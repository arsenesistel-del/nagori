/* Tests du récit de l'absence (lot E, docs/cahier-lot-E.md) : node tests/recit.test.js
   La série simulée de novembre (tests/donnees) est présentée au récit comme réelle, seulement ici, pour faire jouer les règles. */
'use strict';
const { assert, test, lancer } = require('./aide.js');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const RACINE = path.join(__dirname, '..');
const bac = { Math, Date, Object, Number, String }; bac.window = bac; vm.createContext(bac);
for (const f of ['data/calendrier.js', 'data/monde.js', 'js/ciel.js']) vm.runInContext(fs.readFileSync(path.join(RACINE, f), 'utf8'), bac);
const CIEL = bac.window.NAGORI.ciel, NUIT = bac.window.NAGORI.NUIT, STATION = bac.window.NAGORI.STATION;
const R = require('../data/recit.js'), FERM = require('../data/fermeture.js'), POSES = require('../data/objets.js');
const METEO = require('../js/meteo.js'), O = require('../js/objets.js'), vie = require('../js/vie.js'), recit = require('../js/recit.js');
const H = 3600e3;
const jst = (y, m, d, h) => Date.UTC(y, m - 1, d) + (h - 9) * H;

const SERIE = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees/simule-novembre-14-jours.json'), 'utf8')).mesures;
function meteoDe(mesures) { const m = new Map(mesures.map(x => [x.t, Object.assign({}, x, { source: 'reelle' })])); return { a: ms => m.get(METEO.cleHeure(ms)) || METEO.inconnue('heure-inconnue', {}) }; }
const MET = meteoDe(SERIE), VIDE = { a: () => METEO.inconnue('heure-inconnue', {}) };

function ctx(de, a, o = {}) {
  return Object.assign({
    de, a, meteo: MET, horsLigne: false, sunElev: ms => CIEL.sunAltAz(ms, STATION.lat, STATION.lon).elev,
    koDuJour: (y, m, d) => CIEL.seasonOf(y, m, d).ko, vie, NUIT, FERM, jourDecole: ms => O.jourDecole(POSES, ms),
    passages: { ecolier: [7.5], vieille: [13], cheminot: [10.4, 21.4] }, objets: {}, voyageurArrivees: [], premiereNeigeFaite: () => true, hist: []
  }, o);
}
const composer = c => recit.composer(R, c);
const parType = r => r.plans.reduce((s, p) => (s[p.type] = (s[p.type] || 0) + 1, s), {});

