/* Tests des lots F, G, H (cahier des charges) : la nuit et ses causes, la fermeture, les moments ; et (provisoire) la lune et les traits.
   node tests/vie.test.js */
'use strict';
const { assert, test, lancer } = require('./aide.js');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const RACINE = path.join(__dirname, '..');

/* js/ciel.js et data/calendrier.js sont écrits pour le navigateur : on les charge avec une fenêtre minimale */
const bac = { Math, Date, Object, Number, String }; bac.window = bac;
vm.createContext(bac);
for (const f of ['data/calendrier.js', 'data/monde.js', 'js/ciel.js']) vm.runInContext(fs.readFileSync(path.join(RACINE, f), 'utf8'), bac);
const CIEL = bac.window.NAGORI.ciel;
const NUIT = bac.window.NAGORI.NUIT;
const HABITUES = require('../data/habitues.js'), FERMETURE = require('../data/fermeture.js'), CRAIE = require('../data/craie.js');
const POSES = require('../data/objets.js');
const vie = require('../js/vie.js');
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

/* ---------- une météo réelle simulée : snowfall (cm par heure) et neige au sol (m) par heure ---------- */
function meteoFixe(f) { return { a: ms => { const v = f(ms); return v ? { source: 'reelle', snowfall: 0, snowDepth: 0, ...v } : null; } }; }
const jstMs = (y, m, d, h) => Date.UTC(y, m - 1, d) + (h - 9) * 3600e3;

/* ---------- la nuit (lot F) ---------- */
test('nuit : le livreur passe chaque nuit entre 4 h 05 et 4 h 20, la fenêtre de ferme s\'allume vers 4 h 30', () => {
  for (let d = 1; d <= 30; d++) {
    const n = vie.nuitDe(NUIT, 2026, 11, d, null);
    const l = n.find(x => x.id === 'livreur'), f = n.find(x => x.id === 'ferme');
    assert.ok(l && l.debut >= 28 + 5 / 60 - 1e-9 && l.fin <= 28 + 20 / 60 + 1e-9, `livreur ${l && l.debut}`);
    assert.ok(f && f.debut >= 28.33 && f.debut <= 28.67, `ferme ${f && f.debut}`);
  }
});
test('nuit : même tirage pour tous et pour une même nuit', () => {
  assert.deepEqual(vie.nuitDe(NUIT, 2026, 11, 20, null), vie.nuitDe(NUIT, 2026, 11, 20, null));
});
test('nuit : sans neige réelle, jamais de chasse-neige ni de cheminot sur le quai ; une heure sans mesure ne compte pas', () => {
  const sec = meteoFixe(() => ({ snowfall: 0 })), vide = meteoFixe(() => null);
  for (let d = 1; d <= 60; d++) for (const m of [sec, vide, null]) {
    const ids = vie.nuitDe(NUIT, 2026, 12, 1 + d % 28, m).map(x => x.id);
    assert.ok(!ids.includes('chasseNeige') && !ids.includes('cheminotQuai'));
  }
});
test('nuit : 2 cm de neige réelle dans les 6 h avant son passage : le chasse-neige passe ; 1,9 cm : non', () => {
  const avec = cm => meteoFixe(ms => ({ snowfall: cm / 6 }));
  for (let d = 1; d <= 20; d++) {
    assert.ok(vie.nuitDe(NUIT, 2026, 12, d, avec(2.4)).some(x => x.id === 'chasseNeige'));
    assert.ok(!vie.nuitDe(NUIT, 2026, 12, d, avec(1.6)).some(x => x.id === 'chasseNeige'));
  }
});
test('nuit : le cheminot dégage le quai vers 5 h si 2 cm sont tombés entre 23 h et 5 h', () => {
  const nuit = meteoFixe(ms => { const h = ((ms / 3600e3 + 9) % 24 + 24) % 24; return { snowfall: h >= 23 || h < 5 ? .5 : 0 }; });
  const q = vie.nuitDe(NUIT, 2026, 12, 3, nuit).find(x => x.id === 'cheminotQuai');
  assert.ok(q && q.debut === 29 && q.fin === 29.75);
  const a = vie.enCours(NUIT, 'cheminotQuai', 2026, 12, 4, 5.3, nuit);
  assert.ok(a && Math.abs(a.k - .4) < 1e-9, 'retrouvé le lendemain matin à 5 h 18');
});
test('nuit : renard environ 2 nuits sur 10 ; cerfs plus fréquents en automne, rares dans la neige profonde', () => {
  const compte = (mo, m) => { const c = { renard: 0, cerfs: 0 }; for (let i = 0; i < 3000; i++) for (const x of vie.nuitDe(NUIT, 2000 + Math.floor(i / 28), mo, 1 + i % 28, m)) if (c[x.id] != null) c[x.id]++; return c; };
  const oct = compte(10, null), jan = compte(1, null), profond = compte(1, meteoFixe(() => ({ snowDepth: .6 })));
  assert.ok(oct.renard > 3000 * .17 && oct.renard < 3000 * .23, JSON.stringify(oct));
  assert.ok(oct.cerfs > jan.cerfs * 1.8, `automne ${oct.cerfs}, janvier ${jan.cerfs}`);
  assert.ok(profond.cerfs < jan.cerfs * .35, `neige profonde ${profond.cerfs}, janvier ${jan.cerfs}`);
});
test('nuit : un passage après minuit se retrouve le lendemain, et reste le dernier passage du matin', () => {
  let t = null;
  for (let d = 1; d <= 28 && !t; d++) { const r = vie.nuitDe(NUIT, 2026, 10, d, null).find(x => x.id === 'renard' && x.debut >= 24); if (r) t = { d, r }; }
  assert.ok(t, 'aucun renard après minuit en octobre');
  const h = t.r.debut - 24 + (t.r.fin - t.r.debut) / 2;
  const a = vie.enCours(NUIT, 'renard', 2026, 10, t.d + 1, h, null);
  assert.ok(a && Math.abs(a.k - .5) < 1e-6);
  const p = vie.dernier(NUIT, 'renard', 2026, 10, t.d + 1, 9, null);
  assert.ok(p && Math.abs(p.debut - (t.r.debut - 24)) < 1e-9);
});

