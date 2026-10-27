# Nagori · passation (27 octobre 2026, session 3 alignée sur le cahier)

Document de reprise pour une nouvelle conversation. Ne duplique pas la bible ni le cahier des charges : il dit où on en est.

## Sources de vérité, dans cet ordre
1. `CLAUDE.md` (dépôt) : état technique, règles du projet.
2. Cahier des charges v3 (projet claude.ai, `claude/Nagori, cahier des charges du prototype de 14 jours.md`) : lots, critères de la partie 9, sessions de la partie 13. Extrait des lots F, G, H dans le dépôt : `docs/cahier-lots-F-G-H.md`.
3. Bible (`Nagori, bible du projet.docx`) : ne pas la modifier sans Arsène.
4. Ce fichier : décisions postérieures au cahier.

## État réel du dépôt
- Dépôt `arsenesistel-del/nagori`, branche de travail **`session-1`** (poussée). `main` et le site public sont inchangés (`6e05c57`). Ne rien fusionner ni déployer sans accord explicite d'Arsène.
- Dernier commit de code : « Session 3 alignée sur le cahier (lots F, G, H) ». Vérifier avec `git log --oneline | head`.
- Étiquettes `avant-session-1` (sur `6e05c57`), `avant-session-2`, `avant-session-3` (sur `d491c70`), `avant-session-3-cahier` (sur `d37fcd4`) : locales seulement, le proxy refuse de les pousser. Non bloquant (validé). Elles disparaissent avec l'espace de travail : en cas de besoin, retrouver les commits par leur message.
- Tests à lancer avant toute fin de session : `node tests/meteo.test.js` (27), `node tests/objets.test.js` (18), `node tests/vie.test.js` (22), `python3 -I tests/navigateur.test.py` (~3 min), `python3 -I tests/objets.navigateur.test.py` (~4 min), `python3 -I tests/vie.navigateur.test.py` (~2 min).
- Session cloud : Python n'a pas Playwright d'office. `pip install playwright==1.63.0 pillow` (la version doit correspondre au Chromium de `/opt/pw-browsers`, sinon « Executable doesn't exist »).
- Captures de référence : `tests/captures/fin-session-3-cahier/` (six états et `traces/`, sans le provisoire ; `lots-fgh/` : seize états des lots F, G, H, préfixe `p-` pour le provisoire).

## Fait
- Session 1 (lots A, B) : météo honnête (`js/meteo.js`), point de vue, sauvegarde v3, tests, captures, région.
- Session 2 (lots C, D) : objets à laisser (`data/objets.js`, `js/objets.js`), étagère, traces, empreintes, givre, aperçu Atelier, tests.
- Session 3 (lots F, G, H) : d'abord faite sans le cahier, puis alignée sur `docs/cahier-lots-F-G-H.md` le 27 octobre. Ce qui vient du cahier est visible de tous ; ce qui n'y est pas reste derrière la case « provisoire » de l'Atelier. Détail dans `CLAUDE.md`.

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
| 3 | F (nuit), G (habitués, chat), H (fermeture) | sessions 1 et 2 | faite et alignée sur le cahier ; restes ci-dessous |
| 4 | E (récit de l'absence) | 2 et 3 | oui |
| 5 | I, J, K, L, performances, voyageur, ligne « réel et imaginé » | 2 à 4 | oui (compte GoatCounter à créer par Arsène) |
| 6 | intégration des textes (6a), corrections et mise en ligne (6b) | 5 + textes des 2, 9, 16 novembre | non |

## Lots F, G, H : ce qui reste par rapport au cahier
- Voyageur « seulement s'il est activé » (J9) et critère « voyageur désactivé : aucune trace de lui nulle part » : pas d'interrupteur pour l'instant (le voyageur reste comme avant). Prévu avec le voyageur en session 5 ?
- Rapport sur 14 nuits avec une série réelle : `outils/nuits.js` existe, mais le dépôt n'a que 7 jours réels (octobre). Capturer une série réelle de 14 jours par le navigateur intégré.
- Sons nouveaux (scooter, chasse-neige, sabots, pelle) : facultatifs, non faits.
- Titres japonais (avis, compte à rebours) à relire par un natif ; tous les textes « texte à écrire » à écrire par Arsène.
- « Les trois habitués se distinguent au premier coup d'œil sur téléphone » : à vérifier par Arsène.

## Ce qu'il faut d'Arsène
- Les textes : traduction de l'avis, entrées du cahier, 7 lignes de craie, deux lignes par habitué, lignes des moments et du registre, objets de la nuit.
- La mise en scène des trois moments (provisoire : l'écolier devant l'avis, la vieille dame qui reste, le cheminot et ses étiquettes).
- Garder, retirer ou intégrer au cahier le provisoire hors cahier (lune, papillons, pas, traits météo, fin de service, fleurs, bandeau).
- Seuil de « neige profonde » pour les cerfs (40 cm, imaginé).
- Nom du chat (pour la session 6a).

## Prochaine action concrète
Montrer à Arsène `?atelier` (simuler les dates du 17 au 30 novembre, et le menu de la nuit) et les captures `tests/captures/fin-session-3-cahier/lots-fgh/`, puis la session 4 (lot E).

## Pièges connus
- Le terminal n'atteint pas Open-Meteo ; les séries réelles passent par le navigateur intégré. Les tests naviguent avec Open-Meteo simulé.
- Horloge de Playwright : `page.clock.install` veut une date avec fuseau ; `fast_forward` pour les grands sauts, `run_for` seulement pour quelques secondes ; mettre à jour la réponse simulée AVANT le saut.
- `pkill -f` peut tuer son propre shell si le motif figure dans la commande : écrire `[c]aptures`.
- Une constante utilisée avant sa déclaration (`const` plus bas dans `jeu.js`) casse tout le jeu : vérifier en chargeant la page.
- Les prises de captures sont longues (environ 1 à 2 min par état) : les lancer en arrière-plan.