test('pas de récit sous 3 h d\'absence', () => {
  assert.equal(composer(ctx(jst(2026, 11, 20, 9), jst(2026, 11, 20, 11.9))), null);
});
test('3 h à 1 jour : 4 à 6 plans, 2 à 4 s chacun, 20 s au plus, dans l\'ordre du temps, tous dans l\'absence', () => {
  for (let d = 16; d <= 28; d++) {
    const c = ctx(jst(2026, 11, d, 20), jst(2026, 11, d + 1, 20)), r = composer(c);
    assert.ok(r, `récit le ${d}`);
    assert.equal(r.regime, 'court');
    if (!r.calme) assert.ok(r.plans.length >= 4 && r.plans.length <= 6, `${r.plans.length} plans le ${d}`);
    assert.ok(r.dureeS <= 20 && r.parPlanS >= 2 && r.parPlanS <= 4, `${r.dureeS} s`);
    for (let i = 0; i < r.plans.length; i++) {
      assert.ok(r.plans[i].ms > c.de && r.plans[i].ms <= c.a);
      if (i) assert.ok(r.plans[i].ms >= r.plans[i - 1].ms);
    }
  }
});
test('2 à 7 jours : le meilleur plan de chaque jour, daté, 25 s au plus', () => {
  const r = composer(ctx(jst(2026, 11, 18, 21), jst(2026, 11, 23, 20)));
  assert.equal(r.regime, 'jours');
  const js = r.plans.map(p => p.jour);
  assert.equal(new Set(js).size, js.length, 'un plan par jour');
  assert.ok(r.plans.length <= 7 && r.dureeS <= 25, `${r.plans.length} plans, ${r.dureeS} s`);
});
test('plus de 7 jours : les 7 derniers jours, un plan chacun, 25 s au plus', () => {
  const r = composer(ctx(jst(2026, 11, 16, 1), jst(2026, 11, 30, 20)));
  assert.equal(r.regime, 'long');
  assert.ok(r.plans.length <= 7 && r.dureeS <= 25);
  assert.ok(r.plans.every(p => p.jour >= '2026-11-24'), r.plans.map(p => p.jour).join(','));
});
test('au moins un plan de jour dès que l\'absence en contenait', () => {
  for (const [de, a] of [[jst(2026, 11, 20, 20), jst(2026, 11, 21, 22)], [jst(2026, 11, 17, 19), jst(2026, 11, 22, 19)], [jst(2026, 11, 16, 12), jst(2026, 11, 30, 2)]]) {
    const r = composer(ctx(de, a, { hist: [{ types: ['lumiere'], habitues: [] }] }));
    assert.ok(r.plans.some(p => p.jourLumiere), r.plans.map(p => p.type + '@' + new Date(p.ms).toISOString()).join(' '));
  }
});
test('une heure inconnue retire ses plans météo ; hors ligne, seulement les plans sans météo', () => {
  const sans = composer(ctx(jst(2026, 11, 17, 20), jst(2026, 11, 18, 20), { meteo: VIDE }));
  assert.ok(!sans || sans.plans.every(p => p.type !== 'temps' && !p.meteo));
  const cands = recit.candidats(R, ctx(jst(2026, 11, 17, 20), jst(2026, 11, 22, 20)));
  assert.ok(cands.some(p => p.meteo), 'la série simulée donne des plans météo');
  const hl = composer(ctx(jst(2026, 11, 17, 20), jst(2026, 11, 22, 20), { horsLigne: true }));
  assert.ok(hl.plans.every(p => !p.meteo));
});
test('la conséquence de l\'objet est toujours montrée si elle a eu lieu ; jamais si elle tombe hors de l\'absence', () => {
  const trace = { type: 'thermos', fin: jst(2026, 11, 18, 12) };
  for (const hist of [[], [{ types: ['objet'], habitues: [] }]]) {
    const r = composer(ctx(jst(2026, 11, 17, 20), jst(2026, 11, 18, 20), { objets: { trace }, hist }));
    assert.ok(r.plans.some(p => p.type === 'objet' && p.ms === trace.fin && p.cadrage && p.cadrage.span === R.cadrages.serre.span));
  }
  const r = composer(ctx(jst(2026, 11, 18, 13), jst(2026, 11, 18, 20), { objets: { trace } }));
  assert.ok(!r || !r.plans.some(p => p.type === 'objet'));
});
test('voyageur : un plan seulement s\'il est activé et arrivé pendant l\'absence', () => {
  const avec = composer(ctx(jst(2026, 11, 25, 9), jst(2026, 11, 25, 20), { voyageurArrivees: [jst(2026, 11, 25, 16 + 21 / 60)] }));
  assert.ok(avec.plans.some(p => p.type === 'voyageur'));
  const sans = composer(ctx(jst(2026, 11, 25, 9), jst(2026, 11, 25, 20)));
  assert.ok(!sans.plans.some(p => p.type === 'voyageur'));
});
test('changement de la gare et moments des habitués aux dates du calendrier ; kō en carton', () => {
  const c = recit.candidats(R, ctx(jst(2026, 11, 18, 20), jst(2026, 11, 20, 20)));
  assert.ok(c.some(p => p.type === 'gare' && p.sous === 'affiche-commune'));
  assert.ok(c.some(p => p.type === 'habitue' && p.sous === 'moment' && p.habitue === 'ecolier'));
  const k = recit.candidats(R, ctx(jst(2026, 11, 21, 20), jst(2026, 11, 22, 20)));
  assert.ok(k.some(p => p.type === 'ko' && p.ko === CIEL.seasonOf(2026, 11, 22).ko), 'kō du 22 novembre');
});
test('anti-répétition : note × 0,3 pour un type vu dans les trois derniers récits ; l\'habitué du récit précédent écarté', () => {
  const c = ctx(jst(2026, 11, 23, 6), jst(2026, 11, 23, 20));
  const base = recit.candidats(R, c), sans = composer(c);
  assert.ok(sans.plans.some(p => p.type === 'habitue' && p.habitue === 'ecolier'), 'le 23 novembre, l\'écolier est absent : plan d\'habitué');
  const avec = composer({ ...c, hist: [{ types: ['lumiere'], habitues: ['ecolier'] }] });
  assert.ok(!avec.plans.some(p => p.habitue === 'ecolier'), 'pas deux récits de suite');
  const x = recit.candidats(R, c).find(p => p.type === 'lumiere' && p.sous !== 'jour');
  const r2 = recit.composer(R, { ...c, hist: [{ types: ['lumiere'], habitues: [] }] }, [{ ...x }]);
  assert.ok(r2 && Math.abs(r2.plans[0].note - x.note * .3) < 1e-9);
  assert.ok(base.length > 0);
});
test('une absence calme donne un seul plan', () => {
  const lum = recit.candidats(R, ctx(jst(2026, 11, 17, 5), jst(2026, 11, 17, 17))).filter(p => p.type === 'lumiere');
  const r = recit.composer(R, ctx(jst(2026, 11, 17, 5), jst(2026, 11, 17, 17)), lum);
  assert.ok(r.calme && r.plans.length === 1);
});

