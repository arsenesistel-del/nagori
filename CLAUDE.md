# Nagori

Petit jeu web contemplatif : une gare de campagne japonaise qui vit à l'heure réelle de Tokyo, sous la vraie météo et au rythme des 72 micro-saisons (七十二候). La gare vit sa dernière année avant fermeture. Projet personnel d'Arsène.

Les documents de référence (bible du projet, boucle de jeu et plan) sont dans le projet claude.ai « Nagori · jeu des micro-saisons ». En cas de doute sur une décision de design, ils font foi.

## État actuel

Version de travail vers la « version jouable » (voir la feuille de route dans le projet claude.ai). Site statique, sans dépendance ni étape de build, hébergé sur GitHub Pages depuis `main`, à la racine.

Fichiers :
- `index.html` : la page (balisage seulement).
- `css/nagori.css` : styles.
- `data/calendrier.js` : 24 sekki, 72 kō (kanji, kana, romaji, sens littéral à vérifier), heures officielles NAOJ des sekki 2026 et 2027, textes des kō (`KO_TEXTE`, vides tant qu'Arsène ne les a pas écrits).
- `data/monde.js` : gare (`STATION`), trains, voyageur du sekki, omiyage, objets oubliés, moments rares.
- `data/textes.js` : **tous** les textes visibles du jeu, provisoires. C'est le seul fichier à toucher pour réécrire un texte.
- `js/ciel.js` : position réelle du soleil (Meeus), hauteur et direction du soleil à la gare, dates exactes des sekki et kō pour toute année (NAOJ prioritaire).
- `js/son.js` : tout le son, fabriqué en code avec Web Audio (aucun fichier, aucune licence) : rivière, pluie, vent, neige qui étouffe, lampe, faune selon le kō et la vraie température (grillons, suzumushi, grenouilles, cigales, higurashi, uguisu, chouette, corbeaux), passage à niveau, train (roues, freins, portes, klaxon), furin, gestes. API : `NAGORI.son.update(état)` à chaque image, `NAGORI.son.event(nom)`.
- `js/jeu.js` : scène canvas 2D, personnages, gestes, registre, carnet, météo, Atelier. Le décor vit dans un repère de 1600 × 900 ; les repères (gare 360-610, distributeur 620-654, lampe 694, banc 740-830, panneau 860-1010, passage à niveau 1262, jardin 560-740 au premier plan) sont notés en tête du bloc « Canvas et cadrage ».
- `manifest.webmanifest`, `sw.js`, `icones/` : installation sur l'écran d'accueil (PWA) ; le service worker sert le réseau d'abord et le cache hors ligne, jamais la météo. Icônes dessinées en code (PIL), pas générées par IA.
- `outils/version.py` : numéros de version des fichiers.

Ce que fait le jeu :
- heure de Tokyo (`Asia/Tokyo`) quelle que soit l'heure de l'appareil ; lumière calculée depuis la vraie hauteur du soleil à la gare ;
- kō du jour (kanji, lecture, sens, jusqu'à quand), calculé et non plus approximatif ; un kō commence le jour de son début, toute la journée ;
- météo réelle via Open-Meteo (gratuit, sans clé) : type et intensité (bruine, pluie, forte pluie, neige, forte neige…), vent, neige au sol ; si la requête échoue, le bandeau affiche « météo indisponible » ;
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
- Atelier : outils de test (heure, date, météo, neige au sol, vent, scènes, prochains kō). Visible seulement avec `?atelier` dans l'adresse.

Sauvegarde : `localStorage`, clé `nagori-maquette-v2`. Pas de compte, pas de serveur.

Test de six semaines (repoussé jusqu'à la version jouable) : chaque testeur aura un lien `?t=prenom`, mémorisé dans `localStorage` (`nagori-testeur`). Un compteur GoatCounter sans cookie comptera les visites sur `/t/prenom`. Inactif tant que la constante `COUNTER` est vide, jamais avec `?atelier`.

Avant chaque mise en ligne : `python3 outils/version.py` (numéro de version sur les fichiers chargés, sinon les navigateurs mélangent ancienne et nouvelle version).

Tester en local : `python3 -m http.server` dans le dossier, puis ouvrir `http://localhost:8000/?atelier`.

Direction : 2D en couches (choix du 18 octobre 2026), pour pouvoir accueillir plus tard une illustration d'artiste découpée en calques et éclairée par le code. Ressources gratuites uniquement pour l'instant.

## Règles du projet

- **Charte** : le code est assisté par IA. Les images et la musique du jeu ne sont jamais générées par IA. Les textes partent des idées, dictées ou souvenirs d'Arsène et c'est lui qui valide. Tous les textes visibles actuels sont des emplacements provisoires, rangés dans `data/textes.js`. Ne jamais y mettre de texte narratif inventé par l'IA : seulement des emplacements ou des textes validés par Arsène.
- **Rétention douce** : aucune loot box, aucun avantage payant, aucune punition d'absence, aucune notification culpabilisante. Une absence ne fait jamais rien perdre.
- **Ton** : mélancolie douce, dominante Spiritfarer. Textes courts et concrets.
- Réponses à Arsène : en français, directes, sans tirets cadratins ni tournures qui sonnent IA. Poser une question quand une décision lui revient.

## Pistes ouvertes

Région réelle de la gare, nom définitif, qui sont les voyageurs, chef de gare visible ou non, présence des autres joueurs, musique, langues. Voir la bible.
