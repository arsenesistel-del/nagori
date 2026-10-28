# Extrait du cahier des charges v3 : lots I, J, K, L, contraintes et critères (session 5)

Copie verbatim des passages du cahier des charges du projet claude.ai (« Nagori, cahier des charges du prototype de 14 jours », v3 du 21 octobre 2026) utiles à la session 5. Le cahier complet reste la référence. En cas d'écart, il fait foi.

## Session 5 (partie 13)
**5 · Interface, Atelier, mesure** : lots I, J, K, L, performances, réglage du voyageur, ligne « réel et imaginé ». Dépend des sessions 2 à 4. Validation : aucun compteur ni objectif, gestes repliés, événements comptés, voyageur absent s'il est désactivé, fluidité. Textes d'Arsène : aucun.

## Lot I · Le surnaturel discret (facultatif)
- **Une seule option : des pas sur le quai enneigé qui s'arrêtent au milieu, sans retour.**
- **Conditions réelles** : au moins 1 cm de neige réelle tombée entre 0 h et 4 h, de la neige au sol, et pas avant J4.
- **Fréquence** : 25 % de chances par nuit éligible, une fois au plus par joueur. Sans nuit éligible, rien. Aucun rattrapage, aucun quota.
- Ce n'est jamais expliqué. Les pas s'effacent comme les autres traces. Dans un récit, ce n'est jamais le premier plan.

## Lot J · Interface, registre, gestes
- **Registre** : seulement les faits notables, 5 lignes au plus par jour, et un lien « Revoir » vers le récit.
- **Gestes actuels** : le libellé « Gestes du jour » et les coches disparaissent. Balayer, arroser, la lampe et la gamelle restent faisables au doigt dans la scène, et dans un menu « Gestes » replié.
- **L'étagère et ses trois objets** deviennent l'action principale, sans quête ni optimisation.
- **Voyageur** : réglage `VOYAGEUR_TEST.actif`, désactivé par défaut, activé seulement si ses trois textes sont validés le 16 novembre. Désactivé, il n'apparaît nulle part (bandeau, registre, carnet). Les voyageurs des autres sekki sont désactivés pendant toute la période.
- **Ce qui est réel et ce qui est imaginé** : une ligne dans le pied de page et dans le carnet. Formulation proposée par Claude, validée par Arsène : du type « le ciel, le calendrier et la météo sont réels ; la gare, ses horaires et ses habitants sont imaginés ». Aucun horaire n'est présenté comme réel.
- Aucun texte provisoire visible sans `?atelier`.

## Lot K · Atelier
- Simuler une date (dont celles du test), une absence de N heures ou N jours, une série météo enregistrée ou simulée.
- Forcer une conséquence, un événement de nuit, un signe de la fermeture, le surnaturel.
- Revoir chaque type de plan du récit.
- Afficher graines, tirages et source de chaque donnée météo.
- Bouton « Vérifier la météo réelle » : valeurs brutes d'Open-Meteo et interprétation du jeu, côte à côte.
- Tout remettre à zéro.
(Indispensable pour le test : la simulation de date et d'absence. Le reste des options est facultatif.)

## Lot L · Mesure
Lien personnel `?t=prenom` et GoatCounter, sans cookie de notre part. Le compte est à créer par Arsène. Événements anonymes, préfixés par le prénom :

| Événement | Ce qu'il éclaire |
| --- | --- |
| `visite-h21` (heure de Paris arrondie) | retour, heure de jeu |
| `sejour-60s` | on reste regarder |
| `sejour-sans-action` | contemplation sans geste |
| `recit-propose`, `recit-vu`, `recit-passe` | intérêt pour l'absence |
| `objet-thermos`, `objet-parapluie`, `objet-lumiere` | usage de la boucle |
| `trace-touchee` | curiosité pour la conséquence |
| `cahier-ouvert`, `avis-touche` | attention à la fermeture |
| `habitue-touche` | intérêt pour les personnages |
| `meteo-indispo` | pannes vécues |

Les testeurs sont prévenus avant le test. (Existant : `?t=prenom` mémorisé dans `localStorage`, constante `COUNTER` vide, jamais avec `?atelier`.)

## Partie 7 · Contraintes techniques
- Site statique sur GitHub Pages, sans dépendance ni build ; `python3 outils/version.py` avant chaque mise en ligne.
- Scripts et styles : moins de 250 Ko, polices non comprises.
- Fluidité : au moins 30 images par seconde avec un processeur ralenti quatre fois en émulation téléphone, au moins 50 sur ordinateur.
- Le terminal de l'espace de travail n'atteint pas Open-Meteo ; les vérifications sur données réelles passent par le navigateur relié ou intégré.

## Critères de validation concernés (partie 9)
**Boucle**
- [ ] Ne rien poser pendant 14 jours : rien de perdu, aucun message de reproche.
- [ ] Aucun compteur, objectif, succès ni liste de conséquences visible.

**Météo**
- [ ] Données réelles : trois heures récentes comparées entre les valeurs brutes d'Open-Meteo et l'interprétation du jeu, dans un tableau du compte rendu.

**Fermeture**
- [ ] Voyageur désactivé : aucune trace de lui nulle part.

**Qualité et charte**
- [ ] Aucune erreur dans la console pendant 60 s de jeu accéléré.
- [ ] Seuils de fluidité et de taille respectés ; la sauvegarde existante se recharge sans perte.
- [ ] La ligne « réel et imaginé » est présente ; aucun horaire n'est présenté comme réel.
- [ ] Aucun texte provisoire ni texte écrit par l'IA visible sans `?atelier`.
