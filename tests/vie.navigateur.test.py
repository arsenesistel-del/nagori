"""Tests des lots F, G, H dans le navigateur (Chromium, horloge simulée) : avis, cahier de la gare, registre de la fermeture,
toucher des habitués et de leurs moments, jours fériés ; et la case « provisoire » de l'Atelier (rien de hors cahier sans elle).

  python3 -I tests/vie.navigateur.test.py

Open-Meteo est coupé : la météo reste inconnue, ce qui ne déclenche aucun événement de nuit à cause météo ni aucun trait provisoire."""
import datetime, pathlib, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h, mi=0):
    return datetime.datetime(y, m, d, h, mi, 0, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


def ouvrir(nav, port, quand, query=''):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.clock.install(time=quand)
    page.goto(f'http://127.0.0.1:{port}/{query}')
    page.clock.run_for(2500)
    return ctx, page, erreurs


def fermer(page):
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.clock.run_for(500)


def provisoire(page, v):
    page.evaluate("(v) => { const e = document.getElementById('lab-provisoire'); e.checked = v; e.dispatchEvent(new Event('change')); }", v)
    page.clock.run_for(500)


def toucher(page, x, y):
    """touche un point de la scène (repère 1600 × 900), rend le texte du message"""
    page.evaluate("document.getElementById('toast').hidden = true")
    sx, sy = page.evaluate(f"NAGORI.ecran({x}, {y})")
    page.mouse.click(sx, sy)
    page.clock.run_for(300)
    return page.evaluate("(() => { const t = document.getElementById('toast'); return t.hidden ? '' : t.textContent; })()")


texte = lambda page, sel: page.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); return e && !e.hidden ? e.innerText : ''; }})()")
HORS_CAHIER = ["fermeture dans", "la gare est fermée"]

