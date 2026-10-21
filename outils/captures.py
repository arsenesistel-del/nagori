"""Captures d'écran de Nagori, pour comparer avant et après une session.

  python3 outils/captures.py prendre tests/captures/avant-session-1
  python3 outils/captures.py prendre DOSSIER --etat nuit-neige
  python3 outils/captures.py comparer AVANT APRES

Le jeu est servi depuis le dossier du dépôt, avec le Chromium de l'espace de travail
(Playwright). Pour que deux prises successives soient comparables :
- l'horloge du navigateur est simulée et avance par pas fixes ;
- Math.random est remplacé par un tirage reproductible ;
- les polices distantes et Open-Meteo sont coupés (la météo vient de l'Atelier).
Chaque état règle date, heure, météo et neige au sol par l'Atelier (?atelier).

Bruit : la pluie et la neige ne sont pas reproductibles à l'image près. Deux prises du même code donnent
environ 0,06 % de pixels différents sans précipitation, et 1,2 % avec de la pluie. Au-dessus, regarder les
images dans DOSSIER/diff avant de conclure."""
import argparse, contextlib, datetime, http.server, pathlib, socketserver, sys, threading
from PIL import Image, ImageChops

RACINE = pathlib.Path(__file__).resolve().parent.parent

# nom, largeur, hauteur, mobile, date, heure, météo, neige au sol, vent
ETATS = [
    ('jour-clair',       1280, 720, False, '2026-11-17', 10.5, 'clear',     False, None),
    ('pluie-midi',       1280, 720, False, '2026-11-17', 13.0, 'rain',      False, .4),
    ('nuit-neige',       1280, 720, False, '2026-11-20', 22.0, 'heavysnow', True,  .3),
    ('crepuscule',       1280, 720, False, '2026-11-17', 15.9, 'partly',    False, None),
    ('portrait-matin',    390, 844, True,  '2026-11-17', 8.0,  'overcast',  False, None),
    ('brouillard-aube',  1280, 720, False, '2026-11-18', 6.9,  'fog',       False, None),
]

GRAINE = """
(() => { let s = 123456789;
  Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); };
})();
"""

REGLER = """
([date, heure, meteo, sol, vent]) => {
  const set = (id, v, ev) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(ev, {bubbles: true})); };
  set('lab-date', date, 'change');
  set('lab-weather', meteo, 'change');
  set('lab-hour', heure, 'input');
  if (vent != null) set('lab-wind', vent, 'input');
  const g = document.getElementById('lab-ground'); g.checked = sol; g.dispatchEvent(new Event('change', {bubbles: true}));
}
"""


@contextlib.contextmanager
def serveur():
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=str(RACINE), **k)
        def log_message(self, *a): pass
    with socketserver.TCPServer(('127.0.0.1', 0), H) as s:
        threading.Thread(target=s.serve_forever, daemon=True).start()
        try:
            yield s.server_address[1]
        finally:
            s.shutdown()


def prendre(dossier, seul=None):
    from playwright.sync_api import sync_playwright
    dossier = pathlib.Path(dossier); dossier.mkdir(parents=True, exist_ok=True)
    with serveur() as port, sync_playwright() as p:
        nav = p.chromium.launch(args=['--no-sandbox'])
        for nom, w, h, mobile, date, heure, meteo, sol, vent in ETATS:
            if seul and nom != seul: continue
            ctx = nav.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile,
                                  device_scale_factor=1, service_workers='block')
            ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else r.abort())
            page = ctx.new_page()
            erreurs = []
            page.on('pageerror', lambda e: erreurs.append(str(e)))
            page.on('console', lambda m: erreurs.append(m.text) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
            page.clock.install(time=datetime.datetime(2026, 11, 17, 12, 0, 0))
            page.add_init_script(GRAINE)
            page.goto(f'http://127.0.0.1:{port}/?atelier')
            page.clock.run_for(1500)
            page.evaluate("document.querySelectorAll('[data-close]').forEach(b => b.click())")
            page.evaluate(REGLER, [date, heure, meteo, sol, vent])
            for _ in range(24):          # 24 s simulées : la météo et la neige ont le temps de s'installer
                page.clock.run_for(1000)
            page.screenshot(path=str(dossier / f'{nom}.png'))
            print('capture', nom, '(erreurs : %d)' % len(erreurs))
            for e in erreurs[:5]: print('   ', e)
            ctx.close()
        nav.close()


def comparer(avant, apres, seuil=12):
    avant, apres = pathlib.Path(avant), pathlib.Path(apres)
    sortie = apres / 'diff'; sortie.mkdir(exist_ok=True)
    pire = 0
    for f in sorted(avant.glob('*.png')):
        g = apres / f.name
        if not g.exists(): print(f'{f.stem:18} MANQUE'); continue
        a, b = Image.open(f).convert('RGB'), Image.open(g).convert('RGB')
        if a.size != b.size: print(f'{f.stem:18} tailles différentes'); continue
        d = ImageChops.difference(a, b).convert('L')
        n = sum(1 for v in d.tobytes() if v > seuil)
        pc = 100 * n / (a.size[0] * a.size[1]); pire = max(pire, pc)
        d.point(lambda v: 255 if v > seuil else 0).save(sortie / f.name)
        print(f'{f.stem:18} {pc:6.3f} % des pixels changent')
    return pire


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest='cmd', required=True)
    a = sp.add_parser('prendre'); a.add_argument('dossier'); a.add_argument('--etat')
    c = sp.add_parser('comparer'); c.add_argument('avant'); c.add_argument('apres')
    args = ap.parse_args()
    if args.cmd == 'prendre': prendre(args.dossier, args.etat)
    else: comparer(args.avant, args.apres)
