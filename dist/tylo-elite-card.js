/* Tylö Elite card: the Tylö Elite (Cloud) sauna control panel as a Lovelace card.
 *
 *   type: custom:tylo-elite-card
 *   entity: climate.tylo_sauna_climate   # the heater: a climate, or a switch
 *   name: Bastun                         # optional: written over the panel
 *   entities:                            # optional: any role below, by entity id;
 *     temperature: sensor.tylo_current_temperature      # the rest is found on
 *     target_temperature: number.tylo_bath_temperature  # the entity's device,
 *     humidity: sensor.bastu_luftfuktighet              # and "none" drops a
 *     target_humidity: number.tylo_humidity             # role that was found
 *     bath_time: number.tylo_bath_time
 *     remaining_time: sensor.tylo_remaining_time        # or a timer
 *     light: switch.tylo_light
 *     ready: binary_sensor.tylo_ready_state
 *     heating: binary_sensor.tylo_heater_state
 *     heater: switch.tylo_heater                        # on/off, when entity is a climate
 *   toggles:                             # optional: more rows under the lighting
 *     - switch.bastu_doft_lavendel
 *     - entity: switch.bastu_doft_eukalyptus
 *       name: Eukalyptus
 *   favorites:                           # optional: fixed favourites
 *     - name: Kvällsbad
 *       temperature: 80
 *       humidity: 30
 *       bath_time: 120                   # minutes
 *       light: true
 *       toggles: { switch.bastu_doft_lavendel: true }
 *   schedule:                            # optional: the calendar tab
 *     - schedule.bastu_vardagar
 *     - automation.bastu_fredag
 *   info:                                # optional: more rows on the system tab
 *     - sensor.bastu_dorr
 *   time_step: 10                        # minutes per press on "Stop after"
 *   language: sv                         # optional: pins the language
 *   hide_bezel: false                    # true: the screen alone, no black glass
 *   logo: TYLÖ                           # the word on the glass; "none" hides it
 *   max_width: 380px
 *
 * The panel's five screens, behind the same row of icons at the bottom:
 * home (the overview: the bath temperature large, the humidity under a line,
 * the set values small at the top, the clock and the connection at the
 * bottom, light, power and the state in the bar along the top), settings
 * (temperature and humidity with − and +, "Stop after", lighting and the
 * extra toggles, "Save as favourite"), favourites, the weekly program and
 * the system. The calendar icon shows only with a schedule configured.
 *
 * Built for the ESPHome sauna360 component (f-io/esphome-tylo): with its
 * climate as the entity, every other role is found on the same device by the
 * entity's object id without the device's prefix (bath_temperature,
 * bath_time, remaining_time, light, ready_state, heater_state, humidity).
 * Any other sauna works with the roles given by hand.
 *
 * Presses on − and + show at once and are sent 0.7 s after the last one, so
 * ten presses are one write; held down, the button repeats. Saved favourites
 * live in the viewing user's Home Assistant profile (frontend/set_user_data),
 * so they follow the user to every device; the ones in the configuration are
 * shared and cannot be deleted from the card.
 *
 * The pure helpers at the top are also loaded by tests/card.test.mjs in node,
 * which is why the custom element is only defined in a browser.
 */

const TYPE = "tylo-elite-card";
const VERSION = "0.1.0";
const USER_DATA_KEY = "tylo-elite-card";
const SEND_DELAY_MS = 700;
const SETTLE_MS = 6000;
const OPTIMISTIC_MS = 5000;

const STR = {
  en: {
    name: "Tylö Elite",
    description: "A sauna control panel in the style of the Tylö Elite: temperature, humidity, bath time, lighting and favourites.",
    temperature: "Temperature", humidity: "Humidity", stopAfter: "Stop after", lighting: "Lighting",
    saveFav: "Save as favourite", save: "Save", cancel: "Cancel", favName: "Name of the favourite",
    favDefault: "Favourite {n}", favorites: "Favourites", start: "Start", delete: "Delete",
    noFavorites: "No favourites yet. Set the temperature and the time under the thermometer, then save them as a favourite.",
    program: "Weekly program", noProgram: "Add schedules under schedule: in the card's configuration.",
    system: "System", connection: "Connection", connected: "Connected", offline: "Offline",
    moreInfo: "More information", power: "On/off",
    off: "OFF", heating: "HEATING", ready: "READY", unavailable: "—",
    stopsIn: "Stops in {t}", bathTime: "Bath time {t}", notFound: "{id} not found",
    runningNow: "Running now", next: "Next {t}", lastRun: "Last {t}", missing: "Not found",
    noSettings: "Nothing to set: give the card a target temperature, a humidity or a bath time.",
    tab_home: "Home", tab_settings: "Settings", tab_favorites: "Favourites", tab_program: "Weekly program", tab_system: "System",
    lightOn: "light", startedFav: "{name} started",
    f_entity: "Heater (climate or switch)", f_name: "Name", f_entities: "Entities (found on the heater's device when empty)",
    f_temperature: "Temperature now", f_target_temperature: "Set temperature", f_humidity: "Humidity now",
    f_target_humidity: "Set humidity", f_bath_time: "Bath time (Stop after)", f_remaining_time: "Remaining time",
    f_light: "Lighting", f_ready: "Ready", f_heating: "Heating element on", f_heater: "On/off switch",
    f_toggles: "More toggles (aroma, fan …)", f_schedule: "Weekly program (schedule, calendar, automation)",
    f_info: "More rows on the system screen", f_time_step: "Minutes per press on Stop after",
    f_language: "Language", f_hide_bezel: "Hide the black glass frame", f_logo: "Text on the frame (none hides it)",
    f_max_width: "Max width", auto: "Automatic",
  },
  sv: {
    name: "Tylö Elite",
    description: "En bastupanel i Tylö Elites stil: temperatur, luftfuktighet, badtid, belysning och favoriter.",
    temperature: "Temperatur", humidity: "Fuktighet", stopAfter: "Stoppa efter", lighting: "Belysning",
    saveFav: "Spara som favorit", save: "Spara", cancel: "Avbryt", favName: "Favoritens namn",
    favDefault: "Favorit {n}", favorites: "Favoriter", start: "Starta", delete: "Ta bort",
    noFavorites: "Inga favoriter än. Ställ in temperatur och tid under termometern och spara dem som favorit.",
    program: "Veckoprogram", noProgram: "Lägg till scheman under schedule: i kortets inställningar.",
    system: "System", connection: "Anslutning", connected: "Ansluten", offline: "Ej ansluten",
    moreInfo: "Mer information", power: "På/av",
    off: "AV", heating: "VÄRMER", ready: "KLAR", unavailable: "—",
    stopsIn: "Stoppar om {t}", bathTime: "Badtid {t}", notFound: "{id} finns inte",
    runningNow: "Pågår nu", next: "Nästa {t}", lastRun: "Senast {t}", missing: "Finns inte",
    noSettings: "Inget att ställa in: ge kortet en måltemperatur, en fuktighet eller en badtid.",
    tab_home: "Hem", tab_settings: "Inställningar", tab_favorites: "Favoriter", tab_program: "Veckoprogram", tab_system: "System",
    lightOn: "ljus", startedFav: "{name} startad",
    f_entity: "Aggregat (climate eller switch)", f_name: "Namn", f_entities: "Entiteter (hittas på aggregatets enhet om tomt)",
    f_temperature: "Temperatur nu", f_target_temperature: "Inställd temperatur", f_humidity: "Fuktighet nu",
    f_target_humidity: "Inställd fuktighet", f_bath_time: "Badtid (Stoppa efter)", f_remaining_time: "Tid kvar",
    f_light: "Belysning", f_ready: "Klar", f_heating: "Värmeelement på", f_heater: "På/av-brytare",
    f_toggles: "Fler brytare (doft, fläkt …)", f_schedule: "Veckoprogram (schedule, calendar, automation)",
    f_info: "Fler rader på systemskärmen", f_time_step: "Minuter per tryck på Stoppa efter",
    f_language: "Språk", f_hide_bezel: "Dölj den svarta glasramen", f_logo: "Text på ramen (none döljer den)",
    f_max_width: "Största bredd", auto: "Automatiskt",
  },
  de: {
    name: "Tylö Elite",
    description: "Ein Saunabedienfeld im Stil des Tylö Elite: Temperatur, Feuchtigkeit, Badezeit, Licht und Favoriten.",
    temperature: "Temperatur", humidity: "Feuchtigkeit", stopAfter: "Stopp nach", lighting: "Beleuchtung",
    saveFav: "Als Favorit speichern", save: "Speichern", cancel: "Abbrechen", favName: "Name des Favoriten",
    favDefault: "Favorit {n}", favorites: "Favoriten", start: "Starten", delete: "Löschen",
    noFavorites: "Noch keine Favoriten. Temperatur und Zeit unter dem Thermometer einstellen und als Favorit speichern.",
    program: "Wochenprogramm", noProgram: "Zeitpläne unter schedule: in der Kartenkonfiguration hinzufügen.",
    system: "System", connection: "Verbindung", connected: "Verbunden", offline: "Offline",
    moreInfo: "Weitere Informationen", power: "Ein/Aus",
    off: "AUS", heating: "HEIZT", ready: "BEREIT", unavailable: "—",
    stopsIn: "Stoppt in {t}", bathTime: "Badezeit {t}", notFound: "{id} nicht gefunden",
    runningNow: "Läuft jetzt", next: "Nächste {t}", lastRun: "Zuletzt {t}", missing: "Nicht gefunden",
    noSettings: "Nichts einzustellen: der Karte eine Solltemperatur, eine Feuchtigkeit oder eine Badezeit geben.",
    tab_home: "Start", tab_settings: "Einstellungen", tab_favorites: "Favoriten", tab_program: "Wochenprogramm", tab_system: "System",
    lightOn: "Licht", startedFav: "{name} gestartet",
    f_entity: "Ofen (climate oder switch)", f_name: "Name", f_entities: "Entitäten (leer: am Gerät des Ofens gesucht)",
    f_temperature: "Temperatur jetzt", f_target_temperature: "Solltemperatur", f_humidity: "Feuchtigkeit jetzt",
    f_target_humidity: "Sollfeuchtigkeit", f_bath_time: "Badezeit (Stopp nach)", f_remaining_time: "Restzeit",
    f_light: "Beleuchtung", f_ready: "Bereit", f_heating: "Heizelement an", f_heater: "Ein/Aus-Schalter",
    f_toggles: "Weitere Schalter (Duft, Lüfter …)", f_schedule: "Wochenprogramm (schedule, calendar, automation)",
    f_info: "Weitere Zeilen im System", f_time_step: "Minuten pro Druck auf Stopp nach",
    f_language: "Sprache", f_hide_bezel: "Schwarzen Glasrahmen ausblenden", f_logo: "Text auf dem Rahmen (none blendet aus)",
    f_max_width: "Maximale Breite", auto: "Automatisch",
  },
};

