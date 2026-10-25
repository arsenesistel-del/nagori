/* Génère tests/donnees/simule-novembre-14-jours.json : une série SIMULÉE (jamais réelle) du 16 au 30 novembre 2026,
   avec des journées claires, couvertes, pluvieuses, neigeuses. Graine fixe : le fichier est reproductible.
   node tests/donnees/generer-simule-novembre.js */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { aleatoire } = require('../../js/objets.js');
const alea = aleatoire(20261117);
const regimes = ['clear', 'overcast', 'rain', 'snow', 'overcast', 'clear', 'heavysnow', 'drizzle', 'overcast', 'snow', 'clear', 'rain', 'overcast', 'snow', 'clear'];
const pad = n => String(n).padStart(2, '0');
const mesures = []; let sol = 0;
for (let j = 0; j < 15; j++) {
  const reg = regimes[j], base = reg === 'clear' ? -5 : reg.includes('snow') ? -4 : 1;
  for (let h = 0; h < 24; h++) {
    const jour = 16 + j, t = `2026-11-${pad(jour)}T${pad(h)}:00`;
    const isDay = h >= 7 && h < 16;
    const temp = Math.round((base + (isDay ? 3 : -2) + (alea() - .5) * 2) * 10) / 10;
    const actif = reg !== 'clear' && reg !== 'overcast' ? alea() < .6 : false;
    let kind = reg, precip = 0, snowfall = 0;
    if (!actif && reg !== 'clear' && reg !== 'overcast') kind = 'overcast';
    if (actif) {
      if (reg.includes('snow')) { snowfall = reg === 'heavysnow' ? 1.6 : .5; precip = snowfall / 7; sol = Math.min(.6, sol + snowfall / 100); }
      else precip = reg === 'drizzle' ? .2 : 1.2;
    } else if (temp > 0) sol = Math.max(0, sol - .004);
    mesures.push({ source: 'simulee', t, kind, code: 0, temp, hum: 80, precip, snowfall, snowDepth: Math.round(sol * 1000) / 1000, wind: 10, cloud: kind === 'clear' ? 5 : 100, isDay, recu: null });
  }
}
fs.writeFileSync(path.join(__dirname, 'simule-novembre-14-jours.json'),
  '{"source":"simulee","note":"Série simulée pour les tests de objets.js, du 16 au 30 novembre 2026. Jamais présentée comme réelle ; le magasin météo la refuse.","mesures":[\n' + mesures.map(m => JSON.stringify(m)).join(',\n') + '\n]}\n');
console.log(mesures.length + ' heures');
