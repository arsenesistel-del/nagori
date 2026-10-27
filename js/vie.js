/* Nagori · la vie autour de la gare (lots F, G, H du cahier des charges) : la nuit et le petit matin, le calendrier de la fermeture,
   et (provisoire, hors cahier) les traits des habitués selon la météo. Logique pure, sans dessin ; tourne dans le navigateur et dans Node
   (tests/vie.test.js). Réglages : data/monde.js (NUIT), data/fermeture.js, data/craie.js, data/habitues.js.

   Météo : les causes des événements de nuit sont des mesures réelles, lues par meteo.a(ms) (js/meteo.js, magasin).
   Une heure sans mesure réelle ne compte pas : on ne suppose jamais de neige. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.NAGORI = root.NAGORI || {}; root.NAGORI.vie = api; }
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const H = 3600e3, JOUR = 864e5;
const minuitJST = (y, m, d) => Date.UTC(y, m - 1, d) - 9 * H;
const cle = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
function decaler(y, m, d, n) { const t = new Date(Date.UTC(y, m - 1, d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
const joursEntre = (a, b) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / JOUR);
const lireDate = s => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };

/* ---------- Hasard reproductible (même famille que js/jeu.js) ---------- */
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Météo réelle, cause des événements ---------- */
/* neige réelle tombée entre deux instants (cm), heure par heure ; les heures sans mesure réelle ne comptent pas */
function neigeTombee(meteo, debutMs, finMs) {
  if (!meteo) return 0;
  let cm = 0;
  for (let t = Math.ceil(debutMs / H) * H; t <= finMs; t += H) { const x = meteo.a(t); if (x && x.source === 'reelle') cm += x.snowfall || 0; }
  return cm;
}
/* neige réelle au sol à un instant (cm), ou null sans mesure */
function neigeSol(meteo, ms) { const x = meteo && meteo.a(ms); return x && x.source === 'reelle' && x.snowDepth != null ? x.snowDepth * 100 : null; }

/* ---------- La nuit (lot F) ---------- */
/* La nuit qui commence le soir du jour (y, m, d). Heures comptées depuis minuit ce jour-là (après minuit : > 24).
   Les tirages se font toujours dans le même ordre, que les causes soient réunies ou non : une même nuit donne le même résultat
   à tous les joueurs, et une mesure qui arrive plus tard ne change que ce qui dépend d'elle. */
function nuitDe(NUIT, y, m, d, meteo) {
  const r = rng(hash('nuit:' + cle(y, m, d))), base = minuitJST(y, m, d), ms = h => base + h * H;
  const R = NUIT.routine, E = NUIT.evenements, out = [];
  const entre = (de, a, duree) => de + r() * (a - de - (duree || 0));

  const liv = entre(R.livreur.de, R.livreur.a, R.livreur.duree);
  out.push({ id: 'livreur', debut: liv, fin: liv + R.livreur.duree });
  const ferme = entre(R.ferme.de, R.ferme.a);
  out.push({ id: 'ferme', debut: ferme, fin: null });            /* jusqu'au lever du soleil : le dessin le sait */

  const C = E.chasseNeige, tc = entre(C.de, C.a, C.duree);
  if (neigeTombee(meteo, ms(tc - C.fenetreH), ms(tc)) >= C.neigeCm) out.push({ id: 'chasseNeige', debut: tc, fin: tc + C.duree, cause: 'neige' });
  const Q = E.cheminotQuai;
  if (neigeTombee(meteo, ms(Q.de - Q.fenetreH), ms(Q.de)) >= Q.neigeCm) out.push({ id: 'cheminotQuai', debut: Q.de, fin: Q.a, cause: 'neige' });

  const V = E.cerfs, pc = r(), tv = entre(V.de, V.a, V.duree), n = 1 + Math.floor(r() * V.max);
  let chance = V.mois.includes(m) ? V.automne : V.chance;
  const sol = neigeSol(meteo, ms(tv));
  if (sol != null && sol >= V.neigeProfondeCm) chance *= V.facteurNeige;
  if (pc < chance) out.push({ id: 'cerfs', debut: tv, fin: tv + V.duree, n, cause: 'saison' });

  const F = E.renard, pr = r(), tr = entre(F.de, F.a, F.duree);
  if (pr < F.chance) out.push({ id: 'renard', debut: tr, fin: tr + F.duree });
  return out;
}
/* ce qui touche la journée (y, m, d) : la nuit d'avant (heures ramenées à ce jour, donc négatives avant minuit) et celle de ce soir */
function nuitsDuJour(NUIT, y, m, d, meteo) {
  const v = decaler(y, m, d, -1);
  const decal = x => ({ ...x, debut: x.debut - 24, fin: x.fin == null ? null : x.fin - 24 });
  return [...nuitDe(NUIT, v.y, v.m, v.d, meteo).map(decal), ...nuitDe(NUIT, y, m, d, meteo)];
}
/* l'événement id en cours à l'heure h du jour, avec sa progression k de 0 à 1 */
function enCours(NUIT, id, y, m, d, h, meteo) {
  for (const x of nuitsDuJour(NUIT, y, m, d, meteo)) if (x.id === id && x.fin != null && h >= x.debut && h < x.fin) return { ...x, k: (h - x.debut) / (x.fin - x.debut) };
  return null;
}
/* le dernier passage de id terminé avant l'heure h, dans les 24 heures */
function dernier(NUIT, id, y, m, d, h, meteo) {
  const l = nuitsDuJour(NUIT, y, m, d, meteo).filter(x => x.id === id && (x.fin == null ? x.debut : x.fin) <= h && x.debut > h - 24);
  return l.length ? l[l.length - 1] : null;
}

