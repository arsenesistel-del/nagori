"""Tests dans le navigateur (Chromium de l'espace de travail, horloge simulée) : panne de la météo,
séparation du réel et du simulé, rechargement d'une ancienne sauvegarde.

  python3 -I tests/navigateur.test.py

Open-Meteo est simulé par des réponses fabriquées à partir de la série réelle de tests/donnees/.
Le terminal n'atteint pas Open-Meteo : la comparaison avec les vraies valeurs se fait ailleurs."""
import datetime, json, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures                                    # serveur local réutilisé
from playwright.sync_api import sync_playwright

MAINTENANT = datetime.datetime(2026, 11, 17, 12, 0, 0, tzinfo=datetime.timezone.utc)   # 21:00 à Tokyo
REEL = json.loads((RACINE / 'tests/donnees/reel-2026-10-22.json').read_text(encoding='utf-8'))['reponse']
VARS = ['weather_code', 'temperature_2m', 'relative_humidity_2m', 'precipitation', 'snowfall', 'snow_depth', 'wind_speed_10m', 'cloud_cover', 'is_day']
echecs = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg)
    if not cond: echecs.append(msg)


def reponse_reelle():
    """Série réelle de tests, décalée pour finir le 17 novembre 23:00 (les heures après 21:00 sont des prévisions)."""
    h = REEL['hourly']; debut = datetime.datetime(2026, 11, 10)
    temps = [(debut + datetime.timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(192)]
    hourly = {'time': temps, **{v: h[v] for v in VARS}}
    i = temps.index('2026-11-17T21:00')
    courant = {'time': '2026-11-17T21:00', 'interval': 900, **{v: h[v][i] for v in VARS}}
    return {'latitude': 43.9, 'longitude': 143.2, 'hourly': hourly, 'current': courant}


class Banc:
    def __init__(self, nav, port, mode, sauvegarde=None, atelier=False):
        self.mode, self.demandes, self.erreurs, self.console, self.en_attente = mode, 0, [], [], []
        self.ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
        self.ctx.route('**/*', self.route)
        if sauvegarde is not None:
            self.ctx.add_init_script("if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', %s);" % json.dumps(json.dumps(sauvegarde)))
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda e: self.erreurs.append(str(e)))
        self.page.on('console', lambda m: self.console.append(m.text) if m.type == 'error' else None)
        self.page.clock.install(time=MAINTENANT)
        self.page.goto(f'http://127.0.0.1:{port}/' + ('?atelier' if atelier else ''))

    def route(self, r):
        u = r.request.url
        if 'api.open-meteo.com' in u:
            self.demandes += 1
            m = self.mode
            if m == 'reel': return r.fulfill(status=200, content_type='application/json', body=json.dumps(reponse_reelle()))
            if m == '500': return r.fulfill(status=500, body='erreur')
            if m == '429': return r.fulfill(status=429, content_type='application/json', body='{"error":true,"reason":"trop de requetes"}')
            if m == 'illisible': return r.fulfill(status=200, content_type='application/json', body='<html>pas du json')
            if m == 'vide': return r.fulfill(status=200, content_type='application/json', body='{"error":true,"reason":"x"}')
            if m == 'bloque': self.en_attente.append(r); return        # ne répond jamais
        if u.startswith('http://127.0.0.1'): return r.continue_()
        return r.abort()

    def avancer(self, secondes):
        # run_for joue chaque image (60 par seconde simulée) : trop long au-delà de quelques secondes.
        # fast_forward saute dans le temps et déclenche chaque minuteur échu une fois, ce qui suffit ici.
        if secondes <= 12: self.page.clock.run_for(int(secondes * 1000))
        else:
            self.page.clock.fast_forward(int(secondes * 1000))
            self.page.wait_for_timeout(250)           # laisse arriver la réponse simulée
            self.page.clock.run_for(1000)             # quelques images : le bandeau se met à jour
        self.page.wait_for_timeout(250)

    def maintenant(self): return self.page.evaluate('Date.now()') / 1000

    def jusqu_a_requete(self, n, attendu):
        """Avance par sauts jusqu'à la n-ième requête ; rend le temps simulé écoulé depuis l'appel (à 1 s près)."""
        t0 = self.maintenant()
        self.page.clock.fast_forward(int(max(0, attendu - 20) * 1000)); self.page.wait_for_timeout(120)
        while self.demandes < n and self.maintenant() - t0 < attendu + 60:
            self.page.clock.fast_forward(1000); self.page.wait_for_timeout(120)
        self.page.clock.run_for(1000); self.page.wait_for_timeout(250)
        return round(self.maintenant() - t0)

    def sub(self): return self.page.inner_text('#sub')
    def stock(self, cle): return self.page.evaluate("k => localStorage.getItem(k)", cle)
    def fin(self):
        for r in self.en_attente:
            try: r.abort()
            except Exception: pass
        self.ctx.unroute_all(behavior='ignoreErrors'); self.ctx.close()


def erreurs_vraies(b):
    return b.erreurs + [c for c in b.console if 'Failed to load resource' not in c and 'ERR_' not in c]


