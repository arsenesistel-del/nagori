/* Nagori · le récit de l'absence (lot E du cahier des charges, docs/cahier-lot-E.md)
   Réglages seulement, sans texte. Les chiffres du cahier sont marqués (cahier) ; les autres sont des choix de mise en œuvre,
   NON VALIDÉS, réglables ici sans toucher au code. */
const RACINE_R = typeof window !== 'undefined' ? window : globalThis;
RACINE_R.NAGORI = RACINE_R.NAGORI || {};

RACINE_R.NAGORI.RECIT = {
  absenceMinH: 3,                     /* (cahier) absence de 3 h ou plus, avec au moins un plan à montrer */
  vignetteS: 30,                      /* (cahier) la vignette s'efface au premier geste ou après 30 s */
  plan: { minS: 2, maxS: 4, fonduS: .6 },   /* (cahier) 2 à 4 s par plan, fondu de 0,6 s */

  /* (cahier) durée selon l'absence : jusqu'à 1 jour, 4 à 6 plans, 20 s au plus ; 2 à 7 jours, le meilleur plan de chaque jour, 25 s au plus ;
     plus de 7 jours, les 7 derniers jours, un plan chacun (25 s au plus, critère « 25 s après plusieurs jours ») */
  regimes: { courtMaxH: 24, joursMaxH: 7 * 24, court: { min: 4, max: 6, totalS: 20 }, jours: { max: 7, totalS: 25 } },
  /* NON VALIDÉ : au-delà d'un jour, la conséquence de l'objet s'ajoute au meilleur plan de son jour (js/recit.js, composer) */

  /* note de base de chaque type, dans l'ordre de priorité du cahier (1 = conséquence de l'objet … 8 = changement de kō).
     Les valeurs exactes sont NON VALIDÉES ; seul l'ordre vient du cahier. */
  types: ['objet', 'voyageur', 'gare', 'temps', 'lumiere', 'habitue', 'nuit', 'ko'],
  notes: { objet: 100, voyageur: 90, gare: 80, temps: 70, lumiere: 60, habitue: 50, nuit: 40, ko: 30 },
  /* au sein de la lumière : le plan « jour » (midi) ne sert qu'à garantir un plan de jour ; NON VALIDÉ */
  noteJour: 20,
  premiereNeigeBonus: 10,             /* NON VALIDÉ : la première neige passe devant les autres changements de temps */

  /* (cahier) anti-répétition : un type vu dans l'un des trois derniers récits voit sa note multipliée par 0,3 ;
     la routine d'un habitué n'apparaît jamais deux récits de suite */
  antiRepetition: { recits: 3, facteur: .3 },

  /* l'instant de chaque plan, par rapport à son événement (NON VALIDÉ) */
  decalageH: { temps: .3, lever: .25, coucher: -.25, ko: 7, voyageur: .05, gare: .15 },

  /* cadrages (repère de la scène 1600 × 900) : cx, cy au centre, span = largeur vue. NON VALIDÉS, sauf leur nature (cahier). */
  cadrages: {
    serre:  { span: 320, cy: 640 },   /* (cahier) conséquence de l'objet : serré sur la trace */
    signe:  { span: 260, cy: 615 },   /* (cahier) changement de la gare : sur le signe */
    moyen:  { span: 620, cy: 630 },   /* (cahier) habitué, vie de nuit */
    quai:   { span: 900, cy: 620, cx: 700 },   /* (cahier) arrivée du voyageur : quai et train */
    large:  null                      /* (cahier) changement de temps, lumière, kō : la vue d'ensemble */
  },
  cibles: {
    objet: { thermos: 782, parapluie: 536, lumiere: 572, retour: 536 },
    gare: { 'cahier-1': [564, 612], 'cahier-2': [564, 612], 'cahier-3': [564, 612], 'affiche-commune': [432, 605], 'photo-1': [432, 618], 'photo-2': [432, 625] },
    habitue: { ecolier: 940, vieille: 792, cheminot: 900 },
    nuit: { chasseNeige: 1230, cheminotQuai: 720, cerfs: 760, renard: 470 }
  }
};

if (typeof module === 'object' && module.exports) module.exports = RACINE_R.NAGORI.RECIT;
