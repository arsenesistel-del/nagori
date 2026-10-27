(() => {
'use strict';
const $ = s => document.querySelector(s);

/* ---------- Données (fichiers data/) ---------- */
const N = window.NAGORI, T = N.TEXTES, CIEL = N.ciel;
const son = N.son || { event(){}, update(){}, enable(){ return false; }, disable(){}, on:false, supported:false };
const STATION = N.STATION, TRAINS = N.TRAINS;
const SEKKI = N.SEKKI, KO = N.KO;
const GIFTS = N.OMIYAGE.map(o => o.nom), ITEMS = N.OBJETS.map(o => o.nom);
const MOMENTS = N.MOMENTS.map(m => ({ id: m.id, name: m.nom, rar: m.rar }));
const RANK = {'Peu commun':1,'Rare':2,'Légendaire':3};
const WX_LABEL = T.meteo;
const OBJ = N.objets, POSES = N.POSES;   /* js/objets.js, data/objets.js : les trois objets à laisser */
const MET = N.meteo;                 /* js/meteo.js : sources de la météo, panne, point de vue */
/* lots F, G, H (cahier des charges, docs/cahier-lots-F-G-H.md) : js/vie.js, data/monde.js (NUIT), data/fermeture.js, data/craie.js,
   data/habitues.js. Ce qui n'est pas dans le cahier (première version de la session 3) reste derrière la case « provisoire »
   de l'Atelier : visible seulement avec ?atelier. */
const VIE = N.vie, HAB = N.HABITUES, NUIT = N.NUIT, FERM = N.FERMETURE, CRAIE = N.CRAIE, RG = HAB.regles, MOM = HAB.moments;
const TF = T.fermeture, TH = T.habitues, TN = T.nuit, TP = T.provisoire;
const AVEC_ATELIER = new URLSearchParams(location.search).has('atelier');
let provOn = AVEC_ATELIER;
const prov = () => provOn;
/* remplace {mot} par sa valeur */
const tx = (str, vars = {}) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
const koName = k => `${KO[k][0]} (${KO[k][2]})`;
const WX_PARAMS = {
 clear:{cloud:.05,rain:0,snow:0,fog:0,storm:0}, partly:{cloud:.45,rain:0,snow:0,fog:0,storm:0},
 overcast:{cloud:.9,rain:0,snow:0,fog:.1,storm:0}, drizzle:{cloud:.92,rain:.35,snow:0,fog:.25,storm:0},
 rain:{cloud:.95,rain:1,snow:0,fog:.15,storm:0}, heavyrain:{cloud:1,rain:1.5,snow:0,fog:.2,storm:0},
 snow:{cloud:.85,rain:0,snow:1,fog:.2,storm:0}, heavysnow:{cloud:.95,rain:0,snow:1.6,fog:.4,storm:0},
 fog:{cloud:.6,rain:0,snow:0,fog:1,storm:0}, storm:{cloud:1,rain:1.4,snow:0,fog:.1,storm:1}
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Sauvegarde locale ---------- */
const KEY = 'nagori-maquette-v2';
/* version : 3 depuis le prototype de 14 jours. Les champs ajoutés viennent ici, avec leur valeur par défaut :
   l'ancienne sauvegarde est fusionnée par-dessus au chargement, sans migration. */
const nouveauSel = () => { try { return Array.from(crypto.getRandomValues(new Uint32Array(2))).map(n => n.toString(36)).join(''); } catch (e) { return Math.random().toString(36).slice(2) + Date.now().toString(36); } };
const fresh = () => ({ version:3, growth:0, watered:null, swept:null, fed:null, fedHour:0, lamp:null, stamps:[], moments:[], gifts:{}, arrived:{}, found:[], lastVisit:null, preview:false, objets:Object.assign(OBJ.etatVide(), { sel: nouveauSel() }) });
let save = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) save = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };

/* ---------- Test de six semaines : compteur de visites ----------
   Chaque testeur reçoit un lien personnel (?t=prenom), mémorisé dans son navigateur.
   GoatCounter (gratuit, sans cookie) note une visite sur le chemin /t/prenom.
   Rien n'est compté tant que COUNTER est vide, ni avec ?atelier (visites d'Arsène). */
const COUNTER = '';
(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('atelier')) return;
  let who = (q.get('t') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  try { if (who) localStorage.setItem('nagori-testeur', who); else who = localStorage.getItem('nagori-testeur') || ''; } catch (e) {}
  if (!COUNTER) return;
  window.goatcounter = { path: who ? `/t/${who}` : '/sans-lien' };
  const s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.dataset.goatcounter = `https://${COUNTER}.goatcounter.com/count`;
  document.head.appendChild(s);
})();