with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    print('météo réelle servie')
    b = Banc(nav, port, 'reel'); b.avancer(2)
    ok('simulé' not in b.sub() and 'indisponible' not in b.sub() and 'en route' not in b.sub(), f'bandeau : « {b.sub()} »')
    cache = json.loads(b.stock('nagori-meteo-v1') or '{"mesures":[]}')
    ok(len(cache['mesures']) >= 150 and all(m['source'] == 'reelle' for m in cache['mesures']), f'cache : {len(cache["mesures"])} heures, toutes réelles')
    ok(all(m['t'] <= '2026-11-17T21:00' for m in cache['mesures']), 'cache : aucune prévision (heures après 21:00 écartées)')
    sauve = b.stock('nagori-maquette-v2') or ''
    ok('"kind"' not in sauve and 'snowDepth' not in sauve and 'simulee' not in sauve, 'sauvegarde : aucune donnée météo dedans')
    ok(not erreurs_vraies(b), 'aucune erreur dans la console')
    b.avancer(16 * 60)
    ok(b.demandes >= 2, f'rythme normal : {b.demandes} requêtes après 16 min')
    b.mode = '500'; b.avancer(16 * 60)
    ok('météo de 21:' in b.sub(), f'panne après une réponse : la donnée reste, avec son heure : « {b.sub()} »')
    b.avancer(2 * 3600)
    ok('météo indisponible' in b.sub(), f'plus de 2 h sans réponse : « {b.sub()} »')
    b.fin()

    for mode in ['500', '429', 'illisible', 'vide', 'bloque']:
        print(f'panne : {mode}')
        b = Banc(nav, port, mode)
        b.avancer(9)
        ok('météo indisponible' in b.sub(), f'bandeau après le premier échec : « {b.sub()} »')
        ok(b.demandes == 1, f'1 requête au départ ({b.demandes})')
        d1 = b.jusqu_a_requete(2, 60)
        if mode == 'bloque':
            # les sauts de temps passent par-dessus le délai de 8 s : seule la première reprise est mesurable ici
            # (le calendrier complet, avec le délai de 8 s, est vérifié dans tests/meteo.test.js)
            ok(d1 + 9 in range(59, 80), f'première reprise après 1 min (écart simulé : {d1 + 9} s)')
        else:
            d2 = b.jusqu_a_requete(3, 300); d3 = b.jusqu_a_requete(4, 900); d4 = b.jusqu_a_requete(5, 900)
            # d1 part de 9 s après le premier échec ; les autres, de la requête précédente (+ 1 s de pas)
            ok(d1 + 9 in range(59, 66) and d2 in range(299, 308) and d3 in range(899, 908) and d4 in range(899, 908),
               f'reprises à 1, 5, 15 puis 15 min (écarts simulés : {d1 + 9} s, {d2} s, {d3} s, {d4} s)')
        ok(not erreurs_vraies(b), 'aucune erreur de script, aucune autre erreur dans la console' + (f' ({erreurs_vraies(b)})' if erreurs_vraies(b) else ''))
        sauve = b.stock('nagori-maquette-v2') or ''
        ok(b.stock('nagori-meteo-v1') is None and 'kind' not in sauve, 'rien d\'inventé dans le stockage')
        b.fin()

    print('panne puis retour du service')
    b = Banc(nav, port, '500'); b.avancer(2); b.jusqu_a_requete(2, 60)
    b.mode = 'reel'; b.jusqu_a_requete(3, 300)
    ok('indisponible' not in b.sub() and 'en route' not in b.sub(), f'la météo revient : « {b.sub()} »')
    b.fin()

    print('simulé et réel séparés')
    b = Banc(nav, port, 'reel', atelier=True); b.avancer(2)
    b.page.click('#btn-lab')
    b.page.select_option('#lab-weather', 'heavysnow')
    b.avancer(2)
    ok('simulé' in b.sub(), f'bandeau : « {b.sub()} »')
    st = b.page.inner_text('#wx-status')
    ok('simulée' in st and 'jamais enregistrée' in st, 'Atelier : état « simulée, jamais enregistrée »')
    sauve = json.loads(b.stock('nagori-maquette-v2'))
    ok('snow' not in sauve['moments'] and 'firstsnow' not in sauve['moments'], f'moments rares : neige simulée jamais enregistrée ({sauve["moments"]})')
    cache = b.stock('nagori-meteo-v1') or ''
    ok('simulee' not in cache, 'cache météo : aucune mesure simulée')
    b.page.select_option('#lab-weather', 'auto'); b.avancer(2)
    ok('simulé' not in b.sub(), f'retour au réel : « {b.sub()} »')
    b.page.fill('#lab-date', '2026-11-20'); b.page.dispatch_event('#lab-date', 'change'); b.avancer(2)
    ok('météo inconnue' in b.sub(), f'date simulée dans le futur sans mesure : « {b.sub()} »')
    b.fin()

    print('ancienne sauvegarde rechargée')
    ancienne = {'growth': 5, 'watered': '2026-11-16', 'swept': None, 'fed': None, 'fedHour': 0, 'lamp': None, 'stamps': [3, 4],
                'moments': ['snow'], 'gifts': {'2026-11-07': 1}, 'arrived': {'2026-11-07': True}, 'found': [{'key': '2026-11-02', 'idx': 0}],
                'lastVisit': 1794800000000, 'preview': False, 'sound': False, 'firstSnow': 2026}
    b = Banc(nav, port, 'reel', sauvegarde=ancienne); b.avancer(2)
    s = json.loads(b.stock('nagori-maquette-v2'))
    ok(s.get('version') == 3, f'version : {s.get("version")}')
    perdu = [k for k, v in ancienne.items() if k not in ('lastVisit', 'stamps') and s.get(k) != v]
    ok(not perdu, 'tous les champs de l\'ancienne sauvegarde sont intacts' + (f' (changés : {perdu})' if perdu else ''))
    ok(set(ancienne['stamps']) <= set(s['stamps']), f'tampons conservés : {s["stamps"]}')
    ok(not erreurs_vraies(b), 'aucune erreur dans la console')
    b.fin()
    nav.close()

print('\n%d échec(s)' % len(echecs))
sys.exit(1 if echecs else 0)