/* ---------- la fermeture (lot H) ---------- */
test('fermeture : les deux dates (révision le samedi 13 mars 2027, dernier jour la veille)', () => {
  assert.equal(FERMETURE.revision, '2027-03-13');
  assert.equal(FERMETURE.dernierJour, '2027-03-12');
  assert.equal(new Date(Date.UTC(2027, 2, 13)).getUTCDay(), 6);
});
test('fermeture : compte à rebours 115 le 17 novembre, 102 le 30 novembre, change à minuit heure du Japon', () => {
  assert.equal(vie.fermeture(FERMETURE, 2026, 11, 17, 0).compte, 115);
  assert.equal(vie.fermeture(FERMETURE, 2026, 11, 17, 23.99).compte, 115);
  assert.equal(vie.fermeture(FERMETURE, 2026, 11, 18, 0).compte, 114);
  assert.equal(vie.fermeture(FERMETURE, 2026, 11, 30, 12).compte, 102);
  assert.equal(vie.fermeture(FERMETURE, 2026, 10, 27, 12).compte, 136, 'dès la première visite, quelle que soit la date');
});
test('fermeture : les changements arrivent à leur date et restent en place', () => {
  const quand = { 'cahier-1': [11, 17], 'affiche-commune': [11, 19], 'moment-ecolier': [11, 20], 'photo-1': [11, 22], 'cahier-2': [11, 23],
                  'moment-vieille': [11, 24], 'moment-cheminot': [11, 26], 'photo-2': [11, 28], 'cahier-3': [11, 29] };
  for (const [id, [mo, d]] of Object.entries(quand)) {
    const c = FERMETURE.changements.find(x => x.id === id);
    assert.deepEqual(vie.dateDuJour(FERMETURE, c.j), { y: 2026, m: mo, d }, id);
    const veille = vie.dateDuJour(FERMETURE, c.j - 1);
    assert.ok(!vie.fermeture(FERMETURE, veille.y, veille.m, veille.d, 23.9).faits.includes(id), `${id} pas avant`);
    assert.ok(!vie.fermeture(FERMETURE, 2026, mo, d, c.h - .01).faits.includes(id), `${id} pas avant son heure`);
    assert.ok(vie.fermeture(FERMETURE, 2026, mo, d, c.h).faits.includes(id), `${id} à son heure`);
    assert.ok(vie.fermeture(FERMETURE, 2026, mo, d, c.h).aujourdhui.includes(id));
    assert.ok(vie.fermeture(FERMETURE, 2026, 11, 30, 12).faits.includes(id), `${id} reste en place`);
  }
  assert.equal(vie.dateDuJour(FERMETURE, 4).d, 20); assert.equal(new Date(Date.UTC(2026, 10, 20)).getUTCDay(), 5, 'moment de l\'écolier un vendredi');
});
test('fermeture : une seule constante décale tout le calendrier du test', () => {
  const F2 = { ...FERMETURE, debutTest: '2026-11-24' };
  assert.ok(vie.fermeture(F2, 2026, 11, 26, 12).faits.includes('affiche-commune'));
  assert.ok(!vie.fermeture(F2, 2026, 11, 25, 12).faits.includes('affiche-commune'));
  assert.equal(vie.fermeture(F2, 2026, 11, 26, 12).compte, vie.fermeture(FERMETURE, 2026, 11, 26, 12).compte, 'le compte à rebours ne bouge pas');
});
test('craie : 7 lignes, un jour sur deux, les autres jours gardent la précédente', () => {
  assert.equal(CRAIE.length, 7);
  const l = j => { const d = vie.dateDuJour(FERMETURE, j); const c = vie.craieDuJour(CRAIE, FERMETURE, d.y, d.m, d.d); return c && c.id; };
  assert.equal(l(0), null);
  assert.equal(l(1), 'craie-1'); assert.equal(l(2), 'craie-1'); assert.equal(l(3), 'craie-2'); assert.equal(l(14), 'craie-7'); assert.equal(l(40), 'craie-7');
});
test('fermeture (provisoire) : fin de service après le dernier arrêt du dernier jour', () => {
  assert.equal(vie.fermeture(FERMETURE, 2027, 3, 12, 18).prov.fermee, false);
  assert.equal(vie.fermeture(FERMETURE, 2027, 3, 12, 19.5).prov.fermee, true);
  assert.equal(vie.fermeture(FERMETURE, 2026, 11, 17, 12).prov.bandeau, null);
  assert.equal(vie.fermeture(FERMETURE, 2027, 2, 20, 12).prov.bandeau, 20);
});
test('fermeture : le parapluie prêté revient avant le dernier jour de service', () => {
  const [y, m, d] = FERMETURE.dernierJour.split('-').map(Number);
  assert.ok(Date.parse(POSES.retour.avant) < Date.UTC(y, m - 1, d) - 9 * 3600e3 + 24 * 3600e3);
});