/* ---------- Temps ---------- */
const fmt = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function tokyoAt(ms){ const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x=>[x.type,x.value])); return {y:+p.year,m:+p.month,d:+p.day,h:+p.hour + (+p.minute)/60 + (+p.second)/3600}; }
const sim = { hour:null, date:null, weather:'auto', fast:false, ground:false, wind:null };
function worldTime(){
  const n = tokyoAt(Date.now());
  const dt = sim.date || n;
  return { y:dt.y, m:dt.m, d:dt.d, hour: sim.hour != null ? sim.hour : n.h, simulated: sim.hour!=null || !!sim.date };
}
const dayKey = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
function addDays(y,m,d,n){ const t = new Date(Date.UTC(y,m-1,d+n)); return {y:t.getUTCFullYear(), m:t.getUTCMonth()+1, d:t.getUTCDate()}; }
const idx = (y,m,d,h) => Date.UTC(y,m-1,d)/6e4 + h*60;
const jstMs = (y,m,d,h) => Date.UTC(y,m-1,d) + (h-9)*3600e3;
const SEASONS = {};
function seasonOf(y,m,d){ const k = dayKey(y,m,d); return SEASONS[k] || (SEASONS[k] = CIEL.seasonOf(y,m,d)); }
function travelerOf(s){ const V = N.VOYAGEUR, a = addDays(s.start.y, s.start.m, s.start.d, V.jour); return { key:s.key, day:a, h: V.h + V.m/60, at: idx(a.y,a.m,a.d,V.h+(V.m+1)/60) }; }
/* soleil réel à la gare : e va de -1 (nuit noire, soleil à -18°) à 1 (soleil au zénith) ; t = position dans le ciel, est à gauche */
function sunState(w){
  const { elev, az } = CIEL.sunAltAz(jstMs(w.y,w.m,w.d,w.hour), STATION.lat, STATION.lon);
  const e = elev >= 0 ? Math.sin(elev*Math.PI/180) : Math.max(-1, elev/18);
  return { e, elev, az, t: elev > -1 ? clamp((az-90)/180, 0, 1) : null, morning: az < 180 };
}
function moonPhase(y,m,d,h){ return CIEL.moonPhase(jstMs(y,m,d,h)); }
function hhmm(h){ const t = Math.floor(((h%24)+24)%24*60); return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0'); }
const frDate = (y,m,d,opts={day:'numeric',month:'long'}) => new Date(Date.UTC(y,m-1,d)).toLocaleDateString('fr-FR',{...opts,timeZone:'UTC'});

/* ---------- Hasard reproductible ---------- */
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1|seed); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }; }
function hash(str){ let h = 2166136261; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const PLANS = {};
function dayPlan(y,m,d){
  const k = dayKey(y,m,d); if (PLANS[k]) return PLANS[k];
  const r = rng(hash(k));
  const cat = [{from:1+r()*3, len:2, spot:'roof'}, {from:8.6+r()*1.6, len:1.6, spot:'bench'}, {from:19+r()*2.5, len:1.8, spot:'roof'}].map(c=>({from:c.from, to:c.from+c.len, spot:c.spot}));
  const item = r() < .3 ? { h: 8+r()*11, idx: Math.floor(r()*ITEMS.length), key:k } : null;
  return PLANS[k] = { cat, item };
}

/* ---------- Habitués : position en fonction de l'heure ---------- */
const lerp = (a,b,t) => a+(b-a)*t;
/* jour d'école : du lundi au vendredi, sauf jours fériés japonais (data/objets.js, les mêmes que pour les objets) */
const jourDecole = (y,m,d) => OBJ.jourDecole(POSES, jstMs(y,m,d,12));
/* les habitués à l'heure h. F : état de la fermeture (moments du jour) ; nuit : événements de la nuit (cheminot sur le quai). */
function habitues(w, F, nuit){
  const out = [], h = w.hour, school = jourDecole(w.y,w.m,w.d), moment = id => F.aujourdhui.includes('moment-' + id);
  /* provisoire, hors cahier : traits selon la météo dessinée */
  const p = prov(), m = vue.meteo, pluie = p && VIE.parapluie(RG, m), bonnet = p && VIE.bonnet(RG, m);
  if (school){
    if (moment('ecolier') && h >= MOM.ecolier.de && h < MOM.ecolier.a){
      /* son moment (vendredi 20 novembre) : il s'arrête devant l'avis officiel avant son train */
      const M = MOM.ecolier, AV = 535;
      if (h < M.de + .06){ const t = (h - M.de)/.06; out.push({kind:'kid', x:lerp(1260,AV,t), walk:true, moment:true, umbrella:pluie, hat:bonnet}); }
      else if (h < M.avis) out.push({kind:'kid', x:AV, walk:false, face:1, moment:true, umbrella:pluie, hat:bonnet});
      else { const t = clamp((h - M.avis)/(M.a - .01 - M.avis), 0, 1); out.push({kind:'kid', x:lerp(AV,940,t), walk:t<1, moment:true, umbrella:pluie, hat:bonnet}); }
    }
    else if (h >= 7.5 && h < 7.8){ const t = clamp((h-7.5)/0.06,0,1); out.push({kind:'kid', x:lerp(1260,940,t), walk:t<1, sit:false, umbrella:pluie, hat:bonnet}); }
    if (h >= 16.36 && h < 16.46){ const t = (h-16.36)/0.1; out.push({kind:'kid', x:lerp(900,1280,t), walk:true, sit:false, face:1, umbrella:pluie, hat:bonnet}); }
  }
  if (!p || VIE.vieilleVient(RG, m)){
    /* toujours au même bout du banc ; son moment (mardi 24 novembre) : elle reste après le départ du train de 13 h 30 */
    const mo = moment('vieille'), part = mo ? MOM.vieille.reste : 13.6, fin = mo ? MOM.vieille.a : 13.68;
    if (h >= 13 && h < part){ const t = clamp((h-13)/0.06,0,1); out.push({kind:'lady', x:lerp(520,792,t), walk:t<1, sit:t>=1, moment:mo && h >= 13.6, umbrella:pluie && t<1}); }
    else if (h >= part && h < fin){ const t = (h-part)/(fin-part); out.push({kind:'lady', x:lerp(792,500,t), walk:true, sit:false, fade: t > .6 ? 1-(t-.6)/.4 : 1, moment:mo, umbrella:pluie}); }
  }
  /* le cheminot dégage la neige du quai à la lanterne, vers 5 h, après une nuit de neige (data/monde.js) */
  if (nuit.quai){ const k = nuit.quai.k; out.push({kind:'worker', quai:true, x:lerp(1190, 250, k), walk:false, shovel:true, lantern:true, face:0}); }
  const C = MOM.cheminot;
  if (moment('cheminot') && h >= C.de && h < C.a){
    /* son moment (jeudi 26 novembre) : l'inventaire, des étiquettes numérotées sur le banc, le poêle et l'horloge */
    let x, walk = true, quai = h >= C.banc - .02;
    if (h < C.banc) x = lerp(1500, 800, (h - C.de)/(C.banc - C.de));
    else if (h < C.gare - .04){ x = 800; walk = false; }
    else if (h < C.gare) x = lerp(800, 480, (h - (C.gare - .04))/.04);
    else if (h < C.a - .18){ x = 480; walk = false; }
    else x = lerp(480, 100, (h - (C.a - .18))/.18);
    out.push({kind:'worker', x, walk, quai, clipboard:true, moment:true});
  }
  else for (const [a,b] of [[10.4,10.9],[21.4,21.9]]) if (h >= a && h < b){ out.push({kind:'worker', x:lerp(1500,100,(h-a)/(b-a)), walk:true, lantern: a > 20}); }
  return out;
}
function catSpot(w){
  const today = dayKey(w.y,w.m,w.d);
  if (save.fed === today && w.hour >= save.fedHour && w.hour < save.fedHour + 0.75) return 'bowl';
  for (const c of dayPlan(w.y,w.m,w.d).cat) if (w.hour >= c.from && w.hour < c.to) return prov() && VIE.chatAbrite(RG, vue.meteo) ? 'salle' : c.spot;
  return null;
}
/* salle : sur le rebord de la fenêtre de gauche, près du poêle (trait provisoire) */
const CAT_POS = { roof:[470,540], bench:[812,662], bowl:[668,682], salle:[402,630] };

/* ---------- Couleurs ---------- */
const mix = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const rgb = (c,a=1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const SKY = [
 [-1,[6,10,26],[18,24,48]], [-.45,[10,16,44],[34,34,70]], [-.15,[30,36,80],[94,64,98]],
 [0,[58,74,132],[226,140,96]], [.12,[104,146,200],[242,196,142]], [.35,[92,148,208],[200,224,238]], [1,[74,138,206],[214,232,243]]
];
function skyAt(e){
  for (let i=0;i<SKY.length-1;i++){ const a=SKY[i], b=SKY[i+1]; if (e<=b[0]) { const t=(e-a[0])/(b[0]-a[0]); return [mix(a[1],b[1],t), mix(a[2],b[2],t)]; } }
  return [SKY[SKY.length-1][1], SKY[SKY.length-1][2]];
}
const FOLIAGE = [[96,124,78],[46,98,58],[170,86,44],[90,98,106]];
const TREES = [[62,92,64],[38,78,48],[124,70,42],[70,78,88]];
const GRASS = [[90,116,72],[62,104,60],[124,104,62],[96,98,92]];
const DEBRIS = [[236,182,196],[78,112,62],[188,92,44],[230,234,240]];

/* ---------- Canvas et cadrage ----------
   Le décor vit dans un repère fixe de 1600 × 900. Le cadrage choisit l'échelle et le centre selon l'écran :
   en paysage on voit toute la gare ; en portrait on cadre le bâtiment, la lampe et le banc, et on glisse pour regarder ailleurs.
   Repères principaux (x) : boîte aux lettres 300, gare 360-610, distributeur 620-654, lampe 694, banc 740-830,
   panneau 860-1010, fin du quai 1200, passage à niveau 1340. Quai : dessus 668, face jusqu'à 716. Jardin au premier plan 560-740. */
const cv = $('#scene'), ctx = cv.getContext('2d');
let W=0,H=0,DPR=1, S=1, OX=0, OY=0, uiTop=0;
const VW=1600, VH=900;
const cam = { pan:0, vel:0, drag:null, justDragged:false };
function layoutCam(){
  const portrait = W < H*0.9;
  const span = portrait ? 520 : 1100, cx = portrait ? 592 : 760;
  S = Math.min(W/span, Math.max(140, uiTop - 12) / (portrait ? 400 : 460));
  const minX = -150, maxX = 1750, half = W/2/S;
  let c = cx + cam.pan;
  if (maxX - minX > 2*half) c = clamp(c, minX + half, maxX - half); else c = (minX + maxX)/2;
  cam.pan = c - cx;
  OX = W/2 - c*S;
  OY = (uiTop - 10) - 772*S;
}
function resize(){
  DPR = Math.min(2, window.devicePixelRatio||1);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR);
  const ges = document.querySelector('.gestures');
  uiTop = ges ? ges.getBoundingClientRect().top - cv.getBoundingClientRect().top : H;
  layoutCam();
}
addEventListener('resize', resize);

const R = rng(1685);
function ridge(base, amp, step, shift){
  const pts = []; const p = [R()*6, R()*6, R()*6];
  for (let x=-300; x<=1900; x+=step) pts.push([x, base - amp*(0.45*Math.sin(x*0.0021+p[0]+shift) + 0.35*Math.abs(Math.sin(x*0.0057+p[1])) + 0.2*Math.sin(x*0.013+p[2]) + 0.55)]);
  return pts;
}
const FAR = ridge(520, 150, 10, 0), NEAR = ridge(536, 70, 8, 2);
const TREELINE = Array.from({length:170},(_,i)=>({x:-300+i*14+R()*8, r:9+R()*14}));
const STARS = Array.from({length:190},()=>({x:R(), y:R()*0.7, r:R()*1.2+.3, tw:R()*6}));
const CLOUDS = Array.from({length:9},()=>({x:R()*1.2, y:.04+R()*.3, s:.6+R()*.9, v:.004+R()*.006, parts:Array.from({length:5},()=>[R()*120-60,R()*30-15,30+R()*40])}));
const RAIN = Array.from({length:280},()=>({x:R(),y:R(),l:.6+R()*.6,v:.8+R()*.5}));
const SNOW = Array.from({length:220},()=>({x:R(),y:R(),r:1+R()*2.2,v:.25+R()*.3,ph:R()*6}));
const FLIES = Array.from({length:34},()=>({x:R()*1600,y:540+R()*110,ph:R()*6,sp:.3+R()*.6}));
const LEAVES = Array.from({length:80},()=>({x:240+R()*950, y:671+R()*16, a:R()*6, s:.7+R()*.7}));
const PUDDLES = [[300,684,34,4],[520,686,46,5],[700,683,38,4],[905,687,52,5],[1100,684,30,4],[200,742,60,6],[860,752,70,7],[1300,746,56,6]];
const GRASS_TUFTS = Array.from({length:60},()=>({x:-150+R()*1900, y:722+R()*150, h:6+R()*12, s:R()}));
let ripples = [], smoke = [];

/* ---------- Dessin ----------
   Lumière : L va de la nuit (0,2) au plein jour (1) ; les couleurs se mélangent vers l'indigo de nuit. */
const NIGHT = [20,26,52];
const C = { wood:[104,72,50], woodDark:[70,48,36], roof:[138,62,46], plaster:[214,204,184], plat:[150,147,140], platFace:[92,90,88], tactile:[214,178,62],
  rail:[74,70,68], gravel:[86,80,76], pole:[72,54,42], sign:[238,236,228], signBar:[46,112,78], body:[226,224,214], stripeG:[92,170,96], stripeB:[48,84,150],
  troof:[150,152,156], glass:[40,50,66], lit:[250,212,150], soil:[92,66,48], bench:[118,82,56], snow:[236,240,246], vend:[46,92,150] };
const shade = (c, L) => mix(NIGHT, c, L);
const col = (c, k, a=1) => rgb(shade(c, k), a);
function glow(x, y, r, color, a){ if (a <= .005) return; const g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`); ctx.fillStyle = g; ctx.fillRect(x-r,y-r,r*2,r*2); }
/* neige au sol : réelle (épaisseur Open-Meteo), ou en train de tomber */
let snowCover = 0, wetness = 0, lastFx = 0;
function weatherCover(dt){
  const kind = kindNow(), depth = vue.meteo.snowDepth || 0;
  let target = clamp(depth / .12, 0, 1);
  if (isSnow(kind)) target = Math.max(target, .55 + wx.snow*.3);
  snowCover += (target - snowCover) * Math.min(1, dt*.15);
  const wetTarget = isRain(kind) ? 1 : 0;
  wetness += (wetTarget - wetness) * Math.min(1, dt * (wetTarget ? .3 : .01));
}
function tempNow(){ const t = vue.meteo.temp; return t != null ? Math.round(t) : 12; }

function drawScene(w, info){
  const {e} = info.sun;
  const Lraw = clamp((e+.25)/.6, 0, 1);
  let L = (0.2 + 0.8*Lraw) * (1 - .25*wx.cloud);
  const night = 1 - Lraw;
  /* clair de lune (provisoire, lot F) : la vraie lune, levée, éclaire un peu la nuit, davantage sur la neige */
  const lune = info.lune, luneHaute = lune ? clamp(lune.elev/20, 0, 1) * lune.lit * (1-wx.cloud) : 0;
  if (lune) L = Math.min(1, L + .1*luneHaute*night*(1 + .6*snowCover));
  let [top, bot] = skyAt(e);
  const grey = mix([22,28,40],[150,158,168], Lraw);
  top = mix(top, mix(grey,[0,0,0],.08), wx.cloud*.78); bot = mix(bot, grey, wx.cloud*.7);
  const season = info.season.season;
  const snowy = snowCover > .25;
  const wind = windNow(), temp = tempNow();
  const now = performance.now(), dt = Math.min(.1, (now - (lastFx||now))/1000); lastFx = now;
  weatherCover(dt);
  info.L = L; info.night = night; info.snowy = snowy; curFerm = info.ferm;

  /* ---- ciel (écran) */
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const horizonY = OY + 540*S;
  let g = ctx.createLinearGradient(0,0,0,Math.max(10,horizonY));
  g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  const starA = clamp(-e*1.6,0,1) * (1-wx.cloud) * (1 - .55*luneHaute);
  if (starA > .01){ for (const s of STARS){ ctx.fillStyle = `rgba(240,238,225,${starA*(.55+.45*Math.sin(clock*1.3+s.tw))})`; ctx.beginPath(); ctx.arc(s.x*W, s.y*horizonY, s.r, 0, 7); ctx.fill(); } }
  if (info.sun.t != null && wx.cloud < .85){
    const sx = W*(.12+.76*info.sun.t), sy = horizonY - Math.max(0,e)*horizonY*.82;
    const sg = ctx.createRadialGradient(sx,sy,0,sx,sy,120*S+40);
    sg.addColorStop(0,`rgba(255,240,205,${.9*(1-wx.cloud)})`); sg.addColorStop(.12,`rgba(255,228,180,${.5*(1-wx.cloud)})`); sg.addColorStop(1,'rgba(255,220,170,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx-260,sy-260,520,520);
  }
  let moonA = clamp(-e*2,0,1) * (1-wx.cloud*.9);
  let mx = W*.78, my = Math.max(70, horizonY*.3), mPhase = info.moon;
  if (lune){                     // la vraie lune : sa direction et sa hauteur, comme le soleil (est à gauche)
    const t = (lune.az-90)/180;
    moonA *= lune.elev > 0 && t > -.08 && t < 1.08 ? clamp(lune.elev/4, 0, 1) : 0;
    /* à l'horizon, la lune se lève derrière les montagnes ; dès une quinzaine de degrés, elle passe au-dessus des crêtes */
    mx = W*(.12+.76*clamp(t, 0, 1)); my = horizonY - (horizonY - 60)*Math.pow(Math.sin(Math.max(0, lune.elev)*Math.PI/180), .5); mPhase = lune.phase;
  }
  /* les crêtes réelles ne dépassent pas une quinzaine de degrés : au-dessus, la vraie lune se dessine devant les montagnes du décor */
  const luneDevant = lune && lune.elev >= 15;
  const dessinLune = () => { if (moonA <= .02) return;
    const p = mPhase, k = (1-Math.cos(2*Math.PI*p))/2, s = p < .5 ? 1 : -1, r = 14 + 8*S;
    const mg = ctx.createRadialGradient(mx,my,0,mx,my,r*6); mg.addColorStop(0,`rgba(240,236,214,${.25*moonA*k})`); mg.addColorStop(1,'rgba(240,236,214,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx-r*6,my-r*6,r*12,r*12);
    ctx.fillStyle = `rgba(200,205,220,${.08*moonA})`; ctx.beginPath(); ctx.arc(mx,my,r,0,7); ctx.fill();
    ctx.fillStyle = `rgba(244,240,222,${moonA})`; ctx.beginPath();
    for (let a=-Math.PI/2; a<=Math.PI/2+.001; a+=Math.PI/40) ctx.lineTo(mx + s*r*Math.cos(a), my + r*Math.sin(a));
    for (let a=Math.PI/2; a>=-Math.PI/2-.001; a-=Math.PI/40) ctx.lineTo(mx + s*r*Math.cos(a)*(1-2*k), my + r*Math.sin(a));
    ctx.fill();
  };
  if (!luneDevant) dessinLune();
  const cloudA = clamp(wx.cloud*1.1-.05,0,1);
  if (cloudA > .02){
    const cc = mix(bot, [255,255,255], .15+.4*Lraw);
    for (const c of CLOUDS){
      c.x += c.v*0.016*(1+wind*3)*(reduceMotion?.3:1); if (c.x > 1.25) c.x = -.25;
      ctx.fillStyle = rgb(cc, .22*cloudA);
      for (const [px,py,pr] of c.parts){ ctx.beginPath(); ctx.ellipse(c.x*W+px*c.s*S*1.4, c.y*horizonY+py*c.s, pr*c.s*S*1.6, pr*c.s*.6, 0, 0, 7); ctx.fill(); }
    }
  }

  /* ---- décor (repère de la scène) */
  ctx.setTransform(DPR*S,0,0,DPR*S,DPR*OX,DPR*OY);
  const farC = shade(mix(bot,[44,54,84],.5), .55+.45*L), nearC = shade(mix(bot,[30,40,56],.72), .4+.6*L);
  const capAmt = Math.max(snowCover, season===3 ? .8 : (info.season.i===17||info.season.i===0||info.season.i===1) ? .4 : 0);
  for (const [pts,c,base] of [[FAR,farC,520],[NEAR,nearC,536]]){
    ctx.beginPath(); ctx.moveTo(-300,600); for (const [x,y] of pts) ctx.lineTo(x,y); ctx.lineTo(1900,600); ctx.closePath();
    ctx.fillStyle = rgb(c); ctx.fill();
    if (capAmt > .05){ ctx.save(); ctx.clip(); ctx.fillStyle = rgb(shade(C.snow,.35+.65*L), capAmt*(base===520 ? .85 : .5)); ctx.fillRect(-300,0,2200, base===520 ? base-112 : base-40); ctx.restore(); }
  }
  if (luneDevant){ ctx.setTransform(DPR,0,0,DPR,0,0); dessinLune(); ctx.setTransform(DPR*S,0,0,DPR*S,DPR*OX,DPR*OY); }
  const haze = ctx.createLinearGradient(0,430,0,560); haze.addColorStop(0,rgb(bot,0)); haze.addColorStop(1,rgb(bot,.45+.3*wx.fog)); ctx.fillStyle = haze; ctx.fillRect(-300,430,2200,130);
  // rivière
  g = ctx.createLinearGradient(0,548,0,648); g.addColorStop(0, rgb(mix(bot,[10,16,30],.35))); g.addColorStop(1, rgb(mix(top,[6,10,22],.55)));
  ctx.fillStyle = g; ctx.fillRect(-300,548,2200,100);
  ctx.strokeStyle = rgb(mix(bot,[255,255,255],.25), .18+.12*Lraw); ctx.lineWidth = 1.2;
  for (let i=0;i<30;i++){ const y = 560 + (i*37%84); const x = ((i*211 + clock*(8+i%5)) % 2100) - 250; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+30+(i%4)*14,y); ctx.stroke(); }
  if (moonA>.05 || (info.sun.t!=null && wx.cloud<.7)){
    const rx = moonA>.05 ? (mx-OX)/S : ((W*(.12+.76*(info.sun.t||0)))-OX)/S;
    ctx.fillStyle = moonA>.05 ? `rgba(244,240,222,${.18*moonA})` : `rgba(255,228,180,${.2*(1-wx.cloud)})`;
    for (let i=0;i<9;i++){ const ww = 10+Math.sin(clock*2+i)*6+i*2; ctx.fillRect(rx-ww/2 + Math.sin(clock+i)*4, 556+i*10, ww, 2.2); }
  }
  ctx.fillStyle = col(snowy ? [196,204,214] : TREES[season], .3+.7*L); ctx.fillRect(-300,546,2200,8);
  for (const t of TREELINE){ ctx.beginPath(); ctx.arc(t.x, 548, t.r, Math.PI, 0); ctx.fill(); }
  if (snowy){ ctx.fillStyle = col(C.snow, .35+.65*L, .7*snowCover); for (const t of TREELINE){ ctx.beginPath(); ctx.ellipse(t.x, 548-t.r*.8, t.r*.7, t.r*.3, 0, Math.PI, 0); ctx.fill(); } }
  drawFerme(L, info.nuit.ferme, snowy);
  if (info.flies){ for (const f of FLIES){ const a = Math.max(0, Math.sin(clock*f.sp*2+f.ph)); const x = f.x + Math.sin(clock*.3+f.ph)*12, y = f.y + Math.cos(clock*.4+f.ph)*6; glow(x, y, 9, '214,255,140', .9*a); } }
  if (wx.rain > .2){ if (Math.random() < wx.rain*.7) ripples.push({x:Math.random()*2000-200, y:560+Math.random()*80, t:0}); ctx.strokeStyle = 'rgba(220,228,240,.25)'; ctx.lineWidth=1; ripples = ripples.filter(r=>{ r.t += .016; ctx.globalAlpha = Math.max(0,1-r.t*1.4); ctx.beginPath(); ctx.ellipse(r.x,r.y,4+r.t*22,1+r.t*5,0,0,7); ctx.stroke(); return r.t < .75; }); ctx.globalAlpha = 1; }
  // poteaux et fils
  ctx.strokeStyle = col([40,36,36], .3+.7*L, .9); ctx.lineWidth = 1.2;
  for (const dy of [0,14]){ ctx.beginPath(); ctx.moveTo(-300, 350+dy); ctx.quadraticCurveTo(0, 380+dy, 200, 342+dy); ctx.quadraticCurveTo(650, 400+dy, 1100, 342+dy); ctx.quadraticCurveTo(1450, 400+dy, 1900, 352+dy); ctx.stroke(); }
  ctx.fillStyle = col(C.pole, .25+.75*L); for (const x of [200,1100]){ ctx.fillRect(x-4, 330, 8, 318); ctx.fillRect(x-26, 340, 52, 5); }
  // voie
  ctx.fillStyle = col(C.gravel, .25+.75*L); ctx.fillRect(-300,640,2200,30);
  if (snowy){ ctx.fillStyle = col(C.snow, .35+.65*L, .85*snowCover); ctx.fillRect(-300,640,2200,9); }
  ctx.fillStyle = col(C.rail, .3+.7*L); ctx.fillRect(-300,651,2200,3); ctx.fillRect(-300,661,2200,3);
  if (wetness > .2 || snowy) { ctx.fillStyle = `rgba(230,236,246,${.25*Math.max(wetness, snowCover)*(.3+.7*L)})`; ctx.fillRect(-300,651,2200,1); ctx.fillRect(-300,661,2200,1); }
  drawPlatelage(L, snowy);
  for (const p of info.people) if (p.kind==='worker' && !p.quai) figure(p, 652, L, night);
  if (info.nuit.cerfs) drawCerfs(info.nuit.cerfs, L, night);
  drawTrain(L, night, snowy);
  drawCrossing(L, night, crossingActive(), snowy);

  /* ---- quai */
  ctx.fillStyle = col(mix(C.gravel,[0,0,0],.2), .2+.8*L); ctx.fillRect(-300,668,2200,50);
  const platC = mix(C.plat, [40,44,56], wetness*.45);
  ctx.fillStyle = col(platC, .22+.78*L); ctx.fillRect(230,668,970,22);
  ctx.fillStyle = col(C.tactile, .3+.7*L); ctx.fillRect(230,670,970,4);
  ctx.fillStyle = col(C.platFace, .2+.8*L); ctx.fillRect(230,690,970,26);
  ctx.fillStyle = col([60,58,58], .2+.8*L, .5); ctx.fillRect(230,690,970,2);
  if (snowy){
    ctx.fillStyle = col(C.snow, .42+.58*L, .95);
    ctx.beginPath(); ctx.moveTo(230,688); for (let x=230; x<=1200; x+=20) ctx.lineTo(x, 674 - snowCover*5 + Math.sin(x*.07)*1.5); ctx.lineTo(1200,688); ctx.closePath(); ctx.fill();
    // le chemin tassé devant la porte et le banc
    ctx.fillStyle = col([200,206,216], .35+.65*L, .5); ctx.fillRect(470, 678, 330, 6);
    /* le quai dégagé par le cheminot, à la pelle, après une nuit de neige */
    if (info.nuit.quai || info.nuit.quaiDegage){
      const x0 = info.nuit.quai ? lerp(1190, 250, info.nuit.quai.k) : 240;
      ctx.fillStyle = col(mix(platC, [60,64,76], .25), .22+.78*L); ctx.fillRect(x0, 675, 1196 - x0, 13);
      ctx.fillStyle = col(C.snow, .42+.58*L, .9); ctx.fillRect(x0, 674, 1196 - x0, 2);
    }
  }
  drawEmpreintes(L, snowy);
  drawPistes(L, w);
  drawReflections(L, night, info);
  drawDebris(L, season, info);
  drawMailbox(L, snowy);
  drawStation(L, night, snowy, info, temp, wind);
  drawObjets(L, night, snowy);
  drawVending(L, night, snowy);
  drawLamp(L, night, info.lampOn, snowy);
  { const dx = bancDecale(); ctx.save(); ctx.translate(dx, 0); drawBench(L, snowy); ctx.restore(); }
  drawObjetsBanc(L);
  drawGivre(L, train.phase === 'idle');
  drawSign(L, night, snowy);
  drawBowl(L);
  drawItem(L, info.item);
  if (info.cat && info.cat !== 'roof') drawCat(info.cat, L, night);
  if (info.waiting && trav.state === 'none') figure({kind:'traveler', x:760, sit:true}, 682, L, night);
  for (const p of info.people) if (p.kind!=='worker' || p.quai) figure(p, 682, L, night);
  if (info.nuit.renard) drawRenard(info.nuit.renard, L, night);
  drawPapillons(info);
  if (trav.state !== 'none') figure({kind:'traveler', x:trav.x, walk:true, phase:trav.walk, fade:trav.alpha}, 682, L, night);

  /* ---- premier plan */
  const gc = snowy ? mix(GRASS[season], C.snow, Math.min(1, snowCover*1.3)) : GRASS[season];
  g = ctx.createLinearGradient(0,716,0,900); g.addColorStop(0, col(gc, .22+.6*L)); g.addColorStop(1, col(mix(gc,[0,0,0],.45), .2+.6*L));
  ctx.fillStyle = g; ctx.fillRect(-300,716,2200,700);
  drawRoute(L, snowy, info.nuit);
  drawTufts(L, season, snowy, wind);
  if (snowy){ ctx.fillStyle = col(C.snow, .4+.6*L, .9); for (const [x0,x1] of [[-300,236],[1194,1900]]){ ctx.beginPath(); ctx.moveTo(x0, 720); ctx.quadraticCurveTo((x0+x1)/2, 700 - snowCover*14, x1, 720); ctx.lineTo(x1,730); ctx.lineTo(x0,730); ctx.fill(); } }
  drawGarden(L, season, snowy, wind);
  if (info.nuit.livreur) drawVehicule('livreur', info.nuit.livreur.k, L, night);
  if (info.nuit.chasseNeige) drawVehicule('chasseNeige', info.nuit.chasseNeige.k, L, night);
  updateSmoke(dt, wind, L, night);
  if (purr){ purr.t += .016; ctx.fillStyle = `rgba(241,201,124,${1-purr.t})`; for (let i=0;i<3;i++){ const px = purr.x + i*10 - 10, py = purr.y - 20 - purr.t*30 - i*6; ctx.beginPath(); ctx.arc(px-2,py,2.6,0,7); ctx.arc(px+2,py,2.6,0,7); ctx.moveTo(px-4.6,py+1); ctx.lineTo(px,py+6); ctx.lineTo(px+4.6,py+1); ctx.fill(); } if (purr.t>1) purr = null; }
  if (wx.fog > .05){
    const fc = mix(bot,[230,232,236],.35);
    for (let i=0;i<5;i++){ const y = 470+i*55, x = ((clock*(6+i*2) + i*400) % 2600) - 700; const fg = ctx.createRadialGradient(x+500,y,0,x+500,y,700); fg.addColorStop(0, rgb(fc, .42*wx.fog)); fg.addColorStop(1, rgb(fc,0)); ctx.fillStyle = fg; ctx.fillRect(x-200,y-120,1400,240); }
  }

  /* ---- écran : pluie, neige, éclairs, vignette */
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if (wx.rain > .02){
    const n = Math.floor(RAIN.length*Math.min(1,wx.rain)*(reduceMotion?.4:1));
    ctx.strokeStyle = rgb(mix(bot,[220,228,240],.6), .35); ctx.lineWidth = 1; ctx.beginPath();
    for (let i=0;i<n;i++){ const r = RAIN[i]; r.y += r.v*.032*(1+wx.storm*.5); if (r.y>1.05){ r.y=-.05; r.x=Math.random(); } const x=r.x*W, y=r.y*H; ctx.moveTo(x,y); ctx.lineTo(x-(4+wind*16)*r.l, y+22*r.l); }
    ctx.stroke();
  }
  if (wx.snow > .02){
    const n = Math.floor(SNOW.length*Math.min(1,wx.snow)*(reduceMotion?.4:1));
    ctx.fillStyle = 'rgba(246,248,252,.85)';
    for (let i=0;i<n;i++){ const s = SNOW[i]; s.y += s.v*.004; if (s.y>1.02){ s.y=-.02; s.x=Math.random(); } s.x -= wind*.0012; if (s.x < -.02) s.x = 1.02; ctx.beginPath(); ctx.arc((s.x + Math.sin(clock*.6+s.ph)*.01)*W, s.y*H, s.r, 0, 7); ctx.fill(); }
  }
  if (wx.storm > .5 && Math.random() < .004){ if (!reduceMotion) flash = .5; son.event('thunder', {delay: .8 + Math.random()*2.5}); }
  if (flash > 0){ ctx.fillStyle = `rgba(230,236,255,${flash})`; ctx.fillRect(0,0,W,H); flash -= .03; }
  const vg = ctx.createRadialGradient(W/2,H*.55,Math.min(W,H)*.35,W/2,H*.55,Math.max(W,H)*.8);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(6,8,18,${.22+.22*night})`);
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
}

/* reflets des lumières sur le quai mouillé ou enneigé : c'est là que la nuit devient belle */
function drawReflections(L, night, info){
  const shine = Math.max(wetness, snowCover*.6) * clamp(night*1.2, 0, 1);
  if (shine < .03) return;
  const warm = '250,214,150', cool = '200,232,250';
  if (night > .35){ for (const x of [404, 498, 556]) streak(x, 690, 26, 40, warm, .38*shine); }
  streak(637, 690, 22, 36, cool, .45*shine);
  if (info.lampOn) streak(694, 690, 18, 46, '255,226,160', .5*shine);
  if (crossingActive() && Math.floor(clock*2.38)%2 === 0) streak(CROSSING_X-13, 690, 10, 30, '255,70,50', .5*shine);
  if (wetness > .2){
    for (const [x,y,rx,ry] of PUDDLES){
      ctx.fillStyle = `rgba(150,170,200,${.12*wetness*(.4+.6*L)})`; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,7); ctx.fill();
      if (wx.rain > .2 && Math.random() < wx.rain*.25) ripples.push({x:x+(Math.random()-.5)*rx, y, t:0});
    }
  }
}
function streak(x, y, w, h, color, a){
  if (a <= .01) return;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w/2, y); ctx.lineTo(x + w/2, y); ctx.lineTo(x + w*.2, y + h); ctx.lineTo(x - w*.2, y + h); ctx.fill();
}

/* fumée du poêle, gaz d'échappement du train, buée des respirations */
function puff(x, y, kind){ smoke.push({ x, y, vx:(Math.random()-.5)*4, vy: kind==='breath' ? -6 : -14 - Math.random()*6, r: kind==='breath' ? 2 : 5, a: kind==='exhaust' ? .5 : kind==='breath' ? .35 : .3, kind }); }
function updateSmoke(dt, wind, L, night){
  smoke = smoke.filter(p => {
    p.x += (p.vx - wind*26)*dt; p.y += p.vy*dt; p.r += (p.kind==='breath' ? 6 : 10)*dt; p.a -= (p.kind==='breath' ? .35 : .12)*dt;
    if (p.a <= 0) return false;
    const c = p.kind==='exhaust' ? [90,92,96] : [210,214,222];
    ctx.fillStyle = col(c, .3+.7*L, p.a); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    return true;
  });
  if (smoke.length > 160) smoke.splice(0, smoke.length - 160);
}

