# Changelog

## [0.1.0] - 2026-10-28

- **First release.** The Tylö Elite panel as a Lovelace card. The home screen has
  the temperature, the humidity, the set values, the state, the clock and the
  connection. The settings screen has −/+ for temperature, humidity and *Stop
  after*, lighting and extra toggles, and *Save as favourite*. Behind the
  bottom icons are favourites, the weekly program and the system screen.
- **Finds the ESPHome sauna360 device's entities by itself** from its climate.
  Any other sauna works with the roles given by hand (switch, sensors,
  `number`/`input_number`, timer).
- **Favourites follow the user**: they are stored in the user's Home Assistant
  profile. Fixed favourites can come from the configuration.
- **Presses are gathered**: − and + show at once and write once, 0.7 s after
  the last press. Held down, they repeat.
- **A visual editor** (Home Assistant 2025.1 or later), Swedish, English and German.
