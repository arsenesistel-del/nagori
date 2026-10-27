/* Nagori · les habitués et le chat (lot G), la nuit (lot F), la fermeture (lot H)
   Réglages seulement, sans texte narratif. Tout ce qui est marqué « provisoire » attend la validation d'Arsène
   (fiches des personnages, nom du chat, calendrier de fermeture, compte à rebours) et ne se voit qu'avec ?atelier.
   Heures : heures de la gare (Tokyo), en heures décimales. */
const RACINE_H = typeof window !== 'undefined' ? window : globalThis;
RACINE_H.NAGORI = RACINE_H.NAGORI || {};

RACINE_H.NAGORI.HABITUES = {
  /* fiches : rôle et traits de comportement, provisoires. Les traits disent ce que fait le personnage, jamais qui il est :
     son histoire viendra des dictées d'Arsène. */
  fiches: {
    ecolier: {
      role: "L'écolier",
      passages: [{ de: 7.5, a: 7.8, quoi: 'part par le train de 07:48' }, { de: 16.36, a: 16.46, quoi: 'rentre par le train de 16:20' }],
      traits: ["ne vient que les jours d'école (fériés japonais exclus)", 'ouvre un parapluie sous la pluie ou la neige',
               'bonnet quand il fait moins de 0 °C', 'laisse des pas dans la neige du quai']
    },
    vieille: {
      role: 'La vieille dame',
      passages: [{ de: 13, a: 13.68, quoi: 'regarde partir le train de 13:30, sans monter' }],
      traits: ['tous les jours', 'ne vient pas par forte neige, orage, vent fort ou grand froid', 'ouvre un parapluie sous la pluie ou la neige']
    },
    cheminot: {
      role: 'Le cheminot',
      passages: [{ de: 10.4, a: 10.9, quoi: 'inspecte la voie' }, { de: 21.4, a: 21.9, quoi: 'repasse avec sa lanterne' }],
      traits: ['tous les jours', 'après une nuit de neige, déblaie le passage à niveau le matin (plus long)']
    },
    chat: {
      role: 'Le chat',
      nom: null,                       /* à choisir par Arsène (utile à partir de la session 6a) */
      passages: [{ quoi: 'trois passages par jour, à des heures tirées chaque jour' }],
      traits: ["s'abrite dans la salle d'attente, près du poêle, sous la pluie, la neige ou le grand froid",
               'laisse des pas dans la neige quand il passe sur le quai', 'vient manger quand on a rempli sa gamelle']
    }
  },

  /* seuils des traits provisoires (météo dessinée : réelle, ou simulée par l'Atelier) */
  regles: {
    parapluie: { pluie: true, neige: true, ventMax: 40 },       /* au-delà de 40 km/h de vent, pas de parapluie */
    bonnet: { tempMax: 0 },
    vieilleReste: { kinds: ['heavysnow', 'storm'], tempMin: -15, ventMax: 45 },
    cheminotDeneige: { neigeCm: 5, de: 10.4, a: 11.3, arret: 1262 },
    chatAbri: { pluie: true, neige: true, tempMax: -3 }
  }
};

/* La nuit (lot F) : visiteurs nocturnes, tirés pour chaque nuit avec une graine (la date), les mêmes pour tous.
   chance : par nuit ; hiver : chance de novembre à mars ; de / a : fenêtre de passage (après minuit : +24) ;
   duree : temps de traversée, en heures. Leurs pas restent dans la neige réelle (effacés par 3 cm de neige fraîche). */
RACINE_H.NAGORI.NUIT = {
  visiteurs: [
    { id: 'renard', chance: .3, hiver: .35, de: 22, a: 28.5, duree: .03, y: 684, sens: -1 },
    { id: 'cerf',   chance: .12, hiver: .3, de: 23, a: 29,   duree: .05, y: 664, sens: 1 }
  ],
  papillons: { tempMin: 15 }                                    /* papillons de nuit autour de la lampe allumée */
};

/* La fermeture (lot H). Provisoire : dates et étapes à confirmer par Arsène.
   dernierJour : dernier jour de service (le même que le retour du parapluie, data/objets.js) ;
   dernierArret : le dernier train qui s'arrête ce jour-là ; ensuite la gare est fermée.
   etapes : à partir de combien de jours avant le dernier jour chaque signe apparaît (null = toute l'année). */
RACINE_H.NAGORI.FERMETURE = {
  dernierJour: '2027-03-12',
  dernierArret: { h: 18, m: 45 },
  etapes: { affiche: null, compteARebours: 30, derniersJours: 7 }
};

if (typeof module === 'object' && module.exports) module.exports = { HABITUES: RACINE_H.NAGORI.HABITUES, NUIT: RACINE_H.NAGORI.NUIT, FERMETURE: RACINE_H.NAGORI.FERMETURE };