/* l'autorail diesel des lignes rurales de Hokkaidō : une seule voiture, blanche à bandes verte et bleue */
function drawTrain(L, night, snowy){
  if (train.phase==='idle') return;
  const x = train.x, y = 552, h = 104, k = .2+.8*L, lit = night > .3;
  ctx.fillStyle = col([40,40,44], k); ctx.fillRect(x+30, y+h, 54, 10); ctx.fillRect(x+CAR-84, y+h, 54, 10);
  ctx.fillStyle = col([28,28,30], k); for (const bx of [x+38, x+72, x+CAR-76, x+CAR-42]){ ctx.beginPath(); ctx.arc(bx, y+h+9, 6, 0, 7); ctx.fill(); }
  ctx.fillStyle = col(C.body, k);
  ctx.beginPath(); ctx.moveTo(x+10, y); ctx.lineTo(x+CAR, y); ctx.lineTo(x+CAR, y+h); ctx.lineTo(x, y+h); ctx.lineTo(x, y+14); ctx.quadraticCurveTo(x, y, x+10, y); ctx.fill();
  ctx.fillStyle = col(C.troof, k); ctx.fillRect(x+8, y-6, CAR-14, 7); ctx.fillRect(x+CAR*.42, y-14, 44, 9);
  ctx.fillStyle = col([60,60,64], k); ctx.fillRect(x+CAR*.72, y-22, 7, 17);
  if (snowy || wx.snow > .3){ ctx.fillStyle = col(C.snow, .4+.6*L, .9); ctx.fillRect(x+10, y-9, CAR-16, 4); }
  ctx.fillStyle = col(C.stripeG, k); ctx.fillRect(x, y+70, CAR, 6);
  ctx.fillStyle = col(C.stripeB, k); ctx.fillRect(x, y+78, CAR, 3);
  ctx.fillStyle = lit ? `rgba(${C.lit.join(',')},${.7+.25*night})` : col(C.glass, .3+.7*L);
  ctx.fillRect(x+6, y+14, 30, 34);
  for (let i=0;i<5;i++) ctx.fillRect(x+60+i*42, y+18, 30, 30);
  ctx.fillStyle = col([84,88,96], k); ctx.fillRect(x+40, y+12, 16, 86); ctx.fillRect(x+CAR-34, y+12, 16, 86);
  ctx.fillStyle = lit ? 'rgba(255,190,90,.95)' : col([60,50,40], k); ctx.fillRect(x+8, y+4, 26, 7);
  ctx.fillStyle = lit ? 'rgba(255,246,220,.98)' : col([230,220,190], k); ctx.fillRect(x+2, y+84, 9, 6);
  if (lit && train.phase !== 'stop'){ const hg = ctx.createRadialGradient(x,y+86,0,x,y+86,240); hg.addColorStop(0,`rgba(255,236,190,${.38*night})`); hg.addColorStop(1,'rgba(255,236,190,0)'); ctx.fillStyle = hg; ctx.fillRect(x-240,y-150,250,330); }
  if (lit) glow(x+CAR/2, y+40, 170, '250,212,150', .1*night);
  const accel = train.phase==='out' || (train.phase==='stop' && train.t > 8.5);
  if (Math.random() < (accel ? .5 : train.phase==='stop' ? .06 : .12)) puff(x+CAR*.72+3, y-24, 'exhaust');
}
function drawCrossing(L, night, active, snowy){
  const x = CROSSING_X, base = 668, k = .25+.75*L;
  for (let i=0;i<8;i++){ ctx.fillStyle = col(i%2 ? [30,30,32] : [226,190,40], k); ctx.fillRect(x-3, base-112+i*14, 6, 14); }
  ctx.save(); ctx.translate(x, base-126);
  for (const a of [.62, -.62]){ ctx.save(); ctx.rotate(a); ctx.fillStyle = col([30,30,32],k); ctx.fillRect(-23,-4.5,46,9); ctx.fillStyle = col([232,196,44],k); ctx.fillRect(-21,-3,42,6); ctx.restore(); }
  ctx.restore();
  if (snowy){ ctx.fillStyle = col(C.snow, .4+.6*L, .9); ctx.fillRect(x-20, base-108, 40, 3); }
  ctx.fillStyle = col([40,40,44],k); ctx.fillRect(x-20, base-104, 40, 4);
  const blink = Math.floor(clock*2.38) % 2;
  for (const [i, dx] of [[0,-13],[1,13]]){
    const lit = active && blink === i;
    ctx.fillStyle = col([30,30,32],k); ctx.beginPath(); ctx.arc(x+dx, base-94, 8, 0, 7); ctx.fill();
    ctx.fillStyle = lit ? 'rgba(255,70,50,.98)' : col([90,30,28],k); ctx.beginPath(); ctx.arc(x+dx, base-94, 5.5, 0, 7); ctx.fill();
    if (lit) glow(x+dx, base-94, 40+60*night, '255,60,40', .35+.4*night);
  }
}
/* les étiquettes de l'inventaire du cheminot : posées à leur heure le jour de son moment, elles restent ensuite */
function etiquette(quoi){
  const F = cur && VIE.fermeture(FERM, cur.y, cur.m, cur.d, cur.hour), c = FERM.changements.find(x => x.id === 'moment-cheminot');
  if (!F) return false;
  return F.jour > c.j || (F.jour === c.j && cur.hour >= MOM.cheminot.etiquettes[quoi]);
}
function etiquetteEn(x, y, k){ ctx.fillStyle = col([250,250,244], k); ctx.fillRect(x, y, 5, 3.4); ctx.fillStyle = col([60,60,70], k); ctx.fillRect(x+1, y+1.4, 3, .6); }
function hasGift(i){ return save.preview || Object.values(save.gifts).includes(i); }

/* le bâtiment : salle d'attente en bois, toit de tôle rouge comme à Hokkaidō, poêle l'hiver */
function drawStation(L, night, snowy, info, temp, wind){
  const x0 = 360, x1 = 610, base = 680, top = 584, k = .2+.8*L, lit = night > .3;
  /* la salle d'attente reste éclairée toute la nuit ; le poêle ne chauffe qu'aux heures des trains */
  const F = info.ferm, hour = cur.hour, open = !(prov() && F.prov.fermee), stove = open && temp < 10 && hour >= 5.5 && hour < 22.5;
  // murs : planches en bas, enduit et colombages en haut
  ctx.fillStyle = col(C.plaster, k); ctx.fillRect(x0, top, x1-x0, base-top);
  ctx.fillStyle = col(C.wood, k); ctx.fillRect(x0, top+58, x1-x0, base-top-58);
  ctx.fillStyle = col(C.woodDark, k);
  for (let x=x0; x<x1; x+=9) ctx.fillRect(x, top+58, 1.2, base-top-58);
  for (const x of [x0, x0+82, x0+168, x1-6]) ctx.fillRect(x, top, 6, base-top);
  ctx.fillRect(x0, top+54, x1-x0, 5); ctx.fillRect(x0, top, x1-x0, 5);
  // fenêtres et porte coulissante
  const winC = lit && open ? `rgba(${C.lit.join(',')},.92)` : col(C.glass, .3+.7*L);
  for (const wx0 of [x0+16, x1-62]){
    ctx.fillStyle = winC; ctx.fillRect(wx0, top+14, 46, 34);
    if (lit && open && stove && wx0 === x0+16) glow(wx0+14, top+44, 26, '255,130,60', .5);
    ctx.fillStyle = col(C.woodDark, k); ctx.fillRect(wx0+22, top+14, 2, 34); ctx.fillRect(wx0, top+30, 46, 2);
    if (wx.rain > .1) rainOnGlass(wx0, top+14, 46, 34, L);
  }
  const dx0 = x0+96, dw = 64;
  ctx.fillStyle = lit && open ? `rgba(${mix(C.lit,[150,100,50],.2).join(',')},.9)` : col([58,46,38], k); ctx.fillRect(dx0, top+12, dw, base-top-12);
  ctx.fillStyle = col(C.woodDark, k); ctx.fillRect(dx0+dw/2-1, top+12, 2, base-top-12); ctx.fillRect(dx0, top+60, dw, 2);
  if (lit && open){ glow(dx0+dw/2, base, 150, '248,212,148', .28*night); glow(x0+40, base, 90, '248,212,148', .16*night); }
  // nom de la gare au-dessus de la porte
  ctx.fillStyle = col([240,236,226], Math.max(k, lit ? .6 : 0)); ctx.fillRect(dx0+4, top-2, dw-8, 12);
  ctx.fillStyle = col([30,30,34], Math.max(k, lit ? .6 : 0)); ctx.textAlign = 'center'; ctx.font = '700 9px "Shippori Mincho", serif'; ctx.fillText('名残駅', dx0+dw/2, top+7.5); ctx.textAlign = 'left';
  // tableau à craie (伝言板) et horaires
  ctx.fillStyle = col([40,64,52], k); ctx.fillRect(x0+18, top+62, 40, 26);
  ctx.fillStyle = col([238,236,228], k); ctx.fillRect(x1-56, top+62, 30, 34);
  ctx.fillStyle = col([60,60,70], k); for (let i=0;i<7;i++) ctx.fillRect(x1-52, top+67+i*4, 10 + (i*7%12), 1.2);
  /* — la fermeture (lot H) : rien n'est retiré, vidé ni emballé ; ce qui change s'ajoute — */
  // l'horloge de la salle d'attente, derrière la vitre de la porte (heure de la gare)
  { const cx = dx0+dw-14, cy = top+24, r = 6, hh = hour % 12;
    ctx.fillStyle = col([244,240,230], Math.max(k, lit && open ? .7 : 0)); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = col([40,40,44], Math.max(k, lit && open ? .7 : 0)); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    const aig = (a, l) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a)*l, cy - Math.cos(a)*l); ctx.stroke(); };
    aig(hh/12*2*Math.PI, 3.2); aig((hour % 1)*2*Math.PI, 4.8); }
  // l'avis officiel près de la porte, dès la première visite : titre japonais court, lignes illisibles, la date en gros
  { const ax = dx0+dw+4, ay = top+8, kk = Math.max(k, lit && open ? .55 : 0);
    ctx.fillStyle = col([248,246,238], kk); ctx.fillRect(ax, ay, 22, 34);
    ctx.fillStyle = col([30,30,34], kk); ctx.textAlign = 'center'; ctx.font = '700 2.8px "Zen Kaku Gothic New", sans-serif'; ctx.fillText(TF.avisTitre, ax+11, ay+5);
    ctx.fillStyle = col([178,40,36], kk); ctx.font = '700 6px "Zen Kaku Gothic New", sans-serif'; ctx.fillText(TF.avisDate, ax+11, ay+14); ctx.textAlign = 'left';
    ctx.fillStyle = col([96,96,104], kk); for (let i=0;i<5;i++) ctx.fillRect(ax+3, ay+18+i*3, 16 - (i*5%7), .8);
    ctx.fillStyle = col([186,44,40], kk); ctx.beginPath(); ctx.arc(ax+17, ay+31, 1.6, 0, 7); ctx.fill(); }
  // l'affiche de la commune (J3) et les photos anciennes punaisées dessous (J6, J12) : rectangles sépia aux formes vagues
  if (F.faits.includes('affiche-commune')){
    const px = x0+64, py = top+6;
    ctx.fillStyle = col([226,236,214], k); ctx.fillRect(px, py, 16, 22);
    ctx.fillStyle = col([70,110,80], k); ctx.fillRect(px+1.5, py+1.5, 13, 3);
    ctx.strokeStyle = col([90,90,96], k); ctx.lineWidth = .8; ctx.strokeRect(px+4, py+7, 8, 6);
    ctx.fillStyle = col([110,110,116], k); for (let i=0;i<3;i++) ctx.fillRect(px+2.5, py+15+i*2.2, 11 - i*2, .7);
  }
  for (const [id, py] of [['photo-1', top+30], ['photo-2', top+41]]) if (F.faits.includes(id)){
    const px = x0+65, sep = id === 'photo-1' ? [176,146,104] : [164,136,100];
    ctx.fillStyle = col([240,234,220], k); ctx.fillRect(px, py, 14, 10);
    ctx.fillStyle = col(sep, k); ctx.fillRect(px+1, py+1, 12, 8);
    ctx.fillStyle = col(mix(sep, [60,44,30], .55), k);
    if (id === 'photo-1'){ ctx.fillRect(px+2, py+5, 9, 3); ctx.fillRect(px+4, py+3, 4, 2); }          // un bâtiment, vaguement
    else { ctx.fillRect(px+1.5, py+6, 11, 1.4); ctx.beginPath(); ctx.arc(px+5, py+4.5, 1.6, 0, 7); ctx.arc(px+9, py+4.8, 1.4, 0, 7); ctx.fill(); }   // des gens sur le quai
    ctx.fillStyle = col([200,60,50], k); ctx.fillRect(px+6.5, py-.6, 1.2, 1.2);
  }
  // les étiquettes numérotées de l'inventaire (jeudi 26 novembre), sur le poêle et l'horloge ; celle du banc est dessinée avec le banc
  if (etiquette('poele')) etiquetteEn(x0+24, top+40, k);
  if (etiquette('horloge')) etiquetteEn(dx0+dw-17, top+32, k);
  // le tableau à craie : la ligne du jour, et dans le coin, d'une main qu'on ne connaît pas, le compte à rebours
  { const c = VIE.craieDuJour(CRAIE, FERM, cur.y, cur.m, cur.d), n = c ? CRAIE.indexOf(c) : -1;
    ctx.strokeStyle = col([214,220,208], k, .6); ctx.lineWidth = .8; ctx.beginPath();
    const lignes = n < 0 ? [[22, 70, 44, 69], [22, 76, 36, 76]] : [[22, 69, 30 + (n*7)%16, 69], [22, 74, 26 + (n*11)%14, 74.5]];
    for (const [a, y1, b, y2] of lignes){ ctx.moveTo(x0+a, top+y1); for (let x = a; x < b; x += 3) ctx.lineTo(x0+x+3, top+y1 + Math.sin(x+n)*.5 + (y2-y1)*(x-a)/Math.max(1, b-a)); }
    ctx.stroke();
    if (F.compte != null){
      ctx.fillStyle = col([236,238,226], k, .85); ctx.textAlign = 'right'; ctx.font = 'italic 500 4.6px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText(tx(TF.ardoise, {n: F.compte}), x0+56, top+86); ctx.textAlign = 'left';
    }
  }
  // toit de tôle, gouttière, cheminée
  const rc = C.roof;
  ctx.fillStyle = col(rc, k);
  ctx.beginPath(); ctx.moveTo(x0-34, top+8); ctx.lineTo(x0+30, top-46); ctx.lineTo(x1-30, top-46); ctx.lineTo(x1+34, top+8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col(mix(rc,[0,0,0],.25), k); for (let x=x0-20; x<x1+20; x+=10) ctx.fillRect(x, top-40 + Math.max(0, (x0+30-x))*.8, 1.2, 40);
  ctx.fillStyle = col(mix(rc,[0,0,0],.4), k); ctx.fillRect(x0-34, top+6, x1-x0+68, 4);
  const chX = x1-48;
  ctx.fillStyle = col([70,70,74], k); ctx.fillRect(chX, top-78, 7, 40); ctx.fillRect(chX-3, top-82, 13, 5);
  if (stove && Math.random() < .12) puff(chX+3, top-84, 'smoke');
  if (snowy){
    const t = 3 + snowCover*9;
    ctx.fillStyle = col(C.snow, .42+.58*L);
    ctx.beginPath(); ctx.moveTo(x0-30, top+4); ctx.lineTo(x0+30, top-46-t); ctx.lineTo(x1-30, top-46-t); ctx.lineTo(x1+30, top+4); ctx.lineTo(x1+18, top+4); ctx.lineTo(x1-36, top-42); ctx.lineTo(x0+36, top-42); ctx.lineTo(x0-18, top+4); ctx.closePath(); ctx.fill();
    ctx.fillRect(chX-3, top-86, 13, 4);
    if (temp < -1){ ctx.fillStyle = col([220,232,246], .5+.5*L, .85); for (let x=x0-28; x<x1+28; x+=13){ const l = 4 + ((x*7)%11); ctx.beginPath(); ctx.moveTo(x, top+10); ctx.lineTo(x+3, top+10); ctx.lineTo(x+1.5, top+10+l); ctx.fill(); } }
  }
  if (info.cat === 'roof') drawCat('roof', L, night);
  // omiyage posés sur la façade
  const sway = 1 + wx.storm*2 + wx.rain*.5 + wind*2.5;
  if (hasGift(2)){ const ddx = x0+88, ddy = base; ctx.fillStyle = col([196,52,44], .3+.7*L); ctx.beginPath(); ctx.ellipse(ddx, ddy-8, 8, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = col([240,232,214], .3+.7*L); ctx.beginPath(); ctx.arc(ddx, ddy-10, 4, 0, 7); ctx.fill(); }
  if (hasGift(0)){ const fx = x1+14, sw = Math.sin(clock*2.2)*4*sway; ctx.strokeStyle = col([60,60,60],k); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, top+8); ctx.lineTo(fx, top+18); ctx.stroke(); ctx.fillStyle = `rgba(180,214,232,${.55+.3*L})`; ctx.beginPath(); ctx.arc(fx, top+24, 7, Math.PI, 0); ctx.fill(); ctx.strokeStyle = col([200,60,60],k); ctx.beginPath(); ctx.moveTo(fx, top+24); ctx.lineTo(fx+sw*.5, top+34); ctx.stroke(); ctx.fillStyle = col([236,226,190],k); ctx.fillRect(fx-3+sw, top+34, 6, 14); }
  if (hasGift(1)){ const lx = x0+70, ly = top+26; if (night>.3) glow(lx, ly, 50, '255,140,90', .4*night); ctx.strokeStyle = col([50,50,50],k); ctx.beginPath(); ctx.moveTo(lx, top+8); ctx.lineTo(lx, ly-12); ctx.stroke(); ctx.fillStyle = night>.3 ? 'rgba(240,96,64,.95)' : col([196,52,40],k); ctx.beginPath(); ctx.ellipse(lx, ly, 9, 13, 0, 0, 7); ctx.fill(); ctx.fillStyle = col([30,26,26],k); ctx.fillRect(lx-6, ly-14, 12, 3); ctx.fillRect(lx-6, ly+11, 12, 3); }
  if (hasGift(4)){ const tx = x0-14, sw = Math.sin(clock*1.7+1)*3*sway; ctx.strokeStyle = col([60,60,60],k); ctx.beginPath(); ctx.moveTo(tx, top+8); ctx.lineTo(tx+sw*.4, top+20); ctx.stroke(); ctx.fillStyle = col([244,242,236], .35+.65*L); ctx.beginPath(); ctx.arc(tx+sw*.4, top+24, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx-8+sw*.6, top+40); ctx.lineTo(tx+sw*.4, top+26); ctx.lineTo(tx+8+sw*.6, top+40); ctx.fill(); }
  if (hasGift(3)){ const bx = 338, by = 668; ctx.fillStyle = col([88,64,52],k); ctx.fillRect(bx-12, by-10, 24, 10); ctx.strokeStyle = col([80,60,44],k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by-10); ctx.quadraticCurveTo(bx-6, by-22, bx+4, by-30); ctx.stroke(); ctx.fillStyle = col(info.season.season===2 ? [176,72,44] : [58,96,60], k); ctx.beginPath(); ctx.ellipse(bx+6, by-32, 16, 7, -.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(bx-8, by-24, 10, 5, .2, 0, 7); ctx.fill(); }
  if (hasGift(5)){ const vx = 1160, vy = 668; ctx.fillStyle = col([70,90,110],k); ctx.beginPath(); ctx.moveTo(vx-7,vy); ctx.lineTo(vx-9,vy-18); ctx.lineTo(vx+9,vy-18); ctx.lineTo(vx+7,vy); ctx.fill(); ctx.strokeStyle = col([214,206,170], .3+.7*L); ctx.lineWidth = 1.4; for (let i=-3;i<=3;i++){ const sw = Math.sin(clock*1.3+i)*3*sway; ctx.beginPath(); ctx.moveTo(vx+i, vy-18); ctx.quadraticCurveTo(vx+i*5, vy-40, vx+i*9+sw, vy-56+Math.abs(i)*3); ctx.stroke(); } }
}
/* gouttes qui coulent sur une vitre */
function rainOnGlass(x, y, w, h, L){
  ctx.fillStyle = `rgba(210,222,240,${.35*(.4+.6*L)})`;
  for (let i=0;i<7;i++){ const px = x + 3 + ((i*13.7) % (w-6)), py = y + ((clock*12*(1+i%3) + i*17) % h); ctx.fillRect(px, Math.max(y, py-6), 1, Math.min(6, py - y)); ctx.beginPath(); ctx.arc(px+.5, py, 1.2, 0, 7); ctx.fill(); }
}
/* le distributeur de boissons : la lumière froide du quai la nuit */
function drawVending(L, night, snowy){
  const x = 620, y = 606, w = 34, h = 74, k = .25+.75*L;
  ctx.fillStyle = col(C.vend, k); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col([236,240,244], k); ctx.fillRect(x+3, y+4, w-6, 34);
  const DR = [[200,60,50],[60,120,190],[230,180,60],[80,150,90],[240,240,240],[150,90,60]];
  for (let r=0;r<3;r++) for (let c=0;c<5;c++){ ctx.fillStyle = col(DR[(r*5+c)%6], k); ctx.fillRect(x+5+c*5, y+7+r*11, 3, 8); }
  ctx.fillStyle = col([30,34,40], k); ctx.fillRect(x+6, y+56, w-12, 10); ctx.fillRect(x+w-9, y+42, 4, 8);
  const on = night > .2 && !(prov() && curFerm && curFerm.prov.fermee);
  if (on){ ctx.fillStyle = `rgba(220,240,255,${.45*night})`; ctx.fillRect(x+3, y+4, w-6, 34); glow(x+w/2, y+30, 90, '200,232,250', .3*night); glow(x+w/2, 684, 70, '200,232,250', .2*night); }
  if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.beginPath(); ctx.ellipse(x+w/2, y, w/2+3, 3+snowCover*3, 0, Math.PI, 0); ctx.fill(); }
}
function drawMailbox(L, snowy){
  const x = 300, k = .25+.75*L;
  ctx.fillStyle = col([60,60,64], k); ctx.fillRect(x-2, 650, 4, 30);
  ctx.fillStyle = col([196,44,38], k); ctx.beginPath(); ctx.moveTo(x-11, 660); ctx.lineTo(x-11, 630); ctx.quadraticCurveTo(x, 618, x+11, 630); ctx.lineTo(x+11, 660); ctx.fill();
  ctx.fillStyle = col([40,30,30], k); ctx.fillRect(x-7, 634, 14, 2.5);
  ctx.fillStyle = col([240,236,226], k); ctx.fillRect(x-5, 644, 10, 7);
  if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.beginPath(); ctx.ellipse(x, 624, 13, 4+snowCover*3, 0, Math.PI, 0); ctx.fill(); }
}
function drawLamp(L, night, on, snowy){
  const x = 694, base = 680, top = 556;
  ctx.fillStyle = col([46,48,54], .25+.75*L); ctx.fillRect(x-3, top, 6, base-top); ctx.fillRect(x-18, top-4, 36, 6);
  ctx.fillStyle = on ? 'rgba(255,236,186,.98)' : col([90,92,96], .3+.7*L); ctx.fillRect(x-14, top+2, 28, 4);
  if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.fillRect(x-19, top-8, 38, 4); }
  if (on && night > .15){
    glow(x, top+4, 80, '255,226,160', .75*night);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cone = ctx.createLinearGradient(0, top, 0, base);
    cone.addColorStop(0, `rgba(255,220,150,${.16*night})`); cone.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(x-12, top+5); ctx.lineTo(x+12, top+5); ctx.lineTo(x+80, base+4); ctx.lineTo(x-80, base+4); ctx.fill();
    ctx.restore();
    const lg = ctx.createRadialGradient(x,684,0,x,684,130); lg.addColorStop(0,`rgba(255,226,160,${.34*night})`); lg.addColorStop(1,'rgba(255,226,160,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(x,684,140,22,0,0,7); ctx.fill();
  }
}
function drawBench(L, snowy){
  const k = .2+.8*L;
  ctx.fillStyle = col(mix(C.bench,[0,0,0],.25), k); ctx.fillRect(744, 667, 4, 15); ctx.fillRect(824, 667, 4, 15); ctx.fillRect(744, 640, 4, 27); ctx.fillRect(824, 640, 4, 27);
  ctx.fillStyle = col(C.bench, k); ctx.fillRect(740, 661, 92, 6); ctx.fillRect(740, 642, 92, 4); ctx.fillRect(740, 650, 92, 4);
  if (etiquette('banc')) etiquetteEn(812, 662.3, k);
  if (snowy && !(cur.hour >= 13 && cur.hour < 13.7)){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.fillRect(740, 657, 92, 4); ctx.fillRect(740, 639, 92, 3); }
}
function drawBowl(L){
  const x = 668, y = 683, full = save.fed === dayKey(cur.y,cur.m,cur.d) && cur.hour < save.fedHour + 0.75;
  ctx.fillStyle = col([170,60,52], .3+.7*L); ctx.beginPath(); ctx.ellipse(x, y, 11, 4, 0, 0, 7); ctx.fill();
  if (full){ ctx.fillStyle = col([150,110,70], .3+.7*L); ctx.beginPath(); ctx.ellipse(x, y-2, 8, 2.5, 0, 0, 7); ctx.fill(); }
}
function drawItem(L, item){
  if (!item) return; const x = 836, y = 662, k = .3+.7*L;
  if (item.idx === 0){ ctx.strokeStyle = col([44,64,96],k); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y-30); ctx.lineTo(x+8, y+18); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x+11, y+18, 3, 0, Math.PI); ctx.stroke(); }
  else if (item.idx === 1){ ctx.fillStyle = col([214,200,150],k); ctx.fillRect(x-24, y-3, 14, 6); }
  else if (item.idx === 2){ ctx.fillStyle = col([186,44,44],k); ctx.fillRect(x-30, y-3, 22, 4); ctx.fillRect(x-10, y-3, 4, 14); }
  else { ctx.fillStyle = col([70,80,60],k); ctx.fillRect(x-24, y-5, 13, 5); }
}
/* ---------- Objets posés, étagère et traces (lots C et D) ----------
   Le moteur (js/objets.js) décide ; ici on ne fait que dessiner et recevoir les gestes.
   Aperçu de l'Atelier : une trace montrée sans rien enregistrer. */
