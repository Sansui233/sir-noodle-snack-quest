# Sir Noodle's Snack Quest

Open `index.html` in a browser. Everything is local: no network access, no server and no build step needed.

```
index.html              page shell: HUD, canvas, script tags (in load order)
css/style.css           page + HUD styles, page mood per effect
src/                    the game, as plain classic scripts sharing one global scope
  config.js             constants and data: effects, pickups, quotes, art names
  util.js               small pure helpers
  dom.js                page elements
  state.js              mutable game state, reset()
  hud.js                HUD above the canvas
  audio.js              synthesized sound effects
  particles.js          particle bursts, ambient effect particles
  game.js               rules: spawning, effects, movement, eating, rocks, bombs
  input.js              keyboard / touch / mouse
  render/               canvas drawing (helpers, world, snake, overlays + render())
  main.js               main loop and boot (loads last)
assets/*.png            all art, 128x128 (no system emoji are used, so it looks the same on every OS)
assets/fonts/           Fredoka (SIL Open Font License, see OFL.txt)
tools/art.js            the art, drawn as code in a 100x100 box
tools/sheet.html        preview of every icon (open in a browser)
tools/export.mjs        renders tools/art.js -> assets/*.png via headless Chrome
tools/playtest.mjs      drives the game in headless Chrome (smoke test, scripted tests, screenshots)
docs/                   game mechanics write-ups (for humans)
```

Why classic scripts and not ES modules: browsers block module scripts on `file://`, and the game is meant to
be opened by double-clicking `index.html`. Top-level `let`/`const`/`function` in classic scripts share one
global scope, so the files see each other's state directly. Keep the `<script>` order in `index.html`:
a file may only *run* code at load time that uses things defined in files above it.

## Mechanics docs

- [Speed and the Night (moon) mechanic](docs/speed-and-night.md): speed stage table, speed meter, moon spawn rules, tuning knobs

## Changing the art

1. Edit or add a drawing in `tools/art.js` (`ART.<name> = g => { ... }`).
2. Run `node tools/export.mjs` (set `CHROME=<path>` if Chrome/Edge is not in the default Windows location).
3. New icons used on the canvas must also be listed in `ICON_NAMES` in `src/config.js`.

## Testing

`node tools/playtest.mjs` boots the game headless, plays random moves and fails on any page error.
`node tools/playtest.mjs path/to/test.mjs` runs your own script; see the header of `tools/playtest.mjs`.
