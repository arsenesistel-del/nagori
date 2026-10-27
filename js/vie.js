/* Nagori · la vie autour de la gare (session 3, lots F, G, H) : traits des habitués et du chat selon la météo,
   visiteurs de la nuit, calendrier de la fermeture. Logique pure, sans dessin ; tourne dans le navigateur et dans Node
   (tests/vie.test.js). Réglages : data/habitues.js.

   Une mesure météo m est celle de js/meteo.js : { source, kind, temp, wind, snowDepth }. Une mesure inconnue
   (source 'inconnue', kind null) ne déclenche aucun trait météo : on ne suppose ni pluie, ni neige, ni froid. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.NAGORI = root.NAGORI || {}; root.NAGORI.vie = api; }
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const PLUIE = ['drizzle', 'rain', 'heavyrain', 'storm'], NEIGE = ['snow', 'heavysnow'];
const connue = m => !!m && m.source !== 'inconnue' && m.kind != null;
const tombe = (r, m) => connue(m) && ((r.pluie && PLUIE.includes(m.kind)) || (r.neige && NEIGE.includes(m.kind)));

/* ---------- Habitués et chat (lot G) ---------- */
function parapluie(R, m) { return tombe(R.parapluie, m) && !(m.wind != null && m.wind > R.parapluie.ventMax); }
function bonnet(R, m) { return connue(m) && m.temp != null && m.temp < R.bonnet.tempMax; }
function vieilleVient(R, m) {
  if (!connue(m)) return true;
  const r = R.vieilleReste;
  return !(r.kinds.includes(m.kind) || (m.temp != null && m.temp < r.tempMin) || (m.wind != null && m.wind > r.ventMax));
}
/* neige au sol : la mesure peut être inconnue mais garder sa neige (24 h, js/meteo.js) */
function cheminotDeneige(R, m) { return !!m && (m.snowDepth || 0) * 100 >= R.cheminotDeneige.neigeCm; }
function chatAbrite(R, m) { return tombe(R.chatAbri, m) || (connue(m) && m.temp != null && m.temp < R.chatAbri.tempMax); }

/* ---------- Hasard reproductible (même famille que js/jeu.js) ---------- */
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cle = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
function veille(y, m, d) { const t = new Date(Date.UTC(y, m - 1, d - 1)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }

/* ---------- La nuit (lot F) ---------- */
/* les visiteurs de la nuit qui commence le soir du jour (y, m, d) ; heures comptées depuis minuit ce jour-là (après minuit : > 24) */
function nuitDe(NUIT, y, m, d) {
  const r = rng(hash('nuit:' + cle(y, m, d))), hiver = m >= 11 || m <= 3, out = [];
  for (const v of NUIT.visiteurs) {
    const p = r(), t = r();
    if (p < (hiver ? v.hiver : v.chance)) {
      const debut = v.de + t * (v.a - v.de - v.duree);
      out.push({ id: v.id, nuit: cle(y, m, d), debut, fin: debut + v.duree, y: v.y, sens: v.sens });
    }
  }
  return out;
}
/* toutes les traversées qui touchent la journée (y, m, d) : celles de la nuit d'avant (heures ramenées à ce jour) et de ce soir */
function traversees(NUIT, y, m, d) {
  const v = veille(y, m, d);
  return [...nuitDe(NUIT, v.y, v.m, v.d).map(x => ({ ...x, debut: x.debut - 24, fin: x.fin - 24 })), ...nuitDe(NUIT, y, m, d)];
}
/* le visiteur en train de traverser à l'heure h du jour (y, m, d), avec sa progression de 0 à 1 */
function visiteurA(NUIT, y, m, d, h) {
  for (const x of traversees(NUIT, y, m, d)) if (h >= x.debut && h < x.fin) return { ...x, k: (h - x.debut) / (x.fin - x.debut) };
  return null;
}
/* le dernier passage avant l'heure h, dans les 24 heures (pour ses pas dans la neige) */
function dernierPassage(NUIT, y, m, d, h) {
  const avant = traversees(NUIT, y, m, d).filter(x => x.fin <= h && x.fin > h - 24);
  return avant.length ? avant[avant.length - 1] : null;
}

/* ---------- La fermeture (lot H) ---------- */
const JOUR = 864e5;
/* où en est la gare le jour (y, m, d) à l'heure h. joursRestants : 0 le dernier jour. */
function fermeture(F, y, m, d, h) {
  const [fy, fm, fd] = F.dernierJour.split('-').map(Number);
  const jours = Math.round((Date.UTC(fy, fm - 1, fd) - Date.UTC(y, m - 1, d)) / JOUR);
  const finService = F.dernierArret.h + F.dernierArret.m / 60 + .2;      /* le temps que le dernier train reparte */
  const fermee = jours < 0 || (jours === 0 && h >= finService);
  const E = F.etapes;
  let etape = 'annee';
  if (fermee) etape = 'fermee';
  else if (jours === 0) etape = 'dernier-jour';
  else if (E.derniersJours != null && jours <= E.derniersJours) etape = 'derniers-jours';
  else if (E.compteARebours != null && jours <= E.compteARebours) etape = 'compte';
  return {
    joursRestants: jours, fermee, etape,
    affiche: !fermee && (E.affiche == null || jours <= E.affiche),
    compte: !fermee && E.compteARebours != null && jours <= E.compteARebours ? jours : null
  };
}

return { parapluie, bonnet, vieilleVient, cheminotDeneige, chatAbrite, nuitDe, traversees, visiteurA, dernierPassage, fermeture, hash, rng };
});