let apercuTrace = null, apercuGivre = false;

/* ce qui est posé ou laissé, tel que la scène doit le montrer */
function etatObjets(){
  const o = save.objets, ap = apercuTrace;
  if (ap) {
    if (ap.type === 'retour') return { pose: null, tr: null, retour: { trace: ap.trace }, out: false, habitude: false };
    return { pose: null, tr: ap, retour: null, out: !!ap.emprunt, habitude: !!ap.habitude };
  }
  return { pose: o.pose ? o.pose.type : null, tr: o.trace, retour: o.retourTrace, out: !!o.parapluieRetour, habitude: !!(o.trace && o.trace.habitude) };
}

function fil(x, y){ ctx.fillStyle = 'rgba(200,50,44,.95)'; ctx.fillRect(x, y, 2, 2); }          // la trace d'habitude : un fil rouge noué

function dessinThermos(x, base, k, o = {}){
  ctx.fillStyle = col([58,100,96], k); ctx.fillRect(x-4, base-16, 8, 16);
  ctx.fillStyle = col([180,190,186], k); ctx.fillRect(x-4, base-12, 8, 1.2);
  if (o.ouvert){
    ctx.fillStyle = col([30,40,40], k); ctx.fillRect(x-3, base-17, 6, 2);
    ctx.fillStyle = col([220,220,214], k); ctx.fillRect(x+7, base-3, 7, 3);
  } else {
    ctx.fillStyle = col([222,222,214], k); ctx.fillRect(x-4.5, base-19, 9, 3.5);
    if (o.givre){ ctx.fillStyle = `rgba(240,248,255,${.4+.55*k})`; ctx.fillRect(x-5, base-20, 10, 2); ctx.fillRect(x-4, base-16, 8, 1.5); }
  }
  if (o.fil) fil(x-1, base-19);
}
function dessinTasse(x, base, k, renversee){
  ctx.fillStyle = col([236,230,214], k);
  if (renversee){ ctx.fillRect(x-4, base-6, 8, 6); ctx.fillStyle = col([200,194,178], k); ctx.fillRect(x-4, base-6, 8, 1.2); }
  else { ctx.fillRect(x-4, base-6, 8, 6); ctx.fillStyle = col([60,44,34], k); ctx.fillRect(x-3, base-6, 6, 1.6); }
}
function dessinParapluie(x, base, k, o = {}){
  ctx.strokeStyle = col([60,52,46], k); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x, base-4); ctx.lineTo(x+1, base-34); ctx.arc(x+4, base-34, 3, Math.PI, 0.2*Math.PI, true); ctx.stroke();
  ctx.fillStyle = col([44,64,96], k); ctx.beginPath(); ctx.moveTo(x-1, base-8); ctx.lineTo(x-4, base-28); ctx.lineTo(x+3, base-30); ctx.lineTo(x+3, base-8); ctx.closePath(); ctx.fill();
  if (o.neige){ ctx.fillStyle = col(C.snow, .5+.5*k); ctx.beginPath(); ctx.ellipse(x-.5, base-29, 5, 2.4, -.1, 0, 7); ctx.fill(); ctx.fillRect(x-3, base-27, 4, 5); }
  if (o.fil) fil(x+3, base-37);
}

function drawObjets(L, night, snowy){
  const e = etatObjets(), k = .25+.75*L, tr = e.tr, vis = tr && tr.visuel;
  const pose = e.pose;
  /* — l'étagère, dans la fenêtre de droite — */
  const sx = 550, sy = 623;
  ctx.fillStyle = col(C.woodDark, k); ctx.fillRect(sx, sy, 42, 3);
  const thermosEtagere = pose !== 'thermos' && !(tr && tr.type === 'thermos');
  const parapluieEtagere = pose !== 'parapluie' && !(tr && tr.type === 'parapluie') && !e.out && !e.retour;
  if (thermosEtagere){ ctx.fillStyle = col([40,70,68], .5+.5*L); ctx.fillRect(sx+5, sy-13, 6, 13); ctx.fillStyle = col([160,160,154], .5+.5*L); ctx.fillRect(sx+4.5, sy-15, 7, 3); }
  if (parapluieEtagere){ ctx.strokeStyle = col([36,48,70], .5+.5*L); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx+19, sy); ctx.lineTo(sx+23, sy-24); ctx.stroke(); }
  /* le cahier de la gare (駅ノート), debout sur l'étagère, dès la première visite */
  ctx.fillStyle = col([58,92,128], .5+.5*L); ctx.fillRect(sx+12, sy-12, 5, 12); ctx.fillStyle = col([236,232,220], .5+.5*L); ctx.fillRect(sx+12.6, sy-10, 3.8, 1);
  /* la lanterne : allumée si on l'a posée, ou si la nuit a laissé une trace de lumière */
  const lanterneAllumee = pose === 'lumiere' || (tr && tr.type === 'lumiere' && vis !== 'renard' && vis !== 'banc-deplace');
  const lx = sx+33, ly = sy;
  ctx.fillStyle = col([50,44,40], .5+.5*L); ctx.fillRect(lx, ly-12, 8, 12); ctx.fillRect(lx-1, ly-14, 10, 2);
  if (lanterneAllumee){
    const vacille = vis === 'gresille' ? .55 + .45*Math.sin(clock*23)*Math.sin(clock*9) : 1;
    ctx.fillStyle = `rgba(255,214,140,${.9*Math.max(0, vacille)})`; ctx.fillRect(lx+1.5, ly-10, 5, 8);
    glow(lx+4, ly-6, 38, '255,190,110', (.35 + .35*night) * Math.max(0, vacille));
  }
  if (tr && tr.type === 'lumiere' && e.habitude) fil(lx+3, ly-16);
  if (vis === 'chat-vitre'){                          // le chat, enroulé sur l'étagère, derrière la vitre
    ctx.fillStyle = col([52,46,44], .5+.5*L); ctx.beginPath(); ctx.ellipse(sx+17, sy-5, 10, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(sx+26, sy-8, 4, 0, 7); ctx.fill();
    ctx.fillRect(sx+23.5, sy-13, 2, 3); ctx.fillRect(sx+27, sy-13, 2, 3);
  }
  if (vis === 'givre-vitre'){                         // givre en fougère sur la vitre
    ctx.strokeStyle = `rgba(236,246,255,${.35+.5*L})`; ctx.lineWidth = .9;
    for (const [bx, by, dir] of [[550,632,1],[594,632,-1],[550,598,1],[594,598,-1]]){
      for (let i = 0; i < 4; i++){
        const a = (dir > 0 ? -.8 : -Math.PI+.8) - i*.05*dir, len = 22 - i*3;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a)*len*(by>615?1:1), by + (by>615 ? -Math.abs(Math.sin(a))*len : Math.abs(Math.sin(a))*len)); ctx.stroke();
      }
    }
    ctx.fillStyle = `rgba(236,246,255,${.12+.12*L})`; ctx.fillRect(550, 598, 44, 34);
  }
  if (vis === 'renard' || (tr && tr.type === 'lumiere' && vis === 'renard')){        // quelques poils roux sur la marche
    ctx.fillStyle = col([196,110,52], k); for (const [dx, dy] of [[0,0],[3,1],[6,-1],[2,-2]]) ctx.fillRect(490+dx, 682+dy, 2, 1);
  }

  /* — le porte-parapluie, près de la porte — */
  const bx = 536, bb = 680;
  ctx.fillStyle = col([76,86,88], k); ctx.fillRect(bx-9, bb-14, 18, 14); ctx.fillStyle = col([52,60,62], k); ctx.fillRect(bx-10, bb-15, 20, 2);
  const dansLePorte = pose === 'parapluie' || vis === 'plein';
  if (dansLePorte) dessinParapluie(bx, bb-6, k, { neige: vis === 'plein' && tr.contexte && tr.contexte.neige, fil: e.habitude && tr && tr.type === 'parapluie' });
  if (e.retour){
    dessinParapluie(bx, bb-6, k, { fil: false });
    const t = e.retour.trace;
    if (t === 'mandarines'){ ctx.fillStyle = col([232,140,46], k); for (const [dx, dy] of [[12,-3],[17,-3],[14.5,-8]]){ ctx.beginPath(); ctx.arc(bx+dx, bb+dy, 3.2, 0, 7); ctx.fill(); } }
    if (t === 'ticket'){ ctx.fillStyle = col([236,232,214], k); ctx.fillRect(bx+4, bb-36, 8, 5); ctx.fillStyle = col([186,60,52], k); ctx.fillRect(bx+4, bb-36, 8, 1.4); }
    if (t === 'mot-tableau'){ ctx.fillStyle = col([240,238,228], k); ctx.fillRect(386, 654, 12, 9); ctx.fillStyle = col([60,60,70], k); ctx.fillRect(388, 657, 8, .8); ctx.fillRect(388, 659.5, 6, .8); }
  }

}

/* le thermos et les tasses, posés sur le banc (dessinés après le banc, avant les personnages) */
function drawObjetsBanc(L){
  const e = etatObjets(), k = .25+.75*L, tr = e.tr, vis = tr && tr.visuel, pose = e.pose;
  const tbx = 782, tbb = 661;
  if (pose === 'thermos') dessinThermos(tbx, tbb, k);
  if (tr && tr.type === 'thermos'){
    const f = e.habitude;
    if (vis === 'tasse-retournee'){ dessinThermos(tbx, tbb, k, { fil: f }); dessinTasse(tbx+12, tbb, k, true); }
    else if (vis === 'refermé'){ ctx.fillStyle = col([236,234,226], k); ctx.fillRect(tbx-6, tbb-1.4, 12, 1.4); dessinThermos(tbx, tbb-1.4, k, { fil: f }); }
    else if (vis === 'tasse-banc'){ dessinThermos(tbx, tbb, k, { fil: f }); dessinTasse(751, tbb, k, false); }
    else if (vis === 'couvercle-givre'){ dessinThermos(tbx, tbb, k, { givre: !!(tr.contexte && tr.contexte.gel) || apercuTrace, fil: f }); }
    else if (vis === 'tasse-rincee'){ dessinThermos(tbx, tbb, k, { fil: f }); dessinTasse(tbx+12, tbb, k, true); ctx.fillStyle = 'rgba(190,214,236,.8)'; ctx.fillRect(tbx+12, tbb+.5, 1, 2); ctx.fillRect(tbx+16, tbb+1, 1, 2); }
    else if (vis === 'ouvert-vide'){ dessinThermos(tbx, tbb, k, { ouvert: true, fil: f }); }
  }
}

/* le banc déplacé par quelqu'un qui s'est abrité */
const bancDecale = () => { const e = etatObjets(); return e.tr && e.tr.visuel === 'banc-deplace' ? 14 : 0; };

/* empreintes dans la neige : direction, et effacement selon la neige réelle tombée depuis */
const PAS_TRACES = { ecolier: [1180, 505, 3.2, 9], botte: [1255, 640, 4.4, 13], 'botte-porte': [720, 500, 4.4, 13], renard: [1100, 575, 2.4, 15] };
function empreintesVisibles(snowy){
  const tr = etatObjets().tr;
  if (!tr || !tr.empreintes || !snowy || !PAS_TRACES[tr.empreintes]) return null;
  const etat = apercuTrace ? 'net' : OBJ.empreinte(magasin, tr.quand, Date.now()).etat;
  if (etat === 'aucune' || etat === 'efface') return null;
  return { tr, etat, spec: PAS_TRACES[tr.empreintes] };
}
function drawEmpreintes(L, snowy){
  const v = empreintesVisibles(snowy); if (!v) return;
  const [a, b, taille, pas] = v.spec, dir = v.tr.sens >= 0 ? -1 : 1;     // sens 1 : vers la gare
  const x0 = Math.min(a, b), x1 = Math.max(a, b);
  ctx.fillStyle = col([128,140,168], .35+.65*L, v.etat === 'net' ? .8 : .3);
  let i = 0;
  for (let x = x0; x <= x1; x += pas, i++){
    const y = 679 + (i % 2 ? 2.4 : -1.2);
    ctx.beginPath(); ctx.ellipse(x, y, taille, taille*.45, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + dir*taille*.9, y, taille*.45, taille*.3, 0, 0, 7); ctx.fill();
  }
}

/* ---------- La nuit et le petit matin (lot F) ----------
   Les événements viennent de js/vie.js (data/monde.js, NUIT) : routine quotidienne, et événements qui n'arrivent que s'ils ont une cause
   réelle. L'Atelier peut en faire passer un, sans rien enregistrer (aperçu). */
let apercuNuit = null, apercuApres = null;
const NUITS = {};
function nuitsDuJour(w){
  const k = dayKey(w.y,w.m,w.d) + ':' + magasin.nombre();
  if (!NUITS[k]){ for (const c of Object.keys(NUITS)) delete NUITS[c]; NUITS[k] = VIE.nuitsDuJour(NUIT, w.y,w.m,w.d, magasin); }
  return NUITS[k];
}
const APERCU_NUIT = { livreur: 14, chasseNeige: 18, cheminotQuai: 45, cerfs: 32, renard: 30 };
function nuitEtat(w, sun){
  const l = nuitsDuJour(w), h = w.hour;
  const cours = id => { for (const x of l) if (x.id === id && x.fin != null && h >= x.debut && h < x.fin) return { ...x, k: (h - x.debut)/(x.fin - x.debut) }; return null; };
  const fini = id => l.filter(x => x.id === id && x.fin != null && x.fin <= h && x.debut > h - 24).pop() || null;
  const e = { livreur: cours('livreur'), chasseNeige: cours('chasseNeige'), quai: cours('cheminotQuai'), cerfs: cours('cerfs'), renard: cours('renard') };
  /* la fenêtre de ferme : allumée vers 4 h 30, jusqu'au lever du soleil */
  const f = l.find(x => x.id === 'ferme' && x.debut <= h && x.debut > h - 12);
  e.ferme = !!f && sun.elev < 0;
  /* le bourrelet laissé par le chasse-neige, et le quai dégagé, restent tant qu'il n'est pas retombé 1 cm de neige réelle */
  const tenu = x => x && VIE.neigeTombee(magasin, jstMs(w.y,w.m,w.d,x.fin), jstMs(w.y,w.m,w.d,h)) < 1;
  const ch = fini('chasseNeige'), q = fini('cheminotQuai');
  e.bourrelet = tenu(ch); e.quaiDegage = tenu(q);
  if (apercuNuit){
    const k = (clock - apercuNuit.t0) / APERCU_NUIT[apercuNuit.id];
    const cle = { livreur: 'livreur', chasseNeige: 'chasseNeige', cheminotQuai: 'quai', cerfs: 'cerfs', renard: 'renard' }[apercuNuit.id];
    if (k < 1) e[cle] = { id: apercuNuit.id, k, n: 3, apercu: true };
    else { apercuApres = apercuNuit.id; apercuNuit = null; }
  }
  if (apercuApres === 'chasseNeige') e.bourrelet = true;
  if (apercuApres === 'cheminotQuai') e.quaiDegage = true;
  return e;
}

