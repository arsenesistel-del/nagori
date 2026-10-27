# Nagori

Petit jeu web contemplatif : une gare de campagne japonaise qui vit à l'heure réelle de Tokyo, sous la vraie météo et au rythme des 72 micro-saisons (七十二候). La gare vit sa dernière année avant fermeture. Projet personnel d'Arsène.

Les documents de référence (bible du projet, boucle de jeu et plan) sont dans le projet claude.ai « Nagori · jeu des micro-saisons ». En cas de doute sur une décision de design, ils font foi.

## Reprendre le travail (nouvelle conversation)

1. Lire ce fichier, `PASSATION.md` (décisions récentes, prochaine action), puis le cahier des charges v3 du projet claude.ai pour les lots concernés. La bible fait référence pour le design ; ne pas la modifier.
2. Vérifier l'état réel : `git status`, `git branch`, `git log --oneline | head`. Branche de travail : `session-1`. Ne rien fusionner dans `main` ni déployer sans accord explicite d'Arsène.
3. Ne pas refaire les analyses ni rediscuter les décisions validées (listées dans `PASSATION.md`) sans raison concrète.
4. Début de session : étiquette `avant-session-N`, captures de référence. Fin : tests (voir `PASSATION.md`), mise à jour de ce fichier, compte rendu court, commit et push de la branche.

## État actuel

Version de travail vers la « version jouable » (voir la feuille de route dans le projet claude.ai). Site statique, sans dépendance ni étape de build, hébergé sur GitHub Pages depuis `main`, à la racine.

Fichiers :
- `index.html` : la page (balisage seulement).
- `css/nagori.css` : styles.
- `data/calendrier.js` : 24 sekki, 72 kō (kanji, kana, romaji, sens littéral à vérifier), heures officielles NAOJ des sekki 2026 et 2027, textes des kō (`KO_TEXTE`, vides tant qu'Arsène ne les a pas écrits).
- `data/monde.js` : gare (`STATION`), trains, voyageur du sekki, omiyage, objets oubliés, moments rares.
- `data/textes.js` : **tous** les textes visibles du jeu, provisoires. C'est le seul fichier à toucher pour réécrire un texte.
- `js/ciel.js` : position réelle du soleil (Meeus) et de la lune (`moonAltAz`, faible précision, environ 0,3°, phase d'après l'écart réel lune-soleil), hauteur et direction du soleil à la gare, dates exactes des sekki et kō pour toute année (NAOJ prioritaire).
- `js/son.js` : tout le son, fabriqué en code avec Web Audio (aucun fichier, aucune licence) : rivière, pluie, vent, neige qui étouffe, lampe, faune selon le kō et la vraie température (grillons, suzumushi, grenouilles, cigales, higurashi, uguisu, chouette, corbeaux), passage à niveau, train (roues, freins, portes, klaxon), furin, gestes. API : `NAGORI.son.update(état)` à chaque image, `NAGORI.son.event(nom)`.
- `js/meteo.js` : toute la logique de la météo, sans dessin (tourne dans le navigateur et dans Node) : source de chaque mesure (`reelle`, `simulee`, `inconnue`), magasin des mesures réelles heure par heure et cache du navigateur (`nagori-meteo-v1`, 10 jours, jamais de simulé), état « maintenant » (donnée gardée 2 h, neige au sol gardée 24 h, sinon ciel couvert neutre), requête avec `past_days`, reprises après panne (8 s de délai, puis 1, 5, 15 min), `pointDeVue`.
- `data/objets.js` : réglages des trois objets à laisser (`NAGORI.POSES`) : poids, conditions, fenêtres, créneaux des habitués, jours d'école, garde-fous, retour du parapluie. Aucun texte. Les poids se modifient sans toucher au code.
- `js/objets.js` : logique pure des objets, sans dessin (navigateur et Node) : graine (date à la minute, objet, sel du joueur), fenêtre de la conséquence, tirage pondéré, garde-fous, habitude, retour du parapluie prêté, effacement des empreintes, `poser` / `reprendre` / `avancer`.
- `data/habitues.js` (session 3) : fiches provisoires des habitués et du chat (rôle, passages, traits de comportement, jamais d'histoire), seuils des traits (`regles`), visiteurs de la nuit (`NAGORI.NUIT`), calendrier de fermeture (`NAGORI.FERMETURE` : dernier jour 12 mars 2027, dernier arrêt 18:45, compte à rebours à J−30, fleurs à J−7). Tout est provisoire.
- `js/vie.js` (session 3) : logique pure (navigateur et Node) : traits selon la météo (`parapluie`, `bonnet`, `vieilleVient`, `cheminotDeneige`, `chatAbrite`), visiteurs de la nuit tirés par date (`nuitDe`, `visiteurA`, `dernierPassage`), état de la fermeture (`fermeture`).
- `js/jeu.js` : scène canvas 2D, personnages, gestes, registre, carnet, météo, Atelier. Le décor vit dans un repère de 1600 × 900 ; les repères (gare 360-610, distributeur 620-654, lampe 694, banc 740-830, panneau 860-1010, passage à niveau 1262, jardin 560-740 au premier plan) sont notés en tête du bloc « Canvas et cadrage ».
- `manifest.webmanifest`, `sw.js`, `icones/` : installation sur l'écran d'accueil (PWA) ; le service worker sert le réseau d'abord et le cache hors ligne, jamais la météo. Icônes dessinées en code (PIL), pas générées par IA.
- `outils/version.py` : numéros de version des fichiers.
- `outils/captures.py` : six captures d'écran de référence (Chromium de l'espace de travail, horloge simulée), `prendre DOSSIER` puis `comparer AVANT APRES`. Références : `tests/captures/avant-session-1/` (début de session 1), `fin-session-1/` (début de session 2), `fin-session-2/` (six états, plus `fin-session-2/traces/` : une image par trace, `prendre DOSSIER --traces`), `avant-session-3/`, `fin-session-3/` (plus `traces/` et `session3/` : huit états avec le provisoire, `prendre DOSSIER --session3`). Depuis la session 3, les prises ordinaires décochent « provisoire » : elles montrent le jeu des testeurs. La pluie et la neige ne se reproduisent pas à l'image près (bruit d'environ 1,2 %).
- `tests/` : `vie.test.js` (lune, traits, nuit, fermeture ; `node tests/vie.test.js`), `vie.navigateur.test.py` (rien de provisoire sans `?atelier`, interrupteur, jours fériés, gare fermée ; `python3 -I tests/vie.navigateur.test.py`, environ 1 min), `objets.test.js` (moteur des objets, `node tests/objets.test.js`), `objets.navigateur.test.py` (étagère, pose, résolution, rechargement, météo absente, aperçu ; `python3 -I tests/objets.navigateur.test.py`), `meteo.test.js` (logique pure, `node tests/meteo.test.js`, sans bibliothèque), `navigateur.test.py` (pannes simulées, simulé contre réel, ancienne sauvegarde ; `python3 -I tests/navigateur.test.py`, environ 3 min), `donnees/` (série réelle de 7 jours `reel-2026-10-22.json`, séries simulées `simule-neige-3-jours.json` et `simule-novembre-14-jours.json` (générée par `generer-simule-novembre.js`)).

