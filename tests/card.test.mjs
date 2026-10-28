// The card's pure helpers, in node: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const C = require("../dist/tylo-elite-card.js");

const S = (entity_id, state, attributes = {}) => ({ entity_id, state: String(state), attributes });

// The ESPHome sauna360 device "tylo", Combi Elite, as Home Assistant names it.
function esphomeHass(overrides = {}) {
  const list = [
    S("climate.tylo_sauna_climate", "heat", { hvac_modes: ["off", "heat"], min_temp: 40, max_temp: 110, target_temp_step: 1,
      current_temperature: 64.5, temperature: 80, hvac_action: "heating" }),
    S("sensor.tylo_current_temperature", 64.5, { unit_of_measurement: "°C" }),
    S("sensor.tylo_setting_temperature", 80, { unit_of_measurement: "°C" }),
    S("number.tylo_bath_temperature", 80, { min: 40, max: 110, step: 1, unit_of_measurement: "°C" }),
    S("number.tylo_max_bath_temperature", 110, { min: 40, max: 110, step: 1 }),
    S("sensor.tylo_max_bath_temperature", 110, { unit_of_measurement: "°C" }),
    S("number.tylo_bath_time", 180, { min: 1, max: 360, step: 1, unit_of_measurement: "min" }),
    S("sensor.tylo_setting_bath_time", 180, { unit_of_measurement: "min" }),
    S("sensor.tylo_remaining_time", 95, { unit_of_measurement: "min" }),
    S("switch.tylo_light", "on"),
    S("switch.tylo_heater", "on"),
    S("binary_sensor.tylo_heater_state", "on"),
    S("binary_sensor.tylo_light_state", "on"),
    S("binary_sensor.tylo_ready_state", "off"),
    S("number.tylo_humidity", 30, { min: 0, max: 100, step: 1, unit_of_measurement: "%" }),
    S("sensor.tylo_setting_humidity", 30, { unit_of_measurement: "%" }),
    S("sensor.tylo_water_tank_level", 85, { unit_of_measurement: "%" }),
    S("sensor.tylo_heating_element", "Wave 2"),
    S("sensor.tylo_total_uptime", 51840, { unit_of_measurement: "min" }),
    S("sensor.tylo_tylo_wifi_signal", -61, { unit_of_measurement: "dBm" }),
    S("sensor.kitchen_temperature", 21, { unit_of_measurement: "°C" }),
  ];
  const states = {};
  const entities = {};
  for (const s of list) {
    states[s.entity_id] = s;
    entities[s.entity_id] = { entity_id: s.entity_id, device_id: s.entity_id.includes(".tylo_") ? "dev1" : "dev2" };
  }
  return Object.assign({ states, entities, devices: { dev1: { name: "tylo" } }, config: { time_zone: "Europe/Stockholm",
    unit_system: { temperature: "°C" } }, locale: { language: "sv" } }, overrides);
}

test("the configuration needs the heater and cleans the rest", () => {
  assert.throws(() => C.configOf({}), /entity is required/);
  assert.throws(() => C.configOf({ entity: "sauna" }), /entity is required/);
  const c = C.configOf({ entity: "climate.x", toggles: ["switch.a", { entity: "switch.b", name: "B" }, 3, null],
                         max_width: "400px; color: red", logo: "none", time_step: -5 });
  assert.deepEqual(c.toggles, [{ entity: "switch.a" }, { entity: "switch.b", name: "B" }]);
  assert.equal(c.max_width, "380px");
  assert.equal(c.logo, "");
  assert.equal(c.time_step, 10);
  assert.equal(C.configOf({ entity: "climate.x" }).logo, "TYLÖ");
  assert.equal(C.configOf({ entity: "climate.x", logo: false }).logo, "");
  assert.equal(C.configOf({ entity: "climate.x", max_width: 300 }).max_width, "300px");
  assert.equal(C.configOf({ entity: "climate.x", hide_bezel: true }).hide_bezel, true);
});