/* la route du passage à niveau, vue de face : elle vient vers nous */
const RX = 1230;      // le poteau du passage à niveau (1262) est au bord droit de la route
function drawRoute(L, snowy, nuit){
  const k = .22+.6*L;
  ctx.fillStyle = col(snowy ? [176,182,192] : [74,74,78], k);
  ctx.beginPath(); ctx.moveTo(RX-30, 668); ctx.lineTo(RX+30, 668); ctx.lineTo(RX+96, 900); ctx.lineTo(RX-96, 900); ctx.closePath(); ctx.fill();
  if (!snowy){ ctx.fillStyle = col([200,196,170], k, .6); for (let i=0;i<5;i++){ const y = 690 + i*44, w2 = 1.2 + i*.5; ctx.fillRect(RX - w2, y, w2*2, 14 + i*4); } }
  if (snowy && nuit.bourrelet){                     // le bourrelet du chasse-neige, de chaque côté de la route
    ctx.fillStyle = col(C.snow, .45+.55*L);
    for (const [dx, y, rx, ry] of [[-46, 700, 24, 9], [-70, 740, 30, 12], [50, 702, 26, 9], [76, 744, 32, 12]]){ ctx.beginPath(); ctx.ellipse(RX+dx, y, rx, ry, 0, Math.PI, 0); ctx.fill(); }
  }
}
/* le platelage du passage à niveau, sur les rails */
function drawPlatelage(L, snowy){
  ctx.fillStyle = col([112,104,94], .25+.75*L); ctx.fillRect(RX-30, 646, 60, 22);
  ctx.fillStyle = col([80,74,68], .25+.75*L); for (let x = RX-28; x < RX+30; x += 8) ctx.fillRect(x, 646, 1, 22);
  if (snowy){ ctx.fillStyle = col(C.snow, .4+.6*L, .7*snowCover); ctx.fillRect(RX-30, 646, 60, 6); }
}
/* un véhicule qui franchit le passage à niveau et vient vers nous : k de 0 (sur la voie) à 1 (hors de l'image) */
function drawVehicule(type, k, L, night){
  const y = lerp(664, 980, k), sc = lerp(.5, 1.8, k*k), x = RX + k*14;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  const kk = .3+.7*L;
  if (type === 'livreur'){                          // le scooter du livreur de journaux, panier de journaux à l'avant, phare allumé
    glow(0, -22, 160, '255,244,214', .28*Math.max(.4, night));
    ctx.fillStyle = col([30,30,34], kk); ctx.fillRect(-3, -12, 6, 12);
    ctx.fillStyle = col([170,40,40], kk); ctx.fillRect(-9, -30, 18, 16);
    ctx.fillStyle = col([200,200,196], kk); ctx.fillRect(-11, -26, 22, 9); ctx.fillStyle = col([236,234,226], kk); ctx.fillRect(-9, -25, 18, 3);
    ctx.fillStyle = col([44,48,66], kk); ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(10, -30); ctx.lineTo(8, -56); ctx.lineTo(-8, -56); ctx.fill();
    ctx.fillStyle = col([232,232,226], kk); ctx.beginPath(); ctx.arc(0, -62, 8, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,228,.98)'; ctx.beginPath(); ctx.arc(0, -33, 3.6, 0, 7); ctx.fill();
  } else {                                          // le chasse-neige routier : lame, gyrophare, phares
    const tour = Math.floor(clock*3) % 2;
    glow(0, -26, 220, '255,240,200', .3*Math.max(.4, night));
    glow(0, -66, 70, '255,160,40', tour ? .7 : .25);
    ctx.fillStyle = col([214,150,40], kk); ctx.fillRect(-30, -58, 60, 40);
    ctx.fillStyle = col([40,44,52], kk); ctx.fillRect(-24, -54, 48, 16);
    ctx.fillStyle = 'rgba(250,212,150,.7)'; ctx.fillRect(-22, -52, 44, 12);
    ctx.fillStyle = col([255,170,40], 1, tour ? 1 : .5); ctx.fillRect(-5, -64, 10, 6);
    ctx.fillStyle = col([60,62,68], kk); ctx.fillRect(-26, -18, 12, 18); ctx.fillRect(14, -18, 12, 18);
    ctx.fillStyle = col([110,112,118], kk); ctx.beginPath(); ctx.moveTo(-52, -6); ctx.lineTo(52, -16); ctx.lineTo(52, 2); ctx.lineTo(-52, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,228,.98)'; for (const dx of [-20, 20]){ ctx.beginPath(); ctx.arc(dx, -26, 3.4, 0, 7); ctx.fill(); }
    if (snowCover > .2 && Math.random() < .5) puff(x + 52*sc, y - 8*sc, 'breath');
  }
  ctx.restore();
}
/* la ferme sur l'autre rive : sa fenêtre s'allume vers 4 h 30, jusqu'au lever du soleil */
function drawFerme(L, allumee, snowy){
  const fx = 1036, base = 548, k = .3+.7*L;
  ctx.fillStyle = col(mix(TREES[0], [20,24,30], .5), k); ctx.fillRect(fx, base-14, 34, 14);
  ctx.beginPath(); ctx.moveTo(fx-4, base-14); ctx.lineTo(fx+17, base-25); ctx.lineTo(fx+38, base-14); ctx.fill();
  if (snowy){ ctx.fillStyle = col(C.snow, .35+.65*L, .8); ctx.beginPath(); ctx.moveTo(fx-4, base-14); ctx.lineTo(fx+17, base-25); ctx.lineTo(fx+38, base-14); ctx.lineTo(fx+30, base-15); ctx.lineTo(fx+17, base-22); ctx.lineTo(fx+4, base-15); ctx.fill(); }
  if (allumee){ ctx.fillStyle = 'rgba(255,214,140,.95)'; ctx.fillRect(fx+8, base-10, 5, 4); glow(fx+10, base-8, 16, '255,200,120', .5); streak(fx+10, 552, 4, 34, '255,214,140', .25); }
}
/* le renard, près de la salle d'attente ; les cerfs, sur la voie, qui s'arrêtent sous la lampe (yeux qui brillent) */
function posRenard(k){ return k < .35 ? lerp(150, 470, k/.35) : k < .75 ? 470 : lerp(470, 150, (k-.75)/.25); }
function posCerf(k, i){ const b = k < .4 ? lerp(1500, 760, k/.4) : k < .7 ? 760 : lerp(760, 150, (k-.7)/.3); return b + i*44; }
function drawRenard(v, L, night){
  const k = v.k, x = posRenard(k), arret = k >= .35 && k < .75, f = k < .35 ? 1 : -1;
  drawBete('renard', x, 684, f, !arret, arret, L, night);
}
function drawCerfs(v, L, night){
  const arret = v.k >= .4 && v.k < .7;
  for (let i = 0; i < (v.n || 1); i++) drawBete('cerf', posCerf(v.k, i), 664, -1, !arret, arret, L, night);
}
function drawBete(id, x, y, f, marche, regarde, L, night){
  const k = .3+.7*L, pas = marche ? Math.sin(clock*9)*3 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.lineCap = 'round';
  if (id === 'renard'){
    const c = col([182,98,48], k);
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    for (const [lx, s] of [[-9,1],[-6,-1],[7,1],[10,-1]]){ ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx + s*pas*.6, 0); ctx.stroke(); }
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -11, 13, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, -12); ctx.quadraticCurveTo(-26, -10, -30, -4); ctx.lineTo(-24, -6); ctx.quadraticCurveTo(-20, -9, -12, -9); ctx.fill();
    ctx.fillStyle = col([236,230,220], k); ctx.beginPath(); ctx.arc(-29, -4.5, 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(20, -12); ctx.lineTo(13, -8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11, -14); ctx.lineTo(12, -20); ctx.lineTo(15, -14); ctx.fill();
    if (night > .4) glow(17, -12.5, 6, '220,255,170', regarde ? .9 : .5);
  } else {
    const c = col([118,88,64], k);
    ctx.strokeStyle = c; ctx.lineWidth = 2.6;
    for (const [lx, s] of [[-16,1],[-12,-1],[14,1],[18,-1]]){ ctx.beginPath(); ctx.moveTo(lx, -24); ctx.lineTo(lx + s*pas*.8, 0); ctx.stroke(); }
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -30, 23, 9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col([232,226,214], k); ctx.beginPath(); ctx.ellipse(-21, -31, 4, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(14, -36); ctx.lineTo(24, -54); ctx.lineTo(30, -50); ctx.lineTo(20, -30); ctx.fill();
    if (regarde){ ctx.beginPath(); ctx.ellipse(27, -55, 5, 6, 0, 0, 7); ctx.fill(); }      // la tête tournée vers nous
    else { ctx.beginPath(); ctx.ellipse(31, -52, 7, 3.6, .4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = col([196,180,150], k); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(26, -58); ctx.lineTo(22, -70); ctx.moveTo(24, -64); ctx.lineTo(18, -68); ctx.moveTo(28, -58); ctx.lineTo(32, -70); ctx.stroke();
    if (night > .3){ if (regarde){ glow(25, -56, 9, '226,255,190', .95); glow(29.5, -56, 9, '226,255,190', .95); } else glow(34, -53, 6, '220,255,170', .5); }
  }
  ctx.restore();
}

/* ---------- Provisoire, hors cahier : pas des habitués et des bêtes dans la neige ----------
   Les pas ne restent que s'il y avait de la neige réelle au sol au moment du passage, et s'effacent avec la neige tombée depuis
   (OBJ.empreinte, comme les traces des objets). Avec une météo simulée par l'Atelier, ils se montrent dès que la neige couvre le quai. */
function etatPas(quandMs, w){
  if (vue.meteo.source === 'simulee') return snowCover > .25 ? 'net' : null;
  const e = OBJ.empreinte(magasin, quandMs, jstMs(w.y,w.m,w.d,w.hour)).etat;
  return e === 'net' || e === 'estompe' ? e : null;
}
/* chaque piste : [début, fin, y, taille, pas, forme, quand (heure du jour), qui] */
function pistesDuJour(w){
  if (!prov() || snowCover < .25) return [];
  const out = [], h = w.hour;
  if (jourDecole(w.y,w.m,w.d)){
    if (h >= 16.46) out.push([900, 1280, 685, 3, 9, 'chaussure', 16.36, 'ecolier']);
    else if (h >= 7.8) out.push([1260, 940, 685, 3, 9, 'chaussure', 7.5, 'ecolier']);
  }
  const banc = dayPlan(w.y,w.m,w.d).cat.find(c => c.spot === 'bench' && c.from <= h);
  if (banc && !VIE.chatAbrite(RG, vue.meteo)) out.push([1190, 822, 676, 1.5, 7, 'patte', banc.from, 'chat']);
  const r = VIE.dernier(NUIT, 'renard', w.y,w.m,w.d,h, magasin), c = VIE.dernier(NUIT, 'cerfs', w.y,w.m,w.d,h, magasin);
  if (r) out.push([150, 470, 684, 2, 12, 'patte', r.debut, 'renard']);
  if (c) out.push([1500, 150, 647, 2, 16, 'sabot', c.debut, 'cerfs']);
  return out.map(p => ({ p, etat: etatPas(jstMs(w.y,w.m,w.d,p[6]), w) })).filter(x => x.etat);
}
function drawPistes(L, w){
  for (const { p, etat } of pistesDuJour(w)){
    const [a, b, y, taille, pas, forme] = p, dir = b > a ? 1 : -1, x0 = Math.min(a, b), x1 = Math.max(a, b);
    ctx.fillStyle = col([128,140,168], .35+.65*L, etat === 'net' ? .75 : .3);
    let i = 0;
    for (let x = x0; x <= x1; x += pas, i++){
      const yy = y + (i % 2 ? 1.6 : -.8);
      if (forme === 'chaussure'){ ctx.beginPath(); ctx.ellipse(x, yy, taille, taille*.45, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + dir*taille*.9, yy, taille*.45, taille*.3, 0, 0, 7); ctx.fill(); }
      else if (forme === 'sabot'){ ctx.beginPath(); ctx.ellipse(x - 1.2, yy, taille*.5, taille*.8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 1.2, yy, taille*.5, taille*.8, 0, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, yy, taille, 0, 7); ctx.fill(); }
    }
  }
}
/* papillons de nuit autour de la lampe allumée, les nuits chaudes */
function drawPapillons(info){
  if (!prov() || !info.lampOn || info.night < .5 || vue.meteo.source === 'inconnue' || vue.meteo.temp == null || vue.meteo.temp < NUIT.papillons.tempMin || wx.rain > .1) return;
  ctx.fillStyle = 'rgba(255,244,214,.85)';
  for (let i = 0; i < 6; i++){ const a = clock*(1.7+i*.31) + i*1.9, r = 9 + (i*5)%13; ctx.fillRect(694 + Math.cos(a)*r*1.4, 560 + Math.sin(a*1.3)*r*.7, 1.6, 1.6); }
}

/* givre sur le banc et les rails : sous 0 °C, air humide, mesures réelles seulement */
function givreActif(){
  const m = vue.meteo;
  return apercuGivre || (m.source === 'reelle' && m.temp != null && m.temp < 0 && m.hum != null && m.hum >= 80);
}
function drawGivre(L, avecRails){
  if (!givreActif()) return;
  ctx.fillStyle = `rgba(236,244,255,${.35+.5*L})`;
  ctx.fillRect(740, 660, 92, 1.4); ctx.fillRect(740, 641, 92, 1); ctx.fillRect(740, 649, 92, .8);
  if (avecRails){ ctx.fillRect(0, 650.4, 1600, 1.1); ctx.fillRect(0, 660.4, 1600, 1.1); }
}

function drawDebris(L, season, info){
  const amount = info.debris * (1 - clamp(snowCover*1.6, 0, 1)); if (amount <= .02) return;
  const n = Math.floor(LEAVES.length * amount), c = DEBRIS[season], cut = sweep ? 240 + sweep.t/1.2*960 : -1;
  ctx.fillStyle = col(c, .3+.7*L);
  for (let i=0;i<n;i++){ const l = LEAVES[i]; if (l.x < cut) continue; ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a); ctx.beginPath(); ctx.ellipse(0,0,3.4*l.s,1.8*l.s,0,0,7); ctx.fill(); ctx.restore(); }
  if (sweep){ ctx.strokeStyle = col([150,120,70], .3+.7*L); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cut, 650); ctx.lineTo(cut+8, 686); ctx.stroke(); }
}
function drawSign(L, night, snowy){
  const x0 = 860, y0 = 604, w = 150, h = 46, k = Math.max(.25+.75*L, night > .35 ? .75 : 0);
  ctx.fillStyle = col([60,60,64], .25+.75*L); ctx.fillRect(x0+18, y0+h, 4, 682-y0-h); ctx.fillRect(x0+w-22, y0+h, 4, 682-y0-h);
  ctx.fillStyle = col(C.sign, k); ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = col(C.signBar, k); ctx.fillRect(x0, y0+h-9, w, 9);
  ctx.fillStyle = col([30,32,38], k); ctx.textAlign = 'center';
  ctx.font = '500 9px "Zen Kaku Gothic New", sans-serif'; ctx.fillText('なごり', x0+w/2, y0+11);
  ctx.font = '700 20px "Shippori Mincho", serif'; ctx.fillText('名残', x0+w/2, y0+30);
  ctx.fillStyle = col([240,240,236], k); ctx.font = '500 7px "Zen Kaku Gothic New", sans-serif'; ctx.fillText('Nagori', x0+w/2, y0+h-2.5);
  ctx.textAlign = 'left'; ctx.fillText('←', x0+6, y0+h-2.5); ctx.textAlign = 'right'; ctx.fillText('→', x0+w-6, y0+h-2.5); ctx.textAlign = 'left';
  if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.beginPath(); ctx.ellipse(x0+w/2, y0, w/2+2, 3+snowCover*3, 0, Math.PI, 0); ctx.fill(); }
  /* provisoire, hors cahier : les derniers jours, des fleurs déposées au pied du panneau */
  if (prov() && curFerm && curFerm.prov.fleurs){
    const bx = x0+w-30, by = 682, kk = .3+.7*L;
    ctx.strokeStyle = col([70,100,60], kk); ctx.lineWidth = 1.2; for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+i*3, by-14); ctx.stroke(); }
    ctx.fillStyle = col([236,232,222], kk); ctx.beginPath(); ctx.moveTo(bx-5, by); ctx.lineTo(bx-8, by-10); ctx.lineTo(bx+8, by-10); ctx.lineTo(bx+5, by); ctx.fill();
    for (const [dx, c] of [[-6,[214,92,100]],[-2,[240,214,90]],[3,[226,226,236]],[7,[200,120,170]]]){ ctx.fillStyle = col(c, kk); ctx.beginPath(); ctx.arc(bx+dx, by-15-Math.abs(dx)*.3, 2.4, 0, 7); ctx.fill(); }
  }
}
function drawCat(spot, L, night){
  const [x,y] = CAT_POS[spot], k = .3+.7*L, c = col([66,58,54],k);
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
  if (spot === 'bowl'){
    ctx.beginPath(); ctx.ellipse(x+12, y-9, 10, 8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x+2, y-6, 5, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x+21, y-6); ctx.quadraticCurveTo(x+32, y-4, x+30, y-16); ctx.stroke();
  } else {
    const br = Math.sin(clock*1.5)*.6;
    ctx.beginPath(); ctx.ellipse(x, y-6, 13, 6.5+br, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x-11, y-9, 5.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-15, y-12); ctx.lineTo(x-14, y-18); ctx.lineTo(x-11, y-14); ctx.moveTo(x-10, y-14); ctx.lineTo(x-7, y-18); ctx.lineTo(x-6, y-12); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x+12, y-3); ctx.quadraticCurveTo(x+18, y+1, x+6, y+1); ctx.stroke();
    if (night > .4){ ctx.fillStyle = 'rgba(214,236,140,.8)'; ctx.fillRect(x-13, y-10, 1.6, 1); }
  }
}

