/* Tests du lot B : js/meteo.js, sans navigateur ni réseau. */
'use strict';
const fs = require('fs'), path = require('path');
const { assert, test, lancer } = require('./aide.js');
const M = require('../js/meteo.js');
const R = M.REGLES, H = 3600e3, MIN = 60e3;
const jst = (y, m, d, h = 0, mi = 0) => Date.UTC(y, m - 1, d, h, mi) - 9 * H;

/* série réelle capturée par le navigateur (point d'essai), prévisions comprises */
const REEL = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees', 'reel-2026-10-22.json'), 'utf8')).reponse;
const CAPTURE = Date.UTC(2026, 9, 21, 16, 18, 44);                      // 22 oct. 01:18 à Tokyo
const SIMULE = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees', 'simule-neige-3-jours.json'), 'utf8'));

function brut(h, i) { const o = { time: h.time[i] }; for (const v of M.VARIABLES) o[v] = h[v][i]; return o; }

/* ---------- Interprétation ---------- */
test('wmo : types de temps', () => {
  const c = (code, extra = {}) => M.wmo(Object.assign({ weather_code: code, cloud_cover: 0 }, extra));
  assert.equal(c(0), 'clear'); assert.equal(c(2), 'partly'); assert.equal(c(3), 'overcast');
  assert.equal(c(45), 'fog'); assert.equal(c(53), 'drizzle'); assert.equal(c(61, { precipitation: 1 }), 'rain');
  assert.equal(c(61, { precipitation: .2 }), 'drizzle'); assert.equal(c(65), 'heavyrain'); assert.equal(c(80, { precipitation: 5 }), 'heavyrain');
  assert.equal(c(71), 'snow'); assert.equal(c(71, { snowfall: 2 }), 'heavysnow'); assert.equal(c(75), 'heavysnow'); assert.equal(c(95), 'storm');
  assert.equal(c(1, { cloud_cover: 80 }), 'overcast'); assert.equal(c(1, { cloud_cover: 40 }), 'partly');
});

/* ---------- Lecture de la réponse ---------- */
test('lecture : toutes les mesures portent source "reelle" et l\'heure de réception', () => {
  const l = M.lire(REEL, CAPTURE);
  assert.ok(l.length > 100);
  for (const m of l) { assert.equal(m.source, 'reelle'); assert.equal(m.recu, CAPTURE); }
});
test('lecture : les heures qui n\'ont pas commencé (prévisions) sont écartées', () => {
  const l = M.lire(REEL, CAPTURE);
  const derniere = l.map(m => M.msDe(m.t)).sort((a, b) => b - a)[0];
  assert.ok(derniere <= CAPTURE, 'une mesure est postérieure à la réception');
  assert.equal(l.length, 8 * 24 - (23 - 1))                                  // 192 h − les heures 02:00 à 23:00 du 22 octobre
});
test('lecture : réponse illisible, vide ou en erreur lève une erreur nette', () => {
  for (const mauvais of [null, 'x', 42, {}, { error: true, reason: 'limite' }, { hourly: { time: [] } }, { hourly: { time: ['2026-10-22T00:00'] } }])
    assert.throws(() => M.lire(mauvais, CAPTURE), /illisible|sans données|exploitable/);
});
test('lecture : valeurs brutes et interprétation du jeu (trois heures récentes)', () => {
  const l = M.lire(REEL, CAPTURE), h = REEL.hourly;
  for (const i of [h.time.indexOf('2026-10-22T00:00'), h.time.indexOf('2026-10-21T21:00'), h.time.indexOf('2026-10-21T12:00')]) {
    const b = brut(h, i), m = l.filter(x => x.t === b.time && !x.instantane)[0];
    assert.ok(m, 'mesure absente pour ' + b.time);
    assert.equal(m.code, b.weather_code); assert.equal(m.temp, b.temperature_2m); assert.equal(m.wind, b.wind_speed_10m);
    assert.equal(m.snowDepth, b.snow_depth); assert.equal(m.kind, M.wmo(b));
  }
});

