/* Nagori · le son
   Tout est fabriqué en code avec Web Audio : aucun fichier, aucune licence, aucun son généré par IA.
   Couches continues (rivière, pluie, vent, bourdonnement de la lampe) et événements (gouttes, insectes, oiseaux,
   passage à niveau, train, furin, gestes). Le jeu appelle NAGORI.son.update(état) et NAGORI.son.event(nom). */
(() => {
'use strict';
const N = window.NAGORI = window.NAGORI || {};
const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null, on = false, master, muffle, amb, fx, tickTimer = null, lastTick = 0;
const L = {};           // couches continues
const B = {};           // tampons de bruit
const st = { rain: 0, snow: 0, wind: .15, fog: 0, storm: 0, night: 0, sunE: 0, ko: 50, temp: 15, lampOn: false, furin: false,
             ground: false, bell: false, train: null };
let gust = 0, gustTarget = 0, bellNext = 0, bellSide = 0, clackNext = 0, clackPhase = 0;
let chorus = [];        // individus (insectes, grenouilles) de la saison en cours
let chorusKey = '';

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Bruits ---------- */
function noise(type, seconds = 6){
  const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++){
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++){
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w * .5;
      else if (type === 'pink'){
        b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
      } else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    }
  }
  return buf;
}
/* petit éclat de bruit qui décroît, pour gouttes, clics, balai */
function burst(ms, decay){
  const len = Math.floor(ctx.sampleRate * ms / 1000), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
  return buf;
}
function chain(src, ...nodes){ let n = src; for (const x of nodes){ n.connect(x); n = x; } return n; }
function loop(buf){ const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * buf.duration); return s; }
function filt(type, f, q = .7){ const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; }
function gain(v = 0){ const g = ctx.createGain(); g.gain.value = v; return g; }
function pan(p){ if (!ctx.createStereoPanner) return gain(1); const n = ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); return n; }
function to(param, v, tc = .8){ param.setTargetAtTime(v, ctx.currentTime, tc); }

/* ---------- Mise en place ---------- */
function build(){
  ctx = new AC();
  master = gain(0);
  muffle = filt('lowpass', 16000, .5);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
  chain(master, muffle, comp, ctx.destination);
  amb = gain(1); amb.connect(master);   // ambiance
  fx = gain(.9); fx.connect(master);    // événements
  B.white = noise('white'); B.pink = noise('pink'); B.brown = noise('brown');
  B.drop = burst(25, .004); B.click = burst(12, .002); B.brush = burst(260, .09);

  // rivière : grave et continue, avec un léger scintillement
  L.river = gain(.0); chain(loop(B.brown), filt('lowpass', 420), L.river, amb);
  L.sparkle = gain(.0); const sp = filt('bandpass', 2600, 2.5); chain(loop(B.pink), sp, L.sparkle, amb);
  const lfo = ctx.createOscillator(), lfoG = gain(500); lfo.frequency.value = .07; chain(lfo, lfoG, sp.frequency); lfo.start();

  // pluie : nappe, toit, et ruissellement grave
  L.rain = gain(0); chain(loop(B.pink), filt('highpass', 380), filt('lowpass', 7500), L.rain, amb);
  L.roof = gain(0); chain(loop(B.pink), filt('bandpass', 950, .9), L.roof, amb);
  L.gutter = gain(0); chain(loop(B.brown), filt('bandpass', 260, 1.2), L.gutter, amb);

  // vent : deux bandes dont la hauteur bouge avec les rafales
  L.windHi = gain(0); L.windHiF = filt('bandpass', 600, 1.1); chain(loop(B.white), L.windHiF, L.windHi, amb);
  L.windLo = gain(0); chain(loop(B.brown), filt('lowpass', 160), L.windLo, amb);

  // lampe du quai : bourdonnement du secteur (50 Hz à Hokkaidō, donc 100 Hz)
  L.hum = gain(0);
  for (const [f, v] of [[100, 1], [200, .45], [300, .2]]){ const o = ctx.createOscillator(); o.frequency.value = f; const g = gain(v); chain(o, g, L.hum); o.start(); }
  chain(L.hum, filt('lowpass', 900), pan(-.25), amb);

  // train : grondement
  L.rumble = gain(0); L.rumbleP = pan(0); chain(loop(B.brown), filt('lowpass', 190, .9), L.rumble, L.rumbleP, fx);
  L.motor = gain(0); L.motorF = filt('bandpass', 320, 3); chain(loop(B.pink), L.motorF, L.motor, L.rumbleP);

  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
}