/* personnages : silhouettes de profil à deux tons, chacun avec son objet */
const LOOK = {
  traveler: { coat:[52,58,78], coat2:[42,46,62], scarf:[150,64,58], hair:[34,30,30], h:1 },
  kid:      { coat:[32,34,44], coat2:[24,26,34], scarf:[60,90,150], hair:[22,20,22], h:.9 },
  lady:     { coat:[112,84,104], coat2:[92,68,86], scarf:[180,160,120], hair:[196,196,200], h:.84 },
  worker:   { coat:[52,64,92], coat2:[40,50,74], scarf:[230,120,40], hair:[30,30,30], h:.92 }
};
function figure(p, y, L, night){
  const k = .32+.68*L, look = LOOK[p.kind], winter = tempNow() < 6;
  ctx.save(); ctx.globalAlpha = Math.max(0, p.fade == null ? 1 : p.fade); ctx.translate(p.x, y);
  const sc = look.h; ctx.scale(sc*(p.face===1?-1:1), sc);
  const C1 = col(look.coat,k), C2 = col(look.coat2,k), skin = col([214,182,150],k), hair = col(look.hair,k);
  const ph = p.phase != null ? p.phase : clock*7;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (night > .3) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 1, 13, 3, 0, 0, 7); ctx.fill(); }
  if (p.sit){
    ctx.strokeStyle = C2; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-2,-20); ctx.lineTo(13,-20); ctx.lineTo(14,-2); ctx.stroke();
    ctx.fillStyle = col([30,28,30],k); ctx.fillRect(12,-3,8,3);
    ctx.fillStyle = C1; ctx.beginPath(); ctx.moveTo(-10,-54); ctx.quadraticCurveTo(0,-60,8,-52); ctx.lineTo(10,-20); ctx.lineTo(-11,-18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C2; ctx.beginPath(); ctx.moveTo(2,-48); ctx.quadraticCurveTo(10,-36,16,-26); ctx.lineTo(12,-23); ctx.quadraticCurveTo(4,-34,-1,-44); ctx.fill();
    ctx.fillStyle = col(look.scarf,k); ctx.fillRect(-7,-56,14,5);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(1,-63,7,0,7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(-1,-65,7.4,Math.PI*.95,Math.PI*2.05); ctx.fill();
    if (p.kind==='lady'){ ctx.beginPath(); ctx.arc(-5,-69,3.6,0,7); ctx.fill(); ctx.fillStyle = col([60,92,140],k); ctx.fillRect(6,-30,15,11); ctx.fillStyle = col([230,220,190],k); ctx.fillRect(10,-30,3,11); }
    else { ctx.fillStyle = col([110,74,50],k); ctx.fillRect(20,-16,16,14); ctx.fillStyle = col([80,52,36],k); ctx.fillRect(26,-19,4,3); }
  } else {
    const a = p.walk ? Math.sin(ph)*.42 : 0, bob = p.walk ? Math.abs(Math.sin(ph))*1.5 : 0;
    ctx.translate(0, -bob);
    for (const s of [1,-1]){ ctx.strokeStyle = s>0 ? C2 : C1; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(Math.sin(a*s)*13, -1); ctx.stroke(); ctx.fillStyle = col([30,28,30],k); ctx.fillRect(Math.sin(a*s)*13-3, -3, 8, 3); }
    const lean = p.kind==='lady' ? 4 : 0;
    ctx.fillStyle = C1; ctx.beginPath();
    if (p.kind==='kid'){ ctx.moveTo(-9,-58); ctx.lineTo(9,-58); ctx.lineTo(10,-26); ctx.lineTo(-10,-26); }
    else { ctx.moveTo(-9+lean,-58); ctx.quadraticCurveTo(lean,-62,9+lean,-58); ctx.lineTo(13,-22); ctx.lineTo(-12,-22); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(2+lean,-54); ctx.lineTo(4+lean - a*10, -34); ctx.stroke();
    if (winter || p.kind==='worker'){ ctx.fillStyle = col(look.scarf,k); ctx.fillRect(-7+lean,-61,14,(p.kind==='worker'?0:5)); }
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(1+lean,-67,7,0,7); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(-1+lean,-69,7.4,Math.PI*.95,Math.PI*2.05); ctx.fill();
    if (p.kind==='lady'){ ctx.beginPath(); ctx.arc(-5+lean,-73,3.6,0,7); ctx.fill(); ctx.strokeStyle = col([80,60,44],k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12,-36); ctx.lineTo(18,-1); ctx.stroke(); ctx.fillStyle = col([60,92,140],k); ctx.fillRect(-14,-36,12,10); }
    if (p.kind==='kid'){ ctx.fillStyle = col([200,200,204],k); ctx.fillRect(-2,-58,6,3); ctx.strokeStyle = col([40,60,110],k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6,-57); ctx.lineTo(10,-34); ctx.stroke(); ctx.fillStyle = col([40,60,110],k); ctx.fillRect(6,-38,13,11); }
    if (p.hat){ ctx.fillStyle = col([176,58,50],k); ctx.beginPath(); ctx.arc(1+lean,-69,7.8,Math.PI,0); ctx.fill(); ctx.fillRect(-7+lean,-70,16,3); ctx.beginPath(); ctx.arc(1+lean,-78,2.4,0,7); ctx.fill(); }
    if (p.umbrella){                                  // parapluie ouvert (trait provisoire) : jaune pour l'écolier, prune pour la vieille dame
      const uc = p.kind==='kid' ? [222,186,58] : [96,62,86];
      ctx.strokeStyle = col([60,56,52],k); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(7+lean,-40); ctx.lineTo(3+lean,-96); ctx.stroke();
      ctx.fillStyle = col(uc,k); ctx.beginPath(); ctx.moveTo(-21+lean,-88); ctx.quadraticCurveTo(3+lean,-112,27+lean,-88); ctx.closePath(); ctx.fill();
      if (snowCover > .25 || wx.snow > .3){ ctx.fillStyle = col(C.snow, .45+.55*L, .9); ctx.beginPath(); ctx.ellipse(3+lean,-100,13,3.5,0,Math.PI,0); ctx.fill(); }
    }
    if (p.kind==='traveler'){
      ctx.strokeStyle = col([40,40,44],k); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(14,-34); ctx.lineTo(16,-14); ctx.stroke();
      ctx.fillStyle = col([110,74,50],k); ctx.fillRect(13,-16,15,15);
      if (wx.rain > .3){ ctx.strokeStyle = col([40,44,60],k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3,-54); ctx.lineTo(-3,-92); ctx.stroke(); ctx.fillStyle = col([70,40,52],k); ctx.beginPath(); ctx.arc(-3,-92,24,Math.PI,0); ctx.fill(); }
    }
    if (p.kind==='worker'){
      ctx.fillStyle = col([238,238,232],k); ctx.beginPath(); ctx.arc(1,-71,8.4,Math.PI,0); ctx.fill(); ctx.fillRect(-8,-71,18,2.5);
      ctx.fillStyle = col([236,124,40],k); ctx.fillRect(-9,-56,18,4); ctx.fillRect(-10,-44,20,3);
      if (p.shovel){                                  // la pelle à neige, au passage à niveau
        const a = Math.sin(clock*2.6)*.35;
        ctx.save(); ctx.translate(6,-38); ctx.rotate(.5 + a); ctx.strokeStyle = col([120,88,60],k); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,36); ctx.stroke();
        ctx.fillStyle = col([70,96,140],k); ctx.fillRect(-7,34,14,8); ctx.restore();
        if (a > .3 && Math.random() < .3) puff(p.x - 26*sc, y - 6, 'breath');
      }
      else if (p.clipboard){ ctx.fillStyle = col([150,120,84],k); ctx.fillRect(8,-46,11,14); ctx.fillStyle = col([240,238,230],k); ctx.fillRect(9.5,-44,8,10); }
      else { ctx.strokeStyle = col([90,90,96],k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6,-34); ctx.lineTo(16,-50); ctx.stroke(); ctx.fillStyle = col([90,90,96],k); ctx.fillRect(13,-54,8,4); }
      if (p.lantern){ ctx.fillStyle = 'rgba(255,214,140,.95)'; ctx.fillRect(-20,-32,7,9); glow(-16,-28,70,'255,214,140',.5); }
    }
    if (winter && tempNow() < 3 && Math.random() < .02) puff(p.x + (p.face===1?-8:8)*sc, y - 66*sc, 'breath');
  }
  ctx.restore();
}
/* herbes du premier plan, selon la saison */
function drawTufts(L, season, snowy, wind){
  const c = snowy ? [180,190,200] : season===2 ? [168,140,90] : season===3 ? [130,130,120] : [70,110,64];
  ctx.strokeStyle = col(c, .25+.6*L, snowy ? .5 : .9); ctx.lineWidth = 1.4;
  for (const t of GRASS_TUFTS){ const sw = Math.sin(clock*1.2 + t.s*6)*(1+wind*3); ctx.beginPath(); for (const d of [-3,0,3]){ ctx.moveTo(t.x+d, t.y); ctx.quadraticCurveTo(t.x+d+sw*.5, t.y-t.h*.6, t.x+d*1.6+sw, t.y-t.h); } ctx.stroke(); }
  if (season===2 && !snowy){ ctx.fillStyle = col([220,206,170], .3+.6*L, .9); for (const t of GRASS_TUFTS) if (t.s > .7){ const sw = Math.sin(clock*1.2 + t.s*6)*(1+wind*3); ctx.beginPath(); ctx.ellipse(t.x+sw*1.3, t.y-t.h-4, 2, 6, .3, 0, 7); ctx.fill(); } }
}
/* le jardin, au premier plan devant la lampe */
function drawGarden(L, season, snowy, wind){
  const bx = 560, by = 768, bw = 180;
  ctx.fillStyle = col(C.soil, .2+.8*L); ctx.beginPath(); ctx.ellipse(bx+bw/2, by+12, bw/2, 15, 0, 0, 7); ctx.fill();
  ctx.fillStyle = col([108,82,58], .2+.8*L); for (let i=0;i<7;i++) ctx.fillRect(bx-4+i*31, by-18, 5, 32);
  ctx.fillRect(bx-4, by-10, 192, 3);
  if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.beginPath(); ctx.ellipse(bx+bw/2, by+8, bw/2, 9+snowCover*4, 0, 0, 7); ctx.fill(); for (let i=0;i<7;i++) ctx.fillRect(bx-5+i*31, by-21, 7, 3); }
  const g = Math.min(14, save.growth), px = bx+bw/2, hgt = 28 + g*6;
  ctx.strokeStyle = col([70,92,56], .25+.75*L); ctx.lineWidth = 3; ctx.lineCap = 'round';
  const sway = Math.sin(clock*.8)*2*(1+wx.storm*2+wind*2);
  ctx.beginPath(); ctx.moveTo(px, by+8); ctx.quadraticCurveTo(px-6, by-hgt*.5, px+sway, by-hgt); ctx.stroke();
  const branches = 2 + Math.floor(g/2);
  for (let i=0;i<branches;i++){
    const t = .35 + i/(branches+1)*.6, yy = by - hgt*t, dir = i%2 ? 1 : -1, len = 14 + g*1.2, bx2 = px+sway*t+dir*len;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px+sway*t, yy); ctx.lineTo(bx2, yy-8); ctx.stroke();
    if (season !== 3){ ctx.fillStyle = col(FOLIAGE[season], .25+.75*L); ctx.beginPath(); ctx.ellipse(bx2, yy-10, 9, 6, dir*.4, 0, 7); ctx.fill(); }
    if (season===0 && i%2===0){ ctx.fillStyle = col([240,186,198], .3+.7*L); ctx.beginPath(); ctx.arc(bx2-dir*6, yy-16, 3.5, 0, 7); ctx.fill(); }
    if (snowy){ ctx.fillStyle = col(C.snow, .42+.58*L); ctx.fillRect(bx2-6, yy-12, 10, 3); }
  }
  if (water){
    water.t += .016; ctx.fillStyle = 'rgba(170,210,240,.85)';
    for (let i=0;i<12;i++){ const k = (water.t*1.6 + i/12) % 1; ctx.beginPath(); ctx.arc(px-40 + i*7 + k*10, by - hgt - 30 + k*(hgt+30), 2.2, 0, 7); ctx.fill(); }
    if (water.t > 1.4) water = null;
  }
}

/* ---------- État ---------- */
/* Le point de vue : l'instant et la météo que la scène dessine (meteo.js). Chaque image le recalcule ;
   le récit de l'absence pourra en fournir d'autres. Sa météo porte toujours sa source. */
let vue = MET.pointDeVue({ simulated:false }, MET.inconnue('attente'));
const wx = { cloud:.3, rain:0, snow:0, fog:0, storm:0 };
let flash = 0, lastFrame = performance.now(), clock = 0;
const train = { phase:'idle', x:2000, t:0, stop:true, traveler:false };
const STOP_X = 560, CAR = 300, GAP = 0;
const trav = { state:'none', x:0, walk:0, alpha:1 };
let water = null, sweep = null, purr = null, lastTrainKey = null, panelStep = 0, cur = null, curFerm = null;

function kindNow(){ return vue.meteo.kind; }

/* ---------- Trains ---------- */
/* la sonnerie du passage à niveau commence avant que le train n'apparaisse (t négatif) */
const BELL_LEAD = 8, CROSSING_X = 1262, PX_PER_M = 12.9;
function startTrain(opts){ if (train.phase !== 'idle') return false; Object.assign(train, {phase: opts.stop ? 'in' : 'pass', t:-BELL_LEAD, x:1750, prevX:1750, v:0, stop:opts.stop, traveler:!!opts.traveler, said:{}}); return true; }
const easeOut = t => 1-Math.pow(1-t,3), easeIn = t => t*t*t;
function updateTrain(dt){
  if (train.phase==='idle') return;
  train.t += dt;
  const T0 = Math.max(0, train.t), once = k => { if (train.said[k]) return false; train.said[k] = true; return true; };
  const pan = clamp((train.x + CAR/2 - 790) / 900, -1, 1);
  if (train.phase==='pass'){ train.x = 1750 - T0*300; if (train.t > -1.2 && once('horn')) son.event('horn', {pan: .8}); if (train.x < -800) train.phase='idle'; }
  else if (train.phase==='in'){ const k=Math.min(1,T0/7); train.x = 1750 + (STOP_X-1750)*easeOut(k); if (k > .55 && once('brake')) son.event('brake', {pan}); if (k>=1){ train.phase='stop'; train.t=0; son.event('hiss', {pan}); son.event('doors', {pan, delay: .9}); } }
  else if (train.phase==='stop'){ if (train.traveler && train.t>2.2 && trav.state==='none'){ trav.state='walk'; trav.x=STOP_X+CAR-24; trav.alpha=1; train.traveler=false; } if (train.t > 7.6 && once('close')) son.event('doors', {pan}); if (train.t>9){ train.phase='out'; train.t=0; train.said = {}; } }
  else if (train.phase==='out'){ const k=Math.min(1,T0/7); train.x = STOP_X + (-700-STOP_X)*easeIn(k); if (k>=1) train.phase='idle'; }
  train.v = dt > 0 ? Math.abs(train.x - train.prevX) / dt : 0; train.prevX = train.x;
}
/* la sonnerie sonne tant que le train n'a pas franchi le passage à niveau (à droite du quai) */
function crossingActive(){
  if (train.phase==='in') return train.x + CAR > CROSSING_X - 40;
  if (train.phase==='pass') return train.x + CAR > CROSSING_X - 40;
  return false;
}
function travelerState(w){
  const s = seasonOf(w.y,w.m,w.d), tv = travelerOf(s);
  const welcomed = save.gifts[tv.key] != null;
  const arrived = save.arrived[tv.key] || idx(w.y,w.m,w.d,w.hour) >= tv.at;
  const fermee = prov() && VIE.fermeture(FERM, w.y,w.m,w.d,w.hour).prov.fermee;      // provisoire, hors cahier : plus de voyageur une fois la gare fermée
  return { s, tv, welcomed, fermee, waiting: arrived && !welcomed && !fermee };
}
function updateTraveler(dt){
  if (trav.state==='walk'){ trav.x -= 38*dt; trav.walk += dt*7; if (trav.x <= 750){ trav.state='none'; const st = travelerState(worldTime()); save.arrived[st.tv.key] = true; persist(); showTraveler(); } }
  else if (trav.state==='leave'){ trav.x -= 40*dt; trav.walk += dt*7; if (trav.x < 500) trav.alpha -= dt*1.2; if (trav.alpha<=0) trav.state='none'; }
}

/* ---------- Monde du moment ---------- */
function nightKey(w){ if (w.hour >= 12) return dayKey(w.y,w.m,w.d); const p = addDays(w.y,w.m,w.d,-1); return dayKey(p.y,p.m,p.d); }
const isRain = k => k==='drizzle'||k==='rain'||k==='heavyrain'||k==='storm', isSnow = k => k==='snow'||k==='heavysnow';
function computeInfo(w){
  const season = seasonOf(w.y, w.m, w.d), sun = sunState(w), moon = moonPhase(w.y,w.m,w.d,w.hour);
  const kind = kindNow(), nightish = sun.e < -.2;
  const flies = ((w.m===6 && w.d>=10) || (w.m===7 && w.d<=25)) && nightish && (kind==='clear'||kind==='partly');
  /* provisoire (lot F) : la vraie lune ; une pleine lune ne compte que si elle est levée */
  const lune = prov() ? CIEL.moonAltAz(jstMs(w.y,w.m,w.d,w.hour), STATION.lat, STATION.lon) : null;
  const full = (1-Math.cos(2*Math.PI*moon))/2 > .97 && nightish && kind==='clear' && (!lune || lune.elev > 5);
  const active = [];
  if (nightish && isRain(kind)) active.push('rainnight');
  if (kind==='fog' && sun.e > -.3 && sun.e < .25 && sun.morning) active.push('dawnfog');
  if (isSnow(kind)){ active.push('snow'); const winter = w.m >= 7 ? w.y : w.y-1; if (save.firstSnow !== winter) active.push('firstsnow'); }
  if (flies) active.push('fireflies');
  if (full) active.push((w.m===9||w.m===10) ? 'tsukimi' : 'fullmoon');
  if (w.m===12 && w.d===31 && w.hour >= 21) active.push('lasttrain');
  const plan = dayPlan(w.y,w.m,w.d);
  const item = plan.item && w.hour >= plan.item.h && !save.found.some(f=>f.key===plan.item.key) ? plan.item : null;
  const sinceSweep = save.swept ? (Date.now()-save.swept)/36e5 : 30;
  const debris = sweep ? 1 : clamp(sinceSweep/20, 0, 1) * (season.season===2 ? 1 : .6);
  const lampOn = save.lamp === nightKey(w) && sun.e < .08;
  const tstate = travelerState(w);
  const ferm = VIE.fermeture(FERM, w.y,w.m,w.d,w.hour), nuit = nuitEtat(w, sun);
  return { season, sun, moon, lune, ferm, nuit, flies, active, item, debris, lampOn, cat: catSpot(w), people: habitues(w, ferm, nuit), waiting: tstate.waiting, tstate };
}

/* ---------- Registre ---------- */
function eventsOfDay(y,m,d){
  const R = T.registre, ev = [], school = jourDecole(y,m,d), p = dayPlan(y,m,d);
  const prev = addDays(y,m,d,-1), s = seasonOf(y,m,d);
  if (seasonOf(prev.y,prev.m,prev.d).ko !== s.ko) ev.push([0.01, tx(R.nouveauKo, {ko: koName(s.ko), sens: KO[s.ko][3].toLowerCase()}), true]);
  for (const c of p.cat) ev.push([c.from, c.spot==='roof' ? R.chatToit : R.chatBanc]);
  ev.push([7.8, school ? R.ecolierMatin : R.ecolierAbsent]);
  ev.push([10.6, R.cheminotMatin]);
  { const mv = prov() ? magasin.a(jstMs(y,m,d,13)) : null; if (!mv || mv.source !== 'reelle' || VIE.vieilleVient(RG, mv)) ev.push([13.5, R.vieilleDame]); }
  if (school) ev.push([16.36, R.ecolierRetour]);
  const tv = travelerOf(s);
  if (dayKey(tv.day.y,tv.day.m,tv.day.d) === dayKey(y,m,d)) ev.push([tv.h + .03, R.voyageur, true]);
  if (p.item) ev.push([p.item.h, tx(R.objet, {objet: ITEMS[p.item.idx]}), true]);
  ev.push([21.6, R.cheminotSoir]);
  /* la fermeture : chaque changement a sa ligne, le jour où il arrive (data/fermeture.js) */
  const F = VIE.fermeture(FERM, y,m,d, 0);
  for (const id of F.aujourdhui){ const c = FERM.changements.find(x => x.id === id); ev.push([c.h + .01, TF.registre[id], true]); }
  return ev.sort((a,b)=>a[0]-b[0]);
}
function renderRegistre(fromMs){
  const now = Date.now(), first = !fromMs;
  const t1 = tokyoAt(now);
  let t0 = first ? {y:t1.y,m:t1.m,d:t1.d,h:0} : tokyoAt(fromMs);
  const i0 = idx(t0.y,t0.m,t0.d,t0.h), i1 = idx(t1.y,t1.m,t1.d,t1.h);
  let start = {y:t0.y,m:t0.m,d:t0.d}, skipped = 0;
  const spanDays = Math.round((Date.UTC(t1.y,t1.m-1,t1.d)-Date.UTC(start.y,start.m-1,start.d))/864e5);
  if (spanDays > 3){ skipped = spanDays - 3; start = addDays(t1.y,t1.m,t1.d,-3); }
  const hrs = (now - (fromMs||now))/36e5;
  const duree = hrs < 1 ? Math.max(1,Math.round(hrs*60))+' min' : hrs < 48 ? Math.round(hrs)+' h' : Math.round(hrs/24)+' jours';
  $('#reg-since').textContent = first ? T.registrePremiere : tx(T.registreDepuis, {duree});
  let html = skipped ? `<div class="note">${tx(T.registreResume, {n: skipped})}</div>` : '';
  let total = 0;
  for (let n=0; n<=Math.min(spanDays,3); n++){
    const day = addDays(start.y,start.m,start.d,n);
    const rows = eventsOfDay(day.y,day.m,day.d).filter(([h]) => { const i = idx(day.y,day.m,day.d,h); return i > i0 && i <= i1; });
    if (!rows.length) continue;
    total += rows.length;
    const isToday = dayKey(day.y,day.m,day.d) === dayKey(t1.y,t1.m,t1.d);
    html += `<h3>${isToday ? T.registreAujourdhui : frDate(day.y,day.m,day.d,{weekday:'long',day:'numeric',month:'long'})}</h3><ul class="entries">` + rows.map(([h,t,k]) => `<li class="${k?'key':''}"><time>${hhmm(h)}</time><span>${t}</span></li>`).join('') + '</ul>';
  }
  if (!total) html += `<div class="note">${T.registreVide}</div>`;
  $('#reg-body').innerHTML = html;
}
function openRegistre(fromMs){ renderRegistre(fromMs); son.event('page'); $('#reg').hidden = false; $('#book').hidden = true; $('#lab').hidden = true; }

/* ---------- Interface ---------- */
const toastEl = $('#toast'); let toastTimer = null;
function toast(msg){ toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>toastEl.hidden = true, 3600); }
function phaseLabel(sun){ const P = T.phase; if (sun.e > .18) return sun.morning ? P.matin : P.apresMidi; if (sun.e > 0) return sun.morning ? P.lever : P.finJour; if (sun.e > -.3) return sun.morning ? P.aube : P.crepuscule; return P.nuit; }
function nextStop(h){ for (const t of TRAINS) if (t.stop && t.h+t.m/60 > h) return hhmm(t.h+t.m/60); const f = TRAINS.find(t=>t.stop); return tx(T.demain, {heure: hhmm(f.h+f.m/60)}); }