/* ---------- Magasin et sources ---------- */
test('le magasin refuse toute mesure simulée ou inconnue', () => {
  const mg = M.creerMagasin();
  assert.throws(() => mg.ajouter([M.simulee(null, { kind: 'rain' })]), /réelles/);
  assert.throws(() => mg.ajouter([M.inconnue()]), /réelles/);
  assert.equal(mg.nombre(), 0);
});
test('une mesure simulée porte "simulee", jamais "reelle", et ne contamine pas la mesure de base', () => {
  const base = M.lire(REEL, CAPTURE)[0];
  const s = M.simulee(base, { kind: 'heavysnow', sol: true, vent: .4 });
  assert.equal(s.source, 'simulee'); assert.equal(base.source, 'reelle');
  assert.equal(s.kind, 'heavysnow'); assert.equal(s.snowDepth, .12); assert.equal(s.wind, 18); assert.equal(s.temp, -3);
  assert.equal(M.jugeable(s), false); assert.equal(M.jugeable(base), true); assert.equal(M.jugeable(M.inconnue()), false);
});
test('simulée : sol seul sur météo réelle garde le temps réel ; temps simulé ignore la neige réelle', () => {
  const base = Object.assign({}, M.lire(REEL, CAPTURE).pop(), { snowDepth: .05, temp: 1, wind: 20, kind: 'rain' });
  const sol = M.simulee(base, { sol: true });
  assert.equal(sol.kind, 'rain'); assert.equal(sol.temp, 1); assert.equal(sol.snowDepth, .12);
  const clair = M.simulee(base, { kind: 'clear' });
  assert.equal(clair.snowDepth, 0); assert.equal(clair.temp, 12); assert.equal(clair.wind, null);
});
test('série simulée de test : source "simulee" sur chaque ligne', () => {
  assert.equal(SIMULE.source, 'simulee');
  assert.ok(SIMULE.mesures.length >= 72);
  for (const m of SIMULE.mesures) assert.equal(m.source, 'simulee');
  assert.throws(() => M.creerMagasin().ajouter(SIMULE.mesures), /réelles/);
});

/* ---------- Météo maintenant : 2 h, 24 h, 48 h ---------- */
function magasinReel() { const mg = M.creerMagasin(); mg.ajouter(M.lire(REEL, CAPTURE)); return mg; }
test('maintenant : donnée réelle fraîche → "reelle", pas "ancienne"', () => {
  const m = magasinReel().maintenant(CAPTURE + 5 * MIN, { echecs: 0 });
  assert.equal(m.source, 'reelle'); assert.equal(m.statut, 'reelle'); assert.equal(m.ancienne, false);
});
test('maintenant : après un échec, la donnée de moins de 2 h est gardée et marquée ancienne', () => {
  const m = magasinReel().maintenant(CAPTURE + 119 * MIN, { echecs: 3 });
  assert.equal(m.source, 'reelle'); assert.equal(m.ancienne, true); assert.equal(M.hhmm(m.recu), '01:18');
});
test('maintenant : au-delà de 2 h → météo indisponible, ciel couvert neutre, rien ne tombe', () => {
  const m = magasinReel().maintenant(CAPTURE + 121 * MIN, { echecs: 5 });
  assert.equal(m.source, 'inconnue'); assert.equal(m.statut, 'indisponible'); assert.equal(m.kind, 'overcast');
  assert.equal(m.precip, 0); assert.equal(m.snowfall, 0); assert.equal(M.pleut(m.kind) || M.neige(m.kind), false);
  assert.equal(m.temp, null); assert.equal(m.wind, null);
});
test('maintenant : la neige au sol reste 24 h après la dernière mesure, pas plus', () => {
  /* la série réelle de test n'a pas de neige au sol avant la capture : on en met 5 cm sur sa dernière heure */
  const mg = magasinReel();
  const derniere = M.lire(REEL, CAPTURE).filter(m => !m.instantane).pop();
  mg.ajouter([Object.assign({}, derniere, { snowDepth: .05, recu: CAPTURE + MIN })]);
  const a = mg.maintenant(CAPTURE + 23 * H, { echecs: 9 });
  assert.equal(a.source, 'inconnue'); assert.equal(a.neigeRetenue, true); assert.equal(a.snowDepth, .05);
  const b = mg.maintenant(CAPTURE + 24 * H + 2 * MIN, { echecs: 9 });
  assert.equal(b.neigeRetenue, false); assert.equal(b.snowDepth, 0);
});
test('maintenant : sans aucune donnée, "attente" avant la première réponse, "indisponible" après un échec', () => {
  const mg = M.creerMagasin();
  assert.equal(mg.maintenant(CAPTURE, { echecs: 0 }).statut, 'attente');
  assert.equal(mg.maintenant(CAPTURE, { echecs: 1 }).statut, 'indisponible');
  assert.equal(mg.maintenant(CAPTURE, { echecs: 1 }).kind, 'overcast');
});
test('heure précise inconnue : jamais d\'estimation, jamais de pluie supposée', () => {
  const mg = magasinReel();
  const h = mg.a(jst(2026, 10, 25, 12));                                    // dans le futur : pas de mesure
  assert.equal(h.source, 'inconnue'); assert.equal(h.precip, 0); assert.equal(M.jugeable(h), false);
  assert.equal(mg.a(jst(2026, 10, 20, 12)).source, 'reelle');
});
test('une condition météo inconnue attend une donnée réelle 48 h au plus', () => {
  const t = jst(2026, 11, 20, 8);
  assert.equal(M.attenteDonnee(t, t + 47 * H), 'attendre');
  assert.equal(M.attenteDonnee(t, t + 48 * H), 'abandonner');
});

