/* Nagori · les trois objets à laisser (lot C)
   Réglages seulement : poids, conditions, fenêtres. Aucun texte ici. Les poids se modifient sans toucher au code ;
   une condition non remplie répartit son poids sur les autres (js/objets.js).

   Conditions :
   - { type:'creneau', qui } : l'habitué passe dans la fenêtre à l'un de ses créneaux (heures de la gare, voir CRENEAUX) ;
                               'ecolier' ne passe que les jours d'école ;
   - { type:'toujours' } ;
   - { type:'pluie' }         : au moins une heure de pluie, de bruine ou de neige réelle dans la fenêtre ;
   - { type:'temp', max }     : au moins une heure réelle sous max °C ;
   - { type:'neigeNuit', cm } : au moins cm de neige réelle tombée pendant les heures de nuit de la fenêtre.
   Une condition qui dépend de la météo reste « inconnue » tant que les heures de la fenêtre n'ont pas toutes de mesure réelle ;
   la résolution attend alors une vraie donnée, 48 h au plus, puis ne garde que ce qui ne dépend pas de la météo. */
const RACINE_N = typeof window !== 'undefined' ? window : globalThis;
RACINE_N.NAGORI = RACINE_N.NAGORI || {};

RACINE_N.NAGORI.POSES = {
  /* durée de la fenêtre : 24 h après la pose, ou la nuit suivante (du coucher au lever du soleil) */
  fenetres: { thermos: 24 * 3600e3, parapluie: 24 * 3600e3, lumiere: 'nuit' },
  attenteMs: 48 * 3600e3,

  /* créneaux des habitués, en heures de la gare (voir « Habitués » du cahier des charges) */
  creneaux: { ecolier: [7.5, 16.333], cheminot: [10.5], vieille: [13] },
  /* jours d'école : lundi à vendredi, sauf jours fériés japonais */
  ecole: { jours: [1, 2, 3, 4, 5], feries: ['2026-10-12', '2026-11-03', '2026-11-23', '2026-12-23', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-22'] },

  /* garde-fous */
  /* rienMax : pas plus de deux « rien » de suite quand autre chose était possible ; memeMax : jamais trois fois la même conséquence ;
     habitudeAu : la 3e fois qu'un même habitué profite du même objet, une trace particulière, une seule fois */
  gardeFous: { rienMax: 2, memeMax: 2, habitudeAu: 3 },

  thermos: [
    { id: 'ecolier',    poids: 35, habitue: 'ecolier',  cond: { type: 'creneau', qui: 'ecolier' },  visuel: 'tasse-retournee', empreintes: 'ecolier' },
    { id: 'cheminot',   poids: 25, habitue: 'cheminot', cond: { type: 'creneau', qui: 'cheminot' }, visuel: 'refermé' },
    { id: 'vieille',    poids: 15, habitue: 'vieille',  cond: { type: 'creneau', qui: 'vieille' },  visuel: 'tasse-banc' },
    { id: 'refroidit',  poids: 15, cond: { type: 'toujours' }, rien: true, visuel: 'couvercle-givre' },
    { id: 'inconnu',    poids: 8,  cond: { type: 'toujours' }, visuel: 'tasse-rincee' },
    { id: 'chasseneige', poids: 2, cond: { type: 'neigeNuit', cm: 1 }, rare: true, visuel: 'ouvert-vide', empreintes: 'botte' }
  ],

  parapluie: [
    { id: 'ecolier', poids: 35, habitue: 'ecolier', cond: { type: 'pluie' }, emprunt: true, visuel: 'vide', empreintes: null,
      et: { type: 'creneau', qui: 'ecolier' } },
    { id: 'vieille', poids: 25, habitue: 'vieille', cond: { type: 'pluie' }, emprunt: true, visuel: 'vide',
      et: { type: 'creneau', qui: 'vieille' } },
    { id: 'inconnu', poids: 15, cond: { type: 'pluie' }, emprunt: true, visuel: 'vide' },
    { id: 'reste',   poids: 25, cond: { type: 'toujours' }, rien: true, visuel: 'plein' }
  ],

  lumiere: [
    { id: 'chat',    poids: 35, habitue: 'chat', cond: { type: 'temp', max: 5 }, visuel: 'chat-vitre' },
    { id: 'abri',    poids: 20, cond: { type: 'toujours' }, bonus: { cond: { type: 'pluie' }, facteur: 2 }, visuel: 'banc-deplace', empreintes: 'botte-porte' },
    { id: 'givre',   poids: 20, cond: { type: 'temp', max: -2 }, visuel: 'givre-vitre' },
    { id: 'renard',  poids: 15, cond: { type: 'toujours' }, visuel: 'renard', empreintes: 'renard' },
    { id: 'rien',    poids: 10, cond: { type: 'toujours' }, rien: true, visuel: 'gresille' }
  ],

  /* retour du parapluie prêté : après N jours (pourcentages), avec une trace dans 35 % des cas ; rare : 3 %, 10 à 20 jours, avec un ticket */
  retour: {
    jours: [[1, 15], [2, 30], [3, 25], [4, 20], [5, 10]],
    traceChance: .35, traces: ['plie-seche', 'mot-tableau', 'mandarines'],
    rare: { chance: .03, jours: [10, 20], trace: 'ticket' },
    /* le parapluie revient toujours avant la dernière journée de service (12 mars 2027, heure de la gare) */
    avant: '2027-03-11T12:00:00+09:00'
  }
};

if (typeof module === 'object' && module.exports) module.exports = RACINE_N.NAGORI.POSES;
