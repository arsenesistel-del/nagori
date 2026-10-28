"""Critères « boucle » et « qualité » du cahier (partie 9), dans le navigateur :
- aucune erreur dans la console pendant 60 s de jeu accéléré ;
- ne rien poser pendant 14 jours : rien de perdu, aucun message de reproche ;
- la sauvegarde existante (session 4) se recharge sans perte ;
- la ligne « réel et imaginé » est présente (pied de page et carnet), aucun texte « à écrire » sans ?atelier.

  python3 -I tests/qualite.navigateur.test.py"""
import datetime, json, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h):
    return datetime.datetime(y, m, d, h, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


def ouvrir(nav, port, quand, query='', sauvegarde=None):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
    if sauvegarde is not None:
        ctx.add_init_script(f"if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', {json.dumps(json.dumps(sauvegarde))});")
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.on('console', lambda m: erreurs.append(m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load' not in m.text else None)
    page.clock.install(time=quand)
    page.goto(f'http://127.0.0.1:{port}/{query}')
    page.clock.run_for(2500)
    return ctx, page, erreurs


toasts = []
REPROCHE = ['dommage', 'raté', 'tu as manqué', 'tu n\'es pas venu', 'reviens', 'trop tard', 'perdu ']

print('Qualité et boucle')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    # 1. 60 s de jeu accéléré (une heure toutes les quatre secondes), avec trains, nuit, neige : aucune erreur
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 20, 3), '?atelier')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.evaluate("(() => { const s = (id, v, ev) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(ev)); }; s('lab-weather', 'heavysnow', 'change'); const g = document.getElementById('lab-ground'); g.checked = true; g.dispatchEvent(new Event('change')); const f = document.getElementById('lab-fast'); f.checked = true; f.dispatchEvent(new Event('change')); })()")
    for _ in range(60): page.clock.run_for(1000)
    ok(not err, f'60 s de jeu accéléré (15 h de gare) : aucune erreur dans la console ({err[:3]})')
    ctx.close()

    # 2. ne rien poser pendant 14 jours : rien de perdu, aucun message de reproche
    avant = {'version': 3, 'lastVisit': int(jst(2026, 11, 16, 20).timestamp() * 1000), 'stamps': [55, 56], 'moments': ['dawnfog'], 'found': [{'key': '2026-11-10', 'idx': 1}],
             'growth': 5, 'watered': '2026-11-16', 'gifts': {}, 'arrived': {}}
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 30, 20), '', avant)
    page.evaluate("new MutationObserver(() => { const t = document.getElementById('toast'); if (!t.hidden) (window.__toasts = window.__toasts || []).push(t.textContent); }).observe(document.getElementById('toast'), { attributes: true, childList: true, subtree: true })")
    for _ in range(10): page.clock.run_for(1000)
    s = json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))
    ok(set([55, 56]) <= set(s['stamps']) and s['moments'] == ['dawnfog'] and s['found'] == avant['found'] and s['growth'] == 5, '14 jours sans rien poser : tampons, moments, objets trouvés et jardin intacts')
    texte = (page.evaluate("document.body.innerText") + ' '.join(page.evaluate("window.__toasts || []"))).lower()
    ok(not any(m in texte for m in REPROCHE), 'aucun message de reproche')
    ok(page.evaluate("document.getElementById('book-reel').textContent").startswith('Le ciel, le calendrier et la météo sont réels') and
       page.evaluate("document.getElementById('reel-imagine').textContent") == page.evaluate("document.getElementById('book-reel').textContent"), 'ligne « réel et imaginé » au pied de page et dans le carnet')
    ok('à écrire' not in page.evaluate("document.body.innerText"), 'aucun texte « à écrire » sans ?atelier')
    ok(not err, f'aucune erreur ({err[:2]})')
    ctx.close()

    # 3. une sauvegarde de la session 4 se recharge sans perte
    s4 = {'version': 3, 'growth': 3, 'stamps': [56], 'moments': [], 'gifts': {'2026-11-07': 0}, 'arrived': {'2026-11-07': True}, 'found': [], 'lastVisit': int(jst(2026, 11, 20, 18).timestamp() * 1000),
          'objets': {'sel': 'abc', 'pose': {'type': 'thermos', 'ms': int(jst(2026, 11, 20, 18).timestamp() * 1000)}, 'trace': None, 'parapluieRetour': None, 'retourTrace': None, 'hist': {'thermos': [], 'parapluie': [], 'lumiere': []}},
          'recit': {'vus': [123], 'hist': [{'types': ['lumiere'], 'habitues': []}], 'dernier': None}}
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 20, 19), '', s4)
    s = json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))
    ok(s['gifts'] == s4['gifts'] and s['objets']['sel'] == 'abc' and s['objets']['pose']['type'] == 'thermos' and s['recit']['vus'] == [123] and s['recit']['hist'] == s4['recit']['hist'] and s['growth'] == 3,
       'sauvegarde de la session 4 rechargée sans perte (omiyage gardé même voyageur désactivé, objet posé, récit)')
    ok(not err, f'aucune erreur ({err[:2]})')
    ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