/* critère de variété (partie 9) : 14 jours simulés, trois rythmes, aucun type au-delà de 40 % des plans montrés */
function simuler(visites) {
  const etat = Object.assign(O.etatVide(), { sel: 'essai' }), elev = ms => CIEL.sunAltAz(ms, STATION.lat, STATION.lon).elev;
  const hist = [], vus = {};
  let n = 0, precedente = visites[0], types = ['thermos', 'parapluie', 'lumiere'];
  for (const v of visites.slice(1)) {
    const evts = O.avancer(POSES, etat, v, MET, elev);
    const r = composer(ctx(precedente, v, { objets: { trace: evts.some(e => e.nom === 'resolu') ? etat.trace : null, retour: evts.find(e => e.nom === 'retour') || null }, hist }));
    if (r) { for (const p of r.plans) { vus[p.type] = (vus[p.type] || 0) + 1; n++; } hist.push(recit.memoire(r)); }
    if (!etat.pose) O.poser(etat, types[hist.length % 3], v);
    precedente = v;
  }
  return { n, vus };
}
test('variété sur 14 jours simulés, trois rythmes : aucun type de plan au-delà de 40 %', () => {
  const soirs = [], unSurDeux = [], cinqJours = [];
  for (let d = 16; d <= 30; d++) { soirs.push(jst(2026, 11, d, 20)); if (d % 2 === 0) unSurDeux.push(jst(2026, 11, d, 20)); if (d <= 19 || d >= 25) cinqJours.push(jst(2026, 11, d, 20)); }
  for (const [nom, v] of [['tous les soirs', soirs], ['un soir sur deux', unSurDeux], ['absence de 5 jours', cinqJours]]) {
    const { n, vus } = simuler(v);
    const pire = Object.entries(vus).sort((a, b) => b[1] - a[1])[0];
    console.log(`        ${nom} : ${n} plans, ${Object.entries(vus).map(([t, k]) => `${t} ${Math.round(100 * k / n)} %`).join(', ')}`);
    assert.ok(pire[1] / n <= .4, `${nom} : ${pire[0]} à ${Math.round(100 * pire[1] / n)} %`);
  }
});

lancer('Récit de l\'absence (lot E)');
