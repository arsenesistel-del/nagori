"""Tests des objets dans le navigateur (Chromium, horloge simulée) : étagère, pose, reprise, résolution, rechargement,
météo absente (attente de 48 h), aperçu de l'Atelier sans enregistrement.

  python3 -I tests/objets.navigateur.test.py

Open-Meteo est simulé : une série horaire qui finit à l'heure simulée du navigateur (self.horloge, en secondes UTC)."""
import datetime, json, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

DEPART = datetime.datetime(2026, 11, 17, 12, 0, 0, tzinfo=datetime.timezone.utc)      # 21:00 à Tokyo, un mardi
VARS = ['weather_code', 'temperature_2m', 'relative_humidity_2m', 'precipitation', 'snowfall', 'snow_depth', 'wind_speed_10m', 'cloud_cover', 'is_day']
echecs = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def reponse(maintenant_utc, pluie=True):
    """8 jours d'heures réelles (simulées par le test) qui finissent à l'heure de Tokyo courante ; de la pluie à chaque heure."""
    jst = maintenant_utc + datetime.timedelta(hours=9)
    fin = jst.replace(minute=0, second=0, microsecond=0, tzinfo=None)
    heures = [fin - datetime.timedelta(hours=i) for i in range(191, -1, -1)]
    temps = [h.strftime('%Y-%m-%dT%H:%M') for h in heures]
    code = 61 if pluie else 3
    hourly = {'time': temps, 'weather_code': [code] * 192, 'temperature_2m': [4.0] * 192, 'relative_humidity_2m': [90] * 192,
              'precipitation': [1.0 if pluie else 0.0] * 192, 'snowfall': [0.0] * 192, 'snow_depth': [0.0] * 192,
              'wind_speed_10m': [8.0] * 192, 'cloud_cover': [100] * 192, 'is_day': [1 if 6 <= h.hour < 16 else 0 for h in heures]}
    courant = {'time': temps[-1], 'interval': 900, **{v: hourly[v][-1] for v in VARS}}
    return {'latitude': 43.9, 'longitude': 143.2, 'hourly': hourly, 'current': courant}


class Banc:
    def __init__(self, nav, port, mode='pluie', sauvegarde=None):
        self.mode, self.ecoule, self.erreurs = mode, 0, []
        self.ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
        self.ctx.route('**/*', self.route)
        if sauvegarde is not None:
            self.ctx.add_init_script("if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', %s);" % json.dumps(json.dumps(sauvegarde)))
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda e: self.erreurs.append(str(e)))
        self.page.on('console', lambda m: self.erreurs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text and 'ERR_' not in m.text else None)
        self.page.clock.install(time=DEPART)
        self.port = port
        self.page.goto(f'http://127.0.0.1:{port}/?atelier')
        self.avancer(2)

    def route(self, r):
        u = r.request.url
        if 'api.open-meteo.com' in u:
            if self.mode == 'aucune': return r.fulfill(status=500, body='erreur')
            now = DEPART + datetime.timedelta(seconds=self.ecoule)
            return r.fulfill(status=200, content_type='application/json', body=json.dumps(reponse(now, self.mode == 'pluie')))
        if u.startswith('http://127.0.0.1'): return r.continue_()
        return r.abort()

    def avancer(self, secondes):
        self.ecoule += secondes                 # avant le saut : la réponse simulée doit déjà être à la nouvelle heure
        if secondes <= 12: self.page.clock.run_for(int(secondes * 1000))
        else:
            self.page.clock.fast_forward(int(secondes * 1000))
            self.page.wait_for_timeout(250)
        self.page.wait_for_timeout(200)
        self.page.clock.run_for(1000)
        self.page.wait_for_timeout(200)

    def save(self): return json.loads(self.page.evaluate("localStorage.getItem('nagori-maquette-v2')"))
    def clic_scene(self, x, y):
        px, py = self.page.evaluate("([x, y]) => NAGORI.ecran(x, y)", [x, y])
        self.page.mouse.click(px, py)
        self.page.clock.run_for(100); self.page.wait_for_timeout(100)
    def fin(self):
        self.ctx.unroute_all(behavior='ignoreErrors'); self.ctx.close()