/* ---------- La fermeture (lot H) ---------- */
/* où en est la gare le jour (y, m, d) à l'heure h :
   compte : jours jusqu'au dernier jour de service (115 le 17 novembre 2026), d'après la date à la gare, qui change à minuit au Japon ;
   jour : jour du test (1 = debutTest) ; faits : les changements déjà en place ; aujourdhui : ceux de ce jour ;
   prov : la fin de service et ses signes (provisoire, hors cahier). */
function fermeture(F, y, m, d, h) {
  const date = { y, m, d }, jours = joursEntre(date, lireDate(F.dernierJour));
  const jour = joursEntre(lireDate(F.debutTest), date) + 1;
  const faits = F.changements.filter(c => c.j < jour || (c.j === jour && h >= c.h)).map(c => c.id);
  const aujourdhui = F.changements.filter(c => c.j === jour).map(c => c.id);
  const P = F.provisoire, fin = P.dernierArret.h + P.dernierArret.m / 60 + .2;
  const fermee = jours < 0 || (jours === 0 && h >= fin);
  return {
    joursRestants: jours, compte: jours >= 0 ? jours : null, jour, faits, aujourdhui,
    prov: { fermee, bandeau: !fermee && jours <= P.bandeau ? jours : null, fleurs: jours <= P.fleurs }
  };
}
/* la date d'un changement (ou d'un jour du test) */
function dateDuJour(F, j) { const t = lireDate(F.debutTest); return decaler(t.y, t.m, t.d, j - 1); }
/* la ligne du tableau à craie du jour : la dernière dont le jour est passé */
function craieDuJour(CRAIE, F, y, m, d) {
  const jour = joursEntre(lireDate(F.debutTest), { y, m, d }) + 1;
  const l = CRAIE.filter(c => c.j <= jour);
  return l.length ? l[l.length - 1] : null;
}

/* ---------- Provisoire, hors cahier : traits des habitués selon la météo ---------- */
const PLUIE = ['drizzle', 'rain', 'heavyrain', 'storm'], NEIGE = ['snow', 'heavysnow'];
const connue = m => !!m && m.source !== 'inconnue' && m.kind != null;
const tombe = (r, m) => connue(m) && ((r.pluie && PLUIE.includes(m.kind)) || (r.neige && NEIGE.includes(m.kind)));
function parapluie(R, m) { return tombe(R.parapluie, m) && !(m.wind != null && m.wind > R.parapluie.ventMax); }
function bonnet(R, m) { return connue(m) && m.temp != null && m.temp < R.bonnet.tempMax; }
function vieilleVient(R, m) {
  if (!connue(m)) return true;
  const r = R.vieilleReste;
  return !(r.kinds.includes(m.kind) || (m.temp != null && m.temp < r.tempMin) || (m.wind != null && m.wind > r.ventMax));
}
function chatAbrite(R, m) { return tombe(R.chatAbri, m) || (connue(m) && m.temp != null && m.temp < R.chatAbri.tempMax); }

return { neigeTombee, neigeSol, nuitDe, nuitsDuJour, enCours, dernier, fermeture, dateDuJour, craieDuJour,
         parapluie, bonnet, vieilleVient, chatAbrite, hash, rng };
});
