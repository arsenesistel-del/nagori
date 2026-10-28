"""Atelier (cahier, lot K) dans le navigateur : vérifier la météo réelle (brut contre interprétation), revoir un type de plan,
registre d'une absence simulée, graines et tirages, tout remettre à zéro.

  python3 -I tests/atelier.navigateur.test.py

Open-Meteo est simulé par le test (réponse au format d'Open-Meteo)."""
import datetime, json, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils')); sys.path.insert(0, str(RACINE / 'tests'))
import captures
from playwright.sync_api import sync_playwright

echecs = []
VARS = ['weather_code', 'temperature_2m', 'relative_humidity_2m', 'precipitation', 'snowfall', 'snow_depth', 'wind_speed_10m', 'cloud_cover', 'is_day']


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def reponse(maintenant_utc):
    fin = (maintenant_utc + datetime.timedelta(hours=9)).replace(minute=0, second=0, microsecond=0, tzinfo=None)
    heures = [fin - datetime.timedelta(hours=i) for i in range(191, -1, -1)]
    hourly = {'time': [h.strftime('%Y-%m-%dT%H:%M') for h in heures], 'weather_code': [71 if i % 5 == 0 else 3 for i in range(192)],
              'temperature_2m': [-2.5] * 192, 'relative_humidity_2m': [88] * 192, 'precipitation': [0.4 if i % 5 == 0 else 0 for i in range(192)],
              'snowfall': [0.6 if i % 5 == 0 else 0 for i in range(192)], 'snow_depth': [0.12] * 192, 'wind_speed_10m': [11.0] * 192,
              'cloud_cover': [100] * 192, 'is_day': [1 if 6 <= h.hour < 16 else 0 for h in heures]}
    return {'latitude': 43.9, 'longitude': 143.2, 'hourly': hourly, 'current': {'time': hourly['time'][-1], 'interval': 900, **{v: hourly[v][-1] for v in VARS}}}


MAINTENANT = datetime.datetime(2026, 11, 20, 11, 0, tzinfo=datetime.timezone.utc)      # 20:00 à Tokyo

print('Atelier (lot K)')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    rep = reponse(MAINTENANT)
    ctx.route('**/*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(rep)) if 'open-meteo' in r.request.url
              else (r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort()))
    page = ctx.new_page(); err = []
    page.on('pageerror', lambda e: err.append(str(e)))
    page.clock.install(time=MAINTENANT)
    page.goto(f'http://127.0.0.1:{port}/?atelier')
    for _ in range(6): page.clock.run_for(1000)
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")

    # vérifier la météo réelle : trois heures, brut et interprétation côte à côte
    page.evaluate("document.getElementById('lab-verif').click()"); page.clock.run_for(200)
    t = page.evaluate("document.getElementById('lab-verif-table').innerText")
    lignes = page.evaluate("document.querySelectorAll('#lab-verif-table tr').length")
    ok(lignes == 4 and 'code 71' in t and 'code 3' in t and 'source reelle' in t, f'trois heures, brut et interprétation ({lignes - 1} lignes)')
    ok('neige (snow)' in t and '12 cm' in t and '-2.5 °C' in t, 'le code 71 lu comme de la neige, 0,12 m au sol lus 12 cm')

    # revoir un type de plan (simulé, rien d'enregistré)
    avant = page.evaluate("localStorage.getItem('nagori-maquette-v2')")
    page.evaluate("const s = document.getElementById('lab-plan'); s.value = 'temps'; s.dispatchEvent(new Event('change'))"); page.clock.run_for(600)
    r = page.evaluate("NAGORI.recitCourant().lecture")
    ok(r and r['type'] == 'temps' and r['n'] == 1 and r['simule'], f'plan « changement de temps » revu seul ({r})')
    ok('simulé' in page.evaluate("document.getElementById('recit-quand').textContent"), '« simulé » en surimpression')
    while page.evaluate("document.body.classList.contains('en-recit')"): page.clock.run_for(500)
    ok(json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))['recit'] == json.loads(avant)['recit'], 'rien n\'est enregistré')

    # registre d'une absence simulée de 5 jours
    page.evaluate("document.getElementById('lab-absence').value = '120'; document.getElementById('lab-recit-registre').click()"); page.clock.run_for(400)
    ok('il y a 5 jours' in page.evaluate("document.getElementById('reg-since').innerText"), 'registre d\'une absence de 5 jours')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")

    # graines et tirages, source de la météo
    v = page.evaluate("document.getElementById('lab-vie').innerText")
    ok('sel du joueur' in v and 'graine « 2026-11-20 »' in v and 'Source météo de l\'instant dessiné : reelle' in v, 'graines, tirages et source de la météo affichés')

    # tout remettre à zéro
    page.evaluate("document.getElementById('lab-reset').click()"); page.clock.run_for(300)
    s = json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))
    ok(s['recit'] == {'vus': [], 'hist': [], 'dernier': None} and len(s['stamps']) <= 1 and s['objets']['pose'] is None, 'tout remis à zéro, récit compris')
    ok(not err, f'aucune erreur ({err[:2]})')
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
