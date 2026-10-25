/* Nagori · les trois objets à laisser (lot C) : tirage, garde-fous, résolution. Sans dessin.
   Tourne dans le navigateur et dans Node (tests/objets.test.js).

   Principe : fonction pure. Même objet posé à la même minute, même sel, même météo réelle, même historique : même résultat.
   Recharger la page ne change rien ; le résultat, une fois calculé, est de toute façon gardé dans la sauvegarde.
   Toutes les heures sont celles de Tokyo (JST, sans heure d'été).

   Ce que le moteur ne fait jamais : afficher une probabilité, compter pour le joueur, punir de ne rien poser. */
(function (root, factory) {
  const M = (typeof module === 'object' && module.exports) ? require('./meteo.js') : (root.NAGORI || {}).meteo;
  const m = factory(M);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else { root.NAGORI = root.NAGORI || {}; root.NAGORI.objets = m; }
})(typeof self !== 'undefined' ? self : this, function (METEO) {
'use strict';

const H = 3600e3, DAY = 24 * H, JST = 9 * H, MIN = 60e3;
const TYPES = ['thermos', 'parapluie', 'lumiere'];

/* ---------- Graine ---------- */
/* date à la minute, objet, sel du joueur → entier de 32 bits (FNV-1a) */
function graine(pose) {
  const minute = Math.floor(pose.ms / MIN);
  const s = pose.type + '|' + minute + '|' + (pose.sel == null ? '' : pose.sel);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function aleatoire(a) {                                 // mulberry32
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Temps ---------- */
const debutHeure = ms => Math.floor((ms + JST) / H) * H - JST;
const debutJour = ms => Math.floor((ms + JST) / DAY) * DAY - JST;
const jourJST = ms => new Date(ms + JST).toISOString().slice(0, 10);
const joursemaine = ms => new Date(ms + JST).getUTCDay();

function jourDecole(POSES, ms) {
  return POSES.ecole.jours.includes(joursemaine(ms)) && !POSES.ecole.feries.includes(jourJST(ms));
}

/* la fenêtre où la conséquence peut se produire.
   elev(ms) donne la hauteur du soleil en degrés (js/ciel.js) ; pour la lumière : du coucher au lever (soleil sous l'horizon). */
function fenetre(POSES, type, poseMs, elev) {
  const f = POSES.fenetres[type];
  if (f !== 'nuit') return { debut: poseMs, fin: poseMs + f };
  const PAS = 5 * MIN;
  let t = poseMs, borne = poseMs + 36 * H;
  while (elev(t) >= -.83 && t < borne) t += PAS;       // jusqu'au coucher (ou tout de suite s'il fait déjà nuit)
  const debut = t;
  while (elev(t) < -.83 && t < debut + 24 * H) t += PAS;
  return { debut, fin: t };
}

/* ---------- Ce que la météo réelle dit de la fenêtre ---------- */
/* Pour chaque grandeur : vrai, faux, ou null (une heure au moins n'a pas de mesure réelle et rien n'a décidé avant). */
function contexte(fen, meteo) {
  let pluie = false, neige = false, gelMin = null, tempMin = null, neigeNuit = 0, inconnues = 0, mesurees = 0;
  for (let h = debutHeure(fen.debut); h < fen.fin; h += H) {
    const m = meteo.a(h);
    if (!m || m.source !== 'reelle') { inconnues++; continue; }
    mesurees++;
    if (METEO.pleut(m.kind) || METEO.neige(m.kind) || m.precip > 0) pluie = true;
    if (METEO.neige(m.kind) || m.snowfall > 0) neige = true;
    if (m.temp != null && (tempMin == null || m.temp < tempMin)) tempMin = m.temp;
    if (m.isDay === false) neigeNuit += m.snowfall || 0;
  }
  return { pluie, neige, tempMin, neigeNuit, inconnues, mesurees };
}
const tri = (ok, ctx) => ok ? true : (ctx.inconnues > 0 ? null : false);

function passages(POSES, qui, fen) {
  const creneaux = POSES.creneaux[qui];
  if (!creneaux) return [];
  const out = [];
  for (let j = debutJour(fen.debut); j < fen.fin; j += DAY) {
    if (qui === 'ecolier' && !jourDecole(POSES, j + 12 * H)) continue;
    for (const h of creneaux) { const t = j + Math.round(h * 60) * MIN; if (t >= fen.debut && t < fen.fin) out.push(t); }
  }
  return out;
}

/* évalue une condition : true, false ou null (inconnue) */
function evaluer(POSES, cond, fen, ctx) {
  switch (cond.type) {
    case 'toujours': return true;
    case 'creneau': return passages(POSES, cond.qui, fen).length > 0;
    case 'pluie': return tri(ctx.pluie, ctx);
    case 'temp': return tri(ctx.tempMin != null && ctx.tempMin < cond.max, ctx);
    case 'neigeNuit': return tri(ctx.neigeNuit >= cond.cm, ctx);
    default: throw new Error('condition inconnue : ' + cond.type);
  }
}
const et = (a, b) => (a === false || b === false) ? false : (a === null || b === null) ? null : true;

/* ---------- Résolution ---------- */
/* hist : les résultats précédents de CE type d'objet, du plus ancien au plus récent : { id, habitue, compte }.
   Rend { statut:'en-cours' } avant la fin de la fenêtre, { statut:'attente' } tant qu'une condition météo n'a pas de donnée réelle
   (48 h au plus après la fin de la fenêtre), sinon { statut:'resolu', ... }. */
function resoudre(POSES, pose, hist, meteo, maintenantMs, elev) {
  const fen = fenetre(POSES, pose.type, pose.ms, elev);
  if (maintenantMs < fen.fin) return { statut: 'en-cours', fen };
  const ctx = contexte(fen, meteo);
  const table = POSES[pose.type];
  const evals = table.map(e => {
    let ok = evaluer(POSES, e.cond, fen, ctx);
    if (e.et) ok = et(ok, evaluer(POSES, e.et, fen, ctx));
    return { e, ok };
  });
  if (evals.some(x => x.ok === null) && maintenantMs < fen.fin + POSES.attenteMs) return { statut: 'attente', fen };

  /* l'attente est finie : ce qui dépend d'une météo restée inconnue ne compte pas */
  let cand = evals.filter(x => x.ok === true).map(x => {
    let p = x.e.poids;
    if (x.e.bonus && evaluer(POSES, x.e.bonus.cond, fen, ctx) === true) p *= x.e.bonus.facteur;
    return { e: x.e, p };
  });
  const autreChose = cand.some(c => !c.e.rien);

  /* garde-fous */
  const G = POSES.gardeFous, fin = (n) => hist.slice(-n);
  if (autreChose && hist.length >= G.rienMax && fin(G.rienMax).every(h => h.compte)) cand = cand.filter(c => !c.e.rien);
  if (hist.length >= G.memeMax && fin(G.memeMax).every(h => h.id === hist[hist.length - 1].id)) {
    const sans = cand.filter(c => c.e.id !== hist[hist.length - 1].id);
    if (sans.length) cand = sans;
  }

  const alea = aleatoire(graine(pose));
  const total = cand.reduce((s, c) => s + c.p, 0);
  let r = alea() * total, choix = cand[cand.length - 1];
  for (const c of cand) { if (r < c.p) { choix = c; break; } r -= c.p; }
  const e = choix.e;

  /* quand, dans quel sens : tirés après le choix, donc sans effet sur lui */
  const passes = e.habitue ? passages(POSES, e.habitue, fen) : [];
  const quand = passes.length ? passes[0] : Math.round((fen.debut + alea() * (fen.fin - fen.debut)) / MIN) * MIN;
  const sens = alea() < .5 ? 1 : -1;

  const deja = e.habitue ? hist.filter(h => h.habitue === e.habitue).length : 0;
  const res = {
    statut: 'resolu', id: e.id, type: pose.type, habitue: e.habitue || null, rien: !!e.rien,
    compte: !!e.rien && autreChose,
    visuel: e.visuel, empreintes: e.empreintes || null, emprunt: !!e.emprunt,
    habitude: !!e.habitue && deja + 1 === G.habitudeAu,
    quand, sens, fen, posee: pose.ms,
    contexte: { pluie: ctx.pluie, neige: ctx.neige, gel: ctx.tempMin != null && ctx.tempMin < 0 },
    retour: null
  };
  if (e.emprunt) res.retour = tirerRetour(POSES, alea, quand);
  return res;
}

/* quand le parapluie prêté revient, et avec quoi */
function tirerRetour(POSES, alea, depuisMs) {
  const R = POSES.retour;
  const limite = Date.parse(R.avant);
  let jours, trace = null;
  if (alea() < R.rare.chance) {
    jours = R.rare.jours[0] + Math.floor(alea() * (R.rare.jours[1] - R.rare.jours[0] + 1));
    trace = R.rare.trace;
  } else {
    let r = alea() * R.jours.reduce((s, j) => s + j[1], 0);
    jours = R.jours[R.jours.length - 1][0];
    for (const [j, p] of R.jours) { if (r < p) { jours = j; break; } r -= p; }
    if (alea() < R.traceChance) trace = R.traces[Math.floor(alea() * R.traces.length)];
  }
  return { ms: Math.min(depuisMs + jours * DAY, limite), jours, trace };
}

/* ---------- Empreintes ---------- */
/* Une empreinte n'existe que s'il y avait de la neige au sol quand on est passé ; elle s'efface selon la neige réelle tombée depuis :
   estompée à partir de 1 cm, effacée à partir de 3 cm. Heure sans mesure : on ne suppose pas de neige. */
function empreinte(meteo, quandMs, maintenantMs) {
  const m = meteo.a(quandMs);
  if (!m || m.source !== 'reelle' || m.snowDepth == null || m.snowDepth < .01) return { etat: 'aucune', cm: 0 };
  let cm = 0;
  for (let h = debutHeure(quandMs) + H; h <= maintenantMs; h += H) {
    const x = meteo.a(h);
    if (x && x.source === 'reelle') cm += x.snowfall || 0;
  }
  return { etat: cm >= 3 ? 'efface' : cm >= 1 ? 'estompe' : 'net', cm };
}

/* ---------- État du joueur (ce qui entre dans la sauvegarde) ---------- */
function etatVide() {
  return { sel: null, pose: null, trace: null, parapluieRetour: null, retourTrace: null, hist: { thermos: [], parapluie: [], lumiere: [] } };
}

/* poser un objet : un seul à la fois ; le parapluie prêté n'est pas disponible avant son retour */
function poser(etat, type, ms) {
  if (!TYPES.includes(type)) return { ok: false, raison: 'type' };
  if (etat.pose) return { ok: false, raison: 'deja-pose' };
  if (type === 'parapluie' && etat.parapluieRetour) return { ok: false, raison: 'absent' };
  etat.pose = { type, ms };
  etat.trace = null; etat.retourTrace = null;            // la trace précédente reste jusqu'à la pose suivante
  return { ok: true };
}
/* reprendre l'objet : aucune conséquence, aucune pénalité */
function reprendre(etat) { const p = etat.pose; etat.pose = null; return !!p; }

/* fait avancer l'état à l'instant maintenantMs. Rend la liste de ce qui s'est passé (pour le registre). */
function avancer(POSES, etat, maintenantMs, meteo, elev) {
  const evts = [];
  if (etat.pose) {
    const pose = { type: etat.pose.type, ms: etat.pose.ms, sel: etat.sel };
    const r = resoudre(POSES, pose, etat.hist[pose.type], meteo, maintenantMs, elev);
    if (r.statut === 'resolu') {
      etat.hist[pose.type].push({ id: r.id, habitue: r.habitue, compte: r.compte });
      if (etat.hist[pose.type].length > 80) etat.hist[pose.type].shift();
      etat.trace = {
        type: r.type, id: r.id, habitue: r.habitue, visuel: r.visuel, empreintes: r.empreintes, habitude: r.habitude,
        quand: r.quand, sens: r.sens, fin: r.fen.fin, contexte: r.contexte, emprunt: r.emprunt
      };
      if (r.retour) etat.parapluieRetour = { ms: r.retour.ms, trace: r.retour.trace };
      etat.pose = null;
      evts.push({ nom: 'resolu', trace: etat.trace });
    }
  }
  if (etat.parapluieRetour && maintenantMs >= etat.parapluieRetour.ms) {
    etat.retourTrace = { ms: etat.parapluieRetour.ms, trace: etat.parapluieRetour.trace };
    evts.push({ nom: 'retour', ...etat.retourTrace });
    etat.parapluieRetour = null;
  }
  return evts;
}

return { TYPES, graine, aleatoire, fenetre, contexte, passages, jourDecole, evaluer, resoudre, tirerRetour, empreinte, etatVide, poser, reprendre, avancer, debutHeure, jourJST };
});
