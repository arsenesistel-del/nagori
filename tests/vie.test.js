/* Tests de la session 3 (lots F, G, H) : la lune, les traits des habitués, les visiteurs de la nuit, la fermeture.
   node tests/vie.test.js */
'use strict';
const { assert, test, lancer } = require('./aide.js');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const RACINE = path.join(__dirname, '..');

/* js/ciel.js et data/calendrier.js sont écrits pour le navigateur : on les charge avec une fenêtre minimale */
const bac = { Math, Date, Object, Number, String }; bac.window = bac;
vm.createContext(bac);
for (const f of ['data/calendrier.js', 'js/ciel.js']) vm.runInContext(fs.readFileSync(path.join(RACINE, f), 'utf8'), bac);
const CIEL = bac.window.NAGORI.ciel;
const { HABITUES, NUIT, FERMETURE } = require('../data/habitues.js');
const POSES = require('../data/objets.js');
const vie = require('../js/vie.js');
const R = HABITUES.regles;
const STATION = { lat: 43.8842, lon: 143.1809 };
const ecart = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/* ---------- la lune ---------- */
test('lune : exemple 47.a de Meeus (12 avril 1992, 0 h TD), à 0,5° près', () => {
  const l = CIEL.moonAltAz(Date.UTC(1992, 3, 12, 0, 0, 0) - 59e3, 0, 0);
  assert.ok(ecart(l.lam, 133.162655) < .5, `longitude ${l.lam}`);
  assert.ok(Math.abs(l.bet - -3.229126) < .5, `latitude ${l.bet}`);
  assert.ok(ecart(l.ra, 134.688470) < .5, `ascension droite ${l.ra}`);
  assert.ok(Math.abs(l.dec - 13.768368) < .5, `déclinaison ${l.dec}`);
});
test('lune : pleine le 24 novembre 2026 vers 14:53 UTC, nouvelle le 9 novembre vers 07:02 UTC', () => {
  const p = CIEL.moonAltAz(Date.UTC(2026, 10, 24, 14, 53), STATION.lat, STATION.lon);
  assert.ok(Math.abs(p.phase - .5) < .01 && p.lit > .99, `phase ${p.phase}`);
  const n = CIEL.moonAltAz(Date.UTC(2026, 10, 9, 7, 2), STATION.lat, STATION.lon);
  assert.ok(Math.min(n.phase, 1 - n.phase) < .01 && n.lit < .01, `phase ${n.phase}`);
});
test('lune : la pleine lune se lève au crépuscule et culmine vers minuit, au sud', () => {
  const jst = (j, h) => Date.UTC(2026, 10, j) + (h - 9) * 3600e3;
  assert.ok(CIEL.moonAltAz(jst(24, 14), STATION.lat, STATION.lon).elev < 0, 'sous l\'horizon à 14 h');
  /* à 143° E, minuit solaire tombe vers 23:15 heure de Tokyo en novembre : la lune culmine alors, plein sud */
  let quand = null, avant = CIEL.moonAltAz(jst(24, 21), STATION.lat, STATION.lon);
  for (let mn = 21 * 60 + 1; mn <= 26 * 60 && quand == null; mn++) { const l = CIEL.moonAltAz(jst(24, mn / 60), STATION.lat, STATION.lon); if (avant.az < 180 && l.az >= 180) quand = { h: mn / 60, l }; avant = l; }
  assert.ok(quand && quand.l.elev > 50 && quand.h > 22.8 && quand.h < 24, `passage au méridien : ${JSON.stringify(quand)}`);
  assert.ok(CIEL.moonAltAz(jst(25, 10), STATION.lat, STATION.lon).elev < 0, 'couchée à 10 h');
});