// The roles the card reads, and where each is found on the heater's device:
// the entity's object id without the device's prefix, in this order. A key
// with an underscore also matches as a tail (bath_time in tylo_x_bath_time),
// but never behind max_, min_, setting_ or overheating_.
const RULES = {
  heater: { domains: ["switch"], keys: ["heater"] },
  temperature: { domains: ["sensor"], keys: ["current_temperature", "temperature"] },
  target_temperature: { domains: ["number", "input_number"], keys: ["bath_temperature", "target_temperature"] },
  humidity: { domains: ["sensor"], keys: ["current_humidity", "humidity"] },
  target_humidity: { domains: ["number", "input_number"], keys: ["humidity", "target_humidity", "humidity_percent"] },
  bath_time: { domains: ["number", "input_number"], keys: ["bath_time"] },
  remaining_time: { domains: ["sensor", "timer"], keys: ["remaining_time", "remaining_bath_time"] },
  light: { domains: ["switch", "light"], keys: ["light"] },
  ready: { domains: ["binary_sensor"], keys: ["ready_state", "ready"] },
  heating: { domains: ["binary_sensor"], keys: ["heater_state", "heating"] },
};
const ROLES = Object.keys(RULES);
// A climate is its own on/off, temperature and target: those three are only
// taken from the device when the entity is a switch.
const CLIMATE_OWN = ["heater", "temperature", "target_temperature"];
// The system screen's rows, found the same way among the sensors.
const INFO_KEYS = ["heater_state", "heating_element", "ready_state", "water_tank_level", "setting_humidity",
                   "max_bath_temperature", "overheating_pcb_limit", "heater_session_uptime", "session_uptime",
                   "total_uptime", "wifi_signal"];
const TAIL_GUARD = /(^|_)(max|min|setting|overheating)_$/;
const TOGGLE_DOMAINS = ["switch", "light", "input_boolean", "fan", "automation", "siren", "humidifier", "script"];

const ROLE_DOMAINS = {
  heater: ["switch", "input_boolean"], temperature: ["sensor"], target_temperature: ["number", "input_number"],
  humidity: ["sensor"], target_humidity: ["number", "input_number"], bath_time: ["number", "input_number"],
  remaining_time: ["sensor", "timer"], light: ["switch", "light", "input_boolean"], ready: ["binary_sensor", "input_boolean"],
  heating: ["binary_sensor"],
};

// ---------------------------------------------------------------- helpers

