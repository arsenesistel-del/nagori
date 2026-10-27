# Extrait du cahier des charges v3 : lots F, G, H (copie pour les sessions de code)

Copie verbatim des passages du cahier des charges du projet claude.ai (« Nagori, cahier des charges du prototype de 14 jours », v3 du 21 octobre 2026) qui concernent la session 3. Le cahier complet reste la référence. En cas d'écart, il fait foi.

## Rappels de la partie 2 (lieu)
- Trains : arrêts à 7 h 48, 13 h 30, 16 h 20 et 18 h 45 ; trains sans arrêt à 6 h 12, 10 h 05 et 21 h 10. On n'ajoute pas de train.
- Date de fermeture : imaginée.
- Cerfs d'Ezo et renard de Hokkaidō : réels ; leur fréquence est imaginée. Chasse-neige routier : il passe seulement s'il a vraiment neigé.

## Lot F · Nuit et petit matin

**La présence de fond**, toujours là sans être un événement : les fenêtres et la lampe allumées, le distributeur qui ronronne, la fumée du poêle par temps froid, la rivière, le vent, le ciel réel, le chat parfois. Elle existe déjà en grande partie.

**La routine rurale**, quotidienne, discrète, sans annonce :

| Heure (gare) | Quoi | Statut |
| --- | --- | --- |
| 4 h 05-4 h 20 | le livreur de journaux en scooter passe le passage à niveau, phare allumé | pratique réelle, heure imaginée |
| vers 4 h 30 | une fenêtre de ferme s'allume sur l'autre rive, jusqu'au lever du soleil | imaginé, plausible |
| 6 h 12 | le train sans arrêt (déjà présent) | horaire imaginé |

**Les événements marquants n'arrivent que s'ils ont une raison**, et rien n'est garanti chaque soir :

| Événement | Cause | Fréquence |
| --- | --- | --- |
| chasse-neige routier sur le passage à niveau, gyrophare, bourrelet de neige | au moins 2 cm de neige réelle dans les 6 h précédentes | seulement ces nuits-là |
| le cheminot dégage la neige du quai à la lanterne, vers 5 h | idem | seulement ces matins-là |
| cerfs d'Ezo qui traversent la voie, yeux qui brillent sous la lampe | saison : plus fréquents en automne, rares dans la neige profonde | tirage par nuit, souvent aucun |
| renard près de la salle d'attente | aucune particulière | environ 2 nuits sur 10 |
| givre sur le banc et les rails | température et humidité réelles | selon la météo |

Le tirage de la vie de nuit est commun à tous les joueurs pour une même nuit. **Indispensable** : l'image. **Facultatif** : les sons nouveaux (scooter, chasse-neige, sabots, pelle à neige).

## Lot G · Habitués et chat

Chacun a une silhouette reconnaissable sur téléphone, une démarche, un geste d'attente, une routine, son rapport aux objets et deux lignes au toucher qui alternent. Les traits définitifs viennent des fiches d'Arsène (26 octobre).

| | Routine (gare) | Objets | Moment de fermeture |
| --- | --- | --- | --- |
| L'écolier | jours d'école : arrive vers 7 h 30, train de 7 h 48, retour par celui de 16 h 20 ; absent les week-ends et le 23 novembre | thermos, parapluie | vendredi 20 novembre |
| La vieille dame | tous les jours 13 h-13 h 35 ; regarde partir le train de 13 h 30, toujours au même bout du banc | thermos, parapluie | mardi 24 novembre |
| Le cheminot | inspection vers 10 h 30, soirée à la lanterne vers 21 h 30 ; dégage le quai après une nuit de neige | thermos | jeudi 26 novembre |
| Le chat | heures tirées chaque jour | lumière, gamelle | aucun (il ne parle pas) |

