/* Tests de js/objets.js (tirage, garde-fous, résolution). node tests/objets.test.js */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { assert, test, lancer } = require('./aide.js');
const METEO = require('../js/meteo.js');
const O = require('../js/objets.js');
const POSES = require('../data/objets.js');
const H = 3600e3, DAY = 24 * H, JST = 9 * H;
const jst = (s) => Date.parse(s + '+09:00');

/* soleil de novembre à la gare : levé de 06:24 à 16:01 (heures de Tokyo) */
const elev = ms => { const h = ((ms + JST) % DAY) / H; return h >= 6.4 && h < 16.0 ? 10 : -10; };

/* météo de test : la série SIMULÉE lue comme si les mesures étaient réelles (le moteur ne regarde que la source) */
const SERIE = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees/simule-novembre-14-jours.json'), 'utf8')).mesures;
function meteoDe(mesures) {
  const m = new Map(mesures.map(x => [x.t, Object.assign({}, x, { source: 'reelle' })]));
  return { a: ms => m.get(METEO.cleHeure(ms)) || METEO.inconnue('heure-inconnue', {}) };
}
const MET = meteoDe(SERIE);
/* météo constante pour les 10 000 tirages */
const constante = (o) => ({ a: ms => Object.assign({ source: 'reelle', t: METEO.cleHeure(ms), kind: 'overcast', temp: 3, precip: 0, snowfall: 0, snowDepth: 0, isDay: ((ms + JST) % DAY) / H >= 6.4 && ((ms + JST) % DAY) / H < 16 }, o) });

const resoudre = (type, ms, sel, hist, met, maintenant) =>
  O.resoudre(POSES, { type, ms, sel }, hist || [], met || MET, maintenant == null ? ms + 3 * DAY : maintenant, elev);

test('graine : même pose, même graine ; autre sel ou autre minute, autre graine', () => {
  const p = { type: 'thermos', ms: jst('2026-11-17T20:15:00'), sel: 'abc' };
  assert.equal(O.graine(p), O.graine({ ...p }));
  assert.equal(O.graine(p), O.graine({ ...p, ms: p.ms + 20e3 }));            // même minute
  assert.notEqual(O.graine(p), O.graine({ ...p, sel: 'abd' }));
  assert.notEqual(O.graine(p), O.graine({ ...p, ms: p.ms + 60e3 }));
  assert.notEqual(O.graine(p), O.graine({ ...p, type: 'lumiere' }));
});

test('fonction pure : même résultat à chaque appel, et après un aller-retour JSON de l\'historique', () => {
  const pose = jst('2026-11-17T20:00:00');
  const hist = [{ id: 'inconnu', habitue: null, compte: false }, { id: 'ecolier', habitue: 'ecolier', compte: false }];
  const a = resoudre('thermos', pose, 'sel1', hist), b = resoudre('thermos', pose, 'sel1', JSON.parse(JSON.stringify(hist)));
  assert.deepEqual(a, b);
});

test('jours d\'école : lundi à vendredi, pas les week-ends ni les fériés', () => {
  assert.equal(O.jourDecole(POSES, jst('2026-11-17T12:00:00')), true);       // mardi
  assert.equal(O.jourDecole(POSES, jst('2026-11-21T12:00:00')), false);      // samedi
  assert.equal(O.jourDecole(POSES, jst('2026-11-22T12:00:00')), false);      // dimanche
  assert.equal(O.jourDecole(POSES, jst('2026-11-23T12:00:00')), false);      // férié
});

test('fenêtres : 24 h pour le thermos et le parapluie, la nuit suivante pour la lumière', () => {
  const t = jst('2026-11-17T20:00:00');
  assert.deepEqual(O.fenetre(POSES, 'thermos', t, elev), { debut: t, fin: t + DAY });
  assert.deepEqual(O.fenetre(POSES, 'parapluie', t, elev), { debut: t, fin: t + DAY });
  const avantCoucher = jst('2026-11-17T10:00:00'), f = O.fenetre(POSES, 'lumiere', avantCoucher, elev);
  assert.ok(f.debut >= jst('2026-11-17T16:00:00') && f.debut <= jst('2026-11-17T16:10:00'), 'commence au coucher');
  assert.ok(f.fin >= jst('2026-11-18T06:20:00') && f.fin <= jst('2026-11-18T06:30:00'), 'finit au lever');
  const dansLaNuit = O.fenetre(POSES, 'lumiere', jst('2026-11-18T02:00:00'), elev);
  assert.equal(dansLaNuit.debut, jst('2026-11-18T02:00:00'), 'posée en pleine nuit : la nuit en cours');
});