print('Lots F, G, H dans le navigateur')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    # 1. sans ?atelier : rien de hors cahier, même pendant les 30 derniers jours et après la fermeture
    for quand, nom in [(jst(2027, 2, 20, 16), '20 février 2027'), (jst(2027, 3, 13, 10), '13 mars 2027')]:
        ctx, page, err = ouvrir(nav, port, quand)
        fermer(page)
        corps = page.evaluate("document.body.innerText")
        ok(not any(t in corps for t in HORS_CAHIER), f'sans Atelier, {nom} : aucun texte hors cahier')
        ok(texte(page, '#ferm-line') == '', f'sans Atelier, {nom} : pas de bandeau de fermeture')
        ok('Prochain arrêt' in texte(page, '#next-train'), f'sans Atelier, {nom} : les trains s\'arrêtent comme avant')
        ok(not err, f'sans Atelier, {nom} : aucune erreur ({err[:2]})')
        ctx.close()

    # 2. textes « à écrire » : jamais en jeu normal (décision du 28 octobre) ; avec ?atelier, le registre a la ligne du changement
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 19, 10))
    ok('à écrire' not in page.evaluate("document.body.innerText"), '19 novembre, sans Atelier : aucun texte « à écrire » à l\'écran (registre, kō, bandeau)')
    ok("Pas d'école" not in texte(page, '#reg') and "L'écolier a pris le train" in texte(page, '#reg'), '19 novembre, sans Atelier : le registre garde ses lignes écrites')
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.evaluate("document.getElementById('toast').hidden = true")
    page.mouse.click(640, 400); page.clock.run_for(300)
    ok('à écrire' not in page.evaluate("document.body.innerText"), '19 novembre, sans Atelier : toucher la scène ne montre rien « à écrire »')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 19, 10), '?atelier')
    ok("l'affiche de la commune" in texte(page, '#reg'), 'Atelier, 19 novembre : le registre a la ligne (à écrire) de l\'affiche de la commune')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 18, 10), '?atelier')
    ok("l'affiche de la commune" not in texte(page, '#reg'), 'Atelier, 18 novembre : pas encore')
    ctx.close()

    # 3. avec ?atelier, provisoire décoché : ce qui vient du cahier est là
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 17, 13, 20), '?atelier')
    fermer(page); provisoire(page, False)
    ok('traduction de l\'avis' in toucher(page, 535, 610), '17 novembre : l\'avis officiel se touche (texte à écrire)')
    ok('compte à rebours' in toucher(page, 410, 668), '17 novembre : le compte à rebours à la craie se touche')
    ok('ligne de craie 1' in toucher(page, 385, 652), '17 novembre (J1) : la première ligne de craie')
    toucher(page, 564, 615)
    ok(texte(page, '#cahier').count('entrée du cahier') == 1 and '1re entrée' in texte(page, '#cahier'), '17 novembre : le cahier de la gare a une entrée')
    page.evaluate("document.getElementById('ca-fermer').click()")
    l1, l2, l3 = toucher(page, 792, 640), toucher(page, 792, 640), toucher(page, 792, 640)
    ok('vieille dame, ligne 1' in l1 and 'ligne 2' in l2 and 'ligne 1' in l3, 'la vieille dame : deux lignes au toucher qui alternent')
    ok(texte(page, '#ferm-line') == '' and 'Provisoire hors cahier masqué' in texte(page, '#lab-vie'), 'provisoire décoché : ni bandeau ni provisoire')
    ok(not err, f'17 novembre, Atelier : aucune erreur ({err[:2]})')
    ctx.close()

    # 4. les moments des habitués, à leur date ; le 30 novembre, tout est en place
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 24, 13, 48), '?atelier')
    fermer(page); provisoire(page, False)
    ok('moment de la vieille dame' in toucher(page, 792, 640), '24 novembre, 13 h 48 : la vieille dame est restée, c\'est son moment')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 26, 10, 37), '?atelier')
    fermer(page); provisoire(page, False)
    ok('inventaire du cheminot' in toucher(page, 800, 618), '26 novembre, 10 h 37 : le cheminot fait l\'inventaire, c\'est son moment')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2026, 11, 30, 12), '?atelier')
    fermer(page); provisoire(page, False)
    ok('photos anciennes' in toucher(page, 432, 600), '30 novembre : l\'affiche de la commune')
    ok('deuxième photo' in toucher(page, 432, 630), '30 novembre : la deuxième photo ancienne')
    ok('étiquettes' in toucher(page, 814, 664), '30 novembre : l\'étiquette du banc est restée')
    toucher(page, 564, 615)
    ok(texte(page, '#cahier').count('entrée du cahier') == 3, '30 novembre : trois entrées dans le cahier')
    ok('J14' in texte(page, '#lab-vie') and 'Compte à rebours : 102' in texte(page, '#lab-vie'), '30 novembre : J14, compte à rebours 102')
    ok(not err, f'30 novembre : aucune erreur ({err[:2]})')
    ctx.close()

    # 5. la case provisoire : le bandeau à J−30 et la fin de service n'existent qu'avec elle
    ctx, page, err = ouvrir(nav, port, jst(2027, 2, 20, 16), '?atelier')
    fermer(page)
    ok('fermeture dans 20 jours' in texte(page, '#ferm-line'), 'provisoire coché, 20 février : bandeau « fermeture dans 20 jours »')
    provisoire(page, False)
    ok(texte(page, '#ferm-line') == '', 'provisoire décoché : le bandeau disparaît')
    ctx.close()
    ctx, page, err = ouvrir(nav, port, jst(2027, 3, 13, 10), '?atelier')
    fermer(page)
    ok('la gare est fermée' in texte(page, '#next-train') and texte(page, '#trav-line') == '', 'provisoire coché, 13 mars 2027 : gare fermée, aucun voyageur')
    ctx.close()

    # 6. jours fériés : pas d'écolier le 3 ni le 23 novembre (scène et registre), il prend le train le 4
    for (d, ecole) in [(3, False), (23, False), (4, True)]:
        ctx, page, err = ouvrir(nav, port, jst(2026, 11, d, 9))
        reg = texte(page, '#reg')
        ok(("L'écolier a pris le train de 07:48" in reg) == ecole and ("Pas d'école aujourd'hui" in reg) != ecole, f'{d} novembre : écolier {"présent" if ecole else "absent"}')
        ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
