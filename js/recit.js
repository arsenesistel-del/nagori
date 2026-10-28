/* Nagori · le récit de l'absence (lot E du cahier des charges, docs/cahier-lot-E.md) : quels plans montrer, dans quel ordre,
   combien de temps. Logique pure, sans dessin ; tourne dans le navigateur et dans Node (tests/recit.test.js). Réglages : data/recit.js.

   Un plan est un instant de l'absence que la scène sait dessiner (le point de vue de la session 1), avec un cadrage.
   La météo n'entre que par des mesures réelles : un plan de type « temps » ne naît que de deux heures réelles qui se suivent,
   une heure inconnue n'en produit aucun, et hors ligne le récit ne garde que les plans sans météo.

   ctx : { de, a (ms, l'absence), meteo ({ a(ms) }, js/meteo.js), horsLigne, sunElev(ms), koDuJour(y,m,d), vie, NUIT, FERM,
           jourDecole(ms), passages ({ ecolier:[h…], vieille:[h…], cheminot:[h…] }), objets ({ trace, retour }),
           voyageurArrivees ([ms…], vide s'il est désactivé), premiereNeigeFaite(ms), hist ([{ types, habitues }…], le plus récent en dernier) } */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.NAGORI = root.NAGORI || {}; root.NAGORI.recit = api; }
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const H = 3600e3, JST = 9 * H, DAY = 24 * H;
const jourDe = ms => { const d = new Date(ms + JST); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
const cleJour = ({ y, m, d }) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const minuit = ({ y, m, d }) => Date.UTC(y, m - 1, d) - JST;
const PLUIE = ['drizzle', 'rain', 'heavyrain', 'storm'], NEIGE = ['snow', 'heavysnow'], CLAIR = ['clear', 'partly'];
const classe = x => !x || x.source !== 'reelle' || !x.kind ? null : PLUIE.includes(x.kind) ? 'pluie' : NEIGE.includes(x.kind) ? 'neige' : CLAIR.includes(x.kind) ? 'clair' : 'couvert';

/* les jours (heure de la gare) que l'absence touche */
function jours(de, a) { const out = []; for (let j = minuit(jourDe(de)); j <= a; j += DAY) out.push(jourDe(j + H)); return out; }

/* ---------- Les plans possibles ---------- */
function candidats(R, ctx) {
  const { de, a } = ctx, out = [], dans = ms => ms > de && ms <= a;
  const cad = (nom, cx, cy) => { const c = R.cadrages[nom]; return c ? { span: c.span, cy: cy != null ? cy : c.cy, cx: cx != null ? cx : c.cx } : null; };
  const jourLum = ms => ctx.sunElev(ms) > 0;
  const ajoute = (type, ms, o = {}) => { if (dans(ms)) out.push({ type, ms, jour: cleJour(jourDe(ms)), note: R.notes[type], jourLumiere: jourLum(ms), meteo: false, ...o }); };

  /* 1. la conséquence de l'objet (et le parapluie rendu) : toujours montrée si elle a eu lieu pendant l'absence.
        L'instant est la fin de la fenêtre : on montre la trace laissée, jamais le geste, que le joueur n'a pas vu. */
  const o = ctx.objets || {};
  if (o.trace && o.trace.fin != null) ajoute('objet', o.trace.fin, { force: true, sous: o.trace.type, cle: 'objet:' + o.trace.fin, cadrage: cad('serre', R.cibles.objet[o.trace.type]) });
  if (o.retour && o.retour.ms != null) ajoute('objet', o.retour.ms + R.decalageH.gare * H, { force: true, sous: 'retour', cle: 'retour:' + o.retour.ms, cadrage: cad('serre', R.cibles.objet.retour) });

  /* 2. l'arrivée du voyageur, s'il est activé */
  for (const ms of ctx.voyageurArrivees || []) ajoute('voyageur', ms + R.decalageH.voyageur * H, { cle: 'voyageur:' + ms, cadrage: cad('quai'), train: true });

  for (const j of jours(de, a)) {
    const m0 = minuit(j), k = cleJour(j), F = ctx.vie.fermeture(ctx.FERM, j.y, j.m, j.d, 23.99);

    /* 3. un signe de la fermeture est apparu (les moments des habitués sont des plans d'habitué) */
    for (const id of F.aujourdhui) {
      if (id.startsWith('moment-')) continue;
      const c = ctx.FERM.changements.find(x => x.id === id), cible = R.cibles.gare[id] || [480, 615];
      ajoute('gare', m0 + (c.h + R.decalageH.gare) * H, { sous: id, cle: 'gare:' + id, cadrage: cad('signe', cible[0], cible[1]) });
    }

    /* 5. la lumière : lever et coucher du soleil ; « jour » (midi) sert seulement à garantir un plan de jour */
    let avant = ctx.sunElev(m0 + 3 * H), haut = { ms: null, e: -90 };
    for (let t = m0 + 3 * H + 600e3; t <= m0 + 21 * H; t += 600e3) {
      const e = ctx.sunElev(t);
      if (avant <= 0 && e > 0) ajoute('lumiere', t + R.decalageH.lever * H, { sous: 'lever', cle: 'lever:' + k });
      if (avant > 0 && e <= 0) ajoute('lumiere', t + R.decalageH.coucher * H, { sous: 'coucher', cle: 'coucher:' + k });
      if (e > haut.e) haut = { ms: t, e };
      avant = e;
    }
    if (haut.ms != null && haut.e > 0) ajoute('lumiere', haut.ms, { sous: 'jour', cle: 'jour:' + k, note: R.noteJour });

    /* 6. un habitué, seulement si sa routine a changé : absence (jour de semaine sans école), pluie réelle à son passage,
          moment de fermeture. L'objet dont il a profité est déjà le plan 1. */
    const P = ctx.passages || {}, ecole = ctx.jourDecole(m0 + 12 * H), semaine = [1, 2, 3, 4, 5].includes(new Date(m0 + 12 * H + JST).getUTCDay());
    if (semaine && !ecole && P.ecolier) ajoute('habitue', m0 + 7.75 * H, { sous: 'absence', habitue: 'ecolier', cle: 'habitue:ecolier:absence:' + k, cadrage: cad('moyen', R.cibles.habitue.ecolier) });
    for (const [qui, hs] of Object.entries(P)) {
      if (qui === 'ecolier' && !ecole) continue;
      for (const h of hs) {
        const t = m0 + (h + .05) * H;
        if (classe(ctx.meteo.a(t)) === 'pluie') ajoute('habitue', t, { sous: 'pluie', habitue: qui, meteo: true, cle: `habitue:${qui}:pluie:${k}:${h}`, cadrage: cad('moyen', R.cibles.habitue[qui]) });
      }
    }
    for (const id of F.aujourdhui) if (id.startsWith('moment-')) {
      const qui = id.slice(7), c = ctx.FERM.changements.find(x => x.id === id);
      ajoute('habitue', m0 + (c.h + .1) * H, { sous: 'moment', habitue: qui, cle: 'habitue:' + id, cadrage: cad('moyen', R.cibles.habitue[qui]) });
    }

    /* 8. un kō a commencé */
    const v = jourDe(m0 - H);
    if (ctx.koDuJour(j.y, j.m, j.d) !== ctx.koDuJour(v.y, v.m, v.d)) ajoute('ko', m0 + R.decalageH.ko * H, { ko: ctx.koDuJour(j.y, j.m, j.d), cle: 'ko:' + k });
  }

  /* 7. la vie de nuit : seulement un événement marquant qui a eu lieu (lot F), au milieu de son passage */
  const vus = {};
  for (const j of jours(de - DAY, a)) for (const x of ctx.vie.nuitDe(ctx.NUIT, j.y, j.m, j.d, ctx.meteo)) {
    if (!['chasseNeige', 'cheminotQuai', 'cerfs', 'renard'].includes(x.id)) continue;
    const ms = minuit(j) + ((x.debut + x.fin) / 2) * H, cle = 'nuit:' + x.id + ':' + cleJour(j);
    if (vus[cle]) continue; vus[cle] = true;
    ajoute('nuit', ms, { sous: x.id, cle, n: x.n, meteo: x.cause === 'neige', cadrage: cad('moyen', R.cibles.nuit[x.id]) });
  }

  /* 4. le temps change : début de pluie ou de neige, première neige, éclaircie ; deux heures réelles qui se suivent */
  let prec = null; const dejaJour = {};
  for (let t = Math.ceil(de / H) * H; t <= a; t += H) {
    const c = classe(ctx.meteo.a(t));
    if (c && prec && c !== prec) {
      let sous = null;
      if (c === 'pluie' && (prec === 'clair' || prec === 'couvert')) sous = 'pluie';
      else if (c === 'neige' && prec !== 'neige') sous = ctx.premiereNeigeFaite && !ctx.premiereNeigeFaite(t) ? 'premiere-neige' : 'neige';
      else if (c === 'clair' && prec !== 'clair') sous = 'eclaircie';
      const k = cleJour(jourDe(t)) + ':' + sous;
      if (sous && !dejaJour[k]) {
        dejaJour[k] = true;
        ajoute('temps', t + R.decalageH.temps * H, { sous, meteo: true, cle: 'temps:' + k, note: R.notes.temps + (sous === 'premiere-neige' ? R.premiereNeigeBonus : 0) });
        if (sous === 'premiere-neige') ctx = { ...ctx, premiereNeigeFaite: () => true };
      }
    }
    prec = c;
  }
  return out.sort((x, y) => x.ms - y.ms);
}

/* ---------- Composer le récit ---------- */
/* rend null (pas de vignette) ou { regime, plans, dureeS, parPlanS, calme } ; les plans sont dans l'ordre du temps. */
function composer(R, ctx, cands) {
  const heures = (ctx.a - ctx.de) / H;
  if (heures < R.absenceMinH) return null;
  let c = (cands || candidats(R, ctx)).slice();
  if (ctx.horsLigne) c = c.filter(x => !x.meteo);             /* hors ligne : seulement les plans sans météo */

  /* anti-répétition : un type vu dans l'un des trois derniers récits, note × 0,3 ; l'habitué du récit précédent, écarté */
  const hist = (ctx.hist || []).slice(-R.antiRepetition.recits), dernier = hist[hist.length - 1];
  c = c.filter(x => !(x.type === 'habitue' && dernier && (dernier.habitues || []).includes(x.habitue)));
  for (const x of c) if (!x.force && hist.some(h => (h.types || []).includes(x.type))) x.note *= R.antiRepetition.facteur;
  if (!c.length) return null;

  const regime = heures <= R.regimes.courtMaxH ? 'court' : heures <= R.regimes.joursMaxH ? 'jours' : 'long';
  const meilleur = l => l.slice().sort((p, q) => (q.force ? 1e9 : q.note) - (p.force ? 1e9 : p.note) || p.ms - q.ms)[0];
  const calme = c.every(x => x.type === 'lumiere');
  let plans;
  if (calme) {
    /* une absence calme donne un seul plan : le lever ou le coucher, sinon le jour */
    const l = c.filter(x => x.sous !== 'jour');
    plans = [meilleur(l.length ? l : c)];
  } else if (regime === 'court') {
    const forces = c.filter(x => x.force), autres = c.filter(x => !x.force && x.sous !== 'jour').sort((p, q) => q.note - p.note || p.ms - q.ms);
    plans = forces.concat(autres).slice(0, Math.max(R.regimes.court.max, forces.length));
    if (plans.length < R.regimes.court.min) plans = plans.concat(c.filter(x => x.sous === 'jour').slice(0, R.regimes.court.min - plans.length));
  } else {
    /* le meilleur plan de chaque jour (les 7 derniers jours au plus), daté. La conséquence de l'objet, « toujours montrée si elle
       a eu lieu », s'ajoute au meilleur plan de son jour au lieu de le remplacer (interprétation NON VALIDÉE, à confirmer par Arsène). */
    const parJour = {};
    for (const x of c) if (!x.force) (parJour[x.jour] = parJour[x.jour] || []).push(x);
    const js = [...new Set(c.map(x => x.jour))].sort().slice(-R.regimes.jours.max);
    plans = js.filter(j => parJour[j]).map(j => { const l = parJour[j].filter(x => x.sous !== 'jour'); return meilleur(l.length ? l : parJour[j]); });
    plans = plans.concat(c.filter(x => x.force && js.includes(x.jour)));
  }

  /* au moins un plan de jour dès que l'absence en contenait (critère du cahier) */
  if (!plans.some(p => p.jourLumiere)) {
    const jourCands = c.filter(x => x.jourLumiere && !plans.includes(x));
    const remplacables = plans.filter(p => !p.force).sort((p, q) => p.note - q.note);
    if (jourCands.length && (remplacables.length || plans.length < (regime === 'court' ? R.regimes.court.max : R.regimes.jours.max))) {
      let remplace = remplacables[0];
      if (regime !== 'court' && remplace) {
        /* le même jour si possible, pour garder un plan par jour */
        const meme = remplacables.map(p => [p, jourCands.filter(x => x.jour === p.jour)]).find(([, l]) => l.length);
        if (meme) { plans[plans.indexOf(meme[0])] = meilleur(meme[1]); remplace = null; }
      }
      if (remplace !== null) {
        const choix = meilleur(jourCands);
        if (remplace) plans[plans.indexOf(remplace)] = choix; else plans.push(choix);
      }
    }
  }

  plans.sort((p, q) => p.ms - q.ms);
  const total = regime === 'court' || calme ? R.regimes.court.totalS : R.regimes.jours.totalS;
  /* (cahier) 2 à 4 s par plan et 20 ou 25 s au plus : au-delà de total / 2 plans, on garde les meilleurs */
  const maxPlans = Math.floor(total / R.plan.minS);
  if (plans.length > maxPlans) plans = plans.slice().sort((p, q) => (q.force ? 1e9 : q.note) - (p.force ? 1e9 : p.note)).slice(0, maxPlans).sort((p, q) => p.ms - q.ms);
  const parPlanS = Math.max(R.plan.minS, Math.min(R.plan.maxS, total / plans.length));
  return { regime, calme, plans, parPlanS, dureeS: Math.round(parPlanS * plans.length * 10) / 10 };
}

/* la trace à garder dans l'historique (anti-répétition) */
function memoire(r) { return { types: [...new Set(r.plans.map(p => p.type))], habitues: [...new Set(r.plans.filter(p => p.habitue).map(p => p.habitue))] }; }

return { candidats, composer, memoire, jours, jourDe, cleJour };
});
