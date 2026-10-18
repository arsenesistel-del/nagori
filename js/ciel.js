/* Nagori · le ciel et le calendrier
   Position du soleil (algorithme de Meeus, précision de l'ordre de 0,01°, soit une dizaine de minutes sur une date de sekki),
   hauteur et direction du soleil à la gare, dates des 24 sekki et des 72 kō pour n'importe quelle année.
   Les sekki officiels de NAOJ (data/calendrier.js) sont prioritaires quand ils existent. */
(() => {
'use strict';
const N = window.NAGORI;
const RAD = Math.PI / 180, DAY = 864e5, JST = 9 * 3600e3;
const jdOf = ms => ms / DAY + 2440587.5;
const norm = a => ((a % 360) + 360) % 360;

/* longitude apparente du soleil, en degrés */
function sunLongitude(ms){
  const T = (jdOf(ms) - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const om = (125.04 - 1934.136 * T) * RAD;
  return norm(L0 + C - 0.00569 - 0.00478 * Math.sin(om));
}

/* hauteur (elev) et azimut (az, depuis le nord vers l'est) du soleil, en degrés */
function sunAltAz(ms, lat, lon){
  const jd = jdOf(ms), T = (jd - 2451545) / 36525;
  const lam = sunLongitude(ms) * RAD, eps = (23.439291 - 0.0130042 * T) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const H = (gmst + lon) * RAD - ra, phi = lat * RAD;
  const elev = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
  const az = norm(Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H)) / RAD);
  return { elev, az };
}

/* premier instant après fromMs où la longitude du soleil atteint target */
function crossing(target, fromMs){
  const f = ms => ((sunLongitude(ms) - target + 540) % 360) - 180;
  let a = fromMs, b = a + DAY;
  while (!(f(a) < 0 && f(b) >= 0)) { a = b; b = a + DAY; }
  for (let n = 0; n < 40; n++){ const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
  return b;
}

/* date japonaise (JST) d'un instant */
function jstDate(ms){ const d = new Date(ms + JST); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
const dayNum = (y, m, d) => Date.UTC(y, m - 1, d) / DAY;

/* heures officielles NAOJ, indexées par « année-kō » */
const OFFICIEL = {};
for (const [year, list] of Object.entries(N.SEKKI_OFFICIEL || {})){
  list.forEach((s, i) => {
    const [md, hm] = s.split(' '), [mo, da] = md.split('-').map(Number), [hh, mi] = hm.split(':').map(Number);
    const sekki = (22 + i) % 24;
    OFFICIEL[`${year}-${sekki * 3}`] = Date.UTC(+year, mo - 1, da, hh, mi) - JST;
  });
}

/* tous les débuts de kō entre le 1er décembre de l'année y-1 et le 15 janvier de l'année y+1 */
const CACHE = {};
function koStarts(y){
  if (CACHE[y]) return CACHE[y];
  const out = [], end = Date.UTC(y + 1, 0, 15);
  let ms = Date.UTC(y - 1, 11, 1);
  let k = Math.floor(norm(sunLongitude(ms) - 315) / 5);
  while (ms < end){
    k = (k + 1) % 72;
    let t = crossing(norm(315 + 5 * k), ms + 3600e3);
    const year = jstDate(t).y;
    if (OFFICIEL[`${year}-${k}`] != null) t = OFFICIEL[`${year}-${k}`];
    out.push({ k, ms: t, date: jstDate(t) });
    ms = t;
  }
  return CACHE[y] = out;
}

/* la micro-saison d'un jour (le kō commence le jour de son début, toute la journée, comme dans les calendriers japonais) */
function seasonOf(y, m, d){
  const today = dayNum(y, m, d);
  let cur = null;
  for (const s of koStarts(y)) { if (dayNum(s.date.y, s.date.m, s.date.d) <= today) cur = s; else break; }
  const ko = cur.k, i = Math.floor(ko / 3);
  // début du sekki : le dernier début de kō multiple de 3 jusqu'à aujourd'hui
  let sek = null;
  for (const s of koStarts(y)) { if (dayNum(s.date.y, s.date.m, s.date.d) > today) break; if (s.k === i * 3) sek = s; }
  if (!sek) sek = koStarts(y - 1).filter(s => s.k === i * 3).pop();
  const start = sek.date, key = `${start.y}-${String(start.m).padStart(2, '0')}-${String(start.d).padStart(2, '0')}`;
  return { i, ko, season: Math.floor(i / 6), start, key, koStart: cur.date, koMs: cur.ms, sekkiMs: sek.ms };
}

/* prochains débuts de kō après un instant */
function nextKo(ms, n = 3){
  const y = jstDate(ms).y;
  return [...koStarts(y), ...koStarts(y + 1)].filter((s, i, a) => s.ms > ms && a.findIndex(o => o.ms === s.ms) === i).slice(0, n);
}

/* phase de la lune, de 0 (nouvelle) à 1 */
function moonPhase(ms){ const days = (ms - Date.UTC(2000, 0, 6, 18, 14)) / DAY; return ((days / 29.530588853) % 1 + 1) % 1; }

N.ciel = { sunLongitude, sunAltAz, crossing, koStarts, seasonOf, nextKo, moonPhase, jstDate };
})();