function langOf(hass, cfg) {
  const want = (cfg && cfg.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || "en";
  const base = String(want).toLowerCase().split(/[-_]/)[0];
  return STR[base] ? base : "en";
}

function label(lang, key, vars) {
  let s = (STR[lang] && STR[lang][key]) || STR.en[key] || key;
  if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
  return s;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function list(x) {
  return Array.isArray(x) ? x : x == null ? [] : [x];
}

function num(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : parseFloat(x);
  return Number.isFinite(n) ? n : null;
}

function live(s) {
  return !!s && s.state !== "unavailable" && s.state !== "unknown";
}

function domainOf(id) {
  return String(id).split(".")[0];
}

function cssLength(x) {
  if (typeof x === "number" && x > 0) return x + "px";
  if (typeof x === "string" && /^(none|\d+(\.\d+)?(px|em|rem|%|vw))$/.test(x.trim())) return x.trim();
  return null;
}

function entityItem(x) {
  if (typeof x === "string") return x ? { entity: x } : null;
  if (x && typeof x === "object" && typeof x.entity === "string" && x.entity) {
    return { entity: x.entity, name: typeof x.name === "string" ? x.name : "" };
  }
  return null;
}

function configOf(raw) {
  if (!raw || typeof raw !== "object") throw new Error("tylo-elite-card: the configuration is missing");
  const ents = raw.entities && typeof raw.entities === "object" ? raw.entities : {};
  const entity = typeof raw.entity === "string" && raw.entity ? raw.entity : null;
  if (!entity || !entity.includes(".")) {
    throw new Error("tylo-elite-card: entity is required, the heater's climate or switch (e.g. climate.tylo_sauna_climate)");
  }
  const entities = {};
  for (const r of ROLES) if (typeof ents[r] === "string" && ents[r]) entities[r] = ents[r];
  const favorites = list(raw.favorites)
    .filter((f) => f && typeof f === "object" && f.name)
    .map((f) => favOf(f));
  const step = num(raw.time_step);
  const logo = raw.logo === false || raw.logo === "none" ? "" : raw.logo == null || raw.logo === "" ? "TYLÖ" : String(raw.logo);
  return {
    entity,
    name: typeof raw.name === "string" ? raw.name : "",
    entities,
    toggles: list(raw.toggles).map(entityItem).filter(Boolean),
    favorites,
    schedule: list(raw.schedule).map(entityItem).filter(Boolean),
    info: list(raw.info).map(entityItem).filter(Boolean),
    time_step: step && step > 0 ? step : 10,
    language: typeof raw.language === "string" ? raw.language : "",
    hide_bezel: raw.hide_bezel === true,
    logo,
    max_width: cssLength(raw.max_width) || "380px",
    discover: raw.discover !== false,
  };
}

// A favourite as stored: only the values it carries.
function favOf(f) {
  const out = { name: String(f.name).slice(0, 40) };
  const t = num(f.temperature), h = num(f.humidity), b = num(f.bath_time);
  if (t != null) out.temperature = t;
  if (h != null) out.humidity = h;
  if (b != null) out.bath_time = b;
  if (typeof f.light === "boolean") out.light = f.light;
  if (f.toggles && typeof f.toggles === "object") {
    const tg = {};
    for (const k of Object.keys(f.toggles)) if (typeof f.toggles[k] === "boolean") tg[k] = f.toggles[k];
    if (Object.keys(tg).length) out.toggles = tg;
  }
  return out;
}

// Each id's object id without the prefix every id on the device shares, cut
// at an underscore: tylo_current_temperature → current_temperature.
function keysOf(ids) {
  const objs = ids.map((id) => id.slice(id.indexOf(".") + 1));
  let p = objs[0] || "";
  for (const o of objs) while (p && !o.startsWith(p)) p = p.slice(0, -1);
  p = objs.length > 1 ? p.slice(0, p.lastIndexOf("_") + 1) : "";
  const out = {};
  ids.forEach((id, i) => { out[id] = objs[i].length > p.length ? objs[i].slice(p.length) : objs[i]; });
  return out;
}

function matchKey(ids, keys, domains, wanted) {
  const ok = (id) => !domains || domains.includes(domainOf(id));
  for (const w of wanted) {
    const hit = ids.find((id) => ok(id) && keys[id] === w);
    if (hit) return hit;
  }
  for (const w of wanted) {
    if (!w.includes("_")) continue;
    const hit = ids.find((id) => {
      const k = keys[id];
      return ok(id) && k.endsWith("_" + w) && !TAIL_GUARD.test(k.slice(0, k.length - w.length));
    });
    if (hit) return hit;
  }
  return null;
}

// The roles and the system rows on the entity's device, from the entity
// registry the frontend holds (hass.entities).
function discover(hass, entityId) {
  const out = { roles: {}, info: [] };
  const reg = hass && hass.entities;
  const own = reg && reg[entityId];
  if (!own || !own.device_id) return out;
  const peers = Object.keys(reg).filter((id) => id !== entityId && reg[id] && reg[id].device_id === own.device_id);
  const keys = keysOf([entityId].concat(peers));
  for (const role of ROLES) {
    const id = matchKey(peers, keys, RULES[role].domains, RULES[role].keys);
    if (id) out.roles[role] = id;
  }
  for (const k of INFO_KEYS) {
    const id = matchKey(peers, keys, ["sensor", "binary_sensor"], [k]);
    if (id && !out.info.includes(id)) out.info.push(id);
  }
  return out;
}

function rolesOf(cfg, found) {
  const climate = domainOf(cfg.entity) === "climate";
  const roles = {};
  for (const r of ROLES) {
    const own = cfg.entities[r];
    if (own === "none") continue;
    if (own) { roles[r] = own; continue; }
    if (r === "heater" && !climate) { roles[r] = cfg.entity; continue; }
    if (climate && CLIMATE_OWN.includes(r)) continue;
    if (found.roles[r]) roles[r] = found.roles[r];
  }
  return roles;
}

function toMin(v, unit) {
  if (v == null) return null;
  switch (String(unit || "min").toLowerCase()) {
    case "s": return v / 60;
    case "h": return v * 60;
    case "d": return v * 1440;
    default: return v;
  }
}

function fromMin(v, unit) {
  if (v == null) return null;
  switch (String(unit || "min").toLowerCase()) {
    case "s": return v * 60;
    case "h": return v / 60;
    case "d": return v / 1440;
    default: return v;
  }
}

// "1:30:00" → 90
function durationMin(s) {
  const parts = String(s).split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  while (parts.length < 3) parts.unshift(0);
  return parts[0] * 60 + parts[1] + parts[2] / 60;
}

function remainingOf(s, now) {
  if (!s) return null;
  if (domainOf(s.entity_id) === "timer") {
    if (s.state === "active" && s.attributes.finishes_at) return Math.max(0, (Date.parse(s.attributes.finishes_at) - now) / 60000);
    if (s.state === "paused" && s.attributes.remaining) return durationMin(s.attributes.remaining);
    return null;
  }
  if (!live(s)) return null;
  return toMin(num(s.state), s.attributes.unit_of_measurement || "min");
}

// 180 → "3h 0min", 45 → "45min": the panel's own way of writing it.
function fmtDuration(min) {
  if (min == null) return "—";
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h ${r}min` : `${r}min`;
}

function fmtNum(v) {
  if (v == null) return "--";
  return String(Math.round(v));
}

// One press: to the next mark of the step in that direction, inside the
// limits. From 245 with step 10, up is 250 and down is 240.
function stepped(value, dir, step, min, max) {
  const s = step > 0 ? step : 1;
  let v;
  if (value == null) v = dir > 0 ? min : max;
  else if (dir > 0) v = Math.floor(value / s + 1e-9) * s + s;
  else v = Math.ceil(value / s - 1e-9) * s - s;
  if (v == null) return null;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return +v.toFixed(4);
}

function clampTo(v, f) {
  let x = v;
  if (f.min != null) x = Math.max(f.min, x);
  if (f.max != null) x = Math.min(f.max, x);
  return x;
}

function numberField(s, id) {
  const a = (s && s.attributes) || {};
  return { id, kind: domainOf(id), value: live(s) ? num(s.state) : null, min: num(a.min), max: num(a.max),
           step: num(a.step) || 1, ok: live(s) };
}

function switchField(s, id) {
  return { id, on: !!s && s.state === "on", ok: !!s && s.state !== "unavailable" };
}

function nameOf(hass, id) {
  const s = hass.states && hass.states[id];
  let n = (s && s.attributes && s.attributes.friendly_name) || id;
  const e = hass.entities && hass.entities[id];
  const d = e && e.device_id && hass.devices && hass.devices[e.device_id];
  const dn = d && (d.name_by_user || d.name);
  if (dn && n.toLowerCase().startsWith(dn.toLowerCase() + " ") && n.length > dn.length + 1) n = n.slice(dn.length + 1);
  return n;
}

function stateText(hass, s) {
  if (!s) return "—";
  if (typeof hass.formatEntityState === "function") {
    try { return hass.formatEntityState(s); } catch (e) { /* the plain state below */ }
  }
  const u = s.attributes && s.attributes.unit_of_measurement;
  return u ? `${s.state} ${u}` : s.state;
}

// Everything the screens show, read from the states.
function modelOf(hass, cfg, roles, now) {
  const st = (id) => (id && hass.states ? hass.states[id] : undefined);
  const main = st(cfg.entity);
  const climate = domainOf(cfg.entity) === "climate";
  const sysUnit = (hass.config && hass.config.unit_system && hass.config.unit_system.temperature) || "°C";
  const m = { found: !!main, available: !!main && main.state !== "unavailable", climate, unit: sysUnit };

  if (roles.heater) {
    const s = st(roles.heater);
    m.power = { id: roles.heater, kind: "switch", on: !!s && s.state === "on", ok: !!s && s.state !== "unavailable" };
  } else if (climate) {
    m.power = { id: cfg.entity, kind: "climate", on: !!main && !["off", "unavailable", "unknown"].includes(main.state),
                ok: m.available, modes: (main && main.attributes.hvac_modes) || [] };
  } else {
    m.power = null;
  }

  m.temp = null;
  if (roles.temperature) {
    const s = st(roles.temperature);
    m.temp = live(s) ? num(s.state) : null;
    if (s && s.attributes.unit_of_measurement) m.unit = s.attributes.unit_of_measurement;
  } else if (climate && live(main)) {
    m.temp = num(main.attributes.current_temperature);
  }

  m.target = null;
  if (roles.target_temperature) {
    const s = st(roles.target_temperature);
    m.target = numberField(s, roles.target_temperature);
    if (!roles.temperature && s && s.attributes.unit_of_measurement) m.unit = s.attributes.unit_of_measurement;
  } else if (climate && main && main.attributes.temperature !== undefined) {
    const a = main.attributes;
    m.target = { id: cfg.entity, kind: "climate", value: live(main) ? num(a.temperature) : null, min: num(a.min_temp),
                 max: num(a.max_temp), step: num(a.target_temp_step) || 1, ok: live(main) };
  }

  m.hasHum = false;
  m.hum = null;
  if (roles.humidity) {
    const s = st(roles.humidity);
    m.hum = live(s) ? num(s.state) : null;
    m.hasHum = true;
  } else if (climate && main && main.attributes.current_humidity !== undefined) {
    m.hum = live(main) ? num(main.attributes.current_humidity) : null;
    m.hasHum = true;
  }

  m.targetHum = null;
  if (roles.target_humidity) {
    m.targetHum = numberField(st(roles.target_humidity), roles.target_humidity);
  } else if (climate && main && main.attributes.humidity !== undefined) {
    const a = main.attributes;
    m.targetHum = { id: cfg.entity, kind: "climate_h", value: live(main) ? num(a.humidity) : null,
                    min: num(a.min_humidity), max: num(a.max_humidity), step: 1, ok: live(main) };
  }

  m.bath = null;
  if (roles.bath_time) {
    const s = st(roles.bath_time);
    const f = numberField(s, roles.bath_time);
    const unit = (s && s.attributes.unit_of_measurement) || "min";
    m.bath = Object.assign({}, f, { unit, rawStep: f.step, value: toMin(f.value, unit), min: toMin(f.min, unit),
                                    max: toMin(f.max, unit), step: toMin(f.step, unit) });
  }
  m.remaining = roles.remaining_time ? remainingOf(st(roles.remaining_time), now) : null;
  m.light = roles.light ? switchField(st(roles.light), roles.light) : null;

  if (roles.heating) {
    const s = st(roles.heating);
    m.heating = live(s) ? s.state === "on" : null;
  } else if (climate && main && main.attributes.hvac_action !== undefined) {
    m.heating = main.attributes.hvac_action === "heating";
  } else {
    m.heating = null;
  }
  m.readyRole = !!roles.ready;
  m.readyOn = roles.ready ? (st(roles.ready) || {}).state === "on" : false;

  m.toggles = cfg.toggles.map((t) => Object.assign(switchField(st(t.entity), t.entity), { name: t.name || nameOf(hass, t.entity) }));
  statusOf(m);
  return m;
}

// Ready: the heater's own word where it has one, else within 2 °C (4 °F) of
// the target.
function statusOf(m) {
  const on = !!(m.power && m.power.on);
  m.on = on;
  if (m.readyRole) m.ready = on && m.readyOn;
  else {
    const tol = /F/.test(m.unit) ? 4 : 2;
    const target = m.target ? (m.target.shown != null ? m.target.shown : m.target.value) : null;
    m.ready = on && m.temp != null && target != null && m.temp >= target - tol;
  }
  m.status = !m.found || !m.available ? "unavailable" : on ? (m.ready ? "ready" : "heating") : "off";
  return m;
}

function setValueCall(field, value) {
  if (field.kind === "climate") return ["climate", "set_temperature", { entity_id: field.id, temperature: value }];
  if (field.kind === "climate_h") return ["climate", "set_humidity", { entity_id: field.id, humidity: value }];
  if (field.kind === "input_number") return ["input_number", "set_value", { entity_id: field.id, value }];
  return ["number", "set_value", { entity_id: field.id, value }];
}

function switchCall(id, on) {
  const d = domainOf(id);
  if (d === "button") return ["button", "press", { entity_id: id }];
  if (TOGGLE_DOMAINS.includes(d)) return [d, on ? "turn_on" : "turn_off", { entity_id: id }];
  return ["homeassistant", on ? "turn_on" : "turn_off", { entity_id: id }];
}

function powerCall(power, on) {
  if (power.kind === "climate") {
    const modes = power.modes || [];
    const heat = modes.includes("heat") ? "heat" : modes.find((x) => x !== "off") || "heat";
    return ["climate", "set_hvac_mode", { entity_id: power.id, hvac_mode: on ? heat : "off" }];
  }
  return switchCall(power.id, on);
}

// The bath time in the entity's own unit, on its own step.
function bathValue(field, minutes) {
  const raw = fromMin(clampTo(minutes, field), field.unit);
  const step = field.rawStep > 0 ? field.rawStep : 1;
  return +(Math.round(raw / step) * step).toFixed(4);
}

function favoriteCalls(fav, m) {
  const calls = [];
  if (fav.temperature != null && m.target) calls.push(setValueCall(m.target, clampTo(fav.temperature, m.target)));
  if (fav.humidity != null && m.targetHum) calls.push(setValueCall(m.targetHum, clampTo(fav.humidity, m.targetHum)));
  if (fav.bath_time != null && m.bath) calls.push(setValueCall(m.bath, bathValue(m.bath, fav.bath_time)));
  if (typeof fav.light === "boolean" && m.light) calls.push(switchCall(m.light.id, fav.light));
  if (fav.toggles) {
    for (const t of m.toggles) if (typeof fav.toggles[t.id] === "boolean") calls.push(switchCall(t.id, fav.toggles[t.id]));
  }
  return calls;
}

// A favourite from what the settings screen shows now.
function favFromModel(name, m) {
  const shown = (f) => (f ? (f.shown != null ? f.shown : f.value) : null);
  const f = { name };
  if (shown(m.target) != null) f.temperature = shown(m.target);
  if (shown(m.targetHum) != null) f.humidity = shown(m.targetHum);
  if (shown(m.bath) != null) f.bath_time = Math.round(shown(m.bath));
  if (m.light) f.light = m.light.on;
  if (m.toggles.length) {
    f.toggles = {};
    for (const t of m.toggles) f.toggles[t.id] = t.on;
  }
  return f;
}

function favSummary(fav, m, lang) {
  const parts = [];
  if (fav.temperature != null) parts.push(`${fmtNum(fav.temperature)} ${m.unit}`);
  if (fav.humidity != null) parts.push(`${fmtNum(fav.humidity)} %`);
  if (fav.bath_time != null) parts.push(fmtDuration(fav.bath_time));
  if (fav.light) parts.push(label(lang, "lightOn"));
  if (fav.toggles) {
    for (const t of m.toggles) if (fav.toggles[t.id]) parts.push(t.name.toLowerCase());
  }
  return parts.join(" · ");
}

// h12: true or false as the user chose in the profile, null for the
// language's own habit.
function clockText(now, tz, lang, h12) {
  const opts = { hour: "2-digit", minute: "2-digit", timeZone: tz || undefined };
  if (h12 != null) opts.hourCycle = h12 ? "h12" : "h23";
  try {
    return new Intl.DateTimeFormat(lang, opts).format(new Date(now));
  } catch (e) {
    const d = new Date(now);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
}

// A time from an attribute: with an offset it is an instant, shown in the
// house's time zone; without one (a calendar's start_time) it already is the
// house's wall clock.
function whenText(v, lang, tz) {
  const str = String(v);
  const naive = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(str);
  const date = naive ? new Date(str.replace(" ", "T") + "Z") : new Date(str);
  if (isNaN(date.getTime())) return str;
  try {
    return new Intl.DateTimeFormat(lang, { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
                                           timeZone: naive ? "UTC" : tz || undefined }).format(date);
  } catch (e) {
    return str;
  }
}

function programText(hass, s, lang, tz, locale) {
  const loc = locale || lang;
  if (!s) return label(lang, "missing");
  const d = domainOf(s.entity_id), a = s.attributes || {};
  if (d === "schedule") {
    if (s.state === "on") return label(lang, "runningNow");
    return a.next_event ? label(lang, "next", { t: whenText(a.next_event, loc, tz) }) : "—";
  }
  if (d === "calendar") {
    if (s.state === "on") return a.message || label(lang, "runningNow");
    return a.start_time ? (a.message ? a.message + " · " : "") + whenText(a.start_time, loc, tz) : "—";
  }
  if (d === "automation") return a.last_triggered ? label(lang, "lastRun", { t: whenText(a.last_triggered, loc, tz) }) : "";
  if (d === "input_boolean" || d === "switch") return "";
  return stateText(hass, s);
}

// ------------------------------------------------------------------ look

const P = {
  home: '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.6v9.9h4.4v-5.6h3.6v5.6h4.4V9.6"/>',
  thermo: '<path d="M10 13.6V5.2a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0z"/><path d="M12 8.2v7.2"/>',
  heart: '<path d="M12 19.6s-7.2-4.5-7.2-9.7A4 4 0 0 1 12 7.6a4 4 0 0 1 7.2 2.3c0 5.2-7.2 9.7-7.2 9.7z"/>',
  heartFill: '<path class="f" d="M12 19.6s-7.2-4.5-7.2-9.7A4 4 0 0 1 12 7.6a4 4 0 0 1 7.2 2.3c0 5.2-7.2 9.7-7.2 9.7z"/>',
  calendar: '<rect x="4" y="5.6" width="16" height="14" rx="1.4"/><path d="M4 10h16M8.2 3.6v4M15.8 3.6v4"/>',
  gear: '<circle cx="12" cy="12" r="3.1"/><path d="M10.5 3.2h3l.5 2.3 1.6.7 2-1.3 2.1 2.1-1.3 2 .7 1.6 2.3.5v3l-2.3.5-.7 1.6 1.3 2-2.1 2.1-2-1.3-1.6.7-.5 2.3h-3l-.5-2.3-1.6-.7-2 1.3-2.1-2.1 1.3-2-.7-1.6-2.3-.5v-3l2.3-.5.7-1.6-1.3-2 2.1-2.1 2 1.3 1.6-.7z"/>',
  power: '<path d="M12 3.6v8"/><path d="M7.2 6.8a7 7 0 1 0 9.6 0"/>',
  bulb: '<path d="M9.4 17.4h5.2M10.2 20.2h3.6"/><path d="M8.3 14.1a6 6 0 1 1 7.4 0c-.8.6-1.2 1.4-1.2 2.3v1H9.5v-1c0-.9-.4-1.7-1.2-2.3z"/>',
  wifi: '<path d="M3.6 9.6a12 12 0 0 1 16.8 0M6.6 12.7a7.6 7.6 0 0 1 10.8 0M9.5 15.7a3.5 3.5 0 0 1 5 0"/><circle class="f" cx="12" cy="18.7" r="1.1"/>',
  wifiOff: '<path d="M3.6 9.6a12 12 0 0 1 16.8 0M6.6 12.7a7.6 7.6 0 0 1 10.8 0M9.5 15.7a3.5 3.5 0 0 1 5 0"/><path d="M4.5 4.5l15 15"/>',
  drops: '<path class="f" d="M7.6 6s-3.4 4.3-3.4 6.8a3.4 3.4 0 0 0 6.8 0C11 10.3 7.6 6 7.6 6z"/><path class="f" d="M16.4 6s-3.4 4.3-3.4 6.8a3.4 3.4 0 0 0 6.8 0C19.8 10.3 16.4 6 16.4 6z"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  play: '<path class="f" d="M8.5 5.8v12.4l9.8-6.2z"/>',
  trash: '<path d="M5.2 7h13.6M10 7V4.8h4V7M7 7l.8 12.4h8.4L17 7"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  waves: '<path d="M8 19.5c-2-2.4 2-4.4 0-6.8s2-4.4 0-6.8M12 19.5c-2-2.4 2-4.4 0-6.8s2-4.4 0-6.8M16 19.5c-2-2.4 2-4.4 0-6.8s2-4.4 0-6.8"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || ""}</svg>`;
}

const NAV_ICON = { home: "home", settings: "thermo", favorites: "heart", program: "calendar", system: "gear" };

// The panel's screen: dark, with a soft ripple of light low down.
const RIPPLES = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160" preserveAspectRatio="none">' +
  '<filter id="b"><feGaussianBlur stdDeviation="2.6"/></filter><g filter="url(#b)" fill="none" stroke="#fff">' +
  '<path d="M-10 60 C40 48 80 72 130 60 S220 46 310 62" stroke-opacity=".05" stroke-width="7"/>' +
  '<path d="M-10 86 C50 74 90 98 150 86 S240 72 310 90" stroke-opacity=".07" stroke-width="5"/>' +
  '<path d="M-10 110 C30 100 100 122 160 110 S250 98 310 114" stroke-opacity=".05" stroke-width="8"/>' +
  '<path d="M-10 132 C60 124 110 142 170 132 S260 122 310 136" stroke-opacity=".04" stroke-width="6"/>' +
  "</g></svg>");

const STYLE = `
:host { display: block; --tylo-green: #86c13e; --tylo-ink: #0d1a05; }
ha-card { background: none; border: none; box-shadow: none; overflow: visible; }
ha-card.bare { background: #0e0e0f; overflow: hidden; }
.wrap { max-width: var(--tylo-max, 380px); margin: 0 auto; container-type: inline-size; }
.label { color: var(--primary-text-color); font-size: 14px; padding: 0 4px 6px; opacity: .85; }
svg { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
svg .f { fill: currentColor; stroke: none; }
button { font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
button:focus-visible, .line.tap:focus-visible { outline: 2px solid var(--tylo-green); outline-offset: -2px; }

.bezel { position: relative; padding: 9% 6.5% 2.5%; border-radius: 6cqw;
  background: linear-gradient(162deg, #2c2d30 0%, #121315 32%, #070708 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.14), 0 14px 30px rgba(0,0,0,.35); }
.bezel::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(112deg, rgba(255,255,255,0) 0 58%, rgba(255,255,255,.04) 58.2% 74%, rgba(255,255,255,0) 74.2%); }
.bezel.bare { padding: 0; background: none; box-shadow: none; border-radius: 0; }
.bezel.bare::after { display: none; }
.bezel-name { position: absolute; top: 3.2cqw; left: 0; right: 0; text-align: center; font-size: 3.3cqw; letter-spacing: .08em;
  color: rgba(255,255,255,.5); font-family: "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif; }
.logo { text-align: center; color: #f1f1f1; font: 700 5.2cqw/1 "Helvetica Neue", Arial, sans-serif; letter-spacing: .16em;
  padding: 3.6cqw 0 1.4cqw; }

.screen { position: relative; aspect-ratio: 3 / 4.25; display: flex; flex-direction: column; overflow: hidden;
  border-radius: 1cqw; color: #ececec; user-select: none; -webkit-user-select: none;
  font-family: "Helvetica Neue", "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif; font-size: 4cqw;
  background:
    radial-gradient(130% 50% at 50% 100%, rgba(170,170,170,.14), rgba(0,0,0,0) 62%),
    url("${RIPPLES}") center 78% / 100% 46% no-repeat,
    linear-gradient(180deg, #242528 0%, #161719 42%, #0e0e0f 100%);
  box-shadow: 0 0 0 1px rgba(0,0,0,.7); }
.bare .screen { border-radius: var(--ha-card-border-radius, 12px); }
.view { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: none; }
.view::-webkit-scrollbar { display: none; }
.nav { display: flex; height: 12.5cqw; flex: none; border-top: 1px solid rgba(255,255,255,.09); background: rgba(0,0,0,.28); }
.nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; background: none; border: 0; padding: 0;
  color: #c9c9c9; cursor: pointer; position: relative; font-size: 6.6cqw; }
.nav-btn.on { color: #fff; }
.nav-btn.on::after { content: ""; position: absolute; left: 32%; right: 32%; bottom: 1.4cqw; height: 2px; border-radius: 2px; background: var(--tylo-green); }

.topbar { display: flex; height: 11.5cqw; flex: none; background: rgba(255,255,255,.055); border-bottom: 1px solid rgba(255,255,255,.08); }
.seg { flex: 1; display: flex; align-items: center; justify-content: center; background: none; border: 0; padding: 0;
  border-right: 1px solid rgba(255,255,255,.08); color: #d6d6d6; cursor: pointer; font-size: 6.2cqw; }
.seg:disabled { opacity: .35; cursor: default; }
.seg.light.on { color: #ffd76a; }
.seg.power.on { color: var(--tylo-green); }
.status { cursor: default; border-right: 0; font-size: 3.3cqw; letter-spacing: .14em; color: #8f8f8f; }
.status.heating, .status.ready { background: var(--tylo-green); color: var(--tylo-ink); font-weight: 600; }
.status.heating { animation: tylo-pulse 2.4s ease-in-out infinite; }
@keyframes tylo-pulse { 50% { filter: brightness(.76); } }
.sets { display: flex; justify-content: space-between; padding: 2.8cqw 4.6cqw 0; color: #bcbcbc; font-size: 4cqw; min-height: 5cqw; }
.sets span { display: inline-flex; align-items: center; gap: 1.2cqw; }
.sets b { font-weight: 400; }
.sets svg { font-size: 5cqw; }
.big { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; min-height: 0; }
.num { display: flex; align-items: flex-start; font-weight: 200; line-height: .92; letter-spacing: -.02em; }
.num .u { font-size: .25em; margin: .2em 0 0 .1em; font-weight: 300; letter-spacing: 0; }
.t { font-size: 25cqw; }
.solo .t { font-size: 31cqw; }
.h { font-size: 21cqw; }
.rule { width: 60%; height: 1px; background: rgba(255,255,255,.72); margin: 2.4cqw 0 3.2cqw; }
.sub { display: flex; align-items: center; justify-content: center; gap: 1.4cqw; min-height: 6cqw; color: #bdbdbd; font-size: 4cqw; }
.heat { display: none; color: #ff9a4d; font-size: 5cqw; }
.heat.on { display: inline-flex; }
.foot { display: flex; justify-content: space-between; align-items: center; padding: 1.6cqw 4.6cqw 2.4cqw; color: #d2d2d2; font-size: 4cqw; }
.foot > * { flex: 1; }
.foot .brand { text-align: center; font-weight: 700; letter-spacing: .14em; font-size: 3.6cqw; }
.conn { display: flex; justify-content: flex-end; background: none; border: 0; padding: 0; cursor: pointer; font-size: 5.2cqw; }
.conn.off { color: #e0574f; }
.conn:focus-visible { outline: none; }
.conn:focus-visible svg { outline: 2px solid var(--tylo-green); outline-offset: 2px; border-radius: 3px; }

.pane { padding: 2.4cqw 4.6cqw 3cqw; display: flex; flex-direction: column; }
.lbl { font-size: 3.6cqw; color: #a8a8a8; margin: 2cqw 0 1.4cqw; }
.stepper { display: flex; align-items: center; justify-content: space-between; gap: 2cqw; }
.stepper .val { flex: 1; text-align: center; font-size: 8.6cqw; font-weight: 300; }
.pending { opacity: .72; }
.pm { width: 12cqw; height: 10.5cqw; flex: none; display: flex; align-items: center; justify-content: center; padding: 0;
  border: 0; border-radius: .8cqw; cursor: pointer; touch-action: manipulation; font-size: 6.4cqw; color: #f1f1f1;
  background: linear-gradient(#4b4b4e, #353537); box-shadow: inset 0 1px 0 rgba(255,255,255,.13); }
.pm:active { background: #5d5d61; }
.pm:disabled { opacity: .32; cursor: default; }
.line { display: flex; align-items: center; justify-content: space-between; gap: 2cqw; min-height: 9.4cqw;
  border-bottom: 1px solid rgba(255,255,255,.07); font-size: 3.9cqw; color: #e2e2e2; }
.line.tap { cursor: pointer; }
.line.dim { opacity: .4; }
.mini { display: flex; align-items: center; gap: 2cqw; }
.mini .pm { width: 8.6cqw; height: 7cqw; font-size: 5cqw; }
.mini b { min-width: 17cqw; text-align: center; font-weight: 400; }
.sw { position: relative; width: 15cqw; height: 4.4cqw; flex: none; overflow: hidden; border-radius: .5cqw; background: #565658; transition: background .18s; }
.sw::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 50%; background: #f1f1f1; transition: left .18s; }
.sw.on { background: var(--tylo-green); }
.sw.on::before { left: 50%; }
.wide { display: flex; align-items: center; justify-content: center; gap: 1.6cqw; width: 100%; min-height: 8.6cqw; margin-top: 3.4cqw;
  padding: 0 3cqw; border: 0; border-radius: .8cqw; cursor: pointer; font-size: 3.8cqw; color: #ededed;
  background: linear-gradient(#454548, #333335); box-shadow: inset 0 1px 0 rgba(255,255,255,.1); }
.wide svg { font-size: 4.4cqw; }
.wide.go { background: var(--tylo-green); color: var(--tylo-ink); font-weight: 600; box-shadow: none; }
.savebox { display: flex; gap: 2cqw; margin-top: 3.4cqw; }
.savebox input { flex: 1; min-width: 0; min-height: 8.6cqw; padding: 0 2.4cqw; border: 1px solid #5b5b5e; border-radius: .8cqw;
  background: #1c1c1e; color: #fff; font: inherit; font-size: 3.9cqw; }
.savebox .wide { width: auto; margin: 0; }
.head { font-size: 4.4cqw; color: #f2f2f2; margin: 1cqw 0 2cqw; }
.hint { font-size: 3.6cqw; color: #9c9c9c; line-height: 1.45; }
.fav { border-bottom: 1px solid rgba(255,255,255,.07); }
.fav-main { display: flex; align-items: center; gap: 2.6cqw; width: 100%; padding: 2.4cqw 0; background: none; border: 0; cursor: pointer; text-align: left; }
.fav-main > svg { font-size: 5.4cqw; color: var(--tylo-green); flex: none; }
.fav-name { display: block; font-size: 4.1cqw; }
.fav-sum { display: block; margin-top: .6cqw; font-size: 3.3cqw; color: #a3a3a3; }
.fav-acts { display: flex; gap: 2cqw; padding-bottom: 2.6cqw; }
.fav-acts .wide { margin: 0; }
.val-r { color: #b9b9b9; text-align: right; white-space: nowrap; }
.ver { margin-top: 3cqw; font-size: 3cqw; color: #6c6c6c; }
`;

// --------------------------------------------------------------- screens

function L(v, key, vars) {
  return esc(label(v.lang, key, vars));
}

function homeHtml(v) {
  const m = v.model;
  const light = m.light
    ? `<button class="seg light" data-ref="light" data-action="toggle:${esc(m.light.id)}" aria-label="${L(v, "lighting")}">${icon("bulb")}</button>`
    : "";
  const brand = v.cfg.hide_bezel && v.cfg.logo ? esc(v.cfg.logo) : "";
  return `
  <div class="topbar">${light}
    <button class="seg power" data-ref="power" data-action="power" aria-label="${L(v, "power")}">${icon("power")}</button>
    <div class="seg status" data-ref="status" role="status"></div>
  </div>
  <div class="sets">
    <span>${m.target ? icon("thermo") + '<b data-ref="setTemp"></b>' : ""}</span>
    <span>${m.targetHum ? icon("drops") + '<b data-ref="setHum"></b>' : ""}</span>
  </div>
  <div class="big${m.hasHum ? "" : " solo"}" data-action="tab:settings">
    <div class="num t"><span data-ref="temp"></span><span class="u" data-ref="unit"></span></div>
    ${m.hasHum ? '<div class="rule"></div><div class="num h"><span data-ref="hum"></span><span class="u">%</span></div>' : ""}
  </div>
  <div class="sub"><span class="heat" data-ref="heat">${icon("waves")}</span><span data-ref="sub"></span></div>
  <div class="foot"><span data-ref="clock"></span><span class="brand">${brand}</span>
    <button class="conn" data-ref="conn" data-action="more:${esc(v.cfg.entity)}" aria-label="${L(v, "connection")}"></button></div>`;
}

function stepperHtml(key) {
  return `<div class="stepper"><button class="pm" data-step="${key}:-" data-ref="${key}-" aria-label="−">${icon("minus")}</button>` +
    `<div class="val" data-ref="${key}Val"></div>` +
    `<button class="pm" data-step="${key}:+" data-ref="${key}+" aria-label="+">${icon("plus")}</button></div>`;
}

function toggleHtml(ref, name, id) {
  return `<div class="line tap" tabindex="0" role="switch" data-action="toggle:${esc(id)}" data-ref="row-${ref}">` +
    `<span>${name}</span><span class="sw" data-ref="sw-${ref}"></span></div>`;
}

function settingsHtml(v) {
  const m = v.model, parts = [];
  if (m.target) parts.push(`<div class="lbl">${L(v, "temperature")}</div>${stepperHtml("temp")}`);
  if (m.targetHum) parts.push(`<div class="lbl">${L(v, "humidity")}</div>${stepperHtml("hum")}`);
  if (m.bath) {
    parts.push(`<div class="line" style="margin-top:2cqw"><span>${L(v, "stopAfter")}</span><span class="mini">` +
      `<button class="pm" data-step="time:-" data-ref="time-" aria-label="−">${icon("minus")}</button><b data-ref="timeVal"></b>` +
      `<button class="pm" data-step="time:+" data-ref="time+" aria-label="+">${icon("plus")}</button></span></div>`);
  }
  if (m.light) parts.push(toggleHtml("light", L(v, "lighting"), m.light.id));
  m.toggles.forEach((t, i) => parts.push(toggleHtml("t" + i, esc(t.name), t.id)));
  if (!m.target && !m.targetHum && !m.bath && !m.light && !m.toggles.length) parts.push(`<div class="hint">${L(v, "noSettings")}</div>`);
  if (v.saving) {
    parts.push(`<div class="savebox"><input data-ref="favName" maxlength="40" value="${esc(v.saving.name)}" aria-label="${L(v, "favName")}">` +
      `<button class="wide go" data-action="save-ok">${L(v, "save")}</button>` +
      `<button class="wide" data-action="save-cancel" aria-label="${L(v, "cancel")}">${icon("close")}</button></div>`);
  } else {
    parts.push(`<button class="wide" data-action="save">${L(v, "saveFav")}</button>`);
  }
  return `<div class="pane">${parts.join("")}</div>`;
}

function favoritesHtml(v) {
  const head = `<div class="head">${L(v, "favorites")}</div>`;
  if (!v.favs.length) return `<div class="pane">${head}<div class="hint">${L(v, "noFavorites")}</div></div>`;
  const rows = v.favs.map((f) => {
    const sel = f.key === v.favSel;
    const acts = sel
      ? `<div class="fav-acts"><button class="wide go" data-action="fav-start:${f.key}">${icon("play")}${L(v, "start")}</button>` +
        (f.fixed ? "" : `<button class="wide" data-action="fav-del:${f.key}">${icon("trash")}${L(v, "delete")}</button>`) + "</div>"
      : "";
    return `<div class="fav"><button class="fav-main" data-action="fav:${f.key}" aria-expanded="${sel}">${icon(f.fixed ? "heartFill" : "heart")}` +
      `<span><span class="fav-name">${esc(f.fav.name)}</span><span class="fav-sum">${esc(favSummary(f.fav, v.model, v.lang))}</span></span></button>${acts}</div>`;
  });
  return `<div class="pane">${head}${rows.join("")}</div>`;
}

function programHtml(v) {
  const rows = v.program.map((p, i) => {
    const sw = p.toggle ? `<span class="sw" data-ref="sw-p${i}" data-action="toggle:${esc(p.id)}" role="switch" tabindex="0"></span>` : "";
    return `<div class="line tap" tabindex="0" data-action="more:${esc(p.id)}"><span>${esc(p.name)}</span>` +
      `<span class="mini"><span class="val-r" data-ref="p${i}"></span>${sw}</span></div>`;
  });
  return `<div class="pane"><div class="head">${L(v, "program")}</div>${rows.join("") || `<div class="hint">${L(v, "noProgram")}</div>`}</div>`;
}

function systemHtml(v) {
  const rows = v.info.map((r, i) =>
    `<div class="line tap" tabindex="0" data-action="more:${esc(r.id)}"><span>${esc(r.name)}</span><span class="val-r" data-ref="i${i}"></span></div>`);
  return `<div class="pane"><div class="head">${L(v, "system")}</div>` +
    `<div class="line tap" tabindex="0" data-action="more:${esc(v.cfg.entity)}"><span>${L(v, "connection")}</span><span class="val-r" data-ref="connText"></span></div>` +
    rows.join("") +
    `<button class="wide" data-action="more:${esc(v.cfg.entity)}">${L(v, "moreInfo")}</button>` +
    `<div class="ver">${TYPE} ${VERSION}</div></div>`;
}

const SCREENS = { home: homeHtml, settings: settingsHtml, favorites: favoritesHtml, program: programHtml, system: systemHtml };

// ------------------------------------------------------------------ card

const Base = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

class TyloEliteCard extends Base {
  static getStubConfig(hass) {
    const ids = Object.keys((hass && hass.states) || {});
    const climates = ids.filter((id) => id.startsWith("climate."));
    const sauna = climates.find((id) => /sauna|bastu|tyl|helo/i.test(id)) || ids.find((id) => /^switch\..*(sauna|bastu)/i.test(id));
    return { entity: sauna || climates[0] || "climate.sauna" };
  }

  static getConfigForm() {
    const lang = pickerLang();
    const t = (k) => label(lang, k);
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: ["climate", "switch", "input_boolean"] } } },
        { name: "name", selector: { text: {} } },
        { name: "entities", type: "expandable", title: t("f_entities"), flatten: false,
          schema: ROLES.map((r) => ({ name: r, selector: { entity: { domain: ROLE_DOMAINS[r] } } })) },
        { name: "toggles", selector: { entity: { multiple: true, domain: TOGGLE_DOMAINS } } },
        { name: "schedule", selector: { entity: { multiple: true, domain: ["schedule", "calendar", "automation", "input_boolean", "switch", "input_datetime"] } } },
        { name: "info", selector: { entity: { multiple: true } } },
        { type: "grid", name: "", schema: [
          { name: "time_step", selector: { number: { min: 1, max: 60, mode: "box", unit_of_measurement: "min" } } },
          { name: "language", selector: { select: { mode: "dropdown", options: [
            { value: "", label: t("auto") }, { value: "sv", label: "Svenska" }, { value: "en", label: "English" }, { value: "de", label: "Deutsch" }] } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "hide_bezel", selector: { boolean: {} } },
          { name: "logo", selector: { text: {} } },
        ] },
      ],
      computeLabel: (s) => (s.name ? label(lang, "f_" + s.name) : undefined),
      // Toggles and the rest written as {entity, name} or favourites are
      // edited in YAML: the form would drop what it cannot show.
      assertConfig: (c) => {
        for (const k of ["toggles", "schedule", "info"]) {
          if (list(c[k]).some((x) => typeof x !== "string")) throw new Error(`${k} with names is edited in YAML`);
        }
        if (c.favorites) throw new Error("favorites are edited in YAML");
      },
    };
  }

  setConfig(config) {
    this._config = configOf(config);
    this._tab = "home";
    this._struct = "";
    this._pending = {};
    this._opt = {};
    this._timers = this._timers || {};
    this._saving = null;
    this._favSel = null;
    this._found = null;
    this._foundKey = null;
    this._userFavs = this._userFavs || null;
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._favsAsked) this._loadFavs();
    this._update();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._connected = true;
    clearInterval(this._tick);
    this._tick = setInterval(() => this._update(), 15000);
    this._update();
  }

  disconnectedCallback() {
    this._connected = false;
    clearInterval(this._tick);
    this._stopRepeat();
  }

  getCardSize() {
    return 9;
  }

  // A section's full width: at half of it the panel is too small to read.
  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  // ---- state

  _rolesNow() {
    const hass = this._hass, cfg = this._config;
    // the registry object changes only when the registry does
    if (this._foundKey !== hass.entities || !this._found) {
      this._foundKey = hass.entities;
      this._found = cfg.discover ? discover(hass, cfg.entity) : { roles: {}, info: [] };
    }
    return rolesOf(cfg, this._found);
  }

  // What the user has pressed and the house has not answered yet stands in
  // for the state, until the state agrees or SETTLE_MS have passed.
  _applyLocal(m, now) {
    const fields = { temp: m.target, hum: m.targetHum, time: m.bath };
    for (const key of Object.keys(fields)) {
      const f = fields[key], p = this._pending[key];
      if (!f) { delete this._pending[key]; continue; }
      f.shown = f.value;
      if (!p) continue;
      const tol = key === "time" ? (f.step || 1) / 2 + 1e-6 : 1e-6;
      const agreed = f.value != null && Math.abs(f.value - p.value) < tol;
      if (p.sent && (agreed || now - p.at > SETTLE_MS)) { delete this._pending[key]; continue; }
      f.shown = p.value;
      f.pending = true;
    }
    const overlay = (f) => {
      if (!f) return;
      const o = this._opt[f.id];
      if (!o) return;
      if (f.on === o.on || now - o.at > OPTIMISTIC_MS) { delete this._opt[f.id]; return; }
      f.on = o.on;
    };
    overlay(m.power);
    overlay(m.light);
    m.toggles.forEach(overlay);
    statusOf(m);
  }

  _view() {
    const hass = this._hass, cfg = this._config, now = Date.now();
    const lang = langOf(hass, cfg);
    const roles = this._rolesNow();
    const m = modelOf(hass, cfg, roles, now);
    this._applyLocal(m, now);
    const tabs = ["home", "settings", "favorites"].concat(cfg.schedule.length ? ["program"] : [], ["system"]);
    if (!tabs.includes(this._tab)) this._tab = "home";
    const saved = (this._userFavs && this._userFavs[cfg.entity]) || [];
    const favs = cfg.favorites.map((f, i) => ({ key: "c" + i, fav: f, fixed: true }))
      .concat(saved.map((f, i) => ({ key: "u" + i, fav: f, fixed: false })));
    const program = cfg.schedule.map((p) => ({
      id: p.entity, name: p.name || nameOf(hass, p.entity),
      toggle: ["automation", "input_boolean", "switch"].includes(domainOf(p.entity)),
    }));
    const infoIds = [];
    for (const id of this._found.info.concat(cfg.info.map((x) => x.entity))) if (!infoIds.includes(id)) infoIds.push(id);
    const names = {};
    for (const x of cfg.info) if (x.name) names[x.entity] = x.name;
    const info = infoIds.map((id) => ({ id, name: names[id] || nameOf(hass, id) }));
    // dates and times in the user's own locale (en-GB keeps 24 h), unless the card pins a language
    const locale = cfg.language || (hass.locale && hass.locale.language) || lang;
    const tf = hass.locale && hass.locale.time_format;
    const h12 = tf === "12" ? true : tf === "24" ? false : null;
    return { cfg, lang, locale, model: m, roles, tabs, favs, program, info, now, h12, tz: hass.config && hass.config.time_zone,
             saving: this._saving, favSel: this._favSel };
  }

  _update() {
    if (!this._config || !this._hass || !this._connected || typeof document === "undefined") return;
    const v = this._view();
    this._v = v;
    const m = v.model;
    const struct = JSON.stringify([
      this._tab, v.lang, v.tabs, !!m.target, !!m.targetHum, m.hasHum, !!m.bath, !!m.light, m.unit,
      m.light && m.light.id, m.toggles.map((t) => [t.id, t.name]), v.favs.map((f) => [f.key, f.fav]),
      v.program.map((p) => [p.id, p.name]), v.info.map((r) => [r.id, r.name]), v.saving, v.favSel,
      this._config,
    ]);
    if (struct !== this._struct) {
      this._struct = struct;
      this._render(v);
    }
    this._patch(v);
  }

  _render(v) {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this._listen();
    }
    const cfg = v.cfg;
    const nav = v.tabs.map((tab) =>
      `<button class="nav-btn${tab === this._tab ? " on" : ""}" data-action="tab:${tab}" aria-label="${L(v, "tab_" + tab)}"` +
      `${tab === this._tab ? ' aria-current="page"' : ""}>${icon(NAV_ICON[tab])}</button>`).join("");
    const name = cfg.name
      ? cfg.hide_bezel ? `<div class="label">${esc(cfg.name)}</div>` : `<div class="bezel-name">${esc(cfg.name)}</div>`
      : "";
    const logo = !cfg.hide_bezel && cfg.logo ? `<div class="logo">${esc(cfg.logo)}</div>` : "";
    const screen = `<div class="screen"><div class="view view-${this._tab}">${SCREENS[this._tab](v)}</div><nav class="nav">${nav}</nav></div>`;
    const body = cfg.hide_bezel
      ? `${name}<div class="bezel bare">${screen}</div>`
      : `<div class="bezel">${name}${screen}${logo}</div>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<ha-card class="${cfg.hide_bezel ? "bare" : ""}"><div class="wrap" style="--tylo-max:${cfg.max_width}">${body}</div></ha-card>`;
    this._refs = {};
    for (const el of this.shadowRoot.querySelectorAll("[data-ref]")) this._refs[el.dataset.ref] = el;
    const input = this._refs.favName;
    if (input) {
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") this._saveFav();
        if (e.key === "Escape") { this._saving = null; this._update(); }
      });
      setTimeout(() => { input.focus(); input.select(); }, 0);
    }
  }

  _patch(v) {
    const r = this._refs || {}, m = v.model;
    const text = (k, s) => { if (r[k] && r[k].textContent !== s) r[k].textContent = s; };
    const cls = (k, c, on) => { if (r[k]) r[k].classList.toggle(c, !!on); };
    const dis = (k, d) => { if (r[k] && r[k].disabled !== !!d) r[k].disabled = !!d; };
    const shown = (f) => (f ? (f.shown != null ? f.shown : f.value) : null);
    const unitShort = m.unit;

    // home
    text("temp", fmtNum(m.temp));
    text("unit", unitShort);
    text("hum", fmtNum(m.hum));
    text("setTemp", m.target ? `${fmtNum(shown(m.target))}${unitShort}` : "");
    text("setHum", m.targetHum ? `${fmtNum(shown(m.targetHum))} %` : "");
    text("clock", clockText(v.now, v.tz, v.locale, v.h12));
    if (r.status) {
      text("status", label(v.lang, m.status));
      for (const s of ["off", "heating", "ready", "unavailable"]) cls("status", s, m.status === s);
    }
    cls("power", "on", m.on);
    dis("power", !m.power || !m.power.ok);
    if (r.power) r.power.setAttribute("aria-pressed", String(!!m.on));
    if (m.light) {
      cls("light", "on", m.light.on);
      dis("light", !m.light.ok);
      if (r.light) r.light.setAttribute("aria-pressed", String(!!m.light.on));
    }
    cls("heat", "on", m.on && m.heating);
    let sub = "";
    if (!m.found) sub = label(v.lang, "notFound", { id: v.cfg.entity });
    else if (m.on && m.remaining != null) sub = label(v.lang, "stopsIn", { t: fmtDuration(m.remaining) });
    else if (!m.on && m.bath && shown(m.bath) != null) sub = label(v.lang, "bathTime", { t: fmtDuration(shown(m.bath)) });
    text("sub", sub);
    if (r.conn) {
      const online = m.available;
      const want = online ? "wifi" : "wifiOff";
      if (r.conn.dataset.icon !== want) { r.conn.dataset.icon = want; r.conn.innerHTML = `<span>${icon(want)}</span>`; }
      cls("conn", "off", !online);
      r.conn.title = label(v.lang, online ? "connected" : "offline");
    }

    // settings
    const stepper = (key, f, fmt) => {
      if (!f) return;
      const val = shown(f);
      text(key + "Val", fmt(val));
      cls(key + "Val", "pending", f.pending);
      dis(key + "-", !f.ok || (val != null && f.min != null && val <= f.min));
      dis(key + "+", !f.ok || (val != null && f.max != null && val >= f.max));
    };
    stepper("temp", m.target, (x) => `${fmtNum(x)} ${unitShort}`);
    stepper("hum", m.targetHum, (x) => `${fmtNum(x)} %`);
    stepper("time", m.bath, (x) => fmtDuration(x));
    const sw = (ref, f) => {
      if (!f) return;
      cls("sw-" + ref, "on", f.on);
      cls("row-" + ref, "dim", !f.ok);
      if (r["row-" + ref]) r["row-" + ref].setAttribute("aria-checked", String(!!f.on));
    };
    sw("light", m.light);
    m.toggles.forEach((t, i) => sw("t" + i, t));

    // program
    v.program.forEach((p, i) => {
      const s = this._hass.states[p.id];
      text("p" + i, programText(this._hass, s, v.lang, v.tz, v.locale));
      if (p.toggle) {
        cls("sw-p" + i, "on", s && s.state === "on");
        if (r["sw-p" + i]) r["sw-p" + i].setAttribute("aria-checked", String(!!(s && s.state === "on")));
      }
    });

    // system
    text("connText", label(v.lang, m.available ? "connected" : "offline"));
    v.info.forEach((row, i) => text("i" + i, stateText(this._hass, this._hass.states[row.id])));
  }

  // ---- input

  _listen() {
    const root = this.shadowRoot;
    root.addEventListener("click", (e) => {
      const step = e.target.closest && e.target.closest("[data-step]");
      if (step) {
        // pointer presses are taken on pointerdown; a keyboard press comes as a click alone
        if (e.detail === 0 && !step.disabled) this._stepFrom(step);
        return;
      }
      const el = e.target.closest && e.target.closest("[data-action]");
      if (el) { e.stopPropagation(); this._act(el.dataset.action, el); }
    });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest && e.target.closest("[data-action]");
      if (!el || el.tagName === "BUTTON" || el.tagName === "INPUT") return;
      e.preventDefault();
      this._act(el.dataset.action, el);
    });
    root.addEventListener("pointerdown", (e) => {
      const step = e.target.closest && e.target.closest("[data-step]");
      if (!step || step.disabled || e.button > 0) return;
      e.preventDefault();
      try { step.setPointerCapture(e.pointerId); } catch (err) { /* not every pointer can be captured */ }
      this._stepFrom(step);
      this._stopRepeat();
      const again = () => {
        if (step.disabled) return;
        this._stepFrom(step);
        this._repeat = setTimeout(again, 110);
      };
      this._repeat = setTimeout(again, 450);
    });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) root.addEventListener(ev, () => this._stopRepeat());
  }

  _stopRepeat() {
    clearTimeout(this._repeat);
    this._repeat = null;
  }

  _stepFrom(el) {
    const [key, d] = el.dataset.step.split(":");
    this._bump(key, d === "+" ? 1 : -1);
  }

  _field(key) {
    const m = this._v && this._v.model;
    if (!m) return null;
    return key === "temp" ? m.target : key === "hum" ? m.targetHum : key === "time" ? m.bath : null;
  }

  _bump(key, dir) {
    const f = this._field(key);
    if (!f || !f.ok) return;
    const p = this._pending[key];
    const base = p ? p.value : f.value;
    const step = key === "time" ? Math.max(this._config.time_step, f.step || 0) : f.step;
    const next = stepped(base, dir, step, f.min, f.max);
    if (next == null || next === base) return;
    this._pending[key] = { value: next, at: Date.now(), sent: false };
    clearTimeout(this._timers[key]);
    this._timers[key] = setTimeout(() => this._send(key), SEND_DELAY_MS);
    this._update();
  }

  _send(key) {
    const p = this._pending[key], f = this._field(key);
    if (!p || !f) return;
    p.sent = true;
    p.at = Date.now();
    const value = key === "time" ? bathValue(f, p.value) : p.value;
    this._call(setValueCall(f, value));
    // look again once the wait for an answer is over, house quiet or not
    clearTimeout(this._timers[key + "-settle"]);
    this._timers[key + "-settle"] = setTimeout(() => this._update(), SETTLE_MS + 100);
  }

  _call(call) {
    const [domain, service, data] = call;
    return Promise.resolve()
      .then(() => this._hass.callService(domain, service, data))
      .catch((err) => this._notify((err && err.message) || String(err)));
  }

  _notify(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  _haptic(kind) {
    this.dispatchEvent(new CustomEvent("haptic", { detail: kind || "light", bubbles: true, composed: true }));
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _flip(f) {
    const on = !f.on;
    this._opt[f.id] = { on, at: Date.now() };
    this._haptic("light");
    this._update();
    setTimeout(() => this._update(), OPTIMISTIC_MS + 100);
    return on;
  }

  _act(action, el) {
    const i = action.indexOf(":");
    const verb = i < 0 ? action : action.slice(0, i), arg = i < 0 ? "" : action.slice(i + 1);
    const m = this._v && this._v.model;
    if (!m) return;
    switch (verb) {
      case "tab":
        this._tab = arg;
        this._saving = null;
        this._favSel = null;
        this._update();
        break;
      case "power":
        if (m.power && m.power.ok) {
          const on = this._flip(m.power);
          this._call(powerCall(m.power, on));
        }
        break;
      case "toggle": {
        const f = [m.light].concat(m.toggles).find((x) => x && x.id === arg);
        if (f) {
          if (!f.ok) return;
          this._call(switchCall(f.id, this._flip(f)));
        } else {
          const s = this._hass.states[arg];
          if (s) { this._haptic("light"); this._call(switchCall(arg, s.state !== "on")); }
        }
        break;
      }
      case "more":
        this._moreInfo(arg);
        break;
      case "save":
        this._saving = { name: label(this._v.lang, "favDefault", { n: this._v.favs.filter((f) => !f.fixed).length + 1 }) };
        this._update();
        break;
      case "save-ok":
        this._saveFav();
        break;
      case "save-cancel":
        this._saving = null;
        this._update();
        break;
      case "fav":
        this._favSel = this._favSel === arg ? null : arg;
        this._update();
        break;
      case "fav-start":
        this._startFav(arg);
        break;
      case "fav-del":
        this._deleteFav(arg);
        break;
      default:
        break;
    }
  }

  async _startFav(key) {
    const v = this._v, m = v.model;
    const f = v.favs.find((x) => x.key === key);
    if (!f) return;
    this._haptic("success");
    const calls = favoriteCalls(f.fav, m);
    await Promise.all(calls.map((c) => this._call(c)));
    if (m.power && m.power.ok && !m.on) {
      this._opt[m.power.id] = { on: true, at: Date.now() };
      await this._call(powerCall(m.power, true));
    }
    this._notify(label(v.lang, "startedFav", { name: f.fav.name }));
    this._favSel = null;
    this._tab = "home";
    this._update();
  }

  // ---- favourites kept in the user's profile

  async _loadFavs() {
    this._favsAsked = true;
    let store = null;
    try {
      if (this._hass && this._hass.callWS) {
        const res = await this._hass.callWS({ type: "frontend/get_user_data", key: USER_DATA_KEY });
        store = res && res.value;
      }
    } catch (e) {
      store = null;
    }
    if (!store) {
      try { store = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "null"); } catch (e) { store = null; }
    }
    this._userFavs = (store && store.favorites) || {};
    this._update();
  }

  async _storeFavs(listForEntity) {
    const all = Object.assign({}, this._userFavs || {});
    all[this._config.entity] = listForEntity;
    this._userFavs = all;
    const value = { favorites: all };
    try {
      await this._hass.callWS({ type: "frontend/set_user_data", key: USER_DATA_KEY, value });
    } catch (e) {
      try { localStorage.setItem(USER_DATA_KEY, JSON.stringify(value)); } catch (err) { /* kept for this page only */ }
    }
  }

  async _saveFav() {
    const v = this._v;
    if (!v || !this._saving) return;
    const input = this._refs && this._refs.favName;
    const name = ((input && input.value) || this._saving.name).trim().slice(0, 40) || this._saving.name;
    const fav = favOf(favFromModel(name, v.model));
    const mine = ((this._userFavs && this._userFavs[this._config.entity]) || []).concat([fav]);
    this._saving = null;
    this._tab = "favorites";
    this._favSel = null;
    await this._storeFavs(mine);
    this._haptic("success");
    this._update();
  }

  async _deleteFav(key) {
    if (!key.startsWith("u")) return;
    const idx = Number(key.slice(1));
    const mine = ((this._userFavs && this._userFavs[this._config.entity]) || []).filter((_, i) => i !== idx);
    this._favSel = null;
    await this._storeFavs(mine);
    this._update();
  }
}

