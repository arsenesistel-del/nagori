# Nagori · passation (fin de la session 5)

Document de reprise pour une nouvelle conversation. Ne duplique pas la bible ni le cahier des charges : il dit où on en est.

## Sources de vérité, dans cet ordre
1. `CLAUDE.md` (dépôt) : état technique, règles du projet.
2. Cahier des charges v3 (projet claude.ai, `claude/Nagori, cahier des charges du prototype de 14 jours.md`) : lots, critères de la partie 9, sessions de la partie 13. Extraits dans le dépôt : `docs/cahier-lots-F-G-H.md`, `docs/cahier-lot-E.md`, `docs/cahier-lots-I-J-K-L.md`.
3. Bible (`Nagori, bible du projet.docx`) : ne pas la modifier sans Arsène.
4. Ce fichier : décisions postérieures au cahier.

## État réel du dépôt
- Dépôt `arsenesistel-del/nagori`, branche de travail **`session-1`** (poussée). `main` et le site public sont inchangés (`6e05c57`). Ne rien fusionner ni déployer sans accord explicite d'Arsène.
- Dernier commit de code : « Session 5 : lots J, K, L, performances, voyageur du test ». Vérifier avec `git log --oneline | head`.
- Étiquettes `avant-session-1` (sur `6e05c57`), `avant-session-2`, `avant-session-3` (sur `d491c70`), `avant-session-3-cahier` (sur `d37fcd4`), `avant-session-4` (sur `077be75`), `avant-session-5` (sur `9c5170e`) : locales seulement, le proxy refuse de les pousser. Non bloquant (validé). Elles disparaissent avec l'espace de travail : en cas de besoin, retrouver les commits par leur message.
- Tests à lancer avant toute fin de session : `node tests/meteo.test.js` (27), `node tests/objets.test.js` (18), `node tests/vie.test.js` (22), `python3 -I tests/navigateur.test.py` (~3 min), `python3 -I tests/objets.navigateur.test.py` (~4 min), `python3 -I tests/vie.navigateur.test.py` (~2 min), `python3 -I tests/voyageur.navigateur.test.py` (~2 min), `node tests/recit.test.js` (12), `python3 -I tests/recit.navigateur.test.py` (~3 min), `python3 -I tests/mesure.navigateur.test.py`, `python3 -I tests/atelier.navigateur.test.py`, `python3 -I tests/qualite.navigateur.test.py` (~2 min chacun).
- Session cloud : Python n'a pas Playwright d'office. `pip install playwright==1.63.0 pillow` (la version doit correspondre au Chromium de `/opt/pw-browsers`, sinon « Executable doesn't exist »).
- Captures de référence : `tests/captures/fin-session-5/` (six états, `traces/`, `lots-fgh/`), `avant-session-5/` (même découpage) ; `fin-session-4/`, `avant-session-4/` (voyageur activé) et `tests/captures/fin-session-3-cahier/` (six états et `traces/`, sans le provisoire ; `lots-fgh/` : seize états des lots F, G, H, préfixe `p-` pour le provisoire).

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

### Voyageur : désactivé par défaut (décision d'Arsène, 28 octobre)
- `VOYAGEUR.actif` vaut `false` (cahier, lot J : activé seulement si ses trois textes sont validés le 16 novembre). Les captures de la session 4 n'ont plus le voyageur sur le banc.
- Écarts au lot J, connus : le cahier nomme le réglage `VOYAGEUR_TEST.actif`, et veut les voyageurs des autres sekki désactivés toute la période ; ici un seul interrupteur pour tous (conforme tant qu'il vaut `false`).

### Récit de l'absence (lot E) : fait
- Réglages `data/recit.js`, logique `js/recit.js`, lecture dans `js/jeu.js` (bloc « Le récit de l'absence »). Détail dans `CLAUDE.md`.
- Conforme (testé) : déclenchement à 3 h avec au moins un plan ; vignette avec la durée du récit, effacée au premier geste ou après 30 s, jamais reproposée, « Revoir » dans le registre ; toucher qui passe ; plans de 2 à 4 s, fondu de 0,6 s, instant et météo réelle de l'heure, cadrage par type, jour et heure en surimpression, « simulé » en Atelier ; les 8 types et leur ordre ; régimes et durées (20 s, 25 s, 7 derniers jours) ; anti-répétition (× 0,3 sur 3 récits, habitué jamais deux récits de suite) ; absence calme, un seul plan ; au moins un plan de jour ; plans météo seulement sur des heures réelles, aucun hors ligne ; voyageur seulement s'il est activé ; rien d'enregistré pendant la lecture ; aucun texte à écrire visible ; variété sur 14 jours et trois rythmes : au plus 33 % pour un type (série SIMULÉE de novembre).
- Interprétations NON VALIDÉES (à trancher par Arsène) :
  - absence de plus d'un jour et de moins de deux : traitée comme « 2 à 7 jours » (le cahier ne dit rien entre les deux) ;
  - au-delà d'un jour, la conséquence de l'objet s'ajoute au meilleur plan de son jour au lieu de le remplacer. Sans cela, un soir sur deux avec un objet posé à chaque visite, l'objet fait 50 % des plans (critère : 40 %) ;
  - « routine changée » d'un habitué : absence un jour de semaine sans école, pluie réelle à son passage, moment de fermeture (l'objet est déjà le plan 1 ; l'absence de la vieille dame par mauvais temps reste un trait provisoire, hors récit) ;
  - instants : la trace de l'objet à la fin de sa fenêtre (jamais le geste) ; lever + 15 min, coucher − 15 min ; changement de temps + 18 min ; kō à 7 h ; plan « jour » à midi, seulement pour garantir un plan de jour ;
  - notes de base (100 à 30 dans l'ordre du cahier), bonus de première neige, cadrages et cibles : `data/recit.js` ;
  - quand un récit existe, le registre ne s'ouvre plus de lui-même au retour (la visite type du cahier ne l'ouvre pas) ; sous 3 h ou sans plan, il s'ouvre comme avant ;
  - « hors ligne » : navigateur hors ligne, ou dernière requête Open-Meteo en échec, ou aucune réussie depuis l'ouverture (le récit attend la météo 6 s au plus).
- Incomplet :
  - variété et plan de jour vérifiés sur une série simulée ; à refaire avec 14 jours réels (même manque que le rapport des nuits) ;
  - ligne neutre du registre pour les jours calmes (plus de 7 jours) : emplacement à écrire, donc invisible en jeu normal ;
  - plan du voyageur : le train est montré à l'arrêt, sans son arrivée animée ;
  - son : seulement l'ambiance de chaque plan atténuée et la sonnerie du passage à niveau ; pas de sons nouveaux (reportés) ;
  - registre « 5 lignes au plus par jour » (lot J, session 5).
- Le récit ne s'appuie sur aucun trait provisoire hors cahier.

## Session 5 (lots J, K, L, performances, voyageur du test, ligne « réel et imaginé »)

### Fait et conforme (testé)
- Lot J : registre limité aux faits notables, 5 lignes au plus par jour (`NAGORI.REGISTRE`, classement NON VALIDÉ), « Revoir » ; « Gestes du jour » et coches retirés, menu « Gestes » replié, gestes toujours faisables au doigt ; l'étagère en bouton principal ; `VOYAGEUR_TEST.actif` (false), un seul voyageur possible (sekki de J9, 25 novembre), ceux des autres sekki et leurs omiyage désactivés ; note des objets trouvés masquée tant que le voyageur est désactivé ; ligne « réel et imaginé » au pied de page (aussi sur téléphone) et dans le carnet ; aucun emplacement « à écrire » sans `?atelier`. Une ligne de registre (à écrire) pour la conséquence d'un objet.
- Lot K : simulation de date (existante) et d'absence (récit et registre de cette absence) ; revoir chaque type de plan ; graines, tirages et source de la météo ; « Vérifier la météo réelle » (brut et interprétation, trois heures) ; tout remettre à zéro (récit compris) ; forcer une conséquence (aperçu des traces) et un événement de nuit (existants).
- Lot L : événements du tableau, préfixés par le prénom, une fois par visite (sauf la pose d'un objet) ; rien tant que `COUNTER` est vide ni avec `?atelier`. Le compte GoatCounter reste à créer par Arsène (puis renseigner `COUNTER` dans `js/jeu.js`).
- Performances : ordinateur 58 à 60 images par seconde ; téléphone émulé, processeur ralenti 4 fois, en régime établi : jour 42,5, pluie 36, nuit sous la neige 31,8 (Chromium sans carte graphique : rendu logiciel, donc mesure pessimiste ; les 3 premières secondes, avant l'adaptation, sont plus lentes). Moyens : tracés regroupés (sans effet visible), densité de pixels adaptative, palier d'économie si l'appareil reste lent.
- Qualité : 60 s de jeu accéléré sans erreur ; 14 jours sans rien poser, rien de perdu, aucun reproche ; sauvegarde de la session 4 rechargée sans perte.
- Météo, données réelles (série capturée le 22 octobre à 01 h 18 au Japon, faute de mieux : le terminal n'atteint pas Open-Meteo) :

| Heure (Tokyo) | Open-Meteo brut | Interprétation du jeu |
| --- | --- | --- |
| 21 oct. 23:00 | code 53, 7,2 °C, précip. 0,9 mm, neige 0 cm, au sol 0 m, vent 23,6 km/h, nuages 100 % | bruine (drizzle), 7,2 °C, neige au sol 0 cm, vent 23,6 km/h, source réelle |
| 22 oct. 00:00 | code 51, 5,7 °C, précip. 0,3 mm, neige 0 cm, au sol 0 m, vent 24,7 km/h, nuages 100 % | bruine (drizzle), 5,7 °C, neige au sol 0 cm, vent 24,7 km/h, source réelle |
| 22 oct. 01:00 | code 51, 4,8 °C, précip. 0,2 mm, neige 0 cm, au sol 0 m, vent 23,4 km/h, nuages 100 % | bruine (drizzle), 4,8 °C, neige au sol 0 cm, vent 23,4 km/h, source réelle |

  Le critère demande trois heures *récentes* : à refaire avec le bouton de l'Atelier, en ligne.

- Captures : par rapport à `avant-session-5`, 12 à 30 % des pixels changent parce que la barre du bas (« Étagère », « Gestes », pied de page) est nouvelle et que la scène se cale sur le haut de cette barre, donc quelques pixels plus bas ; le dessin lui-même est inchangé. `fin-session-5/` est la nouvelle référence.

### Écarts et questions pour Arsène
- **Poids des scripts et styles** : 270 Ko bruts (cahier : moins de 250 Ko), 96 Ko transférés (gzip). Pour passer sous 250 Ko bruts sans étape de build : sortir le code de l'Atelier et le provisoire hors cahier dans un fichier chargé seulement avec `?atelier` (environ 25 Ko). Non fait : refonte à décider.
- **« Aucun texte écrit par l'IA visible sans `?atelier` »** : non rempli. Restent visibles des textes écrits en session 1, qui ne sont pas des emplacements « à écrire » : lignes du registre (chat, écolier, vieille dame, cheminot, nouveau kō, objet oublié ; « Depuis ta dernière visite… », « Première visite… », « Les N jours plus anciens sont résumés… », « Rien de nouveau… »), messages des gestes (jardin, quai, gamelle, lampe, « Le chat ronronne. »), notes du carnet, « Tu as rangé… », intitulés de l'étagère, et deux notes en dur dans `index.html` (intro du carnet, « Les lignes du registre sont provisoires… »). Les intitulés fonctionnels (boutons, météo, heures) ne posent pas question. À trancher : valider tels quels, réécrire (6a), ou les passer en « à écrire » (invisibles en jeu normal).
- **« Aucun compteur… visible »** : le carnet affiche « N/72 » (tampons) et « N voyageur(s) sur 24 » (masqué tant que le voyageur est désactivé). Le critère vise peut-être seulement la boucle des objets (aucun compteur de conséquences, c'est le cas). À trancher.
- **Série météo enregistrée ou simulée dans l'Atelier** (lot K, facultatif) : non faite.
- **Lot I (surnaturel)** : non fait, conditionné à « tout le reste fini » ; les deux premiers points ci-dessus restent ouverts.
- Classement des faits notables du registre (`NAGORI.REGISTRE`) et seuils de performance : NON VALIDÉS.

## Session 3 : état exact par rapport au cahier (docs/cahier-lots-F-G-H.md)

### Conforme (comportement conforme à l'extrait, couvert par les tests)
- F : horaires des trains inchangés ; livreur en scooter, phare allumé, chaque nuit entre 4 h 05 et 4 h 20 ; fenêtre de ferme allumée vers 4 h 30 jusqu'au lever ; chasse-neige (gyrophare, bourrelet) et cheminot qui dégage le quai à la lanterne vers 5 h seulement après 2 cm de neige réelle en 6 h ; renard près de la salle d'attente, environ 2 nuits sur 10 ; cerfs plus fréquents en automne, plus rares dans la neige profonde, yeux qui brillent sous la lampe ; givre (session 2) ; tirage commun à tous pour une nuit ; cause de chaque événement écrite dans `data/monde.js`.
- G : routines (écolier les jours d'école, absent les week-ends et le 23 novembre ; vieille dame 13 h-13 h 35, même bout du banc ; cheminot 10 h 30 et 21 h 30, quai après la neige ; chat à heures tirées, sans parole) ; compteur d'habitude (session 2) ; dates des trois moments (20, 24, 26 novembre) ; étiquettes numérotées sur le banc, le poêle et l'horloge, qui restent.
- H : deux dates dans `data/fermeture.js` ; avis officiel et compte à rebours visibles dès la première visite ; compte à rebours 115 le 17 novembre, 102 le 30, passage à minuit heure du Japon ; cahier de la gare sur l'étagère ; calendrier J1 à J13 aux bonnes dates, décalable d'un seul réglage (`debutTest`) ; photos sépia dessinées en code ; 7 lignes de craie un jour sur deux (`data/craie.js`) ; rien n'est retiré, vidé ni emballé.

### Incomplet
- Tous les textes (emplacements « à écrire ») : traduction de l'avis, 3 entrées du cahier, 7 lignes de craie, 2 lignes par habitué, lignes des moments, lignes de registre des changements, textes de la nuit, traces de la session 2, textes des kō, voyageur. Conséquence en jeu normal tant qu'ils manquent : le cahier de la gare ne s'ouvre pas, le registre n'a pas les lignes des changements, toucher l'avis, la craie ou un habitué n'affiche rien. Le critère « chaque changement a sa ligne au registre » n'est donc rempli qu'avec `?atelier`.
- Voyageur : interrupteur fait (session 4), désactivé par défaut comme le veut le cahier.
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
- **Voyageur** : désactivé par défaut. Reste la note des objets trouvés du carnet (« Les voyageurs oublient… ») et le nom du réglage (lot J).
- **Série réelle de 14 jours** : elle validerait à la fois le rapport des nuits et la variété du récit.
- Textes d'Arsène (session 6a, textes des 2, 9 et 16 novembre).
- Série réelle de 14 nuits : à capturer par le navigateur intégré (le terminal n'atteint pas Open-Meteo), puis `node outils/nuits.js FICHIER`.
- Relecture du japonais.
- Bible et cahier : la région (« hors de toute gare réelle ») reste à corriger par Arsène.

## Prochaine action concrète
Arsène tranche les écarts de la session 5 (poids, textes de session 1 encore visibles, compteur du carnet), crée le compte GoatCounter, et les interprétations du lot E ; puis la session 6 (intégration des textes, corrections, mise en ligne avec son accord).

## Pièges connus
- Le terminal n'atteint pas Open-Meteo ; les séries réelles passent par le navigateur intégré. Les tests naviguent avec Open-Meteo simulé.
- Horloge de Playwright : `page.clock.install` veut une date avec fuseau ; `fast_forward` pour les grands sauts, `run_for` seulement pour quelques secondes ; mettre à jour la réponse simulée AVANT le saut.
- `pkill -f` peut tuer son propre shell si le motif figure dans la commande : écrire `[c]aptures`.
- Une constante utilisée avant sa déclaration (`const` plus bas dans `jeu.js`) casse tout le jeu : vérifier en chargeant la page.
- Les prises de captures sont longues (environ 1 à 2 min par état) : les lancer en arrière-plan.
