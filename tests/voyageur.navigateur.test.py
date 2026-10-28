"""Interrupteur du voyageur du sekki (cahier, lot H : « seulement s'il est activé », « voyageur désactivé : aucune trace de lui
nulle part »). Les deux états, activé et désactivé, dans le navigateur (Chromium, horloge simulée) : scène, arrivée par le train,
bandeau, registre, carnet, omiyage de la façade, panneau, sauvegarde, objets, Atelier.

  python3 -I tests/voyageur.navigateur.test.py

Le réglage du jeu est VOYAGEUR.actif dans data/monde.js : le test sert une copie de ce fichier avec actif à true ou à false.
Jour du voyageur de 小雪 en 2026 : le 25 novembre, train de 16 h 20 (début du sekki le 22, plus 3 jours)."""
import datetime, json, pathlib, re, sys
RACINE = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / 'outils'))
import captures
from playwright.sync_api import sync_playwright

echecs = []
MONDE = (RACINE / 'data/monde.js').read_text(encoding='utf-8')
assert re.search(r'VOYAGEUR = \{ actif: (true|false),', MONDE)


def ok(cond, msg):
    print(('  ok   ' if cond else '  ECHEC ') + msg, flush=True)
    if not cond: echecs.append(msg)


def jst(y, m, d, h, mi=0, s=0):
    return datetime.datetime(y, m, d, h, mi, s, tzinfo=datetime.timezone.utc) - datetime.timedelta(hours=9)


# une sauvegarde d'un joueur qui a déjà accueilli le voyageur de 立冬 (furin) et a un objet posé
SAUVEGARDE = {'version': 3, 'gifts': {'2026-11-07': 0}, 'arrived': {'2026-11-07': True}, 'stamps': [56], 'lastVisit': None,
              'objets': {'sel': 'essai', 'pose': None, 'trace': None, 'parapluieRetour': None, 'retourTrace': None,
                         'hist': {'thermos': [], 'parapluie': [], 'lumiere': []}}}


def ouvrir(nav, port, actif, quand, query='', sauvegarde=None):
    ctx = nav.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    monde = re.sub(r'VOYAGEUR = \{ actif: (true|false),', 'VOYAGEUR = { actif: ' + ('true' if actif else 'false') + ',', MONDE)
    def route(r):
        url = r.request.url
        if not url.startswith('http://127.0.0.1'): return r.abort()
        if '/data/monde.js' in url: return r.fulfill(status=200, content_type='application/javascript', body=monde)
        return r.continue_()
    ctx.route('**/*', route)
    if sauvegarde: ctx.add_init_script(f"try {{ if (!localStorage.getItem('nagori-maquette-v2')) localStorage.setItem('nagori-maquette-v2', {json.dumps(json.dumps(sauvegarde))}); }} catch (e) {{}}")
    page = ctx.new_page(); erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    page.clock.install(time=quand)
    page.goto(f'http://127.0.0.1:{port}/{query}')
    page.clock.run_for(2500)
    return ctx, page, erreurs


texte = lambda page, sel: page.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); return e && !e.hidden ? e.innerText : ''; }})()")
etat = lambda page: page.evaluate("NAGORI.etatVoyageur()")
sauve = lambda page: json.loads(page.evaluate("localStorage.getItem('nagori-maquette-v2')"))