const grid = $('#book-grid');
SEKKI.forEach((s,i)=>{
  const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.innerHTML = `${s[0]}<span>${s[1]}</span>`;
  const st = document.createElement('div'); st.className = 'stamps';
  for (let k=0;k<3;k++){ const c = document.createElement('div'); c.className = 'stamp'; c.id = 'st-'+(i*3+k); c.title = `${KO[i*3+k][0]} · ${KO[i*3+k][2]} · ${KO[i*3+k][3]}`; st.appendChild(c); }
  grid.append(lbl, st);
});
let bookSig = '';
function renderBook(currentKo){
  const sig = JSON.stringify([currentKo, save.stamps.length, save.moments, save.gifts, save.found.length]);
  if (sig === bookSig) return; bookSig = sig;
  for (let n=0;n<72;n++){ const el = document.getElementById('st-'+n); const on = save.stamps.includes(n); el.classList.toggle('on', on); el.classList.toggle('now', n===currentKo); el.textContent = on ? KO[n][0][0] : n+1; }
  $('#book-count').textContent = `${save.stamps.length}/72`;
  $('#moments').innerHTML = MOMENTS.map(m => { const on = save.moments.includes(m.id); return `<div class="mom r-${m.rar} ${on?'on':''}"><span>${on ? m.name : '· · ·'}</span><em>${m.rar}</em></div>`; }).join('');
  const got = Object.entries(save.gifts);
  $('#gifts').innerHTML = got.length ? got.map(([k,g]) => { const [y,m,d] = k.split('-').map(Number); const s = SEKKI[seasonOf(y,m,d).i]; return `<div class="mom on"><span>${tx(T.carnetVoyageur, {sekki: s[1], cadeau: GIFTS[g]})}</span><em>${s[0]}</em></div>`; }).join('') + `<div class="note">${tx(T.carnetVoyageurs, {n: got.length, s: got.length>1?'s':''})}</div>` : `<div class="note">${T.carnetAucunVoyageur}</div>`;
  $('#found').innerHTML = save.found.length ? save.found.map(f => `<div class="mom on"><span>${ITEMS[f.idx]}</span><em>${frDate(...f.key.split('-').map(Number))}</em></div>`).join('') : `<div class="note">${T.carnetAucunObjet}</div>`;
}

function showTraveler(){
  const st = travelerState(worldTime()); if (!st.waiting){ return; }
  const s = SEKKI[st.s.i];
  panelStep = 0;
  $('#tr-eyebrow').textContent = tx(T.voyageurArrive, {date: frDate(st.tv.day.y, st.tv.day.m, st.tv.day.d), heure: hhmm(st.tv.h)});
  $('#tr-title').textContent = tx(T.voyageurTitre, {sekki: s[1]});
  $('#tr-slot').innerHTML = T.voyageurArrivee;
  $('#tr-next').textContent = T.btnAccueillir; $('#tr-later').hidden = false;
  $('#traveler').hidden = false;
}
$('#tr-next').addEventListener('click', () => {
  panelStep++;
  if (panelStep === 1){ $('#tr-slot').innerHTML = T.voyageurHistoire; $('#tr-next').textContent = T.btnLaisserPartir; $('#tr-later').hidden = true; }
  else if (panelStep === 2){
    const st = travelerState(worldTime()); const gift = st.s.i % GIFTS.length;
    save.gifts[st.tv.key] = gift; persist(); trav.state = 'leave'; trav.x = 750; trav.alpha = 1; trav.walk = 0;
    $('#tr-slot').innerHTML = tx(T.voyageurDepart, {cadeau: GIFTS[gift]}); son.event('gift');
    $('#tr-next').textContent = T.btnFermer;
  }
  else $('#traveler').hidden = true;
});
$('#tr-later').addEventListener('click', () => { $('#traveler').hidden = true; });

/* gestes */
function today(){ const w = worldTime(); return dayKey(w.y,w.m,w.d); }
function gWater(){ const w = worldTime(); water = {t:0}; son.event('water'); if (save.watered === today() && !w.simulated){ toast(T.jardinDejaArrose); return; } save.watered = today(); save.growth = Math.min(14, save.growth+1); persist(); toast(save.growth >= 14 ? T.jardinPlein : T.jardinArrose); }
function gSweep(){ if (sweep) return; const info = computeInfo(worldTime()); if (info.debris < .05){ toast(T.quaiPropre); return; } sweep = {t:0}; son.event('sweep'); }
function gFeed(){ const w = worldTime(); if (save.fed === today()){ toast(T.gamelleDejaPleine); return; } save.fed = today(); save.fedHour = w.hour; persist(); son.event('feed'); toast(T.gamelleRemplie); }
function gLamp(){ const w = worldTime(), info = computeInfo(w); if (info.sun.e >= .08){ toast(T.lampeTropTot); return; } if (save.lamp === nightKey(w)){ toast(T.lampeDejaAllumee); return; } save.lamp = nightKey(w); persist(); son.event('lamp'); toast(T.lampeAllumee); }
$('#g-water').addEventListener('click', gWater); $('#g-sweep').addEventListener('click', gSweep); $('#g-feed').addEventListener('click', gFeed); $('#g-lamp').addEventListener('click', gLamp);

/* clics dans la scène */
const toucheHab = {};
function sceneHit(ev){
  const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left - OX)/S, y = (ev.clientY - r.top - OY)/S;
  const info = computeInfo(worldTime());
  /* les petites cibles précises d'abord : les étiquettes de l'inventaire */
  if ((etiquette('banc') && x > 808 && x < 821 && y > 658 && y < 668) || (etiquette('poele') && x > 380 && x < 393 && y > 620 && y < 630)) return 'f:etiquettes';
  if (info.cat){ const [cx,cy] = CAT_POS[info.cat]; if (Math.abs(x-cx) < 26 && Math.abs(y-cy+8) < 22) return 'cat'; }
  if (info.item && x > 800 && x < 856 && y > 625 && y < 690) return 'item';
  { const e = etatObjets();
    if (x > 770 && x < 796 && y > 636 && y < 664){ if (e.tr && e.tr.type === 'thermos') return 'trace:' + e.tr.visuel; if (e.pose === 'thermos') return 'etagere'; }
  }
  if (info.waiting && trav.state==='none' && x > 736 && x < 790 && y > 600 && y < 686) return 'traveler';
  { /* lots F, G, H : habitués, fermeture, nuit (au toucher, une ligne à écrire) */
    const w = worldTime(), F = info.ferm, N8 = info.nuit;
    for (const p of info.people){ const py = p.kind === 'worker' && !p.quai ? 652 : 682; if (Math.abs(x - p.x) < 14 && y > py - 75 && y < py + 2) return p.shovel ? 'n:cheminotQuai' : 'hab:' + p.kind; }
    for (const [id, v] of [['livreur', N8.livreur], ['chasseNeige', N8.chasseNeige]]) if (v){ const vy = lerp(664, 980, v.k), sc = lerp(.5, 1.8, v.k*v.k); if (Math.abs(x - RX) < 55*sc && y > vy - 70*sc && y < vy + 4) return 'n:' + id; }
    if (N8.cerfs) for (let i = 0; i < (N8.cerfs.n || 1); i++) if (Math.abs(x - posCerf(N8.cerfs.k, i)) < 30 && y > 600 && y < 668) return 'n:cerfs';
    if (N8.renard && Math.abs(x - posRenard(N8.renard.k)) < 30 && y > 664 && y < 690) return 'n:renard';
    if (N8.ferme && x > 1028 && x < 1078 && y > 518 && y < 552) return 'n:ferme';
    if (N8.bourrelet && snowCover > .25 && Math.abs(x - RX) < 110 && y > 688 && y < 752) return 'n:bourrelet';
    if (x > 559 && x < 570 && y > 606 && y < 624) return 'cahier';
    if (x > 522 && x < 548 && y > 590 && y < 628) return 'f:avis';
    if (F.faits.includes('affiche-commune') && x > 422 && x < 442 && y > 588 && y < 613) return 'f:afficheCommune';
    if (F.faits.includes('photo-1') && x > 423 && x < 441 && y > 613 && y < 625) return 'f:photo:photo-1';
    if (F.faits.includes('photo-2') && x > 423 && x < 441 && y >= 625 && y < 637) return 'f:photo:photo-2';
    if (x > 498 && x < 514 && y > 600 && y < 620) return etiquette('horloge') && y > 614 ? 'f:etiquettes' : 'f:horloge';
    if (x > 378 && x < 418 && y > 646 && y < 672) return x > 394 && y > 663 ? 'f:ardoise' : 'f:craie';
  }
  if (prov()){                                   // provisoire, hors cahier
    const w = worldTime();
    if (curFerm && curFerm.prov.fleurs && x > 970 && x < 992 && y > 660 && y < 684) return 'prov:fleurs';
    for (const { p } of pistesDuJour(w)) if (Math.abs(y - p[2]) < 6 && x >= Math.min(p[0], p[1]) - 6 && x <= Math.max(p[0], p[1]) + 6) return 'prov:pas:' + p[7];
  }
  { const e = etatObjets();
    if (x > 546 && x < 596 && y > 618 && y < 636) return 'etagere';
    if (x > 546 && x < 596 && y > 596 && y < 618 && e.tr && e.tr.type === 'lumiere') return 'trace:' + e.tr.visuel;
    if (x > 522 && x < 552 && y > 640 && y < 684){ if (e.retour) return 'trace:' + (e.retour.trace || 'plie-seche'); if (e.tr && e.tr.type === 'parapluie') return 'trace:' + (e.tr.visuel === 'plein' && e.tr.contexte && e.tr.contexte.neige ? 'plein-neige' : e.tr.visuel); if (e.pose === 'parapluie') return 'etagere'; }
    if (e.tr && e.tr.visuel === 'renard' && x > 484 && x < 500 && y > 676 && y < 688) return 'trace:renard';
    if (e.tr && e.tr.visuel === 'banc-deplace' && x > 750 && x < 848 && y > 636 && y < 664) return 'trace:banc-deplace';
    if (x > 376 && x < 424 && y > 646 && y < 674 && e.retour && e.retour.trace === 'mot-tableau') return 'trace:mot-tableau';
    if (e.retour && e.retour.trace === 'ticket' && x > 538 && x < 552 && y > 640 && y < 650) return 'trace:ticket';
    if (e.tr && e.habitude && Math.abs(x - 782) < 12 && y > 636 && y < 664 && e.tr.type === 'thermos') return 'trace:habitude';
    const ep = empreintesVisibles(snowCover > .25);
    if (ep && y > 672 && y < 690 && x >= Math.min(ep.spec[0], ep.spec[1]) - 8 && x <= Math.max(ep.spec[0], ep.spec[1]) + 8) return 'trace:pas-' + ep.tr.empreintes;
    if (givreActif() && x > 738 && x < 834 && y > 636 && y < 664) return 'trace:givre-banc';
  }
  if (x > 550 && x < 750 && y > 700 && y < 800) return 'garden';
  if (x > 652 && x < 684 && y > 670 && y < 694) return 'bowl';
  if (x > 676 && x < 712 && y > 544 && y < 682) return 'lamp';
  if (x > 230 && x < 1200 && y > 662 && y < 694 && info.debris > .05) return 'platform';
  return null;
}
cv.addEventListener('mousemove', ev => { cv.style.cursor = sceneHit(ev) ? 'pointer' : 'default'; });
/* gestes au doigt : glisser sur le quai couvert de feuilles balaie ; glisser ailleurs fait pivoter la vue (écrans étroits) ;
   un appui long sur le jardin l'arrose. Un simple toucher reste un clic. */
let holdTimer = null;
cv.addEventListener('pointerdown', ev => {
  const hit = sceneHit(ev);
  cam.drag = { x: ev.clientX, y: ev.clientY, pan: cam.pan, hit, moved: false, swept: false, lastX: ev.clientX, lastT: performance.now() };
  cam.vel = 0; cam.justDragged = false;
  clearTimeout(holdTimer);
  if (hit === 'garden') holdTimer = setTimeout(() => { if (cam.drag && !cam.drag.moved){ gWater(); cam.justDragged = true; } }, 450);
});
addEventListener('pointermove', ev => {
  const d = cam.drag; if (!d) return;
  const dx = ev.clientX - d.x;
  if (!d.moved && Math.abs(dx) > 10){ d.moved = true; clearTimeout(holdTimer); }
  if (!d.moved) return;
  cam.justDragged = true;
  if (d.hit === 'platform'){ if (!d.swept && Math.abs(dx) > 40){ d.swept = true; gSweep(); } return; }
  if (W/S < VW){ cam.pan = d.pan - dx/S; layoutCam(); const t = performance.now(); cam.vel = -(ev.clientX - d.lastX)/S / Math.max(1, t - d.lastT) * 16; d.lastX = ev.clientX; d.lastT = t; }
});
addEventListener('pointerup', () => { clearTimeout(holdTimer); cam.drag = null; });
addEventListener('pointercancel', () => { clearTimeout(holdTimer); cam.drag = null; });
cv.addEventListener('click', ev => {
  if (cam.justDragged){ cam.justDragged = false; return; }
  const hit = sceneHit(ev); if (!hit) return;
  const info = computeInfo(worldTime());
  if (hit==='cat'){ const [cx,cy] = CAT_POS[info.cat]; purr = {x:cx, y:cy-6, t:0}; son.event('purr'); toast(info.cat === 'salle' ? TP.chatSalle : T.chatRonronne); }
  else if (hit.startsWith('hab:')){                // deux lignes qui alternent ; le jour de son moment, la ligne du moment
    const kind = hit.slice(4), qui = { kid: 'ecolier', lady: 'vieille', worker: 'cheminot' }[kind], p = info.people.find(q => q.kind === kind);
    toucheHab[qui] = (toucheHab[qui] || 0) + 1;
    toast(p && p.moment ? TH.moments[qui] : TH[qui][(toucheHab[qui] - 1) % 2]);
  }
  else if (hit === 'cahier') ouvrirCahier();
  else if (hit.startsWith('f:')){
    const [, quoi, id] = hit.split(':');
    if (quoi === 'craie'){ const w = worldTime(), c = VIE.craieDuJour(CRAIE, FERM, w.y,w.m,w.d); toast(c ? T.craie[c.id] : T.craie.aucune); }
    else toast({ avis: TF.avisTraduction, afficheCommune: TF.afficheCommune, photo: TF.photos[id], etiquettes: TF.etiquettes, horloge: TF.horloge, ardoise: TF.ardoiseToucher }[quoi]);
  }
  else if (hit.startsWith('n:')) toast(TN[hit.slice(2)]);
  else if (hit.startsWith('prov:')){ const [, quoi, qui] = hit.split(':'); toast(quoi === 'pas' ? TP.pas[qui] : TP[quoi]); }
  else if (hit==='item'){ save.found.push({key:info.item.key, idx:info.item.idx}); persist(); toast(tx(T.objetRange, {objet: ITEMS[info.item.idx]})); }
  else if (hit==='traveler') showTraveler();
  else if (hit==='garden') gWater();
  else if (hit==='bowl') gFeed();
  else if (hit==='lamp') gLamp();
  else if (hit==='platform') gSweep();
  else if (hit==='etagere') ouvrirEtagere();
  else if (hit.startsWith('trace:')) toast(T.traces[hit.slice(6)] || T.traces[hit.slice(6).replace(/^pas-.*/, 'pas-ecolier')] || '');
});

/* Atelier et tests : coordonnées d'écran d'un point de la scène (1600 × 900) */
if (new URLSearchParams(location.search).has('atelier')) N.ecran = (x, y) => { const r = cv.getBoundingClientRect(); return [r.left + OX + x*S, r.top + OY + y*S]; };

/* ---------- Étagère de la salle d'attente (lot C) ----------
   On pose un objet ou on le reprend. Ni compteur, ni indice, ni probabilité ; ne rien poser n'a aucun effet. */
const elevGare = ms => CIEL.sunAltAz(ms, STATION.lat, STATION.lon).elev;
function objetsTick(){
  const evts = OBJ.avancer(POSES, save.objets, Date.now(), magasin, elevGare);
  if (evts.length){ persist(); if (!$('#etagere').hidden) renderEtagere(); }
}
function renderEtagere(){
  const E = T.etagere, o = save.objets;
  $('#et-titre').textContent = E.titre;
  $('#et-etat').textContent = o.pose ? tx(E.pose, { objet: E.objets[o.pose.type].toLowerCase() }) : E.libre;
  const liste = $('#et-liste'); liste.innerHTML = '';
  for (const type of OBJ.TYPES){
    const ligne = document.createElement('div'); ligne.className = 'et-ligne';
    const nom = document.createElement('span'); nom.textContent = E.objets[type];
    const b = document.createElement('button'); b.className = 'chip';
    const estPose = o.pose && o.pose.type === type;
    if (estPose) { b.textContent = E.reprendre; b.className = 'chip done'; }
    else if (type === 'parapluie' && o.parapluieRetour) { b.textContent = E.absent; b.disabled = true; }
    else if (o.pose) { b.textContent = E.poser; b.disabled = true; b.title = E.unSeul; }
    else b.textContent = E.poser;
    b.addEventListener('click', () => {
      if (estPose){ OBJ.reprendre(o); toast(tx(E.repriseToast, { objet: E.objets[type] })); }
      else if (OBJ.poser(o, type, Date.now()).ok) toast(tx(E.poseToast, { objet: E.objets[type] }));
      persist(); objetsTick(); renderEtagere();
    });
    ligne.append(nom, b); liste.appendChild(ligne);
  }
  { const ligne = document.createElement('div'); ligne.className = 'et-ligne';
    const nom = document.createElement('span'); nom.textContent = `${TF.cahierTitre} (${TF.cahierJp})`;
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = TF.cahierOuvrir; b.addEventListener('click', ouvrirCahier);
    ligne.append(nom, b); liste.appendChild(ligne); }
}
function ouvrirEtagere(){ renderEtagere(); $('#etagere').hidden = false; }
/* le cahier de la gare (lot H) : les entrées déjà écrites, à leur date (data/fermeture.js) */
function ouvrirCahier(){
  const w = worldTime(), F = VIE.fermeture(FERM, w.y,w.m,w.d,w.hour);
  const entrees = FERM.changements.filter(c => c.id.startsWith('cahier-') && F.faits.includes(c.id));
  $('#ca-titre').textContent = `${TF.cahierJp} · ${TF.cahierTitre}`;
  $('#ca-liste').innerHTML = entrees.length ? entrees.map(c => { const d = VIE.dateDuJour(FERM, c.j); return `<div class="ca-entree"><time>${frDate(d.y,d.m,d.d)}</time><p>${TF.cahierEntrees[c.id]}</p></div>`; }).reverse().join('') : `<p>${TF.cahierVide}</p>`;
  $('#etagere').hidden = true; $('#cahier').hidden = false; son.event('page');
}
$('#ca-fermer').addEventListener('click', () => { $('#cahier').hidden = true; });
$('#et-fermer').addEventListener('click', () => { $('#etagere').hidden = true; });

/* panneaux */
const book = $('#book'), lab = $('#lab'), reg = $('#reg');
/* son : coupé par défaut ; si le joueur l'a activé, il revient au premier toucher (règle des navigateurs) */
const btnSon = $('#btn-son');
function renderSon(){ btnSon.textContent = son.on ? T.sonActif : T.sonCoupe; btnSon.setAttribute('aria-pressed', son.on ? 'true' : 'false'); btnSon.classList.toggle('done', son.on); }
if (!son.supported) btnSon.hidden = true;
btnSon.addEventListener('click', async () => { if (son.on){ son.disable(); save.sound = false; } else { save.sound = !!(await son.enable()); } persist(); renderSon(); });
if (save.sound){ const wake = async () => { if (!son.on) await son.enable(); renderSon(); }; addEventListener('pointerdown', wake, { once: true }); addEventListener('keydown', wake, { once: true }); }
renderSon();
$('#btn-book').addEventListener('click', () => { book.hidden = !book.hidden; lab.hidden = true; reg.hidden = true; });
/* l'Atelier n'apparaît qu'avec ?atelier dans l'adresse ; les testeurs ne le voient pas */
const ATELIER = new URLSearchParams(location.search).has('atelier');
$('#btn-lab').hidden = !ATELIER;
$('#btn-lab').addEventListener('click', () => { lab.hidden = !lab.hidden; book.hidden = true; reg.hidden = true; });
$('#btn-reg').addEventListener('click', () => { if (reg.hidden) openRegistre(save.prevVisit || save.lastVisit); else reg.hidden = true; });
$('#reg-stamp').addEventListener('click', () => { reg.hidden = true; son.event('stamp'); toast(T.registreTamponne); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { document.getElementById(b.dataset.close).hidden = true; }));
addEventListener('keydown', ev => { if (ev.key === 'Escape'){ book.hidden = true; lab.hidden = true; reg.hidden = true; } });