/* ---------- Événements courts ---------- */
function play(buf, t, { f = 2000, q = 1, type = 'bandpass', v = .1, p = 0, rate = 1 } = {}){
  const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
  chain(s, filt(type, f, q), gain(v), pan(p), fx); s.start(t);
}
/* son d'une cloche ou d'un métal : partiels inharmoniques qui décroissent */
function bell(t, partials, { v = .1, p = 0, decay = .6, out = fx } = {}){
  const g = gain(0), pn = pan(p); chain(g, pn, out);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + decay * 3);
  for (const [f, a, dk] of partials){
    const o = ctx.createOscillator(), og = gain(a); o.frequency.value = f; chain(o, og, g);
    og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(.0001, t + decay * (dk || 1) * 3);
    o.start(t); o.stop(t + decay * 3.2);
  }
}
/* modulation d'amplitude : un étage dont le gain oscille entre 1-2·depth et 1, à placer après l'enveloppe */
function amStage(rate, depth, t, end){
  const g = gain(1 - depth), lfo = ctx.createOscillator(), lg = gain(depth);
  lfo.frequency.value = rate; chain(lfo, lg, g.gain); lfo.start(t); lfo.stop(end);
  return g;
}
/* une note sifflée avec glissé (oiseaux) */
function whistle(t, pts, { v = .05, p = 0, type = 'sine' } = {}){
  const o = ctx.createOscillator(), g = gain(0); o.type = type; chain(o, filt('lowpass', 6000), g, pan(p), amb);
  o.frequency.setValueAtTime(pts[0][1], t); g.gain.setValueAtTime(0, t);
  for (const [dt, f, a] of pts){ o.frequency.linearRampToValueAtTime(f, t + dt); g.gain.linearRampToValueAtTime(a * v, t + dt); }
  const end = t + pts[pts.length - 1][0]; g.gain.linearRampToValueAtTime(0, end + .05); o.start(t); o.stop(end + .1);
}
/* trille d'insecte : suite d'impulsions d'une même note */
function trill(t, f, pulses, on_, off, v, p){
  const o = ctx.createOscillator(), g = gain(0); o.frequency.value = f; chain(o, filt('bandpass', f, 6), g, pan(p), amb);
  let x = t;
  for (let i = 0; i < pulses; i++){ g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(v, x + on_ * .3); g.gain.linearRampToValueAtTime(0, x + on_); x += on_ + off; }
  o.start(t); o.stop(x + .05);
}