print('Interrupteur du voyageur')
with captures.serveur() as port, sync_playwright() as p:
    nav = p.chromium.launch(args=['--no-sandbox'])

    for actif in (True, False):
        nom = 'activé' if actif else 'désactivé'
        # 1. sans Atelier, le 25 novembre à 17 h : bandeau, registre, carnet
        ctx, page, err = ouvrir(nav, port, actif, jst(2026, 11, 25, 17), sauvegarde=SAUVEGARDE)
        reg = texte(page, '#reg')
        ok(("Un voyageur est descendu" in reg) == actif, f'{nom} : ligne du voyageur au registre {"présente" if actif else "absente"}')
        page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())"); page.clock.run_for(600)
        ok(("voyageur" in texte(page, '#trav-line').lower()) == actif, f'{nom} : bandeau du voyageur {"présent" if actif else "vide"}')
        page.evaluate("document.getElementById('btn-book').click()"); page.clock.run_for(600)
        carnet = texte(page, "#book").lower()
        ok(("voyageurs et omiyage" in carnet) == actif and ("un furin" in carnet) == actif, f'{nom} : section voyageurs et omiyage du carnet {"présente" if actif else "absente"}')
        if not actif:
            hud = page.evaluate("[...document.querySelectorAll('.hud, #trav-line, #reg, #gifts, #traveler')].map(e => e.hidden ? '' : e.innerText).join(' ')")
            ok('voyageur' not in hud.lower(), 'désactivé : le mot « voyageur » n\'apparaît ni au bandeau, ni au registre, ni dans la section du carnet, ni au panneau')
        ok(sauve(page)['gifts'] == {'2026-11-07': 0} and sauve(page)['arrived'].get('2026-11-07') is True, f'{nom} : la sauvegarde garde gifts et arrived intacts')
        ok(not err, f'{nom} : aucune erreur ({err[:2]})')
        ctx.close()

        # 2. avec Atelier : arrivée par le train de 16 h 20, omiyage de la façade, panneau, sauvegarde après la journée
        ctx, page, err = ouvrir(nav, port, actif, jst(2026, 11, 25, 16, 19, 40), '?atelier', SAUVEGARDE)
        page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
        e = etat(page)
        ok(e['actif'] == actif and page.evaluate("document.getElementById('lab-voyageur').checked") == actif, f'{nom} : l\'Atelier lit le réglage du jeu')
        ok((e['omiyage'] == [0]) == actif and (e['omiyage'] == []) != actif, f'{nom} : furin sur la façade {"présent" if actif else "absent"} ({e["omiyage"]})')
        ok(page.evaluate("document.getElementById('lab-traveler').hidden") != actif, f'{nom} : bouton « Faire venir le voyageur » {"visible" if actif else "caché"}')
        marches = set()
        for _ in range(40):
            page.clock.run_for(1000); marches.add(etat(page)['marche'])
        e = etat(page)
        if actif:
            ok('walk' in marches and e['attend'] and e['panneau'], 'activé : il descend du train de 16 h 20, s\'assoit, son panneau s\'ouvre')
            ok(sauve(page)['arrived'].get('2026-11-22') is True, 'activé : son arrivée est enregistrée')
        else:
            ok(marches == {'none'} and not e['attend'] and not e['panneau'], 'désactivé : le train de 16 h 20 arrive sans lui, personne n\'attend, aucun panneau')
            ok('2026-11-22' not in sauve(page)['arrived'], 'désactivé : rien n\'est enregistré pour lui')
        # les objets marchent dans les deux états
        page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click()); document.getElementById('traveler').hidden = true")
        sx, sy = page.evaluate("NAGORI.ecran(570, 627)"); page.mouse.click(sx, sy); page.clock.run_for(400)
        page.evaluate("[...document.querySelectorAll('#et-liste .et-ligne')].find(l => l.textContent.includes('Thermos')).querySelector('button').click()")
        page.clock.run_for(400)
        ok((sauve(page)['objets']['pose'] or {}).get('type') == 'thermos', f'{nom} : poser le thermos fonctionne')
        ok(not err, f'{nom}, Atelier : aucune erreur ({err[:2]})')
        ctx.close()

    # 3. l'essai de l'Atelier n'est jamais enregistré : réglage du jeu désactivé, essai activé, rechargement
    ctx, page, err = ouvrir(nav, port, False, jst(2026, 11, 25, 17), '?atelier', SAUVEGARDE)
    page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
    page.evaluate("(() => { const c = document.getElementById('lab-voyageur'); c.checked = true; c.dispatchEvent(new Event('change')); })()")
    page.clock.run_for(800)
    ok(etat(page)['actif'] and etat(page)['omiyage'] == [0] and etat(page)['attend'], 'essai de l\'Atelier : le voyageur et ses omiyage reviennent, la sauvegarde n\'avait rien perdu')
    page.reload(); page.clock.run_for(2500)
    ok(not etat(page)['actif'] and etat(page)['omiyage'] == [], 'après rechargement : retour au réglage du jeu (désactivé), l\'essai n\'est pas enregistré')
    ok('voyageur' not in json.dumps(sauve(page)).lower() and 'essai' == sauve(page)['objets']['sel'], 'la sauvegarde ne contient aucun champ d\'essai')
    ok(not err, f'essai : aucune erreur ({err[:2]})')
    ctx.close()
    nav.close()

print(f'{"aucun échec" if not echecs else str(len(echecs)) + " échec(s)"}')
sys.exit(1 if echecs else 0)