/* atelier (outil d'Arsène, ses textes ne font pas partie du jeu) */
const labHour = $('#lab-hour'), labRT = $('#lab-realtime'), labFast = $('#lab-fast'), labDate = $('#lab-date');
labHour.addEventListener('input', () => { sim.hour = +labHour.value; labRT.checked = false; });
labRT.addEventListener('change', () => { if (labRT.checked){ sim.hour = null; sim.fast = false; labFast.checked = false; } else sim.hour = +labHour.value; });
labFast.addEventListener('change', () => { sim.fast = labFast.checked; if (sim.fast){ labRT.checked = false; if (sim.hour == null) sim.hour = worldTime().hour; } });
labDate.addEventListener('change', () => { if (!labDate.value){ sim.date = null; return; } const [y,m,d] = labDate.value.split('-').map(Number); sim.date = {y,m,d}; });
$('#lab-weather').addEventListener('change', ev => { sim.weather = ev.target.value; });
$('#lab-ground').addEventListener('change', ev => { sim.ground = ev.target.checked; });
$('#lab-wind').addEventListener('input', ev => { sim.wind = +ev.target.value; });
$('#lab-train').addEventListener('click', () => { if (!startTrain({stop:false})) toast('Un train est déjà là.'); });
$('#lab-traveler').addEventListener('click', () => {
  const st = travelerState(worldTime());
  if (st.welcomed){ toast('Le voyageur de ce sekki est déjà reparti. « Tout remettre à zéro » pour le revoir.'); return; }
  if (st.waiting){ toast('Il attend déjà sur le banc.'); showTraveler(); return; }
  if (!startTrain({stop:true, traveler:true})) toast('Un train est déjà là.');
});
$('#lab-away').addEventListener('click', () => { openRegistre(Date.now() - 15*36e5); });
/* aperçu des traces : montre sans rien enregistrer */
{
  const sel = $('#lab-trace');
  for (const type of OBJ.TYPES) for (const e of POSES[type]) { const o = document.createElement('option'); o.value = type + ':' + e.id; o.textContent = `${T.etagere.objets[type]} · ${e.id} (${e.visuel})`; sel.appendChild(o); }
  for (const r of ['plie-seche', 'mot-tableau', 'mandarines', 'ticket']) { const o = document.createElement('option'); o.value = 'retour:' + r; o.textContent = 'Parapluie rendu · ' + r; sel.appendChild(o); }
  const maj = () => {
    const v = sel.value;
    if (!v){ apercuTrace = null; return; }
    const [type, id] = v.split(':');
    if (type === 'retour'){ apercuTrace = { type: 'retour', trace: id }; return; }
    const e = POSES[type].find(x => x.id === id);
    apercuTrace = { type, id, habitue: e.habitue || null, visuel: e.visuel, empreintes: e.empreintes || null, emprunt: !!e.emprunt, habitude: $('#lab-habitude').checked,
      quand: Date.now() - 3*36e5, sens: 1, contexte: { neige: true, gel: true, pluie: true } };
  };
  sel.addEventListener('change', maj); $('#lab-habitude').addEventListener('change', maj);
  $('#lab-givre').addEventListener('change', ev => { apercuGivre = ev.target.checked; });
}
/* session 3 : interrupteur du provisoire, visiteur de la nuit, état du jour */
$('#lab-provisoire').addEventListener('change', ev => { provOn = AVEC_ATELIER && ev.target.checked; bookSig = ''; });
$('#lab-visiteur').addEventListener('change', ev => { const id = ev.target.value; ev.target.value = ''; if (!id) return; apercuApres = null; apercuNuit = { id, t0: clock }; });
function labVie(w, info){
  const F = info.ferm, j = F.jour, l = [];
  l.push(`<b>Fermeture</b> · révision des horaires le ${frDate(...FERM.revision.split('-').map(Number), {weekday:'long', day:'numeric', month:'long', year:'numeric'})}, dernier jour de service la veille. ` +
    `Compte à rebours : ${F.compte != null ? F.compte : '—'}. Jour du test : ${j >= 1 && j <= 14 ? 'J' + j : 'hors du test'} (J1 = ${frDate(...FERM.debutTest.split('-').map(Number))}).`);
  l.push('Calendrier : ' + FERM.changements.map(c => { const d = VIE.dateDuJour(FERM, c.j); const etat = F.faits.includes(c.id) ? 'fait' : F.aujourdhui.includes(c.id) ? `à ${hhmm(c.h)}` : 'à venir'; return `J${c.j} ${frDate(d.y,d.m,d.d)} ${c.id} (${etat})`; }).join(' · ') + '.');
  const c = VIE.craieDuJour(CRAIE, FERM, w.y,w.m,w.d); l.push(`Tableau à craie : ${c ? c.id : 'aucune ligne'}.`);
  const nuit = nuitsDuJour(w).filter(x => x.debut >= 12).map(x => `${x.id} ${hhmm(x.debut)}${x.n ? ' (' + x.n + ')' : ''}${x.cause ? ' · cause : ' + x.cause : ''}`).join(', ');
  l.push(`<b>Nuit de ce soir</b> (tirage commun, causes réelles) : ${nuit}. Le chasse-neige et le cheminot sur le quai n'apparaissent qu'après 2 cm de neige réelle en 6 h.`);
  l.push('<b>Habitués</b> · ' + Object.values(HAB.fiches).map(f => `${f.role} : ${f.routine}${f.moment ? ' ; moment le ' + (d => frDate(d.y,d.m,d.d))(VIE.dateDuJour(FERM, FERM.changements.find(x => x.id === f.moment).j)) : ''}`).join(' · ') + `. Nom du chat : ${HAB.fiches.chat.nom || 'à choisir'}.`);
  if (prov()){
    const m = vue.meteo, oui = b => b ? 'oui' : 'non', lu = info.lune;
    l.push(`<b>Provisoire, hors cahier</b> · parapluie : ${oui(VIE.parapluie(RG, m))} ; bonnet : ${oui(VIE.bonnet(RG, m))} ; vieille dame : ${VIE.vieilleVient(RG, m) ? 'vient' : 'reste chez elle'} ; chat : ${VIE.chatAbrite(RG, m) ? "à l'abri" : 'dehors'}. ` +
      `Lune : ${lu.elev > 0 ? 'levée, ' + Math.round(lu.elev) + '°, azimut ' + Math.round(lu.az) + '°' : "sous l'horizon"}, éclairée à ${Math.round(lu.lit*100)} %. ` +
      `Fin de service après ${hhmm(FERM.provisoire.dernierArret.h + FERM.provisoire.dernierArret.m/60)} le dernier jour, bandeau à J−${FERM.provisoire.bandeau}, fleurs à J−${FERM.provisoire.fleurs}.`);
  } else l.push('Provisoire hors cahier masqué.');
  return l.join('<br><br>');
}
$('#lab-gifts').addEventListener('click', () => { save.preview = !save.preview; persist(); toast(save.preview ? 'Aperçu : la gare avec six omiyage.' : 'Aperçu retiré.'); });
$('#lab-reset').addEventListener('click', () => { save = fresh(); save.lastVisit = Date.now(); persist(); bookSig = ''; renderBook(-1); $('#traveler').hidden = true; toast('Tout est remis à zéro.'); });
$('#lab-place').textContent = `Gare placée à ${STATION.lat}° N, ${STATION.lon}° E : ${STATION.place}. Arrêts à ${TRAINS.filter(t=>t.stop).map(t=>hhmm(t.h+t.m/60)).join(', ')} ; trains sans arrêt à ${TRAINS.filter(t=>!t.stop).map(t=>hhmm(t.h+t.m/60)).join(', ')}.`;
{ const n = tokyoAt(Date.now()); labDate.value = dayKey(n.y,n.m,n.d); }
{ const n = tokyoAt(Date.now()), list = CIEL.nextKo(Date.now(), 4); $('#lab-cal').textContent = 'Prochains kō : ' + list.map(s => `${KO[s.k][0]} le ${frDate(s.date.y,s.date.m,s.date.d)}`).join(' · '); }

/* ---------- Météo (js/meteo.js) ----------
   Open-Meteo, gratuit, sans clé : des modèles météo pour ce lieu, pas une station d'observation.
   Chaque mesure porte sa source. Seul l'Atelier simule, dans une mesure à part qui n'est jamais enregistrée. */
const CACHE_METEO = 'nagori-meteo-v1';
const magasin = MET.creerMagasin();
try { const raw = localStorage.getItem(CACHE_METEO); if (raw) magasin.charger(raw, Date.now()); } catch (e) {}
const clientMeteo = MET.creerClient({
  magasin, lat: STATION.lat, lon: STATION.lon, jours: MET.joursPasses(save.lastVisit, Date.now()),
  fetch: (url, opts) => fetch(url, opts),
  apres: etat => { if (etat.echecs === 0) try { localStorage.setItem(CACHE_METEO, magasin.serialiser(Date.now())); } catch (e) {} }
});
clientMeteo.actualiser();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') clientMeteo.reveil(); });
addEventListener('online', () => clientMeteo.reveil());

/* la météo de l'instant dessiné : la dernière mesure réelle, ou la mesure réelle de l'heure simulée, ou rien.
   Une date ou une heure simulée n'emprunte jamais la météo d'aujourd'hui. */
function meteoPour(w){
  let m;
  if (ATELIER && (sim.hour != null || sim.date)) m = magasin.a(jstMs(w.y, w.m, w.d, w.hour));
  else m = magasin.maintenant(Date.now(), clientMeteo.etat);
  if (ATELIER && (sim.weather !== 'auto' || sim.ground || sim.wind != null))
    m = MET.simulee(m, { kind: sim.weather !== 'auto' ? sim.weather : null, sol: sim.ground, vent: sim.wind });
  return m;
}
/* vent de 0 à 1 et neige au sol, de la météo dessinée */
function windNow(){ const v = vue.meteo.wind; return v != null ? clamp(v/45, 0, 1) : .15; }
function groundSnow(){ return (vue.meteo.snowDepth || 0) >= .01; }
/* la météo ne sert aux moments rares et au carnet que si elle est réelle */
const MOMENTS_METEO = ['rainnight','dawnfog','snow','firstsnow','fireflies','tsukimi','fullmoon'];
const momentSauvable = id => !MOMENTS_METEO.includes(id) || vue.meteo.source === 'reelle';
/* ligne d'état de l'Atelier */
function statutMeteo(){
  const m = vue.meteo, e = clientMeteo.etat, t = ms => ms ? MET.hhmm(ms) : '--:--';
  let l;
  if (m.source === 'simulee') l = `Météo simulée par l'Atelier (${WX_LABEL[m.kind]}) : jamais enregistrée, jamais comptée pour le carnet.`;
  else if (m.source === 'reelle') l = `Météo réelle de modèles Open-Meteo (pas une station) : ${WX_LABEL[m.kind]}, ${m.temp != null ? Math.round(m.temp) : '?'} °C, vent ${m.wind != null ? Math.round(m.wind) : '?'} km/h, neige au sol ${Math.round((m.snowDepth||0)*100)} cm (code ${m.code}). Valeur de ${m.t.replace('T',' ')}, reçue à ${t(m.recu)} (heure de Tokyo).`;
  else l = `Météo inconnue (${m.statut}) : ciel couvert neutre, rien ne tombe, aucun moment ni conséquence météo.${m.neigeRetenue ? ' Neige au sol conservée (dernière mesure de moins de 24 h).' : ''}`;
  if (e.echecs) l += ` Dernière requête en échec (${e.erreur}) : nouvelle tentative à ${t(e.prochain)}.`;
  return `${l} Heures réelles en mémoire : ${magasin.nombre()}.`;
}

/* ---------- Boucle ---------- */
let lastHud = 0;
function hud(w, info){
  const s = SEKKI[info.season.i], k = KO[info.season.ko], kind = kindNow();
  $('#date-label').textContent = frDate(w.y,w.m,w.d);
  $('#clock').innerHTML = hhmm(w.hour) + (w.simulated ? '<small>simulé</small>' : '');
  const mt = vue.meteo; let wxText;
  if (mt.source === 'simulee') wxText = tx(T.meteoSimulee, {meteo: WX_LABEL[kind]});
  else if (mt.source === 'reelle'){ wxText = WX_LABEL[kind] + (mt.temp != null ? ` · ${Math.round(mt.temp)} °C` : ''); if (mt.wind >= 30) wxText += ` · ${T.vent}`; if (groundSnow() && !isSnow(kind)) wxText += ` · ${T.neigeAuSol}`; if (mt.ancienne) wxText += ' · ' + tx(T.meteoDe, {heure: MET.hhmm(mt.recu)}); }
  else { wxText = mt.statut === 'attente' ? T.meteoAttente : mt.statut === 'heure-inconnue' ? T.meteoInconnue : T.meteoIndispo; if (groundSnow()) wxText += ` · ${T.neigeAuSol}`; }
  $('#wx-status').textContent = statutMeteo();
  $('#sub').textContent = `${phaseLabel(info.sun)} · ${wxText}`;
  const F = info.ferm;
  const fermee = prov() && F.prov.fermee;
  $('#next-train').textContent = train.phase==='idle' ? (fermee ? TP.fermee : tx(T.prochainArret, {heure: nextStop(w.hour)})) : train.phase==='pass' ? T.trainPasse : train.phase==='stop' ? T.trainEnGare : T.trainApproche;
  { const fl = $('#ferm-line'), t = prov() && F.prov.bandeau != null ? tx(TP.compte, {n: F.prov.bandeau}) : '';   // provisoire, hors cahier
    fl.hidden = !t; fl.textContent = t; }
  if (ATELIER) $('#lab-vie').innerHTML = labVie(w, info);
  const st = info.tstate; let tl = '';
  if (st.fermee) tl = '';
  else if (st.waiting) tl = T.voyageurAttend;
  else if (!st.welcomed) tl = tx(T.voyageurAnnonce, {date: frDate(st.tv.day.y,st.tv.day.m,st.tv.day.d), heure: hhmm(st.tv.h)});
  else { let d = {y:w.y,m:w.m,d:w.d}; for (let n=0;n<20;n++){ d = addDays(d.y,d.m,d.d,1); const s2 = seasonOf(d.y,d.m,d.d); if (s2.i !== st.s.i){ const t2 = travelerOf(s2); tl = tx(T.voyageurProchain, {date: frDate(t2.day.y,t2.day.m,t2.day.d), heure: hhmm(t2.h)}); break; } } }
  $('#trav-line').textContent = tl;
  $('#sekki-num').textContent = info.season.i+1; $('#ko-num').textContent = info.season.ko+1;
  $('#ko-kanji').textContent = k[0]; $('#ko-read').textContent = k[1];
  $('#ko-sense').textContent = k[3];
  $('#sekki-line').textContent = `${s[0]} ${s[1]} · ${s[2]}`;
  const nextK = CIEL.nextKo(Date.UTC(w.y,w.m-1,w.d,15), 1)[0];
  $('#ko-until').textContent = nextK ? `jusqu'au ${frDate(...Object.values(addDays(nextK.date.y,nextK.date.m,nextK.date.d,-1)))}` : '';
  const kt = N.KO_TEXTE[info.season.ko];
  $('#ko-text').innerHTML = kt ? kt : `<span class="todo">${T.koAEcrire}</span>`;
  $('#lab-hour-val').textContent = hhmm(sim.hour != null ? sim.hour : w.hour);
  if (!save.stamps.includes(info.season.ko)){ save.stamps.push(info.season.ko); persist(); son.event('tampon'); toast(tx(T.nouveauTampon, {ko: koName(info.season.ko)})); }
  const best = info.active.map(id=>MOMENTS.find(m=>m.id===id)).sort((a,b)=>RANK[b.rar]-RANK[a.rar])[0];
  const mEl = $('#moment'); if (best){ mEl.hidden = false; mEl.textContent = `${best.rar} · ` + (momentSauvable(best.id) ? best.name : tx(T.momentSimule, {moment: best.name})); } else mEl.hidden = true;
  for (const id of info.active) if (!save.moments.includes(id) && momentSauvable(id)){
    save.moments.push(id);
    if (id === 'firstsnow') save.firstSnow = w.m >= 7 ? w.y : w.y-1;
    persist(); toast(tx(T.momentAjoute, {moment: MOMENTS.find(m=>m.id===id).name}));
  }
  if (info.active.includes('firstsnow') && save.moments.includes('firstsnow') && momentSauvable('firstsnow')) { save.firstSnow = w.m >= 7 ? w.y : w.y-1; persist(); }
  // gestes
  const td = dayKey(w.y,w.m,w.d);
  $('#g-water').classList.toggle('done', save.watered === td);
  $('#g-feed').classList.toggle('done', save.fed === td);
  $('#g-sweep').classList.toggle('done', info.debris < .05);
  const dusk = info.sun.e < .08, lampDone = save.lamp === nightKey(w);
  $('#g-lamp').classList.toggle('done', lampDone && dusk);
  $('#g-lamp').disabled = !dusk;
  $('#g-lamp').textContent = dusk ? T.lampeBouton : T.lampeBoutonJour;
  renderBook(info.season.ko);
  if (sim.fast) labHour.value = sim.hour;
}
function checkSchedule(w){
  const mins = Math.floor(w.hour*60);
  for (const t of TRAINS){ const tm = t.h*60+t.m; if (mins === tm){ const key = `${dayKey(w.y,w.m,w.d)}-${tm}`; if (key !== lastTrainKey){ lastTrainKey = key; const st = travelerState(w); const isTv = t.h===N.VOYAGEUR.h && t.m===N.VOYAGEUR.m && dayKey(st.tv.day.y,st.tv.day.m,st.tv.day.d)===dayKey(w.y,w.m,w.d) && !st.welcomed && !save.arrived[st.tv.key]; const fermee = prov() && VIE.fermeture(FERM, w.y,w.m,w.d,w.hour).prov.fermee; startTrain({stop:t.stop && !fermee, traveler:isTv && !fermee}); } } }
}
let lastObjets = -1e9;
function frame(now){
  const dt = Math.min(.1, (now - lastFrame)/1000); lastFrame = now; clock += dt;
  if (sim.fast && sim.hour != null) sim.hour = (sim.hour + dt*.25) % 24;
  const w = worldTime(); cur = w;
  vue = MET.pointDeVue(w, meteoPour(w));
  if (!cam.drag && Math.abs(cam.vel) > .05){ cam.pan += cam.vel; cam.vel *= .92; layoutCam(); }
  if (sweep){ sweep.t += dt; if (sweep.t >= 1.2){ sweep = null; save.swept = Date.now(); persist(); toast(T.quaiBalaye); } }
  const info = computeInfo(w);
  // le voyageur de passage ne s'affiche pas en double pendant son arrivée
  if (trav.state === 'walk') info.waiting = false;
  if (trav.state === 'leave') info.waiting = false;
  const target = WX_PARAMS[kindNow()];
  for (const k in wx) wx[k] += (target[k] - wx[k]) * Math.min(1, dt*.8);
  checkSchedule(w); updateTrain(dt); updateTraveler(dt);
  drawScene(w, info);
  const tc = train.x + CAR/2;
  son.update({ rain: wx.rain, snow: wx.snow, wind: windNow(), fog: wx.fog, storm: wx.storm, night: info.night, sunE: info.sun.e,
    ko: info.season.ko, temp: vue.meteo.source === 'reelle' ? tempNow() : 12, lampOn: info.lampOn, furin: hasGift(0), ground: groundSnow(),
    bell: crossingActive(), train: train.phase === 'idle' ? null : { dist: Math.abs(tc - 790), speed: (train.v||0) / PX_PER_M, pan: clamp((tc - 790)/900, -1, 1) } });
  if (now - lastObjets > 5000){ lastObjets = now; objetsTick(); }
  if (now - lastHud > 400){ lastHud = now; hud(w, info); }
  requestAnimationFrame(frame);
}

/* ---------- Ouverture ---------- */
resize();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
cur = worldTime();
const prev = save.lastVisit;
save.prevVisit = prev; save.lastVisit = Date.now(); persist();
const touch = () => { save.lastVisit = Date.now(); persist(); };
setInterval(touch, 30e3); addEventListener('pagehide', touch); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') touch(); });
requestAnimationFrame(frame);
setTimeout(() => { if (!prev || Date.now() - prev > 20*60e3) openRegistre(prev); }, 900);
})();
