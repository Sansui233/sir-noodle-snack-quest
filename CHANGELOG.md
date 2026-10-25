# Changelog

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
