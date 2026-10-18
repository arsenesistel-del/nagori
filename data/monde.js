/* Nagori · réglages du monde
   Tout ce qui décrit la gare et sa vie, sans texte narratif. Les heures sont celles de Tokyo (JST). */
window.NAGORI = window.NAGORI || {};

/* La gare. Région provisoire (bible : à trancher). */
NAGORI.STATION = { lat: 42.55, lon: 140.67, region: 'Hokkaidō', place: 'Hokkaidō, ligne Muroran (provisoire)' };

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
