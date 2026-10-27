/* Nagori · la fermeture (lot H, cahier des charges v3)
   Dates imaginées. La révision des horaires est fixée au samedi 13 mars 2027 (provisoire) ; le dernier jour de service est la veille,
   comme pour les vraies fermetures. Aucun texte ici : les textes sont dans data/textes.js (fermeture). */
const RACINE_F = typeof window !== 'undefined' ? window : globalThis;
RACINE_F.NAGORI = RACINE_F.NAGORI || {};

RACINE_F.NAGORI.FERMETURE = {
  revision: '2027-03-13',
  dernierJour: '2027-03-12',

  /* Ce qui change pendant le test et reste en place. j : jour du test (J1 = debutTest). Tout se décale avec debutTest.
     h : heure de la gare où le changement apparaît (et sa ligne au registre). */
  debutTest: '2026-11-17',
  changements: [
    { j: 1,  id: 'cahier-1',        h: 9.5 },
    { j: 3,  id: 'affiche-commune', h: 8.5 },
    { j: 4,  id: 'moment-ecolier',  h: 7.5 },
    { j: 6,  id: 'photo-1',         h: 11 },
    { j: 7,  id: 'cahier-2',        h: 15 },
    { j: 8,  id: 'moment-vieille',  h: 13.6 },
    { j: 10, id: 'moment-cheminot', h: 10.5 },
    { j: 12, id: 'photo-2',         h: 11 },
    { j: 13, id: 'cahier-3',        h: 14 }
  ],

  /* provisoire, hors cahier (session 3, première version), seulement avec la case « provisoire » de l'Atelier :
     dernier arrêt du dernier jour, puis gare fermée ; ligne de bandeau à partir de J−30 ; fleurs les 7 derniers jours */
  provisoire: { dernierArret: { h: 18, m: 45 }, bandeau: 30, fleurs: 7 }
};

if (typeof module === 'object' && module.exports) module.exports = RACINE_F.NAGORI.FERMETURE;