Ce que fait le jeu :
- heure de Tokyo (`Asia/Tokyo`) quelle que soit l'heure de l'appareil ; lumière calculée depuis la vraie hauteur du soleil à la gare ;
- kō du jour (kanji, lecture, sens, jusqu'à quand), calculé et non plus approximatif ; un kō commence le jour de son début, toute la journée ;
- météo réelle via Open-Meteo (gratuit, sans clé), présentée comme celle de modèles pour ce lieu et non d'une station : type et intensité (bruine, pluie, forte pluie, neige, forte neige…), vent, neige au sol. Chaque mesure porte sa source. Le jeu ne dessine que des mesures `reelle`, sauf dans l'Atelier (`simulee`, jamais enregistrée, bandeau « (simulé) »). Une date ou une heure simulée n'emprunte jamais la météo d'aujourd'hui : mesure réelle de cette heure si elle existe, sinon « météo inconnue à cette heure ». Panne : la dernière donnée de moins de 2 h reste, avec son heure (« météo de 14:05 ») ; au-delà, « météo indisponible », ciel couvert, rien ne tombe, aucun moment rare (la neige au sol reste 24 h après sa dernière mesure). Les moments rares qui dépendent de la météo ne s'enregistrent que sur une mesure réelle ;
- le point de vue : chaque image dessine un instant et une météo (`vue` dans `jeu.js`, `pointDeVue` dans `meteo.js`). Le récit de l'absence (session 4) en fournira d'autres ;
- trains à horaires fixes, habitués à heures réelles (écolier en semaine, vieille dame, cheminot), chat à heures tirées d'une graine par jour (`dayPlan`) ;
- gestes du jour : balayer, arroser, nourrir le chat, allumer la lampe au crépuscule ;
- voyageur du sekki : arrive le 4e jour du sekki par le train de 16:20, attend jusqu'à ce qu'on l'accueille, laisse un omiyage qui décore la gare ;
- registre (駅日誌) « depuis ta dernière visite », objets oubliés, carnet (tampons des 72 kō, moments rares dont la première neige, omiyage) ;
- son : coupé par défaut, bouton « Son » ; s'il a été activé, il revient au premier toucher (règle des navigateurs) ;
- cadrage selon l'écran : toute la gare en paysage ; en portrait, cadrage sur le bâtiment et le banc, et on glisse pour regarder ailleurs ;
- décor : gare en bois au toit de tôle rouge, cheminée du poêle qui fume quand il fait moins de 10 °C, tableau à craie, horaires, distributeur lumineux, boîte aux lettres, autorail diesel à une voiture ;
- la météo marque le décor : neige qui s'accumule (épaisseur réelle), stalactites sous −1 °C, quai mouillé avec flaques et reflets des lumières, gouttes sur les vitres, buée des respirations par grand froid ;
- gestes au doigt : glisser sur le quai pour balayer, appui long sur le jardin pour arroser, toucher le reste ;
- passage à niveau à droite du quai : il sonne et clignote 8 s avant l'arrivée de chaque train ;
- objets à laisser (session 2, lots C et D) : une étagère dans la fenêtre de droite de la salle d'attente ; on pose un seul objet à la fois (thermos de thé, parapluie à prêter, lumière laissée allumée) ou on le reprend, sans aucune conséquence. La conséquence se joue après une fenêtre de 24 h (la nuit suivante pour la lumière), d'après la météo réelle de cette fenêtre, avec une graine fixe : recharger ne change rien, deux joueurs n'ont pas les mêmes résultats (sel tiré à la première visite). Une condition météo sans mesure réelle attend, 48 h au plus, puis ne garde que ce qui n'en dépend pas. Le parapluie prêté revient après 1 à 5 jours (parfois 10 à 20, avant la fermeture) et ne se repose pas avant. Les traces restent jusqu'à la pose suivante : thermos et tasses sur le banc, porte-parapluie plein ou vide, lanterne, chat ou givre à la vitre, banc déplacé, poils de renard, empreintes dans la neige (estompées dès 1 cm de neige réelle tombée depuis, effacées dès 3 cm), givre sur le banc et les rails (sous 0 °C, humidité d'au moins 80 %, mesures réelles). Au toucher, une ligne provisoire « texte à écrire » (`T.traces`). Aucun compteur, indice ni probabilité. Pas encore de récit ni de ligne de registre pour les objets (sessions 4 et 5) ;
- jours d'école : l'écolier (scène et registre) suit les jours fériés de `data/objets.js`, comme les objets (correction de la session 3, visible de tous) ;
- session 3 (lots F, G, H), **provisoire, visible seulement avec `?atelier`** (case « provisoire » de l'Atelier, cochée par défaut ; décochée, on revoit le jeu des testeurs) :
  - nuit (F) : la vraie lune (position, phase, lever et coucher ; devant les montagnes du décor au-dessus de 15°), clair de lune qui éclaire un peu la scène et davantage la neige, étoiles atténuées par la lune ; la pleine lune du carnet ne compte que si la lune est levée ; visiteurs de la nuit (renard sur le quai, cerf sur la voie, plus souvent l'hiver), tirés par date, les mêmes pour tous, avec leurs pas dans la neige réelle ; papillons de nuit autour de la lampe au-dessus de 15 °C ;
  - habitués (G) : parapluie sous la pluie ou la neige (pas au-delà de 40 km/h de vent), bonnet sous 0 °C, la vieille dame reste chez elle par forte neige, orage, vent fort ou grand froid (et le registre ne la mentionne pas ce jour-là si la mesure réelle de 13 h le dit), le cheminot déblaie le passage à niveau le matin dès 5 cm de neige au sol, le chat s'abrite derrière la vitre de la salle d'attente sous la pluie, la neige ou sous −3 °C ; pas de l'écolier et du chat dans la neige. Une météo inconnue ne déclenche aucun trait ;
  - fermeture (H) : avis de fermeture sur le mur, compte à rebours à la craie (« あと N 日 ») à partir de J−30, ligne de bandeau provisoire, fleurs au pied du panneau les sept derniers jours ; après le dernier arrêt du 12 mars 2027, la salle et le distributeur s'éteignent, les trains passent sans s'arrêter, plus de voyageur ;
  - Atelier : panneau « Session 3 » (fiches, ce que fait chacun aujourd'hui, visiteurs de la nuit, lune, état de la fermeture) et bouton pour faire passer un visiteur ;
- Atelier : outils de test (heure, date, météo, neige au sol, vent, aperçu de chaque trace, scènes, prochains kō). Visible seulement avec `?atelier` dans l'adresse.

Sauvegarde : `localStorage`, clé `nagori-maquette-v2`, champ `version: 3`. Les champs nouveaux s'ajoutent à `fresh()` ; l'ancienne sauvegarde est fusionnée par-dessus, sans migration. Pas de compte, pas de serveur. Aucune donnée météo n'y est écrite.

Test de six semaines (repoussé jusqu'à la version jouable) : chaque testeur aura un lien `?t=prenom`, mémorisé dans `localStorage` (`nagori-testeur`). Un compteur GoatCounter sans cookie comptera les visites sur `/t/prenom`. Inactif tant que la constante `COUNTER` est vide, jamais avec `?atelier`.

Avant chaque mise en ligne : `python3 outils/version.py` (numéro de version sur les fichiers chargés, sinon les navigateurs mélangent ancienne et nouvelle version).

Tester en local : `python3 -m http.server` dans le dossier, puis ouvrir `http://localhost:8000/?atelier`.

Prototype de 14 jours (cahier des charges v3 dans le projet claude.ai) : six sessions de code. Avant chaque session, étiquette git `avant-session-N` et captures de référence ; après, tests, mise à jour de ce fichier, compte rendu. Sessions 1 (lots A et B : météo honnête, point de vue, sauvegarde v3, tests, captures), 2 (lots C et D : objets et traces) et 3 (lots F, G, H, provisoires, voir plus haut) faites, sur la branche `session-1` ; rien n'est fusionné dans `main` ni en ligne sans l'accord explicite d'Arsène. Étiquettes locales `avant-session-1` (sur `6e05c57`), `avant-session-2` et `avant-session-3` (sur `d491c70`) ; le proxy refuse de les pousser sur GitHub. Reste à faire : validation par Arsène du provisoire de la session 3, puis sessions 4 à 6. Le cahier des charges n'était pas lisible depuis la session cloud de la session 3 : les lots F, G, H ont été faits d'après ce fichier et `PASSATION.md`, à confronter au cahier.

Région (décidée le 26 octobre 2026) : la vallée du haut Yubetsu, à Engaru (Hokkaidō), sur la ligne Sekihoku, au point de la vraie gare de Shirataki : 43,8842° N, 143,1809° E (Wikipédia ; le géocodeur Open-Meteo place le village à 400 m). Tout vient de `NAGORI.STATION` (`data/monde.js`) : soleil, météo, Atelier. Soleil le 17 novembre : 06:24 à 16:01. La gare de Nagori, ses horaires et ses habitants restent imaginaires. Le test de météo réelle `tests/donnees/reel-2026-10-22.json` a été pris 2,6 km plus au sud-ouest, dans la même maille du modèle, donc la même météo.

Le terminal de l'espace de travail n'atteint pas Open-Meteo : géocodage et séries réelles passent par le navigateur intégré (`mcp__remote-devices__Claude_Browser__*`) ; le Chrome relié n'a pas répondu en session 1.

Direction : 2D en couches (choix du 18 octobre 2026), pour pouvoir accueillir plus tard une illustration d'artiste découpée en calques et éclairée par le code. Ressources gratuites uniquement pour l'instant.

## Règles du projet

- **Charte** : le code est assisté par IA. Les images et la musique du jeu ne sont jamais générées par IA. Les textes partent des idées, dictées ou souvenirs d'Arsène et c'est lui qui valide. Tous les textes visibles actuels sont des emplacements provisoires, rangés dans `data/textes.js`. Ne jamais y mettre de texte narratif inventé par l'IA : seulement des emplacements ou des textes validés par Arsène.
- **Rétention douce** : aucune loot box, aucun avantage payant, aucune punition d'absence, aucune notification culpabilisante. Une absence ne fait jamais rien perdre.
- **Ton** : mélancolie douce, dominante Spiritfarer. Textes courts et concrets.
- Réponses à Arsène : en français, directes, sans tirets cadratins ni tournures qui sonnent IA. Poser une question quand une décision lui revient.

## Pistes ouvertes

Nom définitif, qui sont les voyageurs, chef de gare visible ou non, présence des autres joueurs, musique, langues. Voir la bible.
