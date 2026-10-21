/* Mini banc d'essai sans bibliothèque : node tests/meteo.test.js */
'use strict';
const assert = require('node:assert/strict');
let ok = 0, ko = 0;
const taches = [];
function test(nom, fn) { taches.push([nom, fn]); }
async function lancer(titre) {
  console.log(titre);
  for (const [nom, fn] of taches) {
    try { await fn(); ok++; console.log('  ok   ' + nom); }
    catch (e) { ko++; console.log('  ECHEC ' + nom + '\n        ' + String(e && e.message || e).split('\n').join('\n        ')); }
  }
  console.log(`${ok} réussis, ${ko} échoués`);
  if (ko) process.exitCode = 1;
}
module.exports = { assert, test, lancer };
