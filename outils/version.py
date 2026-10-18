"""Tamponne un numéro de version sur les fichiers chargés par index.html,
pour que les navigateurs ne mélangent jamais ancienne et nouvelle version.
À lancer avant chaque mise en ligne : python3 outils/version.py"""
import re, time, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
v = time.strftime('%Y%m%d%H%M')
s = p.read_text(encoding='utf-8')
s = re.sub(r'((?:src|href)="(?:js|data|css)/[^"?]+)(\?v=\d+)?"', lambda m: f'{m.group(1)}?v={v}"', s)
p.write_text(s, encoding='utf-8')
print('version', v)
