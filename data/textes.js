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
  objetRange: 'Tu as rangé {objet} aux objets trouvés.',

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
