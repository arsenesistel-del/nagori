/* Nagori · météo honnête (lot B)
   Logique pure, sans dessin : tourne dans le navigateur et dans Node (tests/meteo.test.js).

   Règles :
   - chaque mesure horaire porte sa source : 'reelle' (reçue d'Open-Meteo, avec l'heure de réception),
     'simulee' (Atelier ou tests) ou 'inconnue' (pas de donnée) ;
   - le magasin (et donc le cache du navigateur) n'accepte que du 'reelle' ;
   - une heure dont on ne sait rien reste 'inconnue' : on ne suppose jamais qu'il a plu ;
   - la météo est celle de modèles météo pour ce lieu (Open-Meteo), pas celle d'une station.
   Toutes les heures sont celles de Tokyo (JST, sans heure d'été). */
(function (root, factory) {
  const m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else { root.NAGORI = root.NAGORI || {}; root.NAGORI.meteo = m; }
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const H = 3600e3, MIN = 60e3, JST = 9 * H;

const REGLES = {
  delaiMs: 8000,                 // délai d'une requête
  reprisesMin: [1, 5, 15],       // nouvelles tentatives après un échec, puis toutes les 15 min
  periodeMin: 15,                // rythme normal
  garderMs: 2 * H,               // une donnée réelle de moins de 2 h reste affichée
  neigeMs: 24 * H,               // la neige au sol reste affichée 24 h après la dernière mesure
  attenteMs: 48 * H,             // une conséquence attend une donnée réelle 48 h au plus
  conserveMs: 10 * 24 * H,       // on efface du cache ce qui a plus de 10 jours
  joursPassesMax: 8
};

const VARIABLES = ['weather_code', 'temperature_2m', 'relative_humidity_2m', 'precipitation', 'snowfall', 'snow_depth', 'wind_speed_10m', 'cloud_cover', 'is_day'];

/* ---------- Heures ---------- */
const pad = n => String(n).padStart(2, '0');
/* 'AAAA-MM-JJTHH:00' (heure de Tokyo) de l'heure qui contient ms */
function cleHeure(ms) { return new Date(ms + JST).toISOString().slice(0, 13) + ':00'; }
/* instant (ms) du début de l'heure d'une clé ou d'un horodatage Open-Meteo 'AAAA-MM-JJTHH:MM' */
function msDe(cle) { return Date.parse(cle + ':00Z') - JST; }
function hhmm(ms) { const d = new Date(ms + JST); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }

/* ---------- Interprétation ---------- */
/* type de temps pour la scène, à partir des valeurs brutes d'Open-Meteo */
function wmo(c) {
  const code = c.weather_code, p = c.precipitation || 0;
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return (code === 75 || code === 86 || (c.snowfall || 0) >= 1.5) ? 'heavysnow' : 'snow';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return (code === 65 || code === 67 || code === 82 || p >= 4) ? 'heavyrain' : (p > 0 && p < .5 ? 'drizzle' : 'rain');
  if (code === 45 || code === 48) return 'fog';
  if (code === 3 || c.cloud_cover > 75) return 'overcast';
  if (code === 2 || c.cloud_cover > 30) return 'partly';
  return 'clear';
}
const pleut = k => k === 'drizzle' || k === 'rain' || k === 'heavyrain' || k === 'storm';
const neige = k => k === 'snow' || k === 'heavysnow';

const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

/* une ligne de la réponse (brute) devient une mesure, 'reelle', reçue à recuMs */
function mesure(brut, t, recuMs) {
  if (!brut || typeof brut !== 'object' || num(brut.weather_code) == null) return null;
  return {
    source: 'reelle', recu: recuMs, t,
    kind: wmo(brut), code: brut.weather_code,
    temp: num(brut.temperature_2m), hum: num(brut.relative_humidity_2m),
    precip: num(brut.precipitation) || 0, snowfall: num(brut.snowfall) || 0,
    snowDepth: num(brut.snow_depth),                       // en mètres ; null si non mesurée
    wind: num(brut.wind_speed_10m), cloud: num(brut.cloud_cover), isDay: brut.is_day == null ? null : !!brut.is_day
  };
}

/* réponse d'Open-Meteo → mesures. Les heures qui n'ont pas encore commencé sont des prévisions : on ne les retient pas. */
function lire(json, recuMs) {
  const sorties = [];
  if (!json || typeof json !== 'object') throw new Error('réponse illisible');
  const hr = json.hourly, cur = json.current;
  if (!hr && !cur) throw new Error('réponse sans données');
  if (hr && Array.isArray(hr.time)) {
    for (let i = 0; i < hr.time.length; i++) {
      const ms = msDe(hr.time[i]);
      if (!(ms <= recuMs)) continue;
      const brut = {}; for (const v of VARIABLES) brut[v] = Array.isArray(hr[v]) ? hr[v][i] : null;
      const m = mesure(brut, cleHeure(ms), recuMs); if (m) sorties.push(m);
    }
  }
  if (cur && typeof cur.time === 'string') {
    const m = mesure(cur, cleHeure(msDe(cur.time)), recuMs);
    if (m && msDe(cur.time) <= recuMs + 15 * MIN) { m.t = cur.time; m.instantane = true; sorties.push(m); }
  }
  if (!sorties.length) throw new Error('aucune donnée exploitable');
  return sorties;
}

/* ---------- Mesures inconnues et simulées ---------- */
function inconnue(statut = 'indisponible', plus = {}) {
  return Object.assign({ source: 'inconnue', statut, kind: 'overcast', temp: null, wind: null, snowDepth: 0, precip: 0, snowfall: 0, hum: null, cloud: null, isDay: null, recu: null, t: null }, plus);
}
/* mesure simulée par l'Atelier ou les tests : jamais enregistrée, jamais mêlée aux mesures réelles */
function simulee(base, regl = {}) {
  const b = base || inconnue();
  const kind = regl.kind || b.kind;
  const sol = !!regl.sol;
  const typeSimule = !!regl.kind;
  return Object.assign({}, b, {
    source: 'simulee', statut: 'simulee', kind,
    temp: (typeSimule || b.temp == null) ? (neige(kind) || sol ? -3 : 12) : b.temp,
    wind: regl.vent != null ? regl.vent * 45 : (typeSimule ? null : b.wind),
    snowDepth: sol ? .12 : (typeSimule ? 0 : b.snowDepth)
  });
}

/* ---------- Magasin : les mesures réelles, heure par heure ---------- */
function creerMagasin() {
  const heures = new Map();             // clé d'heure → mesure
  let dernierRecu = null;
  return {
    ajouter(liste) {
      for (const m of liste) {
        if (!m || m.source !== 'reelle') throw new Error('le magasin n\'accepte que des mesures réelles (source : ' + (m && m.source) + ')');
        const k = cleHeure(msDe(m.t));
        const ex = heures.get(k);
        if (!ex || m.recu >= ex.recu) heures.set(k, m);
        if (dernierRecu == null || m.recu > dernierRecu) dernierRecu = m.recu;
      }
    },
    /* mesure d'une heure précise, sinon inconnue : jamais d'estimation */
    a(ms) { return heures.get(cleHeure(ms)) || inconnue('heure-inconnue', { t: cleHeure(ms) }); },
    /* la météo maintenant : la dernière mesure réelle, tant qu'elle est assez récente */
    maintenant(ms, etat = {}) {
      let m = heures.get(cleHeure(ms));
      if (!m) { let best = null; for (const [k, v] of heures) if (msDe(k) <= ms && (!best || k > best.k)) best = { k, v }; m = best && best.v; }
      const age = m ? ms - m.recu : null;
      const neigeAuSol = this.neigeAuSol(ms);
      if (m && age < REGLES.garderMs) {
        return Object.assign({}, m, { statut: 'reelle', ancienne: (etat.echecs || 0) > 0, age });
      }
      return inconnue(((etat.echecs || 0) > 0 || etat.dernierSucces != null) ? 'indisponible' : 'attente', { snowDepth: neigeAuSol == null ? 0 : neigeAuSol, neigeRetenue: neigeAuSol != null });
    },
    /* épaisseur de neige (m) de la dernière mesure réelle qui en portait une, si elle a moins de 24 h ; sinon null */
    neigeAuSol(ms) {
      let best = null;
      for (const v of heures.values()) if (v.snowDepth != null && msDe(v.t) <= ms && (!best || msDe(v.t) > msDe(best.t) || (msDe(v.t) === msDe(best.t) && v.recu > best.recu))) best = v;
      return best && ms - best.recu < REGLES.neigeMs ? best.snowDepth : null;
    },
    dernierRecu() { return dernierRecu; },
    nombre() { return heures.size; },
    /* cache du navigateur : seulement du réel, rien de plus ancien que 10 jours */
    serialiser(ms) {
      const garde = []; for (const m of heures.values()) if (ms - m.recu <= REGLES.conserveMs && ms - msDe(m.t) <= REGLES.conserveMs) garde.push(m);
      return JSON.stringify({ v: 1, mesures: garde });
    },
    charger(texte, ms) {
      try {
        const d = JSON.parse(texte); if (!d || !Array.isArray(d.mesures)) return 0;
        const ok = d.mesures.filter(m => m && m.source === 'reelle' && typeof m.t === 'string' && typeof m.recu === 'number' && m.recu <= ms && ms - m.recu <= REGLES.conserveMs && num(m.code) != null);
        this.ajouter(ok); return ok.length;
      } catch (e) { return 0; }
    }
  };
}

/* Une conséquence qui dépend d'une heure dont la météo est inconnue : elle attend une vraie donnée 48 h au plus.
   'attendre' tant que le délai court, 'abandonner' ensuite (seules les conséquences indépendantes de la météo restent possibles). */
function attenteDonnee(msCondition, msMaintenant) { return msMaintenant - msCondition < REGLES.attenteMs ? 'attendre' : 'abandonner'; }
/* une condition météo peut-elle être jugée ? seulement avec une mesure réelle */
const jugeable = m => !!m && m.source === 'reelle';

/* ---------- Point de vue : un instant et une météo, que la scène sait dessiner ---------- */
function pointDeVue(instant, meteo) {
  return { instant, meteo, simule: !!(instant && instant.simulated) || meteo.source === 'simulee' };
}

/* ---------- Requête et reprises ---------- */
const joursPasses = (derniereVisiteMs, ms) => !derniereVisiteMs ? 1 : Math.max(1, Math.min(REGLES.joursPassesMax, Math.ceil((ms - derniereVisiteMs) / (24 * H)) + 1));
function adresse(lat, lon, jours) {
  const v = VARIABLES.join(',');
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${v}&hourly=${v}&past_days=${jours}&forecast_days=1&timezone=Asia%2FTokyo`;
}
/* délai avant le prochain essai : 15 min si tout va bien ; après un échec 1, 5 puis 15 min, ensuite 15 min */
function delaiMin(echecs) { return echecs <= 0 ? REGLES.periodeMin : REGLES.reprisesMin[Math.min(echecs, REGLES.reprisesMin.length) - 1]; }

/* Le client reçoit tout de l'extérieur (fetch, horloge, minuteur) pour se tester sans réseau. */
function creerClient(o) {
  const { magasin, lat, lon, fetch: aller, maintenant = Date.now, planifier = setTimeout, annuler = clearTimeout, apres = () => {} } = o;
  const etat = { echecs: 0, essais: 0, dernierEssai: null, dernierSucces: null, prochain: null, jours: o.jours || 1, erreur: null };
  let minuteur = null, enCours = false;
  async function actualiser() {
    if (enCours) return; enCours = true;
    if (minuteur != null) { annuler(minuteur); minuteur = null; }
    etat.essais++; etat.dernierEssai = maintenant();
    let ctl = null, coupe = null;
    try {
      if (typeof AbortController === 'function') ctl = new AbortController();
      const course = new Promise((_, rejet) => { coupe = planifier(() => { rejet(new Error('délai dépassé')); if (ctl) ctl.abort(); }, REGLES.delaiMs); });
      course.catch(() => {});
      const reponse = await Promise.race([aller(adresse(lat, lon, etat.jours), ctl ? { signal: ctl.signal } : {}), course]);
      if (!reponse || !reponse.ok) throw new Error('http ' + (reponse && reponse.status));
      const json = await Promise.race([reponse.json(), course]);
      const recu = maintenant();
      magasin.ajouter(lire(json, recu));
      etat.echecs = 0; etat.erreur = null; etat.dernierSucces = recu; etat.jours = 1;
    } catch (e) {
      etat.echecs++; etat.erreur = String(e && e.message || e);
    } finally {
      if (coupe != null) annuler(coupe);
      enCours = false;
      const d = delaiMin(etat.echecs) * MIN;
      etat.prochain = maintenant() + d;
      minuteur = planifier(actualiser, d);
      try { apres(etat); } catch (e) {}
    }
  }
  /* au retour au premier plan : un essai tout de suite si le dernier date de plus d'une période */
  function reveil() { if (!enCours && (etat.dernierEssai == null || maintenant() - etat.dernierEssai > REGLES.periodeMin * MIN)) actualiser(); }
  return { actualiser, reveil, etat };
}

return { REGLES, VARIABLES, cleHeure, msDe, hhmm, wmo, pleut, neige, lire, inconnue, simulee, creerMagasin, attenteDonnee, jugeable, pointDeVue, joursPasses, adresse, delaiMin, creerClient };
});
