/* Nagori · les habitués et le chat (lot G du cahier des charges)
   Réglages seulement, sans texte narratif (les lignes au toucher sont dans data/textes.js, habitues).
   Les traits définitifs viendront des fiches d'Arsène. Heures : heures de la gare (Tokyo), en heures décimales. */
const RACINE_H = typeof window !== 'undefined' ? window : globalThis;
RACINE_H.NAGORI = RACINE_H.NAGORI || {};

RACINE_H.NAGORI.HABITUES = {
  /* fiches, d'après le cahier (lot G) : routine, objets, moment de fermeture (data/fermeture.js) */
  fiches: {
    ecolier: {
      role: "L'écolier",
      passages: [{ de: 7.5, a: 7.8, quoi: 'arrive vers 7 h 30, prend le train de 7 h 48' }, { de: 16.36, a: 16.46, quoi: 'rentre par le train de 16 h 20' }],
      routine: "jours d'école seulement : absent les week-ends et les jours fériés (dont le 23 novembre)",
      objets: ['thermos', 'parapluie'], moment: 'moment-ecolier'
    },
    vieille: {
      role: 'La vieille dame',
      passages: [{ de: 13, a: 13.68, quoi: 'regarde partir le train de 13 h 30, toujours au même bout du banc' }],
      routine: 'tous les jours, 13 h à 13 h 35',
      objets: ['thermos', 'parapluie'], moment: 'moment-vieille'
    },
    cheminot: {
      role: 'Le cheminot',
      passages: [{ de: 10.4, a: 10.9, quoi: 'inspection de la voie' }, { de: 21.4, a: 21.9, quoi: 'soirée à la lanterne' }],
      routine: 'tous les jours ; dégage le quai vers 5 h après une nuit de neige (data/monde.js, NUIT)',
      objets: ['thermos'], moment: 'moment-cheminot'
    },
    chat: {
      role: 'Le chat',
      nom: null,                       /* à choisir par Arsène (utile à partir de la session 6a) */
      passages: [{ quoi: 'trois passages par jour, à des heures tirées chaque jour' }],
      routine: 'il ne parle jamais : le registre raconte ce qu\'il fait',
      objets: ['lumière', 'gamelle'], moment: null
    }
  },

  /* mise en scène des moments de fermeture, le jour donné par data/fermeture.js. Le cahier fixe le jour et, pour le cheminot,
     l'inventaire ; le reste (où, combien de temps) est NON VALIDÉ, à valider par Arsène.
     ecolier : s'arrête devant l'avis officiel avant son train ; vieille : reste sur le banc après le départ du train de 13 h 30 ;
     cheminot : fait l'inventaire et colle des étiquettes numérotées sur le banc, le poêle et l'horloge (elles restent ensuite). */
  moments: {
    ecolier:  { de: 7.5,  avis: 7.72, a: 7.8, x: 535 },                                   /* x : devant l'avis officiel */
    vieille:  { reste: 13.95, a: 14.03 },
    cheminot: { de: 10.4, banc: 10.5, gare: 10.68, a: 11.1, xBanc: 800, xGare: 480, etiquettes: { banc: 10.58, poele: 10.78, horloge: 10.86 } }
  },

  /* provisoire, hors cahier (session 3, première version), seulement avec la case « provisoire » de l'Atelier :
     traits selon la météo dessinée */
  provisoire: {
    traits: {
      ecolier: ['ouvre un parapluie sous la pluie ou la neige', 'bonnet sous 0 °C', 'laisse des pas dans la neige du quai'],
      vieille: ['reste chez elle par forte neige, orage, vent fort ou grand froid', 'ouvre un parapluie sous la pluie ou la neige'],
      cheminot: [],
      chat: ["s'abrite derrière la vitre de la salle d'attente sous la pluie, la neige ou sous −3 °C", 'laisse des pas dans la neige']
    }
  },
  regles: {
    parapluie: { pluie: true, neige: true, ventMax: 40 },
    bonnet: { tempMax: 0 },
    vieilleReste: { kinds: ['heavysnow', 'storm'], tempMin: -15, ventMax: 45 },
    chatAbri: { pluie: true, neige: true, tempMax: -3 }
  }
};

if (typeof module === 'object' && module.exports) module.exports = RACINE_H.NAGORI.HABITUES;
