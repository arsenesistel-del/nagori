/* Nagori · tous les textes visibles du jeu
   Tous provisoires : ils seront réécrits à partir des dictées d'Arsène (charte).
   {mot} est remplacé par une valeur au moment de l'affichage. */
window.NAGORI = window.NAGORI || {};

NAGORI.TEXTES = {
  /* bandeau */
  phase: { matin: 'matin', apresMidi: 'après-midi', lever: 'lever du jour', finJour: 'fin du jour', aube: 'aube', crepuscule: 'crépuscule', nuit: 'nuit' },
  meteo: { clear: 'ciel clair', partly: 'quelques nuages', overcast: 'ciel couvert', drizzle: 'bruine', rain: 'pluie', heavyrain: 'forte pluie',
           snow: 'neige', heavysnow: 'forte neige', fog: 'brouillard', storm: 'orage' },
  meteoAttente: 'météo en route…',
  meteoIndispo: 'météo indisponible',
  meteoSimulee: '{meteo} (simulé)',
  meteoDe: 'météo de {heure}',
  meteoInconnue: 'météo inconnue à cette heure',
  momentSimule: '{moment} (simulé)',
  vent: 'vent',
  neigeAuSol: 'neige au sol',
  prochainArret: 'Prochain arrêt {heure}',
  demain: '{heure} (demain)',
  trainPasse: "Un train passe sans s'arrêter",
  trainEnGare: 'Un train est en gare',
  trainApproche: 'Un train approche',
  voyageurAttend: "Un voyageur t'attend sur le banc",
  voyageurAnnonce: 'Voyageur annoncé le {date}, {heure}',
  voyageurProchain: 'Prochain voyageur le {date}, {heure}',

  sonActif: 'Son',
  sonCoupe: 'Son coupé',

  /* tampons et carnet */
  nouveauTampon: 'Nouveau tampon : {ko}',
  momentAjoute: 'Moment ajouté au carnet : {moment}.',
  carnetVoyageurs: '{n} voyageur{s} sur 24 cette année. Chaque cadeau décore la gare.',
  carnetAucunVoyageur: "Aucun voyageur accueilli pour l'instant. Chacun laisse un cadeau qui décore la gare.",
  carnetAucunObjet: "Rien pour l'instant. Les voyageurs oublient parfois quelque chose sur le banc.",
  carnetVoyageur: 'Voyageur de {sekki} · {cadeau}',
  koAEcrire: 'Texte du kō à écrire.',

  /* voyageur du sekki */
  voyageurArrive: 'Arrivé le {date} par le train de {heure}',
  voyageurTitre: 'Le voyageur de {sekki}',
  voyageurArrivee: "<b>Arrivée</b> · texte à écrire (qui il est, ce qu'on remarque en premier)",
  voyageurHistoire: "<b>Son histoire</b> · texte à écrire (ce qu'il raconte, pourquoi il est là)",
  voyageurDepart: "<b>Départ</b> · texte à écrire (ce qu'il laisse derrière lui)<br>Il t'a laissé <b>{cadeau}</b>. Il décore maintenant la gare.",
  btnAccueillir: "L'accueillir",
  btnLaisserPartir: 'Le laisser repartir',
  btnFermer: 'Fermer',

  /* gestes */
  jardinDejaArrose: "Le jardin a déjà bu aujourd'hui.",
  jardinArrose: 'Le jardin a bu. Il poussera un peu.',
  jardinPlein: 'Le jardin est à son plus beau.',
  quaiPropre: 'Le quai est déjà propre.',
  quaiBalaye: 'Le quai est balayé.',
  gamelleDejaPleine: 'La gamelle est déjà pleine.',
  gamelleRemplie: 'Gamelle remplie. Le chat viendra manger.',
  lampeTropTot: "Trop tôt : la lampe s'allume au crépuscule.",
  lampeDejaAllumee: 'La lampe est déjà allumée.',
  lampeAllumee: 'La lampe du quai est allumée pour la nuit.',
  lampeBouton: 'Allumer la lampe',
  lampeBoutonJour: 'Lampe (au crépuscule)',
  chatRonronne: 'Le chat ronronne.',
  /* étagère de la salle d'attente (lot C) : intitulés fonctionnels, provisoires */
  etagere: {
    titre: "L'étagère de la salle d'attente",
    libre: 'Rien n\'est posé.',
    pose: 'Posé : {objet}.',
    objets: { thermos: 'Thermos de thé', parapluie: 'Parapluie à prêter', lumiere: 'Lumière laissée allumée' },
    poser: 'Poser', reprendre: 'Reprendre', fermer: 'Fermer',
    absent: 'Le parapluie n\'est pas là.',
    unSeul: 'Un seul objet à la fois.',
    poseToast: '{objet} : posé.', repriseToast: '{objet} : repris.'
  },
  /* ligne affichée au toucher d'une trace (lot D) : emplacements à écrire par Arsène, pas de texte inventé */
  traces: {
    'tasse-retournee': '(texte à écrire : la tasse retournée)',
    'refermé': '(texte à écrire : le thermos refermé avec soin)',
    'tasse-banc': '(texte à écrire : la tasse au bout du banc)',
    'couvercle-givre': '(texte à écrire : le couvercle du thermos)',
    'tasse-rincee': '(texte à écrire : la tasse rincée)',
    'ouvert-vide': '(texte à écrire : le thermos ouvert et vide)',
    'vide': '(texte à écrire : le porte-parapluie vide)',
    'plein': '(texte à écrire : le parapluie resté là)',
    'plein-neige': '(texte à écrire : le parapluie sous la neige)',
    'plie-seche': '(texte à écrire : le parapluie rendu, plié et sec)',
    'mot-tableau': '(texte à écrire : un mot au tableau)',
    'mandarines': '(texte à écrire : un petit sac de mandarines)',
    'ticket': '(texte à écrire : un ticket d\'une autre ligne)',
    'chat-vitre': '(texte à écrire : le chat derrière la vitre)',
    'banc-deplace': '(texte à écrire : le banc déplacé)',
    'givre-vitre': '(texte à écrire : le givre sur la vitre)',
    'renard': '(texte à écrire : des poils roux)',
    'gresille': '(texte à écrire : la lumière qui grésille)',
    'pas-ecolier': '(texte à écrire : les pas de l\'écolier)',
    'pas-botte': '(texte à écrire : des traces de bottes)',
    'pas-botte-porte': '(texte à écrire : des traces de bottes vers la porte)',
    'pas-renard': '(texte à écrire : des traces de renard)',
    'habitude': '(texte à écrire : la trace particulière d\'un habitué)',
    'givre-banc': '(texte à écrire : le givre sur le banc et les rails)'
  },
  objetRange: 'Tu as rangé {objet} aux objets trouvés.',

  /* session 3 (lots F, G, H) : emplacements provisoires, visibles seulement avec ?atelier tant qu'Arsène ne les a pas écrits */
  provisoire: {
    ardoise: 'あと{n}日',                       /* le compte à rebours à la craie, sur le tableau (forme à valider) */
    compte: '(texte à écrire : fermeture dans {n} jours)',
    dernierJour: '(texte à écrire : le dernier jour de service)',
    fermee: '(texte à écrire : la gare est fermée)',
    visiteurs: { renard: '(texte à écrire : un renard traverse le quai)', cerf: '(texte à écrire : un cerf traverse la voie)' },
    pas: { ecolier: '(texte à écrire : les pas de l\'écolier)', chat: '(texte à écrire : des pas de chat)',
           renard: '(texte à écrire : des pas de renard, cette nuit)', cerf: '(texte à écrire : des pas de cerf sur la voie)' },
    chatSalle: '(texte à écrire : le chat au chaud, derrière la vitre)',
    fleurs: '(texte à écrire : des fleurs au pied du panneau)',
    affiche: '(texte à écrire : l\'avis de fermeture)'
  },

  /* registre */
  registreDepuis: 'Depuis ta dernière visite, il y a {duree}.',
  registrePremiere: "Première visite. Voici la journée d'aujourd'hui avant ton arrivée.",
  registreResume: "Les {n} jours plus anciens sont résumés : la gare a continué sans toi, rien n'est perdu.",
  registreVide: 'Rien de nouveau depuis ton dernier passage. Le quai est calme.',
  registreAujourdhui: "Aujourd'hui",
  registreTamponne: 'Registre tamponné.',
  registre: {
    nouveauKo: 'Nouvelle micro-saison : {ko}, {sens}.',
    chatToit: 'Le chat a dormi sur le toit de la gare.',
    chatBanc: 'Le chat a fait la sieste sur le banc.',
    ecolierMatin: "L'écolier a pris le train de 07:48.",
    ecolierAbsent: "Le train de 07:48 est reparti sans l'écolier. Pas d'école aujourd'hui.",
    ecolierRetour: "L'écolier est rentré par le train de 16:20.",
    cheminotMatin: 'Le cheminot a inspecté la voie.',
    cheminotSoir: 'Le cheminot est passé avec sa lanterne.',
    vieilleDame: 'La vieille dame a regardé partir le train de 13:30, sans monter.',
    voyageur: 'Un voyageur est descendu du train de 16:20. Il attend sur le banc.',
    objet: 'Objet oublié sur le banc : {objet}.'
  }
};
