# Extrait du cahier des charges v3 : lot E (récit de l'absence) et passages liés

Copie verbatim des passages du cahier des charges du projet claude.ai (« Nagori, cahier des charges du prototype de 14 jours », v3 du 21 octobre 2026) utiles à la session 4. Le cahier complet reste la référence. En cas d'écart, il fait foi.

## Rappels de la visite type (partie 4)
1. **Ouverture** : la scène en direct, tout de suite.
2. **La vignette « Pendant ton absence »**, avec sa durée, si l'absence le justifie. Un toucher lance le récit. Elle s'efface au premier geste ou après 30 s, et reste accessible depuis le registre.
3. **Découverte dans la scène** : les traces de la conséquence de l'objet, la ligne du jour au tableau à craie, ce qui a changé dans la gare.
4. **Le présent** : la gare telle qu'elle est à cette heure-là, calme ou animée.
5. **Le choix** : poser un objet sur l'étagère de la salle d'attente, ou ne rien poser.
6. **Fermeture** : rien à valider, aucun « à demain ».

## Le point de vue (lot A)
Le mécanisme de simulation de l'Atelier (heure, date, météo) est généralisé en un « point de vue » : un instant et une météo, que la scène sait dessiner. Le récit et l'Atelier l'utilisent. (Fait en session 1 : `vue`, `pointDeVue`.)

## Lot E · Le récit de l'absence

**Déclenchement :**
- absence de 3 h ou plus, avec au moins un plan à montrer ; sinon, pas de vignette ;
- la vignette indique la durée du récit. Elle s'efface au premier geste ou après 30 s, et le récit reste accessible depuis le registre ;
- un toucher pendant le récit le passe ; il n'est jamais reproposé pour la même absence.

**Les plans** : 2 à 4 s chacun, fondu de 0,6 s. Chaque plan est rendu par la scène, à l'instant et avec la météo de l'heure, animé. En surimpression discrète : le jour et l'heure de la gare, et « simulé » si c'est le cas (Atelier seulement).

| Priorité | Type de plan | Condition | Cadrage |
| --- | --- | --- | --- |
| 1 | Conséquence de l'objet | toujours montrée si elle a eu lieu | serré sur la trace |
| 2 | Arrivée du voyageur | si elle a eu lieu et qu'il est activé | quai et train |
| 3 | Changement de la gare | un signe de la fermeture est apparu | sur le signe |
| 4 | Changement de temps | début de pluie ou de neige, première neige, éclaircie (données réelles) | large |
| 5 | Lumière | lever ou coucher du soleil ; au moins un plan de jour dès que l'absence en contenait | large, rivière |
| 6 | Habitué | seulement si sa routine a changé (pluie, absence, objet, moment de fermeture) | moyen |
| 7 | Vie de nuit | seulement un événement marquant qui a eu lieu (lot F) | moyen |
| 8 | Changement de kō | si un kō a commencé | carton au nom du kō en japonais |

**Durée selon l'absence :**

| Absence | Récit |
| --- | --- |
| 3 h à 1 jour | 4 à 6 plans, 20 s au plus |
| 2 à 7 jours | le meilleur plan de chaque jour, daté, 25 s au plus |
| plus de 7 jours | les 7 derniers jours, un plan chacun, puis une ligne neutre dans le registre pour les jours calmes |

**Anti-répétition :**
- un type de plan vu dans l'un des trois derniers récits voit sa note multipliée par 0,3 ;
- la routine d'un habitué n'apparaît jamais deux récits de suite ;
- une absence calme donne un seul plan, ou aucun récit.

**Son** : l'ambiance de chaque plan à volume réduit, la sonnerie du passage à niveau pour un plan de train. Rien si le son est coupé.

## Lot B (rappels utiles au récit)
- Moments rares, conséquences qui dépendent de la météo et plans météo du récit s'appuient uniquement sur des données `reelle`.
- Hors ligne (application installée) : même comportement que la panne, et le récit ne garde que les plans sans météo.
- Une heure `inconnue` retire ses plans météo.

## Lot C (rappel)
Si le joueur est là au bon moment, la conséquence se joue en direct. Sinon, elle est calculée au retour et le récit la montre. (Décision d'Arsène du 26 octobre : le prototype résout à la fin de la fenêtre ; le récit ne doit jamais prétendre que le joueur y a assisté en direct.)

## Lot H (rappel)
Chaque changement de la fermeture est visible dans la scène, a sa ligne au registre et peut devenir un plan du récit.

## Lot J (extraits)
- **Registre** : seulement les faits notables, 5 lignes au plus par jour, et un lien « Revoir » vers le récit.
- **Voyageur** : réglage `VOYAGEUR_TEST.actif`, **désactivé par défaut**, activé seulement si ses trois textes sont validés le 16 novembre. Désactivé, il n'apparaît nulle part (bandeau, registre, carnet). Les voyageurs des autres sekki sont désactivés pendant toute la période.
- Aucun texte provisoire visible sans `?atelier`.

## Critères de validation (partie 9)

**Récit**
- [ ] Jamais plus de 20 s (25 s après plusieurs jours), toujours passable, jamais reproposé pour la même absence.
- [ ] Au moins un plan de jour dès que l'absence en contenait.
- [ ] Sur 14 jours simulés, avec trois rythmes de visite (tous les soirs, un soir sur deux, une absence de 5 jours), aucun type de plan ne dépasse 40 % des plans montrés.

**Météo**
- [ ] Chaque donnée porte sa source ; aucune donnée simulée en mode normal ni dans la sauvegarde.
- [ ] Une heure `inconnue` retire ses plans météo et ne produit aucune conséquence météo.

**Session 4 (partie 13)** : objectif lot E ; dépend des sessions 2 et 3 ; validation : durées, passage, variété sur trois rythmes, plan de jour, aucune météo inventée ; aucun texte d'Arsène requis.
