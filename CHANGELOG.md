# Changelog

## v2.1.0

- **简体中文**: every screen, HUD tooltip, banner, speech bubble, achievement and the controls hint, in Chinese.
  Follows the browser language until you pick one with the HUD language button (shows the current one: EN / 中).
  Chinese text uses the system UI font (PingFang SC, Microsoft YaHei UI, Noto Sans CJK), kept light.
- Options remember themselves: language and mute are kept in localStorage, like low effects.
- Small windows (experimental): the hint and page padding shrink to 75% so the board gets more room, no text
  is ever below 10px (dialogs, HUD and canvas text), and short windows hide the hint. Re-fits 150ms after a resize.
  The game over stats go 2x2 on narrow cards instead of clipping.

## v2.0.2

- Lighter type: bold text is Fredoka 600 (was 700-900), medium text 500. Applies to dialogs, HUD and the
  canvas (banners, speech bubbles, "×N" pops).

## v2.0.1

- Fix: the bundled Fredoka font never loaded since the CSS moved to `css/` (its `url()` must be relative to the
  stylesheet), so every browser fell back to Trebuchet MS. Text now looks the same on every OS again.
- HUD name gets a little more room, since Fredoka is wider than the fallback.

## v2.0.0

Achievements, ranking, profiles and a new UI.

- **Achievements**: 34 in four rarity tiers (Common, Rare, Epic, Legendary), each tier with its own medallion,
  tile, toast and sound. Toasts drop in during play; epic / legendary also burst confetti on the board.
- **Ranking**: your top 10 runs, saved in the browser. The game over dialog shows this run's stats, a rank
  ribbon, a top 3 podium and what the run unlocked.
- **Profile**: everyone starts as Anonymous; pick a name and one of 13 avatars. Name and avatar show in the HUD,
  dialogs, podium and ranking.
- **New UI**: title / pause / game over / records / profile are animated dialogs over the board (drop-in, pop,
  rise, stamp), with no dark dimming. Game over restarts with Space / Enter / Replay as soon as the dialog lands.
- **HUD**: a header on top of the board. Buttons (profile, records, sound, effects) are raised and outlined;
  score / snacks / best are plain icon + number. Every 5th snack pops a little "×N" on the board.
- New art: coin, snack bag, clock, 13 avatars.
- Project: split into `css/` and `src/`, git, headless playtest and release scripts, docs in `docs/`.

## v1.0.0

The original single-file game: snacks, hats, falling rocks, bombs, shields and six power-up modes
(spicy, chill, dizzy, god, monkey, night).
