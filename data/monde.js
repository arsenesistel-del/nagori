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
