"""Le récit de l'absence dans le navigateur (lot E, docs/cahier-lot-E.md) : vignette, lecture, passage, jamais reproposé, « Revoir »,
rien d'enregistré pendant la lecture, aucun texte à écrire en jeu normal, plans météo seulement sur des heures réelles, voyageur.

  python3 -I tests/recit.navigateur.test.py

Open-Meteo est coupé (hors ligne) ou simulé par le test : une série horaire au format d'Open-Meteo, couverte puis pluvieuse."""
import datetime, json, pathlib, re, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []
VARS = ['weather_code', 'temperature_2m', 'relative_humidity_2m', 'precipitation', 'snowfall', 'snow_depth', 'wind_speed_10m', 'cloud_cover', 'is_day']
MONDE = (RACINE / 'data/monde.js').read_text(encoding='utf-8')


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


def reponse(maintenant_utc, pluie_depuis_h):
    """8 jours d'heures « réelles » (simulées par le test) jusqu'à l'heure courante : couvert, puis pluie depuis pluie_depuis_h heures."""
    fin = (maintenant_utc + datetime.timedelta(hours=9)).replace(minute=0, second=0, microsecond=0, tzinfo=None)
    heures = [fin - datetime.timedelta(hours=i) for i in range(191, -1, -1)]
    pluie = [i >= 192 - pluie_depuis_h for i in range(192)]
    hourly = {'time': [h.strftime('%Y-%m-%dT%H:%M') for h in heures], 'weather_code': [61 if p else 3 for p in pluie],
              'temperature_2m': [4.0] * 192, 'relative_humidity_2m': [90] * 192, 'precipitation': [1.0 if p else 0.0 for p in pluie],
              'snowfall': [0.0] * 192, 'snow_depth': [0.0] * 192, 'wind_speed_10m': [8.0] * 192, 'cloud_cover': [100] * 192,
              'is_day': [1 if 6 <= h.hour < 16 else 0 for h in heures]}
    return {'latitude': 43.9, 'longitude': 143.2, 'hourly': hourly, 'current': {'time': hourly['time'][-1], 'interval': 900, **{v: hourly[v][-1] for v in VARS}}}


def ouvrir(nav, port, retour, depuis, query='', meteo=None, voyageur=None):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    def route(r):
        url = r.request.url
        if 'open-meteo' in url and meteo is not None: return r.fulfill(status=200, content_type='application/json', body=json.dumps(meteo))
        if not url.startswith('http://127.0.0.1'): return r.abort()
        if voyageur is not None and '/data/monde.js' in url:
            return r.fulfill(status=200, content_type='application/javascript', body=re.sub(r'VOYAGEUR_TEST = \{ actif: (true|false),', 'VOYAGEUR_TEST = { actif: ' + ('true' if voyageur else 'false') + ',', MONDE))
        return r.continue_()
    ctx.route('**/*', route)
    sauve = {'version': 3, 'lastVisit': int(depuis.timestamp() * 1000), 'stamps': [56]}
    ctx.add_init_script(f"if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', {json.dumps(json.dumps(sauve))});")
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.clock.install(time=retour)
    page.goto(f'http://127.0.0.1:{port}/{query}')
    for _ in range(8): page.clock.run_for(1000)
    return ctx, page, erreurs


vignette = lambda page: page.evaluate("(() => { const v = document.getElementById('vignette'); return v.hidden ? '' : v.textContent; })()")
en_recit = lambda page: page.evaluate("document.body.classList.contains('en-recit')")
sauve = lambda page: json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))
dernier = lambda page: sauve(page)['recit']['dernier']