const SOUNDS = {
  drop(t, p){ play(B.drop, t, { f: rnd(1800, 5200), q: rnd(1, 4), v: rnd(.02, .07) * (.5 + st.rain * .5), p }); },
  roofdrip(t){ play(B.drop, t, { f: rnd(700, 1400), q: 6, v: rnd(.03, .06), p: rnd(-.6, -.2) }); },
  clack(t, v, p){
    play(B.click, t, { f: 1600, q: .8, type: 'lowpass', v: v * .5, p });
    const o = ctx.createOscillator(), g = gain(0); o.frequency.value = 72; chain(o, g, pan(p), fx);
    g.gain.setValueAtTime(v * .55, t); g.gain.exponentialRampToValueAtTime(.0001, t + .09); o.start(t); o.stop(t + .1);
  },
  /* sonnerie du passage à niveau : deux frappes alternées, timbre de cloche électrique */
  ding(t, side){ bell(t, [[side ? 742 : 702, 1], [side ? 1690 : 1598, .5, .6], [2790, .22, .4], [4130, .1, .3]], { v: .085, p: .55, decay: .16 }); },
  furin(t){ const b = rnd(2350, 2550); bell(t, [[b, 1], [b * 2.76, .45, .7], [b * 5.4, .2, .5], [b * 1.5, .15, .8]], { v: rnd(.03, .06), p: .3, decay: rnd(.5, .9) }); },
  horn(t, p){
    const g = gain(0), out = chain(g, filt('lowpass', 1800), pan(p), fx);
    for (const f of [311, 370]){ const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; chain(o, g); o.start(t); o.stop(t + 1.1); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .05); g.gain.setValueAtTime(.05, t + .85); g.gain.linearRampToValueAtTime(0, t + 1.05);
  },
  brake(t, p){
    for (const [f, a] of [[2080, 1], [3140, .5]]){
      const o = ctx.createOscillator(), g = gain(0), vib = ctx.createOscillator(), vg = gain(14);
      o.frequency.value = f; vib.frequency.value = 6.5; chain(vib, vg, o.frequency); chain(o, g, pan(p), fx);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.012 * a, t + .6); g.gain.linearRampToValueAtTime(.018 * a, t + 2); g.gain.linearRampToValueAtTime(0, t + 2.6);
      o.start(t); vib.start(t); o.stop(t + 2.7); vib.stop(t + 2.7);
    }
  },
  hiss(t, p){ const s = ctx.createBufferSource(); s.buffer = B.white; const g = gain(0); chain(s, filt('highpass', 2500), g, pan(p), fx);
    g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.4); s.start(t, rnd(0, 3)); s.stop(t + 1.5); },
  doors(t, p){ whistle(t, [[0, 988, 1], [.32, 988, 1], [.33, 784, 1], [.75, 784, .8]], { v: .035, p, type: 'triangle' }); },
  thunder(t){ const s = ctx.createBufferSource(); s.buffer = B.brown; const g = gain(0); chain(s, filt('lowpass', 140), g, fx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + rnd(2.5, 4)); s.start(t, rnd(0, 2)); s.stop(t + 4.2); },
  /* gestes */
  sweep(t){ for (let i = 0; i < 4; i++) play(B.brush, t + i * .3, { f: 1900, q: .5, type: 'lowpass', v: .05, p: -.1 + i * .08, rate: rnd(.8, 1) }); },
  water(t){ const s = ctx.createBufferSource(); s.buffer = B.pink; const g = gain(0); chain(s, filt('bandpass', 2400, .8), g, pan(.5), fx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .2); g.gain.linearRampToValueAtTime(0, t + 1.5); s.start(t, rnd(0, 3)); s.stop(t + 1.6);
    for (let i = 0; i < 10; i++) SOUNDS.drop(t + .3 + i * .12, .5); },
  feed(t){ for (let i = 0; i < 14; i++) play(B.click, t + i * .035 + rnd(0, .02), { f: rnd(2500, 4500), q: 3, v: .05, p: -.15 }); },
  lamp(t){ play(B.click, t, { f: 3000, q: 2, v: .12, p: -.25 }); play(B.click, t + .06, { f: 1800, q: 2, v: .06, p: -.25 }); },
  stamp(t){ play(B.click, t, { f: 400, q: .7, type: 'lowpass', v: .5 }); },
  page(t){ play(B.brush, t, { f: 5000, q: .5, v: .04, rate: 1.6 }); },
  purr(t){ const s = ctx.createBufferSource(); s.buffer = B.brown; const g = gain(0), am = amStage(24, .45, t, t + 2.3);
    chain(s, filt('lowpass', 300), g, am, pan(-.1), fx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .3); g.gain.linearRampToValueAtTime(0, t + 2.2);
    s.start(t); s.stop(t + 2.3); },
  gift(t){ bell(t, [[1318, 1], [1976, .4, .7]], { v: .05, decay: .8 }); bell(t + .18, [[1760, 1], [2637, .3, .7]], { v: .04, decay: .9 }); },
  tampon(t){ SOUNDS.stamp(t); }
};

