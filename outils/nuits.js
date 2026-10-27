/* Nagori · rapport sur les nuits (critère « Nuit » du cahier des charges, partie 9)
   Pour chaque nuit d'une série météo, ce que la vie de nuit tire (data/monde.js, js/vie.js), et si une soirée de Paris
   (18 h à 23 h, heure de Paris) est calme ou a un événement marquant. C'est une information à relire, pas un seuil.

     node outils/nuits.js                       série réelle de tests/donnees (7 jours d'octobre) et série simulée de novembre (14 jours)
     node outils/nuits.js FICHIER.json          une réponse brute d'Open-Meteo { reponse, recu } ou une série { mesures }

   La série simulée de novembre n'est pas réelle : elle sert seulement à voir les règles jouer avec de la neige. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const RACINE = path.join(__dirname, '..');
const bac = { Math, Date, Object, Number, String }; bac.window = bac; vm.createContext(bac);
vm.runInContext(fs.readFileSync(path.join(RACINE, 'data/monde.js'), 'utf8'), bac);
const NUIT = bac.window.NAGORI.NUIT, METEO = require('../js/meteo.js'), vie = require('../js/vie.js');
const H = 3600e3, MARQUANTS = ['chasseNeige', 'cheminotQuai', 'cerfs', 'renard'];
const hhmm = h => { const t = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };

/* l'écart entre Paris et le Japon, selon la date (heure d'été européenne : du dernier dimanche de mars au dernier dimanche d'octobre) */
function ecartParis(ms) {
  const y = new Date(ms).getUTCFullYear(), dimanche = (m) => { const d = new Date(Date.UTC(y, m + 1, 0)); return Date.UTC(y, m, d.getUTCDate() - d.getUTCDay(), 1); };
  return ms >= dimanche(2) && ms < dimanche(9) ? 7 : 8;
}

function serie(fichier) {
  const j = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  let mesures;
  if (j.reponse) mesures = METEO.lire(j.reponse, j.recu ? Date.parse(j.recu) : Date.now());
  else mesures = j.mesures.map(x => Object.assign({}, x, { source: 'reelle', recu: 0 }));
  const m = new Map(mesures.map(x => [METEO.cleHeure(METEO.msDe(x.t)), x]));
  const debut = Math.min(...mesures.map(x => METEO.msDe(x.t))), fin = Math.max(...mesures.map(x => METEO.msDe(x.t)));
  return { meteo: { a: ms => m.get(METEO.cleHeure(ms)) || null }, debut, fin, simulee: j.source === 'simulee', note: j.note || '' };
}

function rapport(fichier) {
  const s = serie(fichier);
  console.log(`\n${path.basename(fichier)}${s.simulee ? ' (SIMULÉE, pas réelle)' : ''}`);
  let calmes = 0, marquees = 0, nuits = 0;
  const jst = new Date(s.debut + 9 * H);
  for (let d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate())); ; d = new Date(d.getTime() + 24 * H)) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, j = d.getUTCDate(), minuit = Date.UTC(y, m - 1, j) - 9 * H;
    if (minuit + 30 * H > s.fin) break;                       // la nuit doit être couverte jusqu'au matin
    if (minuit + 18 * H < s.debut) continue;
    nuits++;
    const ev = vie.nuitDe(NUIT, y, m, j, s.meteo), ecart = ecartParis(minuit + 24 * H);
    /* soirée de Paris : 18 h à 23 h à Paris, soit (18 + écart) à (23 + écart) heures de la gare, comptées depuis ce jour */
    const de = 18 + ecart, a = 23 + ecart;
    const marquants = ev.filter(x => MARQUANTS.includes(x.id));
    const soiree = marquants.filter(x => x.debut < a && (x.fin || x.debut) > de);
    if (soiree.length) marquees++; else calmes++;
    const neige = vie.neigeTombee(s.meteo, minuit + 18 * H, minuit + 29 * H).toFixed(1);
    console.log(`  nuit du ${j}/${m} : ${marquants.length ? marquants.map(x => `${x.id} ${hhmm(x.debut)}`).join(', ') : 'rien de marquant'} · neige 18 h-5 h : ${neige} cm · soirée de Paris (${hhmm(de)}-${hhmm(a)} au Japon) : ${soiree.length ? soiree.map(x => x.id).join(', ') : 'calme'}`);
  }
  console.log(`  ${nuits} nuits : ${calmes} soirées de Paris calmes, ${marquees} avec un événement marquant.`);
}

const fichiers = process.argv.slice(2);
for (const f of fichiers.length ? fichiers : ['tests/donnees/reel-2026-10-22.json', 'tests/donnees/simule-novembre-14-jours.json']) rapport(path.resolve(RACINE, f));