test("favourites keep only what they carry", () => {
  const f = C.favOf({ name: "Kväll", temperature: "85", humidity: "x", light: "yes", toggles: { "switch.a": true, "switch.b": 1 } });
  assert.deepEqual(f, { name: "Kväll", temperature: 85, toggles: { "switch.a": true } });
});

test("object ids lose the prefix the device's entities share", () => {
  const keys = C.keysOf(["climate.tylo_sauna_climate", "switch.tylo_light", "number.tylo_bath_time"]);
  assert.deepEqual(keys, { "climate.tylo_sauna_climate": "sauna_climate", "switch.tylo_light": "light", "number.tylo_bath_time": "bath_time" });
  assert.deepEqual(C.keysOf(["switch.bastu"]), { "switch.bastu": "bastu" });
  // a shared start that is not a whole word stays
  assert.deepEqual(C.keysOf(["switch.light", "switch.lights_out"]), { "switch.light": "light", "switch.lights_out": "lights_out" });
});

test("the ESPHome device's roles are found by their names", () => {
  const found = C.discover(esphomeHass(), "climate.tylo_sauna_climate");
  assert.deepEqual(found.roles, {
    heater: "switch.tylo_heater",
    temperature: "sensor.tylo_current_temperature",
    target_temperature: "number.tylo_bath_temperature",
    target_humidity: "number.tylo_humidity",
    bath_time: "number.tylo_bath_time",
    remaining_time: "sensor.tylo_remaining_time",
    light: "switch.tylo_light",
    ready: "binary_sensor.tylo_ready_state",
    heating: "binary_sensor.tylo_heater_state",
  });
  assert.ok(!("humidity" in found.roles), "setting_humidity is the target, not the room");
  assert.deepEqual(found.info, [
    "binary_sensor.tylo_heater_state", "sensor.tylo_heating_element", "binary_sensor.tylo_ready_state",
    "sensor.tylo_water_tank_level", "sensor.tylo_setting_humidity", "sensor.tylo_max_bath_temperature",
    "sensor.tylo_total_uptime", "sensor.tylo_tylo_wifi_signal",
  ]);
});

test("a tail match never takes the max or setting entity", () => {
  const ids = ["number.x_max_bath_temperature", "sensor.x_setting_bath_time"];
  const keys = { "number.x_max_bath_temperature": "x_max_bath_temperature", "sensor.x_setting_bath_time": "x_setting_bath_time" };
  assert.equal(C.matchKey(ids, keys, ["number"], ["bath_temperature"]), null);
  assert.equal(C.matchKey(["number.a_b_bath_time"], { "number.a_b_bath_time": "a_b_bath_time" }, ["number"], ["bath_time"]), "number.a_b_bath_time");
});

test("without a registry nothing is found, and nothing breaks", () => {
  assert.deepEqual(C.discover({ states: {} }, "climate.x"), { roles: {}, info: [] });
});

test("a climate is its own on/off and temperatures; given roles win and none drops one", () => {
  const found = C.discover(esphomeHass(), "climate.tylo_sauna_climate");
  const cfg = C.configOf({ entity: "climate.tylo_sauna_climate", entities: { ready: "none", humidity: "sensor.bastu_rh" } });
  const roles = C.rolesOf(cfg, found);
  assert.equal(roles.heater, undefined);
  assert.equal(roles.temperature, undefined);
  assert.equal(roles.target_temperature, undefined);
  assert.equal(roles.ready, undefined);
  assert.equal(roles.humidity, "sensor.bastu_rh");
  assert.equal(roles.bath_time, "number.tylo_bath_time");
  const sw = C.rolesOf(C.configOf({ entity: "switch.tylo_heater" }), C.discover(esphomeHass(), "switch.tylo_heater"));
  assert.equal(sw.heater, "switch.tylo_heater");
  assert.equal(sw.target_temperature, "number.tylo_bath_temperature");
  assert.equal(sw.temperature, "sensor.tylo_current_temperature");
});