/* ---------- habitués ---------- */
test('habitués : les horaires des fiches couvrent les créneaux des objets (data/objets.js)', () => {
  for (const [qui, hs] of Object.entries(POSES.creneaux))
    for (const h of hs) assert.ok(HABITUES.fiches[qui].passages.some(p => h >= p.de - .2 && h <= p.a + .2), `${qui} à ${h}`);
});
test('habitués : le 23 novembre est férié, l\'écolier est absent', () => {
  assert.ok(POSES.ecole.feries.includes('2026-11-23'));
});
test('habitués : chaque moment de fermeture a sa date au calendrier', () => {
  for (const f of Object.values(HABITUES.fiches)) if (f.moment) assert.ok(FERMETURE.changements.some(c => c.id === f.moment), f.moment);
});

/* ---------- provisoire, hors cahier : traits selon la météo ---------- */
const R = HABITUES.regles;
const mes = (kind, o = {}) => ({ source: 'reelle', kind, temp: 2, wind: 10, snowDepth: 0, ...o });
const inconnue = { source: 'inconnue', kind: null, temp: null, wind: null, snowDepth: 0 };
test('provisoire : parapluie sous la pluie ou la neige, pas par grand vent ni sans mesure', () => {
  assert.equal(vie.parapluie(R, mes('rain')), true);
  assert.equal(vie.parapluie(R, mes('rain', { wind: 55 })), false);
  assert.equal(vie.parapluie(R, inconnue), false);
});
test('provisoire : la vieille dame reste chez elle par forte neige ; vient sans mesure ; le chat à l\'abri', () => {
  assert.equal(vie.vieilleVient(R, mes('heavysnow')), false);
  assert.equal(vie.vieilleVient(R, inconnue), true);
  assert.equal(vie.chatAbrite(R, mes('drizzle')), true);
  assert.equal(vie.chatAbrite(R, inconnue), false);
});

lancer('Vie autour de la gare (lots F, G, H)');