test('rien avant la fin de la fenêtre', () => {
  const t = jst('2026-11-17T20:00:00');
  assert.equal(resoudre('thermos', t, 's', [], MET, t + DAY - 1).statut, 'en-cours');
  assert.equal(resoudre('thermos', t, 's', [], MET, t + DAY).statut, 'resolu');
});

test('créneaux des habitués : l\'écolier ne passe pas un week-end', () => {
  const sam = { debut: jst('2026-11-21T08:00:00'), fin: jst('2026-11-22T08:00:00') };
  assert.equal(O.passages(POSES, 'ecolier', sam).length, 0, 'samedi 8 h → dimanche 8 h : ni le samedi ni le dimanche');
  const sem = { debut: jst('2026-11-17T08:00:00'), fin: jst('2026-11-18T08:00:00') };
  assert.equal(O.passages(POSES, 'ecolier', sem).length, 2, '16 h 20 mardi et 7 h 30 mercredi');
  assert.equal(O.passages(POSES, 'cheminot', sem).length, 1);
  assert.equal(O.passages(POSES, 'vieille', sem).length, 1);
});

test('météo inconnue : la conséquence attend, 48 h au plus, puis ne garde que ce qui n\'en dépend pas', () => {
  const t = jst('2026-12-20T20:00:00'), sans = meteoDe([]);                  // aucune mesure pour ces dates
  const fin = t + DAY;
  assert.equal(resoudre('parapluie', t, 's', [], sans, fin + 1).statut, 'attente');
  assert.equal(resoudre('parapluie', t, 's', [], sans, fin + 47 * H).statut, 'attente');
  const r = resoudre('parapluie', t, 's', [], sans, fin + 48 * H);
  assert.equal(r.statut, 'resolu');
  assert.equal(r.id, 'reste', 'sans donnée, le parapluie ne peut pas avoir été emprunté sous la pluie');
  const th = resoudre('thermos', t, 's', [], sans, fin + 48 * H);
  assert.ok(['ecolier', 'cheminot', 'vieille', 'refroidit', 'inconnu'].includes(th.id) && th.id !== 'chasseneige', 'pas de chasse-neige sans neige connue');
});

test('une mesure réelle arrivée pendant l\'attente décide', () => {
  const t = jst('2026-11-17T20:00:00');
  const pluvieux = meteoDe(SERIE.filter(x => x.t >= '2026-11-17T00:00'));
  const r = resoudre('parapluie', t, 's', [], pluvieux, t + DAY + 1);
  assert.equal(r.statut, 'resolu');
});

test('parapluie : emprunté seulement s\'il y a eu de la pluie ou de la neige réelle', () => {
  const sec = constante({ kind: 'clear' }), pluie = constante({ kind: 'rain', precip: 1 });
  const t = jst('2026-11-17T08:00:00');
  let emprunts = 0;
  for (let i = 0; i < 400; i++) { if (resoudre('parapluie', t + i * 60e3, 'x' + i, [], sec).emprunt) emprunts++; }
  assert.equal(emprunts, 0);
  for (let i = 0; i < 400; i++) { if (resoudre('parapluie', t + i * 60e3, 'x' + i, [], pluie).emprunt) emprunts++; }
  assert.ok(emprunts > 200, 'sous la pluie, il part souvent : ' + emprunts);
});

test('chasse-neige : seulement avec 1 cm de neige réelle tombée la nuit', () => {
  const t = jst('2026-11-17T08:00:00');
  const sans = constante({ snowfall: 0 }), avec = constante({ snowfall: .3, kind: 'snow' });
  let a = 0, b = 0;
  for (let i = 0; i < 3000; i++) {
    if (resoudre('thermos', t + i * 60e3, 'x' + i, [], sans).id === 'chasseneige') a++;
    if (resoudre('thermos', t + i * 60e3, 'x' + i, [], avec).id === 'chasseneige') b++;
  }
  assert.equal(a, 0);
  assert.ok(b > 0 && b < 3000 * .06, 'rare mais possible : ' + b + ' sur 3000');
});

test('lumière : chat sous 5 °C, givre sous −2 °C, jamais sinon', () => {
  const t = jst('2026-11-17T10:00:00'), ids = (met) => { const s = new Set(); for (let i = 0; i < 600; i++) s.add(resoudre('lumiere', t + i * 60e3, 'x' + i, [], met).id); return s; };
  const doux = ids(constante({ temp: 8 })), froid = ids(constante({ temp: 2 })), glace = ids(constante({ temp: -6 }));
  assert.ok(!doux.has('chat') && !doux.has('givre'));
  assert.ok(froid.has('chat') && !froid.has('givre'));
  assert.ok(glace.has('chat') && glace.has('givre'));
});