test("the model of the ESPHome sauna while it heats", () => {
  const hass = esphomeHass();
  const cfg = C.configOf({ entity: "climate.tylo_sauna_climate", toggles: ["switch.tylo_light"] });
  const m = C.modelOf(hass, cfg, C.rolesOf(cfg, C.discover(hass, cfg.entity)), 0);
  assert.equal(m.temp, 64.5);
  assert.equal(m.unit, "°C");
  assert.deepEqual([m.target.kind, m.target.value, m.target.min, m.target.max, m.target.step], ["climate", 80, 40, 110, 1]);
  assert.deepEqual([m.targetHum.kind, m.targetHum.value], ["number", 30]);
  assert.equal(m.hasHum, false);
  assert.deepEqual([m.bath.value, m.bath.min, m.bath.max, m.bath.unit], [180, 1, 360, "min"]);
  assert.equal(m.remaining, 95);
  assert.equal(m.light.on, true);
  assert.equal(m.heating, true);
  assert.equal(m.on, true);
  assert.equal(m.status, "heating");
  assert.equal(m.toggles[0].name, "switch.tylo_light", "no friendly name: the id");
});

test("an unavailable heater shows nothing it no longer knows", () => {
  const hass = esphomeHass();
  hass.states["climate.tylo_sauna_climate"] = S("climate.tylo_sauna_climate", "unavailable", { current_temperature: 64.5, temperature: 80 });
  const cfg = C.configOf({ entity: "climate.tylo_sauna_climate", discover: false });
  const m = C.modelOf(hass, cfg, C.rolesOf(cfg, { roles: {}, info: [] }), 0);
  assert.equal(m.status, "unavailable");
  assert.equal(m.temp, null);
  assert.equal(m.target.value, null);
  assert.equal(m.target.ok, false);
  assert.equal(m.power.ok, false);
});

test("a missing heater says so", () => {
  const cfg = C.configOf({ entity: "climate.nowhere" });
  const m = C.modelOf({ states: {} }, cfg, C.rolesOf(cfg, { roles: {}, info: [] }), 0);
  assert.equal(m.found, false);
  assert.equal(m.status, "unavailable");
});

test("ready: the heater's word, else within two degrees of the target", () => {
  const hass = esphomeHass();
  hass.states["binary_sensor.tylo_ready_state"] = S("binary_sensor.tylo_ready_state", "on");
  const cfg = C.configOf({ entity: "climate.tylo_sauna_climate" });
  assert.equal(C.modelOf(hass, cfg, C.rolesOf(cfg, C.discover(hass, cfg.entity)), 0).status, "ready");
  const own = C.configOf({ entity: "climate.tylo_sauna_climate", entities: { ready: "none" } });
  const roles = C.rolesOf(own, C.discover(hass, own.entity));
  assert.equal(C.modelOf(hass, own, roles, 0).status, "heating");
  hass.states["climate.tylo_sauna_climate"].attributes.current_temperature = 78.2;
  assert.equal(C.modelOf(hass, own, roles, 0).status, "ready");
  hass.states["climate.tylo_sauna_climate"] = S("climate.tylo_sauna_climate", "off", { current_temperature: 80, temperature: 80 });
  assert.equal(C.modelOf(hass, own, roles, 0).status, "off");
});

test("a switch, helpers in hours and a timer", () => {
  const now = Date.parse("2026-10-28T18:00:00Z");
  const hass = { states: {
    "switch.bastu": S("switch.bastu", "on"),
    "sensor.bastu_temp": S("sensor.bastu_temp", 150, { unit_of_measurement: "°F" }),
    "input_number.bastu_mal": S("input_number.bastu_mal", 175, { min: 100, max: 194, step: 5 }),
    "input_number.bastu_tid": S("input_number.bastu_tid", 1.5, { min: 0.5, max: 6, step: 0.5, unit_of_measurement: "h" }),
    "timer.bastu": S("timer.bastu", "active", { finishes_at: "2026-10-28T18:45:30Z" }),
  } };
  const cfg = C.configOf({ entity: "switch.bastu", entities: { temperature: "sensor.bastu_temp", target_temperature: "input_number.bastu_mal",
                                                              bath_time: "input_number.bastu_tid", remaining_time: "timer.bastu" } });
  const m = C.modelOf(hass, cfg, C.rolesOf(cfg, { roles: {}, info: [] }), now);
  assert.equal(m.unit, "°F");
  assert.equal(m.power.kind, "switch");
  assert.deepEqual([m.bath.value, m.bath.min, m.bath.max, m.bath.step, m.bath.rawStep], [90, 30, 360, 30, 0.5]);
  assert.equal(Math.round(m.remaining * 10) / 10, 45.5);
  assert.equal(m.status, "heating");
  hass.states["sensor.bastu_temp"] = S("sensor.bastu_temp", 172, { unit_of_measurement: "°F" });
  assert.equal(C.modelOf(hass, cfg, C.rolesOf(cfg, { roles: {}, info: [] }), now).status, "ready");
  assert.deepEqual(C.setValueCall(m.bath, C.bathValue(m.bath, 125)), ["input_number", "set_value", { entity_id: "input_number.bastu_tid", value: 2 }]);
  assert.equal(C.remainingOf(S("timer.bastu", "paused", { remaining: "0:20:00" }), now), 20);
  assert.equal(C.remainingOf(S("timer.bastu", "idle", {}), now), null);
});