with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    print('étagère : poser, refuser un second objet, reprendre')
    b = Banc(nav, port)
    s = b.save()
    ok(bool(s['objets']['sel']) and s['objets']['pose'] is None and s['objets']['trace'] is None, 'sauvegarde : sel tiré à la première visite, rien de posé')
    ok(not b.page.is_visible('#etagere'), 'l\'étagère est fermée')
    b.clic_scene(571, 628)
    ok(b.page.is_visible('#etagere'), 'toucher l\'étagère dans la fenêtre l\'ouvre')
    texte = b.page.inner_text('#etagere')
    ok('%' not in texte and 'probab' not in texte.lower() and not any(ch.isdigit() for ch in texte), f'aucun chiffre, aucune probabilité affichés : « {texte.replace(chr(10), " | ")} »')
    b.page.click('#et-liste .et-ligne:nth-child(2) button')
    s = b.save()
    ok(s['objets']['pose'] and s['objets']['pose']['type'] == 'parapluie', f'parapluie posé : {s["objets"]["pose"]}')
    ok(b.page.eval_on_selector('#et-liste .et-ligne:nth-child(1) button', 'e => e.disabled') and b.page.eval_on_selector('#et-liste .et-ligne:nth-child(3) button', 'e => e.disabled'),
       'un seul objet à la fois : les autres sont grisés')
    b.page.click('#et-liste .et-ligne:nth-child(2) button')
    ok(b.save()['objets']['pose'] is None, 'repris : plus rien de posé')
    ok(not b.save()['objets']['hist']['parapluie'], 'reprendre ne laisse aucune trace ni pénalité')
    b.page.click('#et-fermer')
    ok(not b.erreurs, 'aucune erreur' + (f' ({b.erreurs})' if b.erreurs else ''))
    b.fin()

    print('résolution après 24 h, avec la météo réelle')
    b = Banc(nav, port)
    b.clic_scene(571, 628); b.page.click('#et-liste .et-ligne:nth-child(1) button')       # thermos
    pose = b.save()['objets']['pose']
    ok(pose and pose['type'] == 'thermos', 'thermos posé')
    b.avancer(23 * 3600); b.avancer(10)
    ok(b.save()['objets']['pose'] is not None and b.save()['objets']['trace'] is None, '23 h après : rien ne s\'est encore passé')
    b.avancer(2 * 3600 + 10); b.avancer(10)
    o = b.save()['objets']
    ok(o['pose'] is None and o['trace'] and o['trace']['type'] == 'thermos', f'25 h après : une conséquence est là ({o["trace"] and o["trace"]["id"]})')
    ok(len(o['hist']['thermos']) == 1, 'historique : une entrée')
    avant = json.dumps(o, sort_keys=True)
    b.page.reload(); b.avancer(3)
    ok(json.dumps(b.save()['objets'], sort_keys=True) == avant, 'recharger la page ne change rien')
    sauve = json.dumps(b.save())
    ok('"kind"' not in sauve and 'snowDepth' not in sauve and 'simulee' not in sauve, 'sauvegarde : aucune donnée météo')
    b.clic_scene(782, 650)
    toast = b.page.inner_text('#toast')
    ok('texte à écrire' in toast or o['trace']['visuel'] in ('ouvert-vide',), f'toucher la trace : ligne provisoire « {toast} »')
    ok(not b.erreurs, 'aucune erreur' + (f' ({b.erreurs})' if b.erreurs else ''))
    # reposer : la trace précédente s'efface, un autre objet est possible
    b.clic_scene(571, 628); b.page.click('#et-liste .et-ligne:nth-child(3) button')
    o = b.save()['objets']
    ok(o['pose']['type'] == 'lumiere' and o['trace'] is None, 'nouvelle pose : la trace précédente est remplacée')
    b.fin()

    print('sans météo réelle : la conséquence attend, puis ne garde que ce qui n\'en dépend pas')
    b = Banc(nav, port, mode='aucune')
    b.clic_scene(571, 628); b.page.click('#et-liste .et-ligne:nth-child(1) button')
    b.avancer(25 * 3600); b.avancer(10)
    o = b.save()['objets']
    ok(o['pose'] is not None and o['trace'] is None, 'après 25 h sans météo : on attend')
    b.avancer(46 * 3600); b.avancer(10)
    o = b.save()['objets']
    ok(o['pose'] is not None, 'après 71 h : on attend encore (48 h après la fin de la fenêtre)')
    b.avancer(2 * 3600); b.avancer(10)
    o = b.save()['objets']
    ok(o['pose'] is None and o['trace'] and o['trace']['id'] != 'chasseneige', f'après 73 h : résolu sans météo ({o["trace"] and o["trace"]["id"]})')
    b.fin()

    print('aperçu de l\'Atelier : rien n\'est enregistré')
    b = Banc(nav, port)
    avant = json.dumps(b.save()['objets'], sort_keys=True)
    b.page.click('#btn-lab')
    b.page.select_option('#lab-trace', 'thermos:chasseneige')
    b.page.check('#lab-givre'); b.avancer(2)
    ok(json.dumps(b.save()['objets'], sort_keys=True) == avant, 'aperçu : sauvegarde inchangée')
    b.page.select_option('#lab-trace', 'retour:mandarines'); b.avancer(1)
    b.page.select_option('#lab-trace', ''); b.avancer(1)
    ok(not b.erreurs, 'aucune erreur' + (f' ({b.erreurs})' if b.erreurs else ''))
    b.fin()

    print('ancienne sauvegarde (sans objets)')
    ancienne = {'growth': 5, 'watered': '2026-11-16', 'stamps': [3], 'moments': [], 'gifts': {}, 'arrived': {}, 'found': [], 'lastVisit': 1794800000000, 'version': 3}
    b = Banc(nav, port, sauvegarde=ancienne)
    s = b.save()
    ok(s['growth'] == 5 and s['objets']['sel'] and s['objets']['hist'] == {'thermos': [], 'parapluie': [], 'lumiere': []}, 'objets ajoutés par défaut, le reste intact')
    b.fin()
    nav.close()

print('\n%d échec(s)' % len(echecs))
sys.exit(1 if echecs else 0)
