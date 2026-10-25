# Changelog

## v2.3.0

- **Pick one**: on a hard board (fast, long, lots of rocks) a power-up can come as a choice of 2 items, rarely 3.
  Eat the one you want and the others vanish. The harder the board, the more often it happens (3 items: at most 5%).
- **Help grows with speed**: faster play brings more shields (from level 15), then more stars (25 and 33).
  Ice is rare at the start and gets more common as you speed up. With 2 shields, shields show up less often.
- **Moon guarantee**: at full speed, a moon shows up within 7 snacks, so the game can't stay at max speed for long.
- **Super bombs**: more rocks and a longer snake make them more likely (tuned for runs around length 150),
  and with 12 or more rocks the next bomb is always a super bomb.

## v2.2.0

- **Share your run**: a share button on the game over card makes a picture (the board at the crash, your
  name, stats and the link) with a sentence about the run. Copy or save the picture, copy the text, or post it
  to X / Weibo / Facebook. The picture needs the online version; opened as a local file, it shares text only.
- **Peek**: the eye button hides the game over card so you can screenshot the board; any key or click brings
  it back (and never starts a new game by accident).
- GitHub link in the top-right corner of the page (under the controls hint on narrow windows).

## v2.1.1

- Snappier swipes: the turn fires mid-drag once the finger has moved 14px, and one continuous drag can chain
  turns (an L-shaped drag = two turns).

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
