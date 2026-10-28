"""Mesure du test (cahier, lot L) dans le navigateur : événements GoatCounter anonymes, préfixés par le prénom ; rien avec ?atelier,
rien tant que COUNTER est vide. GoatCounter est remplacé par un script factice qui note les événements ; aucun réseau.

  python3 -I tests/mesure.navigateur.test.py"""
import datetime, json, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []
JEU = (RACINE / 'js/jeu.js').read_text(encoding='utf-8')
assert "const COUNTER = '';" in JEU
FAUX_GC = "window.goatcounter.count = o => { (window.__comptes = window.__comptes || []).push(o.path); };"


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h):
    return datetime.datetime(y, m, d, h, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


def ouvrir(nav, port, query, compte=True, depuis=None):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    gc = []
    def route(r):
        url = r.request.url
        if 'gc.zgo.at' in url:
            gc.append(url); return r.fulfill(status=200, content_type='application/javascript', body=FAUX_GC)
        if not url.startswith('http://127.0.0.1'): return r.abort()
        if compte and '/js/jeu.js' in url: return r.fulfill(status=200, content_type='application/javascript', body=JEU.replace("const COUNTER = '';", "const COUNTER = 'essai';"))
        return r.continue_()
    ctx.route('**/*', route)
    if depuis:
        ctx.add_init_script(f"if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', {json.dumps(json.dumps({'version': 3, 'lastVisit': int(depuis.timestamp() * 1000)}))});")
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.clock.install(time=jst(2026, 11, 20, 20))       # 12 h à Paris
    page.goto(f'http://127.0.0.1:{port}/{query}')
    page.clock.run_for(2500)
    return ctx, page, erreurs, gc


comptes = lambda page: page.evaluate("window.__comptes || []")

print('Mesure (lot L)')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    # 1. contemplation : visite, 60 s sans geste ; préfixe du prénom ; une fois par visite
    ctx, page, err, gc = ouvrir(nav, port, '?t=Anne')
    c = comptes(page)
    ok(gc and 'anne/visite-h12' in c, f'visite comptée à l\'heure de Paris, préfixée par le prénom ({c})')
    ok(page.evaluate("localStorage.getItem('nagori-testeur')") == 'anne', 'le prénom est mémorisé')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    for _ in range(62): page.clock.run_for(1000)
    c = comptes(page)
    ok('anne/sejour-60s' in c and 'anne/sejour-sans-action' in c, 'séjour de 60 s, sans action')
    ok(c.count('anne/meteo-indispo') <= 1 and 'anne/meteo-indispo' in c, 'météo indisponible (réseau coupé) comptée une fois')
    ok(all(x.startswith('anne/') for x in c) and len(c) == len(set(c)), 'événements préfixés, chacun une fois')
    ok(not err, f'aucune erreur ({err[:2]})')
    ctx.close()

    # 2. avec un geste : pas de « sans action » ; poser un objet est compté à chaque pose
    ctx, page, err, gc = ouvrir(nav, port, '')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.evaluate("document.getElementById('btn-etagere').click()"); page.clock.run_for(300)
    page.evaluate("[...document.querySelectorAll('#et-liste .et-ligne')].find(l => l.textContent.includes('Thermos')).querySelector('button').click()")
    page.clock.run_for(300)
    for _ in range(62): page.clock.run_for(1000)
    c = comptes(page)
    ok('sans-lien/objet-thermos' in c, f'pose du thermos comptée, préfixe « sans-lien » sans prénom ({c})')
    ok('sans-lien/sejour-60s' in c and 'sans-lien/sejour-sans-action' not in c, 'séjour de 60 s avec un geste : pas de « sans action »')
    ctx.close()

    # 3. le récit : proposé, puis passé
    ctx, page, err, gc = ouvrir(nav, port, '?t=anne', depuis=jst(2026, 11, 19, 8))
    for _ in range(7): page.clock.run_for(1000)
    page.evaluate("document.getElementById('vignette').click()"); page.clock.run_for(1500)
    page.mouse.click(640, 360); page.clock.run_for(300)
    c = comptes(page)
    ok('anne/recit-propose' in c and 'anne/recit-passe' in c and 'anne/recit-vu' not in c, f'récit proposé puis passé ({[x for x in c if "recit" in x]})')
    ctx.close()

    # 4. jamais avec ?atelier ; rien tant que COUNTER est vide
    ctx, page, err, gc = ouvrir(nav, port, '?atelier&t=anne')
    for _ in range(62): page.clock.run_for(1000)
    ok(not gc and comptes(page) == [], 'Atelier : aucun script, aucun événement')
    ctx.close()
    ctx, page, err, gc = ouvrir(nav, port, '?t=anne', compte=False)
    for _ in range(62): page.clock.run_for(1000)
    ok(not gc and comptes(page) == [], 'COUNTER vide : aucun script, aucun événement')
    ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
