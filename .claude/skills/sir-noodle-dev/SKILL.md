---
name: sir-noodle-dev
description: How to add art, power-ups/timed effects, achievements and UI screens, and playtest Sir Noodle's Snack Quest (canvas game in index.html + src/). Use when changing gameplay, adding pickups/effects/achievements, editing dialogs, or editing icons in this project.
---

# Sir Noodle dev workflow

Canvas game, no build step, no npm deps, must keep working from `file://`. `index.html` loads `css/` and the
classic scripts in `src/` (not ES modules: browsers block those on file://). The scripts share one global scope,
so files read each other's state directly; keep the `<script>` order and only run load-time code that uses
earlier files. Map of files: README.md. Git: work on a branch, commit with the attribution trailer.

## Art (cheap, code-drawn)
- Every icon is code in `tools/art.js`: `ART.<name> = g => { ... }`, drawn in a 100x100 box with the shared
  helpers (`circ`, `ell`, `paint`, `ink`, `shine`, `dot`...) and the ink outline `#5b2a4e`. Match that style.
- Export: `node tools/export.mjs` (headless Chrome, writes all `assets/*.png` at 128px).
  `--sheet <path.png>` also saves a preview sheet. `CHROME=<path>` if Chrome isn't at the default Windows path.
- Avatars are art too: `ART.av_<name>` (round face filling the box) plus an entry in `AVATARS` (`src/config.js`).
  Stat icons: coin = score, snackbag = snacks, crown = best, worm = length, clock = time; use them wherever a stat shows.
- New icons used on the canvas must be added to `ICON_NAMES` in `src/config.js` (DOM screens use `iconHtml(name)`, no list needed).
- Things that must rotate with the snake's direction (e.g. the monkey head) are drawn with canvas calls in
  `drawFace`, not PNGs. Rotatable parts (e.g. `paw`) are PNGs drawn pointing up, rotated via `icon(name, x, y, size, rot)`.

## Adding a timed effect / power-up
1. `EFFECTS.<k>` (emo, name, ms, color, banner, icon, sub) and its position in `THEME_ORDER`.
   `fx`, `wasActive`, `fxAmt` are built from `EFFECTS` keys via `fxMap`, so they need no edits.
2. `END_QUOTES.<k>`, `GLOWS.<k>`, CSS `body.fx-<k>` page background.
3. `PICKUPS.<kind>` (icon, fx, text, aura) and add the kind to `pickSpecialKind()`'s pool.
4. Optional mood: a branch in `tileRGB` (grass tint), `drawVignettes`, `ambient` particles. Skip heavy work when `lowFx`.
5. Speed comes from `speedLvl` (one level per snack via `snack()`, capped at `MAX_LVL`), not from `eaten`;
   the moon / night effect drains it back to 0. Effect multipliers go in `interval()`.
   Eating logic lives in `consume(x, y, viaPaw)` (called for the head and for monkey paws), not inline in `step()`.
6. Any new short-lived animation array must be reset in `reset()`, ticked in `frame()`, and included in `settled()`,
   otherwise the idle loop sleeps too early or never sleeps.
7. Update the `.hint` text in `index.html`. Consider an achievement for it (below).
8. Mechanics are documented for humans in `docs/` (e.g. `docs/speed-and-night.md`). When you change a number
   documented there (speeds, durations, spawn weights), update the doc's tables too.

## Achievements, ranking, screens
- Achievements: `ACHIEVEMENTS` in `src/achievements.js` (`tier`, `m: r => stat`, `goal`, `life`), stats in `newRun()`,
  bumped in `src/game.js` (`run.rocks++` etc.). Table in `docs/achievements-and-ranking.md` must match.
  Tiers (common/rare/epic/legendary) drive the look everywhere: icon in `emblem(a)`, classes `.t-<tier>` /
  `.r-<tier>` in `css/ui.css`. The rarer, the more the medallion/tile must show it. Hall of Fame stays last.
- Save data: one localStorage key via `src/storage.js` (`save`, `persist()`); validate anything you add in `loadSave()`.
- Title / pause / game over / records are DOM screens over the canvas (`src/ui.js`, `css/ui.css`), not canvas
  panels. Change state only with `setState()`. No dark dimming behind cards (players found it gloomy).
  Borders only on clickable things (buttons, tabs, inputs, avatar picks); read-only stats, chips, tiles, avatars
  have no border and no blurred shadow (only hard ink offset shadows fit the art). HUD read-outs are bare icon +
  number; the speed/effect strip is sunken. Records opens from title / HUD / T, not from dialogs.
  Type: Fredoka, bold = 600 at most (titles too), medium = 500; canvas text() defaults to 600.
  Avatars should be cute and simple (see av_anon: grey, minimal, Notion-like). Layers, flow, key map and the game over timeline: `docs/ui.md`.
- Game over restarts only via `replay()` (Replay button / Space / Enter), gated by `overReady`, which turns on
  when the card has landed (`DEATH_PAUSE + LANDED_MS`, ~1.2s after death), not after the whole results timeline:
  a player mashing Space should get back in right after the dialog pops up. Buttons pop in with the card.
  Animated parts use `.pop/.rise/.stamp` with `style="--d:<ms>"` from the timeline in `showGameOver()`.

## Text and languages (English + 简体中文)
- Every player-facing string needs a Chinese version (`src/i18n.js`): text built in code goes through
  `tr('key', ...args)` with the key in both `STR.en` and `STR.zh`; static text in `index.html` gets
  `data-i18n` / `data-i18n-title` / `-alt` / `-aria` / `-ph` = a key in `UI_ZH`; new entries in the data tables
  (`EFFECTS`, `PICKUPS`, quotes, `ACHIEVEMENTS`, `AVATARS`...) need their entry in `DATA_ZH`.
- Chinese uses full-width punctuation (，！？：（）). Show names with `shownName()` (the saved "Anonymous" is translated).
- CJK glyphs come from system fonts (light: no heavy bold) via the `--font` stack / `TEXT_FONT`;
  check zh screens with `toggleLang()`.

## Playtesting headlessly
UI-only change? Don't play: open the screen directly (`openRecords('ach')`, `setState('pause')`,
`setState('over'); showGameOver({ entry: null, rank: -1, newBest: false, run, unlocked: [] })`) and screenshot it.
Scrollbars are hidden by default; `SCROLLBARS=1` shows real ones. Scroll containers must stay `overflow: hidden auto`
(popping parts scale past the edges and would otherwise flash a horizontal bar).
`node tools/playtest.mjs` = smoke test (random play, fails on page errors).
`node tools/playtest.mjs test.mjs` runs `export default async ({ T, shot, frames, sleep, errors }) => {...}`;
`VIEWPORT=360x640` for phone size. `T(code)` evaluates in the page's global scope, so all game state is reachable
(`state`, `snake`, `run`, `save`...). Put test scripts and screenshots in the scratchpad, not the repo.
- Drive with `T("start(); ...set snake/stones/food/special...; step(); 'ok'")` and read state back as JSON.
  Stop loops when `state !== 'play'`: `step()` doesn't check state, so stepping after death calls `die()` again.
- Keys: `T("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))")`.
- DOM screens animate in real time (CSS, setTimeout), so use `sleep(ms)` before screenshots of dialogs.
  `shot(path)` captures `#stage` (canvas + screens). Things under a centered card (e.g. the snake at its start
  cell) are hidden by the title / pause card; that's expected.
- The canvas loop sleeps when idle; call `wake()` after changing state by hand. If rAF doesn't fire, advance
  frames by hand: `frames(60)` (~1s). `acc = -1e9` stops auto-stepping but makes the tween extrapolate.
