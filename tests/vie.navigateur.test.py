"""Tests de la session 3 dans le navigateur (Chromium, horloge simulée) : rien de provisoire sans ?atelier,
l'interrupteur « provisoire » de l'Atelier, l'écolier absent les jours fériés, la gare fermée.

  python3 -I tests/vie.navigateur.test.py

Open-Meteo est coupé : la météo reste inconnue, ce qui ne déclenche aucun trait météo."""
import datetime, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h):
    return datetime.datetime(y, m, d, h, 0, 0, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


def ouvrir(nav, port, quand, query=''):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.clock.install(time=quand)
    page.goto(f'http://127.0.0.1:{port}/{query}')
    page.clock.run_for(2500)
    return ctx, page, erreurs


texte = lambda page, sel: page.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); return e && !e.hidden ? e.innerText : ''; }})()")
TEXTES_PROVISOIRES = ["fermeture dans", "la gare est fermée", "dernier jour de service"]

print('Session 3 dans le navigateur')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    # 1. sans ?atelier : ni compte à rebours ni fermeture, même pendant les 30 derniers jours et après la fermeture
    for quand, nom in [(jst(2027, 2, 20, 16), '20 février 2027'), (jst(2027, 3, 13, 10), '13 mars 2027, après la fermeture')]:
        ctx, page, err = ouvrir(nav, port, quand)
        page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
        page.clock.run_for(1000)
        hud = texte(page, '.hud') if page.query_selector('.hud') else page.evaluate("document.body.innerText")
        ok(not any(t in hud for t in TEXTES_PROVISOIRES), f'sans Atelier, {nom} : aucun texte provisoire')
        ok(texte(page, '#ferm-line') == '', f'sans Atelier, {nom} : ligne de fermeture cachée')
        ok('Prochain arrêt' in texte(page, '#next-train') or 'train' in texte(page, '#next-train').lower(), f'sans Atelier, {nom} : les trains s\'arrêtent comme avant')
        ok(not err, f'sans Atelier, {nom} : aucune erreur ({err[:2]})')
        ctx.close()

    # 2. avec ?atelier : le compte à rebours apparaît, et disparaît quand on décoche « provisoire »
    ctx, page, err = ouvrir(nav, port, jst(2027, 2, 20, 16), '?atelier')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.clock.run_for(1000)
    ok('fermeture dans 20 jours' in texte(page, '#ferm-line'), 'Atelier, 20 février : « fermeture dans 20 jours » (provisoire)')
    page.evaluate("(() => { const e = document.getElementById('lab-provisoire'); e.checked = false; e.dispatchEvent(new Event('change')); })()")
    page.clock.run_for(1000)
    ok(texte(page, '#ferm-line') == '', 'Atelier, provisoire décoché : la ligne disparaît')
    ok('Provisoire masqué' in page.evaluate("document.getElementById('lab-vie').innerText"), 'Atelier, provisoire décoché : le panneau le dit')
    ok(not err, f'Atelier : aucune erreur ({err[:2]})')
    ctx.close()

    # 3. avec ?atelier, après la fermeture : plus d'arrêt, plus de voyageur annoncé
    ctx, page, err = ouvrir(nav, port, jst(2027, 3, 13, 10), '?atelier')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.clock.run_for(1000)
    ok('la gare est fermée' in texte(page, '#next-train'), 'Atelier, 13 mars 2027 : la gare est fermée (provisoire)')
    ok(texte(page, '#trav-line') == '', 'Atelier, 13 mars 2027 : aucun voyageur annoncé')
    ok(not err, f'Atelier fermée : aucune erreur ({err[:2]})')
    ctx.close()

    # 4. jour férié (3 novembre 2026, un mardi) : pas d'écolier, dans le registre comme dans la scène (correction, sans Atelier)
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 3, 9))
    reg = texte(page, '#reg')
    ok("Pas d'école aujourd'hui" in reg and "L'écolier a pris le train" not in reg, '3 novembre (férié) : le registre dit qu\'il n\'y a pas d\'école')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 4, 9))
    reg = texte(page, '#reg')
    ok("L'écolier a pris le train de 07:48" in reg, '4 novembre (mercredi) : l\'écolier a pris le train')
    ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
