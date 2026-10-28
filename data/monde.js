/* Nagori · réglages du monde
   Tout ce qui décrit la gare et sa vie, sans texte narratif. Les heures sont celles de Tokyo (JST). */
window.NAGORI = window.NAGORI || {};

/* La gare. Région décidée le 26 octobre 2026 : la vallée du haut Yubetsu, à Engaru (Hokkaidō), sur la ligne Sekihoku.
   Le point est celui de la vraie gare de Shirataki (Wikipédia : 43,8842 N, 143,1809 E ; le géocodeur Open-Meteo place le village à 400 m).
   Le ciel (soleil, lever et coucher) et la météo sont calculés ici ; la gare de Nagori, ses horaires et ses habitants restent imaginaires.
   Soleil le 17 novembre : lever 06:24, coucher 16:01. Modèle météo : maille de 43,90 N, 143,18 E, altitude du point 370 m. */
NAGORI.STATION = { lat: 43.8842, lon: 143.1809, region: 'Hokkaidō', place: 'Hokkaidō, vallée du haut Yubetsu (Engaru), ligne Sekihoku, au point de la gare de Shirataki' };

/* Trains de la journée. stop : s'arrête en gare. */
NAGORI.TRAINS = [
  { h: 6, m: 12, stop: false }, { h: 7, m: 48, stop: true }, { h: 10, m: 5, stop: false }, { h: 13, m: 30, stop: true },
  { h: 16, m: 20, stop: true }, { h: 18, m: 45, stop: true }, { h: 21, m: 10, stop: false }
];

/* Le voyageur du sekki : jour d'arrivée après le début du sekki, et train. */
NAGORI.VOYAGEUR = { jour: 3, h: 16, m: 20 };

/* Omiyage : cadeaux laissés par les voyageurs, qui décorent la gare. id = dessin dans la scène. */
NAGORI.OMIYAGE = [
  { id: 'furin', nom: 'un furin' }, { id: 'lanterne', nom: 'une lanterne en papier' }, { id: 'daruma', nom: 'un daruma' },
  { id: 'bonsai', nom: 'un bonsaï' }, { id: 'teruteru', nom: 'un teru teru bōzu' }, { id: 'susuki', nom: 'un vase de susuki' }
];

/* Objets oubliés sur le banc. */
NAGORI.OBJETS = [
  { id: 'parapluie', nom: 'un parapluie' }, { id: 'ticket', nom: "un ticket d'une autre ligne" },
  { id: 'echarpe', nom: 'une écharpe rouge' }, { id: 'carnet', nom: 'un carnet de croquis' }
];

/* Moments rares du carnet. */
NAGORI.MOMENTS = [
  { id: 'rainnight', nom: 'Pluie de nuit', rar: 'Peu commun' },
  { id: 'dawnfog', nom: "Brume à l'aube", rar: 'Peu commun' },
  { id: 'snow', nom: 'Neige sur la gare', rar: 'Rare' },
  { id: 'firstsnow', nom: "Première neige de l'année", rar: 'Rare' },
  { id: 'fireflies', nom: 'Lucioles sur la rivière', rar: 'Rare' },
  { id: 'fullmoon', nom: 'Pleine lune sans nuages', rar: 'Rare' },
  { id: 'tsukimi', nom: "Lune d'automne sans nuages", rar: 'Légendaire' },
  { id: 'lasttrain', nom: 'Dernier train du 31 décembre', rar: 'Légendaire' }
];

/* La nuit et le petit matin (lot F, cahier des charges). Chaque événement a sa cause écrite ici ; aucun n'est là pour remplir un quota.
   Heures de la gare ; après minuit, la nuit compte depuis le soir précédent (+24). Le tirage est commun à tous les joueurs pour une nuit
   (graine : la date du soir). La météo qui sert de cause est la météo réelle (Open-Meteo), la même pour tous.
   - routine : quotidienne, discrète, sans annonce ;
   - evenements : seulement s'ils ont une raison, rien n'est garanti chaque soir. */
NAGORI.NUIT = {
  routine: {
    /* le livreur de journaux en scooter passe le passage à niveau, phare allumé (pratique réelle, heure imaginée) */
    livreur: { de: 28.083, a: 28.333, duree: .012 },
    /* une fenêtre de ferme s'allume sur l'autre rive vers 4 h 30, jusqu'au lever du soleil (imaginé, plausible) */
    ferme: { de: 28.33, a: 28.67 }
  },
  evenements: {
    /* chasse-neige routier sur le passage à niveau, gyrophare, bourrelet de neige.
       Cause : au moins 2 cm de neige réelle tombée dans les 6 h qui précèdent son passage. Seulement ces nuits-là. */
    chasseNeige: { de: 25, a: 27.5, duree: .012, neigeCm: 2, fenetreH: 6 },
    /* le cheminot dégage la neige du quai à la lanterne, vers 5 h. Même cause, mesurée à 5 h. Seulement ces matins-là. */
    cheminotQuai: { de: 29, a: 29.75, neigeCm: 2, fenetreH: 6 },
    /* cerfs d'Ezo qui traversent la voie, yeux qui brillent sous la lampe. Cause : la saison (plus fréquents en automne) ;
       rares dans la neige profonde (au moins neigeProfondeCm de neige réelle au sol au moment du passage). Souvent aucun.
       Le cahier ne chiffre ni « neige profonde » ni les fréquences : neigeProfondeCm (40), facteurNeige, chance et automne
       sont des valeurs arbitraires, NON VALIDÉES, à régler ici. */
    cerfs: { chance: .12, automne: .3, mois: [9, 10, 11], neigeProfondeCm: 40, facteurNeige: .2, de: 22, a: 28.5, duree: .05, max: 3 },
    /* un renard près de la salle d'attente. Aucune cause particulière : environ 2 nuits sur 10. */
    renard: { chance: .2, de: 22, a: 28.5, duree: .04 }
  },
  /* provisoire, hors cahier (session 3, première version) : papillons de nuit autour de la lampe */
  papillons: { tempMin: 15 }
};