// The picker's name and description in the house's language, as far as the
// frontend has told it when the file loads.
function pickerLang() {
  try {
    const ha = document.querySelector("home-assistant");
    if (ha && ha.hass) return langOf(ha.hass);
    return langOf({ language: navigator.language || "en" });
  } catch (e) {
    return "en";
  }
}

if (typeof customElements !== "undefined" && !customElements.get(TYPE)) {
  customElements.define(TYPE, TyloEliteCard);
  const lang = pickerLang();
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TYPE,
    name: label(lang, "name"),
    description: label(lang, "description"),
    preview: true,
    documentationURL: "https://github.com/beolink/tylo-elite-card",
  });
  console.info(`%c TYLÖ ELITE CARD %c ${VERSION} `, "background:#86c13e;color:#0d1a05;font-weight:700", "background:#222;color:#eee");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TYPE, VERSION, STR, RULES, ROLES, INFO_KEYS, langOf, label, esc, configOf, favOf, keysOf, matchKey, discover,
    rolesOf, toMin, fromMin, durationMin, remainingOf, fmtDuration, fmtNum, stepped, clampTo, modelOf, statusOf,
    setValueCall, switchCall, powerCall, bathValue, favoriteCalls, favFromModel, favSummary, clockText, whenText,
    programText, nameOf, TyloEliteCard,
  };
}