/* ---------- Faune : qui chante, selon le kō, l'heure et la vraie température ---------- */
/* index des kō (0 = 立春 初候). Les plages suivent le calendrier et le climat de Hokkaidō, en gros. */
function fauna(){
  const k = st.ko, nightish = st.night > .55, dusk = st.sunE > -.25 && st.sunE < .15, day = st.sunE > .1, T = st.temp;
  const wet = st.rain > .1, quietRain = st.rain > .7 ? .35 : 1, cold = T < 4;
  const out = [];
  if (k >= 39 && k <= 53 && (nightish || dusk) && T >= 8) out.push(['korogi', clamp((T - 8) / 10, .2, 1) * quietRain]);
  if (k >= 39 && k <= 50 && nightish && T >= 14) out.push(['suzumushi', clamp((T - 14) / 8, .2, 1) * quietRain]);
  if (k >= 18 && k <= 41 && (nightish || dusk) && T >= 11) out.push(['kaeru', (wet ? 1 : .6) * clamp((T - 11) / 8, .3, 1)]);
  if (k >= 31 && k <= 41 && day && T >= 22 && !wet) out.push(['semi', clamp((T - 22) / 6, .3, 1)]);
  if (k >= 36 && k <= 44 && dusk && !wet) out.push(['higurashi', 1]);
  if (k >= 1 && k <= 26 && day && !st.storm) out.push(['uguisu', wet ? .3 : 1]);
  if ((k >= 48 || k <= 6) && nightish && !wet) out.push(['fukuro', cold ? 1 : .7]);
  if ((k >= 55 || k <= 3) && day) out.push(['karasu', .8]);
  return out;
}
function rebuildChorus(list){
  chorus = [];
  for (const [kind, lvl] of list){
    const n = { korogi: 5, suzumushi: 3, kaeru: 6, semi: 2, higurashi: 2, uguisu: 1, fukuro: 1, karasu: 2 }[kind];
    for (let i = 0; i < n; i++) chorus.push({ kind, lvl, p: rnd(-.85, .85), f: rnd(.94, 1.06), next: ctx.currentTime + rnd(0, 4), v: rnd(.5, 1) });
  }
}
function sing(c, t){
  const v = c.v * c.lvl, p = c.p;
  switch (c.kind){
    case 'korogi': { // エンマコオロギ : « korori-ri », trilles courtes
      trill(t, 4300 * c.f, 3 + (Math.random() * 3 | 0), .028, .02, .014 * v, p);
      return rnd(.6, 1.6); }
    case 'suzumushi': { // スズムシ : « riiin », note tenue qui vibre
      const o = ctx.createOscillator(), g = gain(0), am = amStage(42, .45, t, t + .6);
      o.frequency.value = 4550 * c.f;
      chain(o, filt('bandpass', 4550 * c.f, 8), g, am, pan(p), amb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.014 * v, t + .05); g.gain.setValueAtTime(.014 * v, t + .4); g.gain.linearRampToValueAtTime(0, t + .55);
      o.start(t); o.stop(t + .6);
      return rnd(.9, 2.2); }
    case 'kaeru': { // grenouille : « kero kero »
      const reps = 2 + (Math.random() * 4 | 0);
      for (let i = 0; i < reps; i++){
        const o = ctx.createOscillator(), g = gain(0), x = t + i * .19; o.type = 'square'; o.frequency.value = 360 * c.f;
        chain(o, filt('bandpass', 720 * c.f, 5), g, pan(p), amb);
        g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(.05 * v, x + .012); g.gain.exponentialRampToValueAtTime(.0005, x + .07);
        o.start(x); o.stop(x + .08);
      }
      return rnd(1.2, 4); }
    case 'semi': { // cigale : « miin miin »
      const s = ctx.createBufferSource(); s.buffer = B.white; const g = gain(0); chain(s, filt('bandpass', 5200 * c.f, 5), g, pan(p), amb);
      let x = t; g.gain.setValueAtTime(0, x);
      for (let i = 0; i < 6; i++){ g.gain.linearRampToValueAtTime(.05 * v, x + .15); g.gain.linearRampToValueAtTime(.012 * v, x + .45); x += .5; }
      g.gain.linearRampToValueAtTime(0, x + .2); s.start(t, rnd(0, 3)); s.stop(x + .3);
      return rnd(4, 9); }
    case 'higurashi': { // ヒグラシ : « kana kana kana », qui descend
      let x = t;
      for (let i = 0; i < 14; i++){ trill(x, (4700 - i * 45) * c.f, 4, .02, .012, .018 * v * (1 - i / 18), p); x += .16; }
      return rnd(6, 14); }
    case 'uguisu': { // ウグイス : « hōōō… hokekyo »
      whistle(t, [[0, 1100, 0], [.08, 1150, .9], [1.1, 1180, .8], [1.25, 0 + 1180, 0]], { v: .05 * v, p });
      whistle(t + 1.4, [[0, 2200, 0], [.05, 2500, 1], [.15, 1900, .8], [.25, 2600, 1], [.4, 2300, .9], [.6, 2400, 0]], { v: .045 * v, p });
      return rnd(12, 30); }
    case 'fukuro': { // フクロウ : « hō, hō-hō »
      for (const [dt, len] of [[0, .45], [.9, .25], [1.25, .5]]) whistle(t + dt, [[0, 390, 0], [.06, 400, 1], [len, 360, 0]], { v: .05 * v, p });
      return rnd(25, 60); }
    case 'karasu': { // corbeau : « kaa »
      const reps = 1 + (Math.random() * 3 | 0);
      for (let i = 0; i < reps; i++){
        const o = ctx.createOscillator(), g = gain(0), x = t + i * .5; o.type = 'sawtooth'; o.frequency.setValueAtTime(560, x); o.frequency.linearRampToValueAtTime(470, x + .32);
        chain(o, filt('bandpass', 1300, 2), g, pan(p), amb);
        g.gain.setValueAtTime(0, x); g.gain.linearRampToValueAtTime(.028 * v, x + .04); g.gain.linearRampToValueAtTime(0, x + .34);
        o.start(x); o.stop(x + .36);
      }
      return rnd(15, 45); }
  }
  return 5;
}