/* ---------- Cache ---------- */
test('cache : aller-retour, rien de plus ancien que 10 jours, rien de simulé', () => {
  const mg = magasinReel();
  const ancien = Object.assign({}, M.lire(REEL, CAPTURE)[0], { t: '2026-09-01T00:00', recu: CAPTURE - 50 * 24 * H });
  mg.ajouter([ancien]);
  const txt = mg.serialiser(CAPTURE);
  const d = JSON.parse(txt);
  assert.ok(d.mesures.every(m => m.source === 'reelle'));
  assert.ok(!d.mesures.some(m => m.t === '2026-09-01T00:00'));
  const mg2 = M.creerMagasin(); const n = mg2.charger(txt, CAPTURE + H);
  assert.equal(n, d.mesures.length); assert.equal(mg2.a(jst(2026, 10, 20, 12)).source, 'reelle');
});
test('cache : une ligne simulée glissée dans le cache est refusée au chargement', () => {
  const sale = JSON.stringify({ v: 1, mesures: [Object.assign({}, M.lire(REEL, CAPTURE)[0], { source: 'simulee' })] });
  const mg = M.creerMagasin(); assert.equal(mg.charger(sale, CAPTURE), 0); assert.equal(mg.nombre(), 0);
  assert.equal(mg.charger('pas du json', CAPTURE), 0);
});

/* ---------- Point de vue ---------- */
test('point de vue : un instant et une météo ; simulé dès que l\'un des deux l\'est', () => {
  const reel = M.lire(REEL, CAPTURE)[0];
  assert.equal(M.pointDeVue({ simulated: false }, reel).simule, false);
  assert.equal(M.pointDeVue({ simulated: true }, reel).simule, true);
  assert.equal(M.pointDeVue({ simulated: false }, M.simulee(reel, { kind: 'rain' })).simule, true);
});

/* ---------- Lieu ---------- */
test('lieu : la gare est au point de la gare de Shirataki, et le jeu et les tests utilisent le même', () => {
  const ctx = {}; ctx.window = ctx; require('vm').runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'monde.js'), 'utf8'), ctx);
  const S = ctx.window.NAGORI.STATION;
  assert.equal(S.lat, 43.8842); assert.equal(S.lon, 143.1809);
  assert.match(M.adresse(S.lat, S.lon, 1), /latitude=43\.8842&longitude=143\.1809/);
});

/* ---------- Requête, panne, reprises ---------- */
test('requête : adresse, jours passés, délais de reprise', () => {
  const u = M.adresse(43.8842, 143.1809, 3);
  for (const v of M.VARIABLES) assert.ok(u.includes(v), v);
  assert.ok(u.includes('past_days=3') && u.includes('timezone=Asia%2FTokyo') && u.includes('latitude=43.8842'));
  const t = Date.UTC(2026, 10, 20);
  assert.equal(M.joursPasses(null, t), 1); assert.equal(M.joursPasses(t - 2 * H, t), 2);
  assert.equal(M.joursPasses(t - 3 * 24 * H, t), 4); assert.equal(M.joursPasses(t - 60 * 24 * H, t), 8);
  assert.deepEqual([0, 1, 2, 3, 4, 10].map(M.delaiMin), [15, 1, 5, 15, 15, 15]);
});

/* horloge et minuteurs factices */
function monde() {
  const w = { t: CAPTURE, file: [], id: 0, appels: [], erreursConsole: [] };
  w.maintenant = () => w.t;
  w.planifier = (fn, ms) => { const id = ++w.id; w.file.push({ id, at: w.t + ms, fn }); return id; };
  w.annuler = id => { w.file = w.file.filter(x => x.id !== id); };
  w.avancer = async ms => {
    const fin = w.t + ms;
    for (;;) {
      w.file.sort((a, b) => a.at - b.at); const p = w.file[0];
      if (!p || p.at > fin) break;
      w.file.shift(); w.t = Math.max(w.t, p.at); p.fn(); await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r));
    }
    w.t = fin;
  };
  return w;
}
const reponse = (status, corps) => ({ ok: status >= 200 && status < 300, status, json: async () => { if (corps === 'illisible') throw new SyntaxError('Unexpected token <'); return corps; } });

async function essai(scenario) {
  const w = monde(), mg = M.creerMagasin();
  const horaires = [];
  const c = M.creerClient({ magasin: mg, lat: 43.8842, lon: 143.1809, jours: 2, maintenant: w.maintenant, planifier: w.planifier, annuler: w.annuler,
    fetch: (u, o) => { horaires.push(Math.round((w.t - CAPTURE) / MIN)); return scenario(u, o, w); } });
  return { w, mg, c, horaires };
}