print('Récit de l\'absence dans le navigateur')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])
    RETOUR, DEPART = jst(2026, 11, 20, 20), jst(2026, 11, 19, 8)

    # 1. jeu normal, 36 h d'absence : la vignette, avec la durée du récit ; pas de registre ouvert d'office
    ctx, page, err = ouvrir(nav, port, RETOUR, DEPART)
    v = vignette(page)
    ok(v.startswith('Pendant ton absence') and re.search(r'\d+ s$', v), f'vignette « {v} »')
    ok(page.evaluate("document.getElementById('reg').hidden"), 'le registre ne s\'ouvre pas par-dessus la vignette')
    d = dernier(page)
    ok(d and d['dureeS'] <= 25 and all(2 <= d['parPlanS'] <= 4 for _ in [0]), f'récit de {d and d["dureeS"]} s, {d and d["parPlanS"]} s par plan (25 s au plus après plusieurs jours)')
    ok(any(sauve(page)['recit']['vus']), 'l\'absence est marquée « proposée »')
    # la vignette s'efface après 30 s
    page.clock.run_for(31000)
    ok(vignette(page) == '', 'la vignette s\'efface après 30 s')
    # le récit reste accessible depuis le registre (« Revoir »)
    page.evaluate("document.getElementById('btn-reg').click()"); page.clock.run_for(500)
    ok(not page.evaluate("document.getElementById('reg-revoir').hidden"), 'le registre propose « Revoir »')
    etamp = sauve(page)['stamps']
    page.evaluate("document.getElementById('reg-revoir').click()"); page.clock.run_for(600)
    ok(en_recit(page), '« Revoir » lance le récit')
    quand = page.evaluate("document.getElementById('recit-quand').textContent")
    ok(re.search(r'novembre · \d\d:\d\d$', quand) is not None and 'simulé' not in quand, f'surimpression : le jour et l\'heure de la gare (« {quand} »)')
    ok('à écrire' not in page.evaluate("document.body.innerText"), 'pendant le récit, aucun texte « à écrire »')
    # lecture complète : elle s'arrête d'elle-même, sans dépasser sa durée
    t = 0
    while en_recit(page) and t < 40: page.clock.run_for(250); t += .25
    ok(not en_recit(page) and t <= d['dureeS'] + 1, f'le récit finit seul en {t:.1f} s (annoncé : {d["dureeS"]} s)')
    s = sauve(page)
    ok(s['stamps'] == etamp and s.get('moments', []) == [], 'pendant le récit, ni tampon ni moment enregistré')
    ok(len(s['recit']['hist']) == 1, 'la première lecture compte une fois pour l\'anti-répétition')
    ok(not err, f'aucune erreur ({err[:2]})')
    # 2. jamais reproposé pour la même absence
    page.reload()
    for _ in range(8): page.clock.run_for(1000)
    ok(vignette(page) == '', 'après rechargement, la vignette n\'est pas reproposée')
    ctx.close()

    # 3. un toucher pendant le récit le passe ; le premier geste efface la vignette
    ctx, page, err = ouvrir(nav, port, RETOUR, DEPART)
    page.mouse.click(200, 400); page.clock.run_for(300)
    ok(vignette(page) == '' and not en_recit(page), 'un geste ailleurs efface la vignette sans lancer le récit')
    page.evaluate("document.getElementById('btn-reg').click()"); page.clock.run_for(300)
    page.evaluate("document.getElementById('reg-revoir').click()"); page.clock.run_for(1500)
    ok(en_recit(page), 'récit lancé')
    page.mouse.click(640, 360); page.clock.run_for(300)
    ok(not en_recit(page), 'un toucher passe le récit')
    ok(page.evaluate("document.getElementById('etagere').hidden && document.getElementById('cahier').hidden"), 'le toucher qui passe le récit n\'agit pas sur la scène')
    ctx.close()

    # 4. moins de 3 h : pas de vignette, le registre comme avant
    ctx, page, err = ouvrir(nav, port, RETOUR, RETOUR - datetime.timedelta(hours=2))
    ok(vignette(page) == '' and not page.evaluate("document.getElementById('reg').hidden"), '2 h d\'absence : pas de vignette, le registre s\'ouvre comme avant')
    ctx.close()

    # 5. météo : plans « temps » seulement sur des heures réelles ; hors ligne, aucun plan météo
    for meteo, nom in [(reponse(RETOUR, 10), 'en ligne, pluie depuis 10 h'), (None, 'hors ligne')]:
        ctx, page, err = ouvrir(nav, port, RETOUR, RETOUR - datetime.timedelta(hours=20), '?atelier', meteo=meteo)
        page.clock.run_for(6000)
        d = page.evaluate("NAGORI.recitCourant().dernier")
        types = [(x['type'], x['sous']) for x in (d['plans'] if d else [])]
        if meteo: ok(('temps', 'pluie') in types, f'{nom} : un plan « début de pluie » ({types})')
        else: ok(d is None or all(t != 'temps' for t, _ in types), f'{nom} : aucun plan météo ({types})')
        if d: ok(d['regime'] == 'court' and (len(d['plans']) <= 6) and d['dureeS'] <= 20, f'{nom} : 20 h d\'absence, {len(d["plans"])} plans, {d["dureeS"]} s (20 s au plus)')
        ok(d is None or any(16 > int(re.search(r'T(\d\d)', datetime.datetime.fromtimestamp(x['ms'] / 1000, datetime.timezone(datetime.timedelta(hours=9))).isoformat()).group(1)) >= 7 for x in d['plans']), f'{nom} : au moins un plan de jour')
        ctx.close()

    # 6. voyageur : désactivé par défaut, aucun plan ; activé, le plan de son arrivée (train en gare)
    for actif in (None, True):
        ctx, page, err = ouvrir(nav, port, jst(2026, 11, 25, 20), jst(2026, 11, 25, 9), '?atelier', voyageur=actif)
        d = page.evaluate("NAGORI.recitCourant().dernier")
        a = any(x['type'] == 'voyageur' for x in (d['plans'] if d else []))
        ok(a == bool(actif), f'voyageur {"activé" if actif else "désactivé (par défaut)"} : plan de son arrivée {"présent" if actif else "absent"}')
        ctx.close()

    # 7. l'Atelier compose un récit sur une absence simulée, sans rien enregistrer, avec « simulé » en surimpression
    ctx, page, err = ouvrir(nav, port, RETOUR, RETOUR - datetime.timedelta(minutes=30), '?atelier')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    avant = json.dumps(sauve(page)['recit'])
    page.evaluate("document.getElementById('lab-absence').value = '120'; document.getElementById('lab-recit-lire').click()")
    page.clock.run_for(700)
    ok(en_recit(page) and 'simulé' in page.evaluate("document.getElementById('recit-quand').textContent"), 'Atelier : récit d\'une absence de 5 jours, « simulé » en surimpression')
    while en_recit(page): page.clock.run_for(500)
    ok(json.dumps(sauve(page)['recit']) == avant, 'Atelier : rien n\'est enregistré')
    ok(not err, f'Atelier : aucune erreur ({err[:2]})')
    ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
