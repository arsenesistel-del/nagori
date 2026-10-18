# Nagori

Petit jeu web contemplatif : une gare de campagne japonaise qui vit à l'heure réelle de Tokyo, sous la vraie météo et au rythme des 72 micro-saisons (七十二候). La gare vit sa dernière année avant fermeture. Projet personnel d'Arsène.

Les documents de référence (bible du projet, boucle de jeu et plan) sont dans le projet claude.ai « Nagori · jeu des micro-saisons ». En cas de doute sur une décision de design, ils font foi.

## État actuel

Maquette V2, un seul fichier : `index.html` (HTML, CSS et JavaScript, sans dépendance ni étape de build). Hébergée sur GitHub Pages depuis la branche `main`, à la racine.

Ce qu'elle contient :
- scène dessinée en canvas 2D : ciel, soleil, lune et sa phase, étoiles, montagnes, rivière, gare, quai, lampe, banc, panneau 名残, jardin ;
- heure de Tokyo (`Asia/Tokyo`) quelle que soit l'heure de l'appareil ; sekki et kō calculés depuis des dates fixes approximatives ;
- météo réelle via Open-Meteo (gratuit, sans clé), coordonnées provisoires à Hokkaidō (`STATION`), vérifiée en ligne le 18 octobre 2026 ; si la requête échoue, la scène garde « quelques nuages » mais le bandeau affiche « météo indisponible » ;
- trains à horaires fixes (`TRAINS`), certains sans arrêt ;
- habitués à heures réelles : écolier (semaine), vieille dame, cheminot ; chat de gare à heures variables, tirées d'une graine par jour (`dayPlan`) ;
- gestes du jour : balayer, arroser, nourrir le chat, allumer la lampe au crépuscule ;
- voyageur du sekki : arrive le 4e jour du sekki par le train de 16:20, attend sur le banc jusqu'à ce qu'on l'accueille, laisse un omiyage qui décore la gare ;
- registre (駅日誌) « depuis ta dernière visite », objets oubliés, carnet (tampons des 72 kō, moments rares, omiyage) ;
- Atelier : outils de test (heure, date, météo, scènes). Caché par défaut ; visible seulement en ajoutant `?atelier` à l'adresse. Les testeurs reçoivent le lien sans ce paramètre.

Sauvegarde : `localStorage`, clé `nagori-maquette-v2`. Pas de compte, pas de serveur.

## Règles du projet

- **Charte** : le code est assisté par IA. Les images et la musique du jeu ne sont jamais générées par IA. Les textes partent des idées, dictées ou souvenirs d'Arsène et c'est lui qui valide. Tous les textes visibles actuels sont des emplacements provisoires.
- **Rétention douce** : aucune loot box, aucun avantage payant, aucune punition d'absence, aucune notification culpabilisante. Une absence ne fait jamais rien perdre.
- **Ton** : mélancolie douce, dominante Spiritfarer. Textes courts et concrets.
- Réponses à Arsène : en français, directes, sans tirets cadratins ni tournures qui sonnent IA. Poser une question quand une décision lui revient.

## Pistes ouvertes

Région réelle de la gare, nom définitif, qui sont les voyageurs, chef de gare visible ou non, présence des autres joueurs, musique, langues. Voir la bible.