test('panne : les 5 formes de panne mènent à "indisponible", sans exception ni météo inventée', async () => {
  const pannes = {
    'erreur 500': () => Promise.resolve(reponse(500, {})),
    'erreur 429': () => Promise.resolve(reponse(429, { error: true, reason: 'limite' })),
    'réponse illisible': () => Promise.resolve(reponse(200, 'illisible')),
    'réponse sans données': () => Promise.resolve(reponse(200, { error: true, reason: 'x' })),
    'réseau coupé': () => Promise.reject(new TypeError('Failed to fetch')),
    'service bloqué (ne répond jamais)': (u, o) => new Promise((_, rej) => { if (o.signal) o.signal.addEventListener('abort', () => rej(new Error('aborted'))); })
  };
  for (const [nom, f] of Object.entries(pannes)) {
    const { w, mg, c } = await essai(f);
    const p = c.actualiser(); await w.avancer(9000); await p;     // 9 s : laisse jouer le délai de 8 s
    assert.equal(c.etat.echecs >= 1, true, nom);
    assert.equal(mg.nombre(), 0, nom);
    const m = mg.maintenant(w.t, c.etat);
    assert.equal(m.source, 'inconnue', nom); assert.equal(m.statut, 'indisponible', nom); assert.equal(m.kind, 'overcast', nom);
  }
});
test('panne : délai de 8 s par requête', async () => {
  const { w, c } = await essai((u, o) => new Promise((_, rej) => { if (o.signal) o.signal.addEventListener('abort', () => rej(new Error('aborted'))); }));
  const p = c.actualiser();
  await w.avancer(7900); assert.equal(c.etat.echecs, 0, 'trop tôt');
  await w.avancer(200); await p; assert.equal(c.etat.echecs, 1); assert.match(c.etat.erreur, /délai/);
});
test('panne : nouvelles tentatives à 1, 5 puis 15 min, ensuite toutes les 15 min', async () => {
  const { w, c, horaires } = await essai(() => Promise.resolve(reponse(500, {})));
  await c.actualiser();
  await w.avancer(70 * MIN);
  assert.deepEqual(horaires.slice(0, 6), [0, 1, 6, 21, 36, 51]);
});
test('panne puis retour : la série se remplit, les échecs retombent à zéro, rythme normal de 15 min', async () => {
  let ok = false;
  const { w, mg, c, horaires } = await essai(() => Promise.resolve(ok ? reponse(200, REEL) : reponse(503, {})));
  await c.actualiser(); await w.avancer(2 * MIN);                       // 0 min, 1 min : deux échecs
  assert.equal(c.etat.echecs, 2); assert.equal(mg.maintenant(w.t, c.etat).statut, 'indisponible');
  ok = true; await w.avancer(5 * MIN);                                  // tentative à 6 min
  assert.equal(c.etat.echecs, 0); assert.ok(mg.nombre() > 100);
  assert.equal(mg.maintenant(w.t, c.etat).source, 'reelle');
  await w.avancer(15 * MIN); assert.equal(horaires[horaires.length - 1], 21);
});
test('panne : une donnée réelle de moins de 2 h reste affichée pendant la panne, avec son heure', async () => {
  let ok = true;
  const { w, mg, c } = await essai(() => Promise.resolve(ok ? reponse(200, REEL) : reponse(500, {})));
  await c.actualiser(); ok = false; await w.avancer(16 * MIN);          // la requête suivante échoue
  assert.ok(c.etat.echecs >= 1);
  const m = mg.maintenant(w.t, c.etat);
  assert.equal(m.source, 'reelle'); assert.equal(m.ancienne, true); assert.equal(M.hhmm(m.recu), '01:18');
  await w.avancer(2 * H);
  assert.equal(mg.maintenant(w.t, c.etat).source, 'inconnue');
});
test('panne : aucune écriture dans la console, aucune exception qui s\'échappe', async () => {
  const avant = [console.error, console.warn]; const vus = [];
  console.error = (...a) => vus.push(a); console.warn = (...a) => vus.push(a);
  let rejets = 0; const h = () => rejets++; process.on('unhandledRejection', h);
  try {
    const { w, c } = await essai(() => Promise.reject(new Error('boum')));
    await c.actualiser(); await w.avancer(40 * MIN); await new Promise(r => setImmediate(r));
  } finally { [console.error, console.warn] = avant; process.off('unhandledRejection', h); }
  assert.deepEqual(vus, []); assert.equal(rejets, 0);
});

lancer('js/meteo.js');