/* ---------- habitués ---------- */
const mes = (kind, o = {}) => ({ source: 'reelle', kind, temp: 2, wind: 10, snowDepth: 0, ...o });
const inconnue = { source: 'inconnue', kind: null, temp: null, wind: null, snowDepth: 0 };
test('habitués : parapluie sous la pluie ou la neige, pas par grand vent ni sans mesure', () => {
  assert.equal(vie.parapluie(R, mes('rain')), true);
  assert.equal(vie.parapluie(R, mes('snow')), true);
  assert.equal(vie.parapluie(R, mes('rain', { wind: 55 })), false);
  assert.equal(vie.parapluie(R, mes('overcast')), false);
  assert.equal(vie.parapluie(R, inconnue), false);
});
test('habitués : la vieille dame reste chez elle par forte neige, orage, vent fort ou grand froid ; vient sans mesure', () => {
  assert.equal(vie.vieilleVient(R, mes('snow')), true);
  for (const m of [mes('heavysnow'), mes('storm'), mes('clear', { temp: -18 }), mes('clear', { wind: 60 })]) assert.equal(vie.vieilleVient(R, m), false);
  assert.equal(vie.vieilleVient(R, inconnue), true);
});
test('habitués : le cheminot déblaie dès 5 cm au sol, même si la neige est gardée d\'une ancienne mesure', () => {
  assert.equal(vie.cheminotDeneige(R, mes('clear', { snowDepth: .04 })), false);
  assert.equal(vie.cheminotDeneige(R, mes('clear', { snowDepth: .06 })), true);
  assert.equal(vie.cheminotDeneige(R, { ...inconnue, snowDepth: .1 }), true);
});
test('chat : à l\'abri sous la pluie, la neige ou sous −3 °C ; dehors sans mesure', () => {
  assert.equal(vie.chatAbrite(R, mes('drizzle')), true);
  assert.equal(vie.chatAbrite(R, mes('clear', { temp: -5 })), true);
  assert.equal(vie.chatAbrite(R, mes('clear', { temp: 4 })), false);
  assert.equal(vie.chatAbrite(R, inconnue), false);
});
test('habitués : les horaires des fiches couvrent les créneaux des objets (data/objets.js)', () => {
  for (const [qui, hs] of Object.entries(POSES.creneaux))
    for (const h of hs) assert.ok(HABITUES.fiches[qui].passages.some(p => h >= p.de - .2 && h <= p.a + .2), `${qui} à ${h}`);
});

/* ---------- la nuit ---------- */
test('nuit : mêmes visiteurs pour une même nuit, dans leur fenêtre, plus de cerfs l\'hiver', () => {
  assert.deepEqual(vie.nuitDe(NUIT, 2026, 11, 20), vie.nuitDe(NUIT, 2026, 11, 20));
  const compte = { hiver: { cerf: 0, renard: 0 }, ete: { cerf: 0, renard: 0 } };
  for (let i = 0; i < 2000; i++) {
    for (const [saison, mo] of [['hiver', 1], ['ete', 7]]) {
      for (const v of vie.nuitDe(NUIT, 2000 + Math.floor(i / 28), mo, 1 + i % 28)) {
        const reg = NUIT.visiteurs.find(x => x.id === v.id);
        assert.ok(v.debut >= reg.de && v.fin <= reg.a + 1e-9, `${v.id} hors fenêtre`);
        compte[saison][v.id]++;
      }
    }
  }
  assert.ok(compte.hiver.cerf > compte.ete.cerf * 1.8, JSON.stringify(compte));
  assert.ok(compte.ete.renard > 2000 * .2 && compte.ete.renard < 2000 * .4, JSON.stringify(compte));
});
test('nuit : une traversée après minuit se retrouve le lendemain matin, avec sa progression', () => {
  let trouve = null;
  for (let d = 1; d <= 28 && !trouve; d++) { const v = vie.nuitDe(NUIT, 2026, 12, d).find(x => x.debut >= 24); if (v) trouve = { d, v }; }
  assert.ok(trouve, 'aucune traversée après minuit en décembre');
  const { d, v } = trouve, h = v.debut - 24 + (v.fin - v.debut) / 2;
  const a = vie.visiteurA(NUIT, 2026, 12, d + 1, h);
  assert.ok(a && a.id === v.id && Math.abs(a.k - .5) < 1e-6);
  const p = vie.dernierPassage(NUIT, 2026, 12, d + 1, 9);
  assert.ok(p && p.id === v.id || p.fin > v.fin - 24, 'le passage de la nuit est retrouvé au matin');
});

/* ---------- la fermeture ---------- */
test('fermeture : étapes, compte à rebours, fermeture après le dernier arrêt du dernier jour', () => {
  const f = (y, m, d, h = 12) => vie.fermeture(FERMETURE, y, m, d, h);
  assert.equal(f(2026, 11, 17).etape, 'annee');
  assert.equal(f(2026, 11, 17).compte, null);
  assert.equal(f(2026, 11, 17).affiche, true);
  assert.equal(f(2027, 2, 10).etape, 'compte');
  assert.equal(f(2027, 2, 10).compte, 30);
  assert.equal(f(2027, 3, 5).etape, 'derniers-jours');
  assert.equal(f(2027, 3, 12, 18).etape, 'dernier-jour');
  assert.equal(f(2027, 3, 12, 18).compte, 0);
  assert.equal(f(2027, 3, 12, 19.5).etape, 'fermee');
  assert.equal(f(2027, 3, 13).fermee, true);
  assert.equal(f(2027, 3, 13).affiche, false);
});
test('fermeture : le parapluie prêté revient avant le dernier jour de service', () => {
  const [y, m, d] = FERMETURE.dernierJour.split('-').map(Number);
  assert.ok(Date.parse(POSES.retour.avant) < Date.UTC(y, m - 1, d) - 9 * 3600e3 + 24 * 3600e3);
  assert.ok(Date.parse(POSES.retour.avant) >= Date.UTC(y, m - 1, d - 1) - 9 * 3600e3);
});

lancer('Vie autour de la gare (session 3)');
