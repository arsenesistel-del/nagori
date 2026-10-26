# Nagori · passation (26 octobre 2026, fin de la conversation « sessions 1 et 2 »)

Document de reprise pour une nouvelle conversation. Ne duplique pas la bible ni le cahier des charges : il dit où on en est.

## Sources de vérité, dans cet ordre
1. `CLAUDE.md` (dépôt) : état technique, règles du projet.
2. Cahier des charges v3 (projet claude.ai, `claude/Nagori, cahier des charges du prototype de 14 jours.md`) : lots, critères de la partie 9, sessions de la partie 13.
3. Bible (`Nagori, bible du projet.docx`) : ne pas la modifier sans Arsène.
4. Ce fichier : décisions postérieures au cahier.

## État réel du dépôt
- Dépôt `arsenesistel-del/nagori`, branche de travail **`session-1`** (poussée). `main` et le site public sont inchangés (`6e05c57`). Ne rien fusionner ni déployer sans accord explicite d'Arsène.
- Dernier commit de code : `1cc2bea` (« Session 2 : objets et traces… »). Vérifier avec `git log --oneline | head`.
- Étiquettes `avant-session-1` (sur `6e05c57`) et `avant-session-2` : locales seulement, le proxy refuse de les pousser. Non bloquant (validé). Elles disparaissent avec l'espace de travail : en cas de besoin, retrouver les commits par leur message.
- Tests à lancer avant toute fin de session : `node tests/meteo.test.js` (27), `node tests/objets.test.js` (18), `python3 -I tests/navigateur.test.py` (~3 min), `python3 -I tests/objets.navigateur.test.py` (~4 min). Tous verts au commit `1cc2bea`.
- Captures de référence : `tests/captures/fin-session-2/` (six états et `traces/`). Prendre `avant-session-3` au début de la session 3 avec `python3 outils/captures.py prendre tests/captures/fin-session-2` si le code n'a pas bougé (c'est déjà la référence), puis comparer à la fin.

## Fait
- Session 1 (lots A, B) : météo honnête (`js/meteo.js`), point de vue, sauvegarde v3, tests, captures, région.
- Session 2 (lots C, D) : objets à laisser (`data/objets.js`, `js/objets.js`), étagère, traces, empreintes, givre, aperçu Atelier, tests.

## Décisions validées par Arsène (26 octobre)
- Région : gare de Shirataki, 43,8842° N, 143,1809° E. La bible et le cahier disent encore « hors de toute gare réelle » : **à corriger par Arsène** (le cahier, parties 2 et « Ce qui est réel », aussi).
- L'écolier n'emprunte le parapluie que les jours d'école, si la météo réelle le permet.
- Les conséquences se résolvent à la fin de leur fenêtre. Le récit de l'absence (session 4) ne doit jamais prétendre que le joueur y a assisté en direct.
- Lignes de registre : sessions 4 et 5.
- Étiquettes git locales : acceptées telles quelles.
- Organisation : un chat par session ou demande importante ; rien dans `main` sans accord.

## Reste à faire (cahier, partie 13)
| Session | Lots | Dépend de | Peut démarrer sans textes d'Arsène ? |
| --- | --- | --- | --- |
| 3 | F (nuit), G (habitués, chat), H (fermeture) | sessions 1 et 2 | oui, avec traits et textes provisoires visibles seulement en Atelier |
| 4 | E (récit de l'absence) | 2 et 3 | oui |
| 5 | I, J, K, L, performances, voyageur, ligne « réel et imaginé » | 2 à 4 | oui (compte GoatCounter à créer par Arsène) |
| 6 | intégration des textes (6a), corrections et mise en ligne (6b) | 5 + textes des 2, 9, 16 novembre | non |

## Ce qu'il faut d'Arsène pour la session 3
Voir le message de fin de conversation. Rien ne bloque le démarrage ; les fiches des quatre personnages affinent le lot G, le nom du chat n'est utile qu'à partir de la session 6a.

## Prochaine action concrète
Ouvrir une nouvelle conversation (idéalement une session cloud, voir ci-dessous) avec : « Lis `CLAUDE.md`, `PASSATION.md` et le cahier des charges, lots F, G, H. Vérifie la branche `session-1` et le dernier commit, puis lance la session 3 (étiquette `avant-session-3` d'abord). »

## Pièges connus
- Le terminal n'atteint pas Open-Meteo ; les séries réelles passent par le navigateur intégré. Les tests naviguent avec Open-Meteo simulé.
- Horloge de Playwright : `page.clock.install` veut une date avec fuseau ; `fast_forward` pour les grands sauts, `run_for` seulement pour quelques secondes ; mettre à jour la réponse simulée AVANT le saut.
- `pkill -f` peut tuer son propre shell si le motif figure dans la commande : écrire `[c]aptures`.
- Une constante utilisée avant sa déclaration (`const` plus bas dans `jeu.js`) casse tout le jeu : vérifier en chargeant la page.
- Les prises de captures sont longues (environ 1 à 2 min par état) : les lancer en arrière-plan.