/* ---------- Horloge : planifie les événements un peu à l'avance ---------- */
function tick(){
  if (!on || !ctx) return;
  const now = ctx.currentTime, horizon = now + .25, dt = Math.min(.5, now - (lastTick || now)); lastTick = now;
  // rafales de vent
  if (Math.random() < .02) gustTarget = Math.random();
  gust += (gustTarget - gust) * .03;
  // gouttes de pluie
  if (st.rain > .02){ const n = st.rain * 60 * dt; for (let i = 0; i < n || Math.random() < n - i; i++){ SOUNDS.drop(now + Math.random() * .2, rnd(-1, 1)); if (i > 40) break; } }
  if (st.rain > .2 && Math.random() < st.rain * dt * 1.5) SOUNDS.roofdrip(now + rnd(0, .2));
  // furin
  if (st.furin && Math.random() < (.03 + st.wind * .5 + gust * st.wind * .6) * dt) SOUNDS.furin(now + rnd(0, .2));
  // passage à niveau
  if (st.bell){ if (bellNext < now) bellNext = now + .05; while (bellNext < horizon){ SOUNDS.ding(bellNext, bellSide); bellSide ^= 1; bellNext += .42; } }
  else bellNext = 0;
  // roues du train sur les joints de rail : « ta-tan … ta-tan »
  const tr = st.train;
  if (tr && tr.speed > .8){
    const near = clamp(1 - tr.dist / 1500, 0, 1), v = .1 + .55 * near * near;
    if (clackNext < now) clackNext = now + .05;
    while (clackNext < horizon){
      SOUNDS.clack(clackNext, v, tr.pan);
      clackPhase = (clackPhase + 1) % 4;
      const m = [2.1, 12, 2.1, 7.8][clackPhase];     // écarts en mètres entre roues et bogies
      clackNext += m / tr.speed;
    }
  } else clackNext = 0;
  // faune
  const list = fauna(), key = list.map(x => x[0]).join(',');
  if (key !== chorusKey){ chorusKey = key; rebuildChorus(list); }
  else for (const c of chorus){ const l = list.find(x => x[0] === c.kind); if (l) c.lvl = l[1]; }
  for (const c of chorus) if (c.next < horizon){ const t = Math.max(now, c.next); c.next = t + sing(c, t); }
}