test('10 000 tirages par objet : garde-fous respectés', () => {
  const metes = [constante({ kind: 'clear', temp: 8 }), constante({ kind: 'rain', precip: 1, temp: 4 }), constante({ kind: 'snow', snowfall: .4, temp: -4, snowDepth: .1 })];
  for (const type of ['thermos', 'parapluie', 'lumiere']) {
    let hist = [], rienDeSuite = 0, memeDeSuite = 0, dernier = null, compte = {}, habitudes = {};
    for (let i = 0; i < 10000; i++) {
      const t = jst('2026-11-17T08:00:00') + i * 7 * 60e3;
      const met = metes[i % 3];
      const r = O.resoudre(POSES, { type, ms: t, sel: 'joueur' }, hist, met, t + 5 * DAY, elev);
      assert.equal(r.statut, 'resolu');
      compte[r.id] = (compte[r.id] || 0) + 1;
      rienDeSuite = r.compte ? rienDeSuite + 1 : 0;
      assert.ok(rienDeSuite <= POSES.gardeFous.rienMax, `${type} : trop de « rien » de suite au tirage ${i}`);
      memeDeSuite = r.id === dernier ? memeDeSuite + 1 : 1; dernier = r.id;
      // le parapluie au sec n'a qu'une issue possible : la règle ne peut pas s'y appliquer
      if (type !== 'parapluie' || metes[i % 3].a(t).kind !== 'clear') assert.ok(memeDeSuite <= POSES.gardeFous.memeMax, `${type} : ${r.id} trois fois de suite au tirage ${i}`);
      if (r.habitude) habitudes[r.habitue] = (habitudes[r.habitue] || 0) + 1;
      hist.push({ id: r.id, habitue: r.habitue, compte: r.compte });
      if (hist.length > 80) hist.shift();
    }
    for (const [h, n] of Object.entries(habitudes)) assert.ok(n <= 1 + 10000 / 80, `${type} : habitude de ${h} trop souvent (${n})`);
    assert.ok(Object.keys(compte).length >= 3, type + ' : variété ' + JSON.stringify(compte));
  }
});

test('habitude : la 3e fois qu\'un même habitué profite du même objet, une seule fois', () => {
  const t = jst('2026-11-17T08:00:00');
  let hist = [], vues = 0, rangs = [];
  for (let i = 0; i < 400 && vues < 3; i++) {
    const ms = t + i * 60e3;
    const r = O.resoudre(POSES, { type: 'lumiere', ms, sel: 'h' }, hist, constante({ temp: 1 }), ms + 3 * DAY, elev);
    const nChat = hist.filter(h => h.habitue === 'chat').length;
    if (r.habitude) { vues++; rangs.push(nChat + 1); }
    hist.push({ id: r.id, habitue: r.habitue, compte: r.compte });
  }
  assert.ok(rangs.length >= 1 && rangs.every(x => x === 3), 'le chat au 3e rang : ' + rangs);
  assert.equal(rangs.length, 1, 'une seule fois');
});

test('parapluie prêté : absent jusqu\'au retour, impossible à reposer, autre objet possible', () => {
  const etat = O.etatVide(); etat.sel = 's';
  const sur = constante({ kind: 'rain', precip: 1 });
  const t0 = jst('2026-11-17T08:00:00');
  let ms = t0, prete = false;
  for (let i = 0; i < 50 && !prete; i++) {
    ms = t0 + i * 3 * DAY;
    assert.equal(O.poser(etat, 'parapluie', ms).ok, true);
    O.avancer(POSES, etat, ms + 2 * DAY, sur, elev);
    prete = !!etat.parapluieRetour;
  }
  assert.ok(prete, 'finit par être emprunté');
  assert.equal(O.poser(etat, 'parapluie', ms + 2 * DAY).raison, 'absent');
  assert.equal(O.poser(etat, 'thermos', ms + 2 * DAY).ok, true, 'un autre objet reste posable');
  assert.equal(O.poser(etat, 'lumiere', ms + 2 * DAY).raison, 'deja-pose', 'un seul objet à la fois');
  O.reprendre(etat);
  const evts = O.avancer(POSES, etat, etat.parapluieRetour.ms + 1, sur, elev);
  assert.ok(evts.some(e => e.nom === 'retour'));
  assert.equal(etat.parapluieRetour, null);
  assert.equal(O.poser(etat, 'parapluie', etat.pose ? 0 : ms + 20 * DAY).ok, true, 'revenu : posable de nouveau');
});