Les habitués se souviennent des objets (compteur d'habitude). Le chat ne parle jamais : c'est le registre qui raconte ce qu'il fait.

## Lot H · La fermeture, présence narrative

**Les dates.** La révision des horaires est fixée au samedi 13 mars 2027 (provisoire), et le dernier jour de service est donc le **vendredi 12 mars 2027**, la veille, comme pour les vraies fermetures. Les deux dates sont dans `data/fermeture.js`.

**L'intensité.** En novembre, il reste presque quatre mois. Les adieux arrivent dans les dernières semaines. Novembre correspond donc à « la nouvelle s'est installée, la vie continue » :
- **rien n'est retiré, vidé ni emballé** ; la gare n'a pas l'air abandonnée ;
- ce qui change **s'ajoute** : de la mémoire, de l'attention, les premiers visiteurs ;
- pour plus tard : décembre et janvier, plus de visiteurs ; février, les préparatifs ; mars, les adieux (hors prototype).

**Ce qui existe dès la première visite :**
1. **L'avis officiel** près de la porte : une affiche administrative dessinée, un titre japonais court (relu par un natif), des lignes illisibles, la date en gros. Un toucher affiche sa traduction (texte d'Arsène).
2. **Le compte à rebours**, petit, à la craie, dans le coin du tableau, d'une main qu'on ne connaît pas. C'est un geste de quelqu'un, pas une annonce officielle. Il compte les jours jusqu'au dernier jour de service, d'après la date à la gare : 「あと115日」 le 17 novembre, 「あと102日」 le 30 novembre (formulation à valider par un natif).
3. **Le cahier de la gare (駅ノート)** sur l'étagère de la salle d'attente. De nouvelles entrées apparaissent à date fixe.

**Ce qui change pendant le test**, et reste en place :

| Jour | Date | Fermeture | Repères |
| --- | --- | --- | --- |
| J1 | mar. 17 nov. | 1re entrée du cahier | kō 金盞香 ; il reste 115 jours |
| J3 | jeu. 19 nov. | une affiche de la commune : appel aux photos anciennes de la gare, pour une exposition avant la fermeture | |
| J4 | ven. 20 nov. | moment de l'écolier | |
| J5-J6 | 21-22 nov. | | week-end ; sekki 小雪 et kō 虹蔵不見 le 22 |
| J6 | dim. 22 nov. | une première photo ancienne punaisée sous l'affiche | |
| J7 | lun. 23 nov. | 2e entrée du cahier (des visiteurs, un jour férié) | pas d'école |
| J8 | mar. 24 nov. | moment de la vieille dame | |
| J9 | mer. 25 nov. | | voyageur, seulement s'il est activé |
| J10 | jeu. 26 nov. | le cheminot fait l'inventaire et colle de petites étiquettes numérotées sur le banc, le poêle et l'horloge ; c'est son moment | |
| J11 | ven. 27 nov. | | kō 朔風払葉 |
| J12 | sam. 28 nov. | une deuxième photo ancienne | |
| J13 | dim. 29 nov. | 3e entrée du cahier | |
| J14 | lun. 30 nov. | | fin du test ; il reste 102 jours |

Les photos anciennes sont dessinées en code, comme le reste : de petits rectangles sépia aux formes vagues, sans image réelle ni générée.
Chaque changement est visible dans la scène, a sa ligne au registre et peut devenir un plan du récit. Les dates se décalent d'un seul réglage si le test bouge.
Pendant son jeu en solo, Arsène voit ces événements en simulant les dates du test dans l'Atelier.

**Le tableau à craie** reçoit aussi une ligne, indexée par date dans `data/craie.js` : 7 lignes en version allégée, un jour sur deux, les autres jours gardent la précédente.

## Critères de validation concernés (partie 9)

**Nuit**
- [ ] Chaque événement marquant a une cause documentée dans `data/monde.js` ; aucun n'est déclenché pour remplir un quota.
- [ ] Sur 14 nuits simulées avec une série réelle, le rapport indique combien de soirées de Paris sont calmes et combien ont un événement marquant. C'est une information à relire, pas un seuil.

**Fermeture**
- [ ] L'avis et le compte à rebours sont visibles dès la première visite, sur téléphone et ordinateur.
- [ ] Le compte à rebours affiche 115 le 17 novembre et 102 le 30 novembre (date de la gare), et passe au jour suivant à minuit, heure du Japon.
- [ ] Les trois entrées du cahier, les quatre changements et les trois moments des habitués apparaissent aux bonnes dates (simulation).
- [ ] Rien n'est retiré, vidé ni emballé dans la gare pendant la période.
- [ ] Voyageur désactivé : aucune trace de lui nulle part.

**Qualité**
- [ ] Les trois habitués se distinguent au premier coup d'œil sur téléphone (vérifié par Arsène).