/* ---------- Niveaux continus ---------- */
function mix(){
  if (!ctx) return;
  const r = st.rain, w = st.wind, snowing = st.snow > .2, hush = snowing || st.ground;
  to(L.river.gain, (hush ? .05 : .085) * (1 - r * .3));
  to(L.sparkle.gain, hush ? .002 : .007);
  to(L.rain.gain, Math.min(.26, r * .17));
  to(L.roof.gain, Math.min(.1, r * .06));
  to(L.gutter.gain, r > .3 ? Math.min(.12, (r - .3) * .1) : 0, 2);
  const g = clamp(w * (.55 + gust * .8) + st.storm * .3, 0, 1.2);
  to(L.windHi.gain, g * g * .12, .5); to(L.windHiF.frequency, 380 + gust * 700 + w * 300, .7);
  to(L.windLo.gain, g * .2, .6);
  to(L.hum.gain, st.lampOn ? .0045 : 0, .1);
  to(muffle.frequency, hush ? 4200 : st.fog > .6 ? 9000 : 16000, 2);
  const tr = st.train;
  if (tr){
    const near = clamp(1 - tr.dist / 1600, 0, 1), sp = clamp(tr.speed / 22, 0, 1);
    to(L.rumble.gain, near * near * (.08 + .5 * sp), .15);
    to(L.motor.gain, near * near * .03 * (.3 + sp), .15); to(L.motorF.frequency, 180 + sp * 420, .3);
    if (L.rumbleP.pan) to(L.rumbleP.pan, tr.pan, .1);
  } else { to(L.rumble.gain, 0, .4); to(L.motor.gain, 0, .4); }
}

/* ---------- API ---------- */
let lastUpdate = 0;
/* appelé à chaque image : les niveaux sont réglés au plus dix fois par seconde */
function update(s){ Object.assign(st, s); if (on && performance.now() - lastUpdate > 100){ lastUpdate = performance.now(); mix(); tick(); } }
function event(name, opts = {}){
  if (!on || !ctx || !SOUNDS[name]) return;
  SOUNDS[name](ctx.currentTime + (opts.delay || 0) + .02, opts.pan || 0);
}
async function enable(){
  if (!AC) return false;
  if (!ctx) build();
  if (ctx.state !== 'running') await ctx.resume();
  on = true; mix();
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, .8);
  if (!tickTimer) tickTimer = setInterval(tick, 100);
  return true;
}
function disable(){
  if (!ctx) return;
  on = false; master.gain.setTargetAtTime(0, ctx.currentTime, .25);
  clearInterval(tickTimer); tickTimer = null;
  setTimeout(() => { if (!on && ctx) ctx.suspend(); }, 1200);
}
/* le récit de l'absence : l'ambiance de chaque plan à volume réduit (k de 0 à 1) ; rien si le son est coupé */
function attenuer(k){ if (!ctx || !amb) return; amb.gain.setTargetAtTime(k, ctx.currentTime, .4); }
N.son = { enable, disable, update, event, attenuer, get on(){ return on; }, supported: !!AC,
  /* outil de test : rend quelques secondes hors ligne pour mesurer les niveaux */
  _sounds: SOUNDS, _state: st, _tick: tick, _mix: mix, get _ctx(){ return ctx; } };
})();