test('retour du parapluie : répartition, traces, rare, toujours avant la fermeture', () => {
  const R = POSES.retour, n = 20000, jours = {}; let traces = 0, rares = 0;
  const limite = Date.parse(R.avant);
  for (let i = 0; i < n; i++) {
    const r = O.tirerRetour(POSES, O.aleatoire(i * 7919 + 1), jst('2026-11-17T12:00:00'));
    if (r.trace === 'ticket') { rares++; assert.ok(r.jours >= 10 && r.jours <= 20); continue; }
    jours[r.jours] = (jours[r.jours] || 0) + 1; if (r.trace) traces++;
    assert.ok(r.ms <= limite);
  }
  const normaux = n - rares;
  assert.ok(Math.abs(rares / n - .03) < .01, 'rare ≈ 3 % : ' + rares / n);
  assert.ok(Math.abs(traces / normaux - .35) < .02, 'trace ≈ 35 % : ' + traces / normaux);
  for (const [j, p] of R.jours) assert.ok(Math.abs(jours[j] / normaux - p / 100) < .02, `jour ${j} ≈ ${p} % : ${jours[j] / normaux}`);
  const tard = O.tirerRetour(POSES, () => .0, Date.parse('2027-03-10T12:00:00+09:00') );
  assert.ok(tard.ms <= limite, 'plafonné avant la dernière journée de service');
});

test('empreintes : nettes, estompées dès 1 cm, effacées dès 3 cm de neige réelle tombée depuis', () => {
  const t = jst('2026-11-17T05:00:00');
  const serie = (cm) => { const l = []; for (let h = 0; h < 12; h++) l.push({ source: 'simulee', t: METEO.cleHeure(t + h * H), kind: 'snow', snowDepth: .1, snowfall: h === 3 ? cm : 0, precip: 0, temp: -4, isDay: false }); return meteoDe(l); };
  assert.equal(O.empreinte(serie(0), t, t + 6 * H).etat, 'net');
  assert.equal(O.empreinte(serie(.9), t, t + 6 * H).etat, 'net');
  assert.equal(O.empreinte(serie(1), t, t + 6 * H).etat, 'estompe');
  assert.equal(O.empreinte(serie(2.9), t, t + 6 * H).etat, 'estompe');
  assert.equal(O.empreinte(serie(3), t, t + 6 * H).etat, 'efface');
  assert.equal(O.empreinte(serie(3), t, t + 2 * H).etat, 'net', 'la neige n\'est pas encore tombée');
  assert.equal(O.empreinte(meteoDe([]), t, t + 6 * H).etat, 'aucune', 'sans mesure, pas de neige supposée');
});

test('14 jours simulés : un objet par jour, la variété est là, sans « rien » de trop', () => {
  for (const type of ['thermos', 'lumiere', 'parapluie']) {
    const dist = new Set(); let rien = 0, total = 0;
    for (let s = 0; s < 30; s++) {
      const etat = O.etatVide(); etat.sel = 'joueur-' + s;
      const ids = [];
      for (let j = 0; j < 14; j++) {
        const t = jst('2026-11-16T20:00:00') + j * DAY;
        if (etat.pose) O.reprendre(etat);
        if (!O.poser(etat, type, t).ok) continue;
        O.avancer(POSES, etat, t + 2 * DAY, MET, elev);
        if (etat.trace) { ids.push(etat.trace.id); total++; }
      }
      if (ids.length >= 5) dist.add(new Set(ids).size);
    }
    const moyenne = [...dist].reduce((a, b) => a + b, 0) / dist.size;
    assert.ok(total > 0);
    console.log(`        ${type} : ${total} conséquences sur 30 joueurs, en moyenne ${moyenne.toFixed(1)} sortes différentes`);
    if (type !== 'parapluie') assert.ok(moyenne >= 3, type + ' : trop peu de variété (' + moyenne + ')');
  }
});

test('les deux joueurs n\'ont pas les mêmes résultats (sel différent)', () => {
  const t = jst('2026-11-17T20:00:00'); let diff = 0;
  for (let i = 0; i < 200; i++) if (resoudre('thermos', t, 'a' + i).id !== resoudre('thermos', t, 'b' + i).id) diff++;
  assert.ok(diff > 40, 'résultats différents : ' + diff + ' / 200');
});

lancer('objets.js');
