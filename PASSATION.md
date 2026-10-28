# Nagori · passation (28 octobre 2026, début de la session 4)

Document de reprise pour une nouvelle conversation. Ne duplique pas la bible ni le cahier des charges : il dit où on en est.

## Sources de vérité, dans cet ordre
1. `CLAUDE.md` (dépôt) : état technique, règles du projet.
2. Cahier des charges v3 (projet claude.ai, `claude/Nagori, cahier des charges du prototype de 14 jours.md`) : lots, critères de la partie 9, sessions de la partie 13. Extrait des lots F, G, H dans le dépôt : `docs/cahier-lots-F-G-H.md`.
3. Bible (`Nagori, bible du projet.docx`) : ne pas la modifier sans Arsène.
4. Ce fichier : décisions postérieures au cahier.

## État réel du dépôt
- Dépôt `arsenesistel-del/nagori`, branche de travail **`session-1`** (poussée). `main` et le site public sont inchangés (`6e05c57`). Ne rien fusionner ni déployer sans accord explicite d'Arsène.
- Dernier commit de code : « Session 4 : interrupteur du voyageur ». Vérifier avec `git log --oneline | head`.
- Étiquettes `avant-session-1` (sur `6e05c57`), `avant-session-2`, `avant-session-3` (sur `d491c70`), `avant-session-3-cahier` (sur `d37fcd4`), `avant-session-4` (sur `077be75`) : locales seulement, le proxy refuse de les pousser. Non bloquant (validé). Elles disparaissent avec l'espace de travail : en cas de besoin, retrouver les commits par leur message.
- Tests à lancer avant toute fin de session : `node tests/meteo.test.js` (27), `node tests/objets.test.js` (18), `node tests/vie.test.js` (22), `python3 -I tests/navigateur.test.py` (~3 min), `python3 -I tests/objets.navigateur.test.py` (~4 min), `python3 -I tests/vie.navigateur.test.py` (~2 min), `python3 -I tests/voyageur.navigateur.test.py` (~2 min).
- Session cloud : Python n'a pas Playwright d'office. `pip install playwright==1.63.0 pillow` (la version doit correspondre au Chromium de `/opt/pw-browsers`, sinon « Executable doesn't exist »).
- Captures de référence : `tests/captures/avant-session-4/` (six états et `traces/`, voyageur activé) et `tests/captures/fin-session-3-cahier/` (six états et `traces/`, sans le provisoire ; `lots-fgh/` : seize états des lots F, G, H, préfixe `p-` pour le provisoire).

## Fait
- Session 1 (lots A, B) : météo honnête (`js/meteo.js`), point de vue, sauvegarde v3, tests, captures, région.
- Session 2 (lots C, D) : objets à laisser (`data/objets.js`, `js/objets.js`), étagère, traces, empreintes, givre, aperçu Atelier, tests.
- Session 3 (lots F, G, H) : d'abord faite sans le cahier, puis alignée sur `docs/cahier-lots-F-G-H.md` le 27 octobre. Ce qui vient du cahier est visible de tous ; ce qui n'y est pas reste derrière la case « provisoire » de l'Atelier. Détail dans `CLAUDE.md`.

## Décisions validées par Arsène (26 octobre)
- Région : gare de Shirataki, 43,8842° N, 143,1809° E. La bible et le cahier disent encore « hors de toute gare réelle » : **à corriger par Arsène** (le cahier, parties 2 et « Ce qui est réel », aussi).
- L'écolier n'emprunte le parapluie que les jours d'école, si la météo réelle le permet.
- Les conséquences se résolvent à la fin de leur fenêtre. Le récit de l'absence (session 4) ne doit jamais prétendre que le joueur y a assisté en direct.
- Lignes de registre : sessions 4 et 5.

## Décisions d'Arsène (28 octobre)
- **Textes à écrire** : aucun emplacement « texte à écrire » n'est montré aux testeurs. En jeu normal, le message au toucher, la ligne de registre, l'entrée du cahier, le texte du kō et les parties à écrire du panneau du voyageur n'apparaissent pas (`montrable`, `sansAEcrire` dans `jeu.js`). Avec `?atelier`, tout reste visible. Les éléments visuels du cahier restent visibles de tous.
- **Seuil de neige des cerfs** : 40 cm est arbitraire, non validé. Le cahier ne chiffre pas « neige profonde ». Réglable dans `data/monde.js` (`NUIT.evenements.cerfs.neigeProfondeCm`, avec `facteurNeige`, `chance`, `automne`).
- **Dates de fermeture** : 12 mars 2027 (dernier jour) et 13 mars 2027 (révision) gardées, provisoires, à vérifier contre le cahier complet (`data/fermeture.js`).
- **Japonais** : 駅廃止のお知らせ, 3月12日, あと{n}日, 駅ノート restent provisoires tant qu'une personne compétente ne les a pas relus (`data/textes.js`, `fermeture`).
- **Rapport sur 14 nuits** : critère non rempli. Le dépôt n'a que 7 nuits réelles (octobre) ; les 14 nuits de novembre de `outils/nuits.js` sont simulées et ne valident rien.
- **Voyageur** : interrupteur posé au début de la session 4, avant le récit de l'absence (fait, voir plus bas).
- Ne modifier ni `main` ni le site public.

## Décisions d'Arsène (28 octobre, suite)
- Interrupteur du voyageur au début de la session 4, vérifié partout, tests des deux états : **fait**.
- Valeurs de la nuit (cerfs, neige, fenêtre de ferme) gardées dans les données, marquées NON VALIDÉ ; pas de refonte avant vérification du cahier complet.
- Dates du 12 et du 13 mars 2027 : provisoires jusqu'à vérification du cahier complet.
- Japonais : provisoire, jamais présenté comme validé.
- Éléments visuels : ceux du cahier restent ; les ajouts d'interprétation sont réglables dans les données (moments : `HABITUES.moments`, positions comprises ; trajets des cerfs et du renard : `NUIT.evenements.*.trajet`) ou derrière la case provisoire de l'Atelier.
- Sons : après les fonctionnalités essentielles.

## Session 4
### Interrupteur du voyageur (fait)
- Réglage du jeu : `VOYAGEUR.actif` dans `data/monde.js` (`true` pour l'instant ; la valeur pour le test est à décider par Arsène).
- Désactivé : rien dans la scène (assis, arrivée par le train de 16 h 20, départ), bandeau, registre, panneau (et le toucher), section « Voyageurs et omiyage » du carnet, omiyage de la façade, furin (son), boutons « Faire venir le voyageur » et « Voir tous les omiyage » de l'Atelier. Le train de 16 h 20 s'arrête comme les autres.
- Sauvegarde : `gifts` et `arrived` restent intacts quand il est désactivé ; rien n'est écrit pour lui ; réactivé, tout revient. Aucun champ nouveau.
- Atelier : case « Voyageur du sekki activé » pour essayer l'autre état, jamais enregistrée (retour au réglage du jeu au rechargement).
- Objets : aucun lien avec le voyageur dans le code ; poser un objet marche dans les deux états. Reste un texte à trancher : la note des objets trouvés du carnet (`T.carnetAucunObjet`) dit « Les voyageurs oublient parfois quelque chose sur le banc » (voyageurs au sens général). À garder ou réécrire par Arsène si le voyageur est désactivé.
- Tests : `tests/voyageur.navigateur.test.py`, 29 contrôles, les deux états.
- Le récit de l'absence devra lire `voyageurActif()` (dans `js/jeu.js`).

### Récit de l'absence (lot E) : bloqué
- Le dépôt n'a que l'extrait des lots F, G, H. Sans le texte du lot E (et ses critères de la partie 9), le récit n'est pas commencé, pour ne pas refaire l'erreur de la session 3.
- Ce qu'on sait déjà : les conséquences des objets se résolvent à la fin de leur fenêtre et le récit ne doit jamais prétendre que le joueur y a assisté en direct ; le point de vue (`vue`, `pointDeVue`) est prêt à recevoir d'autres instants ; chaque changement de la fermeture « peut devenir un plan du récit » ; les emplacements de texte restent invisibles en jeu normal.
- Il faut : `docs/cahier-lot-E.md` (copie verbatim du lot E et des critères concernés), comme pour les lots F, G, H.
- Étiquettes git locales : acceptées telles quelles.
- Organisation : un chat par session ou demande importante ; rien dans `main` sans accord.

## Reste à faire (cahier, partie 13)
| Session | Lots | Dépend de | Peut démarrer sans textes d'Arsène ? |
| --- | --- | --- | --- |
| 3 | F (nuit), G (habitués, chat), H (fermeture) | sessions 1 et 2 | faite et alignée sur le cahier ; restes ci-dessous |
| 4 | E (récit de l'absence) | 2 et 3 | oui |
| 5 | I, J, K, L, performances, voyageur, ligne « réel et imaginé » | 2 à 4 | oui (compte GoatCounter à créer par Arsène) |
| 6 | intégration des textes (6a), corrections et mise en ligne (6b) | 5 + textes des 2, 9, 16 novembre | non |

## Session 3 : état exact par rapport au cahier (docs/cahier-lots-F-G-H.md)

### Conforme (comportement conforme à l'extrait, couvert par les tests)
- F : horaires des trains inchangés ; livreur en scooter, phare allumé, chaque nuit entre 4 h 05 et 4 h 20 ; fenêtre de ferme allumée vers 4 h 30 jusqu'au lever ; chasse-neige (gyrophare, bourrelet) et cheminot qui dégage le quai à la lanterne vers 5 h seulement après 2 cm de neige réelle en 6 h ; renard près de la salle d'attente, environ 2 nuits sur 10 ; cerfs plus fréquents en automne, plus rares dans la neige profonde, yeux qui brillent sous la lampe ; givre (session 2) ; tirage commun à tous pour une nuit ; cause de chaque événement écrite dans `data/monde.js`.
- G : routines (écolier les jours d'école, absent les week-ends et le 23 novembre ; vieille dame 13 h-13 h 35, même bout du banc ; cheminot 10 h 30 et 21 h 30, quai après la neige ; chat à heures tirées, sans parole) ; compteur d'habitude (session 2) ; dates des trois moments (20, 24, 26 novembre) ; étiquettes numérotées sur le banc, le poêle et l'horloge, qui restent.
- H : deux dates dans `data/fermeture.js` ; avis officiel et compte à rebours visibles dès la première visite ; compte à rebours 115 le 17 novembre, 102 le 30, passage à minuit heure du Japon ; cahier de la gare sur l'étagère ; calendrier J1 à J13 aux bonnes dates, décalable d'un seul réglage (`debutTest`) ; photos sépia dessinées en code ; 7 lignes de craie un jour sur deux (`data/craie.js`) ; rien n'est retiré, vidé ni emballé.

### Incomplet
- Tous les textes (emplacements « à écrire ») : traduction de l'avis, 3 entrées du cahier, 7 lignes de craie, 2 lignes par habitué, lignes des moments, lignes de registre des changements, textes de la nuit, traces de la session 2, textes des kō, voyageur. Conséquence en jeu normal tant qu'ils manquent : le cahier de la gare ne s'ouvre pas, le registre n'a pas les lignes des changements, toucher l'avis, la craie ou un habitué n'affiche rien. Le critère « chaque changement a sa ligne au registre » n'est donc rempli qu'avec `?atelier`.
- Voyageur : interrupteur fait (session 4) ; la valeur pour le test reste à décider.
- Rapport sur 14 nuits réelles : manque la série réelle.
- Sons nouveaux (scooter, chasse-neige, sabots, pelle) : facultatifs, non faits.
- « Peut devenir un plan du récit » : session 4.

### À valider par Arsène
- Dates du 12 et du 13 mars 2027 (provisoires).
- Valeurs imaginées : seuil de neige profonde (40 cm), fréquences des cerfs (12 %, 30 % en automne, ×0,2 dans la neige profonde), heure de la fenêtre de ferme (tirée entre 4 h 20 et 4 h 40), nombre de cerfs (1 à 3).
- Japonais (relecture compétente).
- Mise en scène des trois moments : l'écolier devant l'avis avant son train, la vieille dame qui reste jusqu'à 13 h 57, le cheminot à la planchette (heures dans `data/habitues.js`, `moments`).
- Placements : avis à droite de la porte, affiche de la commune et photos à gauche, horloge ajoutée derrière la vitre de la porte, route du passage à niveau dessinée de face ; cerfs qui longent la voie puis s'arrêtent sous la lampe (vue de profil : interprétation de « traversent la voie »).
- Le choix de montrer à tous les éléments visuels du cahier (avis, craie, cahier, route, nuit).
- Silhouettes des trois habitués reconnaissables sur téléphone (critère « qualité »).
- Le provisoire hors cahier, derrière la case de l'Atelier : garder, retirer ou intégrer (lune et clair de lune, papillons, pas dans la neige, parapluie et bonnet, vieille dame absente par mauvais temps, chat à l'abri, fin de service à 18 h 45 le dernier jour, fleurs à J−7, bandeau à J−30).

## Dépendances restantes
- **Voyageur** : interrupteur fait. Reste la valeur pour le test (activé ou non) et la note des objets trouvés du carnet.
- **Lot E** : extrait du cahier à copier dans `docs/`.
- Textes d'Arsène (session 6a, textes des 2, 9 et 16 novembre).
- Série réelle de 14 nuits : à capturer par le navigateur intégré (le terminal n'atteint pas Open-Meteo), puis `node outils/nuits.js FICHIER`.
- Relecture du japonais.
- Bible et cahier : la région (« hors de toute gare réelle ») reste à corriger par Arsène.

## Prochaine action concrète
Arsène copie le lot E du cahier dans `docs/cahier-lot-E.md` ; puis le récit de l'absence. Pas de refonte de la session 3 d'ici là.

## Pièges connus
- Le terminal n'atteint pas Open-Meteo ; les séries réelles passent par le navigateur intégré. Les tests naviguent avec Open-Meteo simulé.
- Horloge de Playwright : `page.clock.install` veut une date avec fuseau ; `fast_forward` pour les grands sauts, `run_for` seulement pour quelques secondes ; mettre à jour la réponse simulée AVANT le saut.
- `pkill -f` peut tuer son propre shell si le motif figure dans la commande : écrire `[c]aptures`.
- Une constante utilisée avant sa déclaration (`const` plus bas dans `jeu.js`) casse tout le jeu : vérifier en chargeant la page.
- Les prises de captures sont longues (environ 1 à 2 min par état) : les lancer en arrière-plan.