test("one press goes to the next mark of the step, inside the limits", () => {
  assert.equal(C.stepped(245, 1, 10, 1, 360), 250);
  assert.equal(C.stepped(245, -1, 10, 1, 360), 240);
  assert.equal(C.stepped(250, 1, 10, 1, 360), 260);
  assert.equal(C.stepped(355, 1, 10, 1, 360), 360);
  assert.equal(C.stepped(5, -1, 10, 1, 360), 1);
  assert.equal(C.stepped(80, 1, 1, 40, 110), 81);
  assert.equal(C.stepped(110, 1, 1, 40, 110), 110);
  assert.equal(C.stepped(0.3, 1, 0.1, 0, 1), 0.4);
  assert.equal(C.stepped(null, 1, 1, 40, 110), 40);
  assert.equal(C.stepped(null, 1, 1, null, null), null);
});

test("durations the panel's way", () => {
  assert.equal(C.fmtDuration(180), "3h 0min");
  assert.equal(C.fmtDuration(190), "3h 10min");
  assert.equal(C.fmtDuration(45), "45min");
  assert.equal(C.fmtDuration(44.6), "45min");
  assert.equal(C.fmtDuration(-3), "0min");
  assert.equal(C.fmtDuration(null), "—");
  assert.equal(C.durationMin("1:30:00"), 90);
  assert.equal(C.toMin(2, "h"), 120);
  assert.equal(C.fromMin(90, "s"), 5400);
});

test("the service calls", () => {
  assert.deepEqual(C.powerCall({ kind: "climate", id: "climate.s", modes: ["off", "heat"] }, true),
                   ["climate", "set_hvac_mode", { entity_id: "climate.s", hvac_mode: "heat" }]);
  assert.deepEqual(C.powerCall({ kind: "climate", id: "climate.s", modes: ["off", "auto"] }, true)[2].hvac_mode, "auto");
  assert.deepEqual(C.powerCall({ kind: "climate", id: "climate.s", modes: [] }, false)[2].hvac_mode, "off");
  assert.deepEqual(C.powerCall({ kind: "switch", id: "switch.s" }, false), ["switch", "turn_off", { entity_id: "switch.s" }]);
  assert.deepEqual(C.switchCall("light.tak", true), ["light", "turn_on", { entity_id: "light.tak" }]);
  assert.deepEqual(C.switchCall("button.go", true), ["button", "press", { entity_id: "button.go" }]);
  assert.deepEqual(C.switchCall("cover.x", false), ["homeassistant", "turn_off", { entity_id: "cover.x" }]);
  assert.deepEqual(C.setValueCall({ kind: "climate", id: "climate.s" }, 85), ["climate", "set_temperature", { entity_id: "climate.s", temperature: 85 }]);
  assert.deepEqual(C.setValueCall({ kind: "climate_h", id: "climate.s" }, 30), ["climate", "set_humidity", { entity_id: "climate.s", humidity: 30 }]);
  assert.deepEqual(C.setValueCall({ kind: "number", id: "number.t" }, 7), ["number", "set_value", { entity_id: "number.t", value: 7 }]);
});

