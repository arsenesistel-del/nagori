/* Nagori · le tableau à craie (伝言板), lot H du cahier des charges
   Une ligne par date, en version allégée : 7 lignes, un jour sur deux à partir du début du test ; les autres jours gardent la précédente.
   j : jour du test (J1 = FERMETURE.debutTest). Le texte de chaque ligne est dans data/textes.js (craie), à écrire par Arsène. */
const RACINE_C = typeof window !== 'undefined' ? window : globalThis;
RACINE_C.NAGORI = RACINE_C.NAGORI || {};

RACINE_C.NAGORI.CRAIE = [
  { j: 1,  id: 'craie-1' }, { j: 3,  id: 'craie-2' }, { j: 5,  id: 'craie-3' }, { j: 7, id: 'craie-4' },
  { j: 9,  id: 'craie-5' }, { j: 11, id: 'craie-6' }, { j: 13, id: 'craie-7' }
];

if (typeof module === 'object' && module.exports) module.exports = RACINE_C.NAGORI.CRAIE;
