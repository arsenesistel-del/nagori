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

  /* ce qui est réel et ce qui est imaginé (cahier, lot J : formulation proposée par Claude, validée par Arsène), pied de page et carnet */
  reelImagine: 'Le ciel, le calendrier et la météo sont réels ; la gare, ses horaires et ses habitants sont imaginés.',

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
  /* registre : la conséquence d'un objet, le jour où sa fenêtre se ferme (emplacements à écrire, invisibles en jeu normal) */
  registreObjet: { thermos: '(texte à écrire : registre, le thermos)', parapluie: '(texte à écrire : registre, le parapluie)',
                   lumiere: '(texte à écrire : registre, la lumière laissée allumée)', retour: '(texte à écrire : registre, le parapluie rendu)' },

  /* lots F, G, H (cahier des charges) : emplacements à écrire par Arsène, montrés seulement avec ?atelier.
     Le japonais (avisTitre, avisDate, ardoise, cahierJp) est PROVISOIRE, non validé : à relire par une personne compétente. */
  fermeture: {
    avisTitre: '駅廃止のお知らせ',              /* titre court de l'avis officiel (à relire par un natif) */
    avisDate: '3月12日',                        /* la date en gros : le dernier jour de service */
    avisTraduction: '(texte à écrire : la traduction de l\'avis officiel)',
    ardoise: 'あと{n}日',                       /* le compte à rebours à la craie (formulation à valider par un natif) */
    ardoiseToucher: '(texte à écrire : le compte à rebours à la craie, d\'une main qu\'on ne connaît pas)',
    afficheCommune: '(texte à écrire : l\'affiche de la commune, appel aux photos anciennes de la gare)',
    photos: { 'photo-1': '(texte à écrire : la première photo ancienne)', 'photo-2': '(texte à écrire : la deuxième photo ancienne)' },
    etiquettes: '(texte à écrire : les étiquettes numérotées de l\'inventaire)',
    horloge: '(texte à écrire : l\'horloge de la salle d\'attente)',
    cahierTitre: 'Cahier de la gare',
    cahierJp: '駅ノート',
    cahierEntrees: { 'cahier-1': '(texte à écrire : 1re entrée du cahier)', 'cahier-2': '(texte à écrire : 2e entrée du cahier, des visiteurs, un jour férié)',
                     'cahier-3': '(texte à écrire : 3e entrée du cahier)' },
    cahierVide: '(texte à écrire : le cahier, encore sans entrée)',
    cahierOuvrir: 'Lire le cahier',
    registre: {
      'cahier-1': '(texte à écrire : registre, 1re entrée du cahier)', 'affiche-commune': '(texte à écrire : registre, l\'affiche de la commune)',
      'moment-ecolier': '(texte à écrire : registre, le moment de l\'écolier)', 'photo-1': '(texte à écrire : registre, une première photo ancienne)',
      'cahier-2': '(texte à écrire : registre, 2e entrée du cahier)', 'moment-vieille': '(texte à écrire : registre, le moment de la vieille dame)',
      'moment-cheminot': '(texte à écrire : registre, l\'inventaire du cheminot)', 'photo-2': '(texte à écrire : registre, une deuxième photo ancienne)',
      'cahier-3': '(texte à écrire : registre, 3e entrée du cahier)'
    }
  },
  /* le tableau à craie, une ligne par date (data/craie.js) */
  craie: { 'craie-1': '(texte à écrire : ligne de craie 1)', 'craie-2': '(texte à écrire : ligne de craie 2)', 'craie-3': '(texte à écrire : ligne de craie 3)',
           'craie-4': '(texte à écrire : ligne de craie 4)', 'craie-5': '(texte à écrire : ligne de craie 5)', 'craie-6': '(texte à écrire : ligne de craie 6)',
           'craie-7': '(texte à écrire : ligne de craie 7)', aucune: '(texte à écrire : le tableau à craie)' },
  /* deux lignes au toucher qui alternent, et la ligne du moment de fermeture (le chat ne parle jamais) */
  habitues: {
    ecolier: ['(texte à écrire : l\'écolier, ligne 1)', '(texte à écrire : l\'écolier, ligne 2)'],
    vieille: ['(texte à écrire : la vieille dame, ligne 1)', '(texte à écrire : la vieille dame, ligne 2)'],
    cheminot: ['(texte à écrire : le cheminot, ligne 1)', '(texte à écrire : le cheminot, ligne 2)'],
    moments: { ecolier: '(texte à écrire : le moment de l\'écolier)', vieille: '(texte à écrire : le moment de la vieille dame)',
               cheminot: '(texte à écrire : l\'inventaire du cheminot)' }
  },
  /* la nuit et le petit matin, au toucher */
  nuit: {
    livreur: '(texte à écrire : le livreur de journaux)', ferme: '(texte à écrire : la fenêtre de ferme sur l\'autre rive)',
    chasseNeige: '(texte à écrire : le chasse-neige)', bourrelet: '(texte à écrire : le bourrelet de neige du chasse-neige)',
    cheminotQuai: '(texte à écrire : le cheminot dégage le quai)', cerfs: '(texte à écrire : des cerfs sur la voie)',
    renard: '(texte à écrire : un renard près de la salle d\'attente)'
  },
  registreNuit: {
    chasseNeige: '(texte à écrire : registre, le chasse-neige est passé)', cheminotQuai: '(texte à écrire : registre, le cheminot a dégagé le quai)',
    cerfs: '(texte à écrire : registre, des cerfs ont traversé la voie)', renard: '(texte à écrire : registre, un renard près de la salle d\'attente)'
  },
  /* le récit de l'absence (lot E) : intitulés de l'interface, d'après le cahier ; la ligne des jours calmes est à écrire */
  recit: {
    vignette: 'Pendant ton absence',
    duree: '{s} s',
    revoir: 'Revoir',
    simule: 'simulé',
    joursCalmes: '(texte à écrire : ligne neutre du registre pour les jours calmes, absence de plus de 7 jours)'
  },
  /* provisoire, hors cahier (session 3, première version) : seulement avec la case « provisoire » de l'Atelier */
  provisoire: {
    compte: '(texte à écrire : fermeture dans {n} jours)',
    fermee: '(texte à écrire : la gare est fermée)',
    pas: { ecolier: '(texte à écrire : les pas de l\'écolier)', chat: '(texte à écrire : des pas de chat)',
           renard: '(texte à écrire : des pas de renard, cette nuit)', cerfs: '(texte à écrire : des pas de cerf sur la voie)' },
    chatSalle: '(texte à écrire : le chat au chaud, derrière la vitre)',
    fleurs: '(texte à écrire : des fleurs au pied du panneau)'
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