test("a favourite saved from the screen starts the same settings again", () => {
  const hass = esphomeHass();
  const cfg = C.configOf({ entity: "climate.tylo_sauna_climate", toggles: ["switch.bastu_doft"] });
  hass.states["switch.bastu_doft"] = S("switch.bastu_doft", "on", { friendly_name: "Lavendel" });
  const m = C.modelOf(hass, cfg, C.rolesOf(cfg, C.discover(hass, cfg.entity)), 0);
  m.target.shown = 85;   // pressed, not yet answered
  const fav = C.favOf(C.favFromModel("Lördag", m));
  assert.deepEqual(fav, { name: "Lördag", temperature: 85, humidity: 30, bath_time: 180, light: true, toggles: { "switch.bastu_doft": true } });
  assert.equal(C.favSummary(fav, m, "sv"), "85 °C · 30 % · 3h 0min · ljus · lavendel");
  assert.deepEqual(C.favoriteCalls({ temperature: 150, humidity: 25, bath_time: 400, light: false, toggles: { "switch.bastu_doft": false } }, m), [
    ["climate", "set_temperature", { entity_id: "climate.tylo_sauna_climate", temperature: 110 }],
    ["number", "set_value", { entity_id: "number.tylo_humidity", value: 25 }],
    ["number", "set_value", { entity_id: "number.tylo_bath_time", value: 360 }],
    ["switch", "turn_off", { entity_id: "switch.tylo_light" }],
    ["switch", "turn_off", { entity_id: "switch.bastu_doft" }],
  ]);
});

test("names lose the device's name", () => {
  const hass = esphomeHass();
  hass.states["switch.tylo_light"].attributes.friendly_name = "tylo Light";
  assert.equal(C.nameOf(hass, "switch.tylo_light"), "Light");
  assert.equal(C.nameOf(hass, "sensor.kitchen_temperature"), "sensor.kitchen_temperature");
});

test("times: an instant in the house's zone, a calendar's wall clock as it stands", () => {
  assert.equal(C.whenText("2026-10-30T17:00:00+00:00", "sv", "Europe/Stockholm"), "fre 18:00");
  assert.equal(C.whenText("2026-10-30 18:00:00", "sv", "America/New_York"), "fre 18:00");
  assert.equal(C.whenText("not a time", "sv", "Europe/Stockholm"), "not a time");
  assert.equal(C.clockText(Date.parse("2026-10-28T17:05:00Z"), "Europe/Stockholm", "sv", false), "18:05");
  assert.match(C.clockText(Date.parse("2026-10-28T17:05:00Z"), "Europe/Stockholm", "en", true), /06:05\sPM/i);
});

test("the weekly program's rows", () => {
  const hass = { states: {} };
  const tz = "Europe/Stockholm";
  assert.equal(C.programText(hass, S("schedule.b", "on"), "sv", tz), "Pågår nu");
  assert.equal(C.programText(hass, S("schedule.b", "off", { next_event: "2026-10-30T17:00:00+00:00" }), "sv", tz), "Nästa fre 18:00");
  assert.equal(C.programText(hass, S("calendar.b", "off", { message: "Bastu", start_time: "2026-10-31 16:00:00" }), "en", tz), "Bastu · Sat 16:00");
  assert.equal(C.programText(hass, undefined, "sv", tz), "Finns inte");
});

test("every language has every word", () => {
  for (const lang of Object.keys(C.STR)) {
    for (const key of Object.keys(C.STR.en)) assert.ok(C.STR[lang][key], `${lang}.${key}`);
  }
  assert.equal(C.langOf({ locale: { language: "sv-SE" } }, {}), "sv");
  assert.equal(C.langOf({ locale: { language: "fi" } }, {}), "en");
  assert.equal(C.langOf({ locale: { language: "sv" } }, { language: "de" }), "de");
  assert.equal(C.label("sv", "stopsIn", { t: "1h 0min" }), "Stoppar om 1h 0min");
  assert.equal(C.esc('<b a="1">'), "&lt;b a=&quot;1&quot;&gt;");
});
