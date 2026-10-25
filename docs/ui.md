# UI hierarchy and screen flow

The world is drawn on the canvas. Everything you click or read in a box (title, pause, game over, records,
toasts) is DOM stacked on top of the canvas, so it gets real buttons, keyboard focus and CSS animations, and
costs nothing while the game loop sleeps. Code: `src/ui.js`, styles: `css/ui.css`.

## Page layout

```
body
├─ h1                       title
├─ #hud                     Score · Best · Snacks · Speed · effect status · [trophy n/22] [mute] [FX]
├─ #stage                   the board (square, scales with the window; container for cqw font sizing)
│  ├─ canvas#c              z0  world: grass, rocks, pickups, Sir Noodle, particles, banners, speech bubbles
│  ├─ .screen #scr-title    z2  ┐
│  ├─ .screen #scr-pause    z2  ├ at most one of these, picked by the game state
│  ├─ .screen #scr-over     z2  ┘
│  ├─ .screen.modal #scr-records  z3  can open on top of any state (opening it during play pauses)
│  └─ #toasts               z4  achievement toasts, never block input (pointer-events: none)
└─ .hint                    controls
```

Each `.screen` is a dimmed backdrop with one `.card`. Card text is sized in `em` off a font size of `2.5cqw`
(2.5% of the board width, clamped to 9-16px), so every dialog scales with the board.

## Screens

| State   | Screen            | Contents                                                                 | Leaves via                          |
|---------|-------------------|--------------------------------------------------------------------------|-------------------------------------|
| `title` | `#scr-title`      | logo, name, **Play**, **Records**, best score + achievement count chips   | Play / Enter / Space / arrow / tap  |
| `play`  | none              | canvas + HUD; toasts drop in when an achievement unlocks                  | Space/P/Esc pause, T records, death |
| `pause` | `#scr-pause`      | score / snacks / time so far, **Resume**, **Records**                     | Resume / Space / arrow / tap        |
| `over`  | `#scr-over`       | game over dialog (below)                                                  | **Replay button or Enter only**     |
| any     | `#scr-records`    | tabs: **Ranking** (top 10 + lifetime totals, reset) / **Achievements**    | ✕ / Esc / T / Enter / backdrop      |

Every state change goes through `setState()` (`src/game.js`), which calls `syncScreens()` to show the right one.

## Game over dialog

```
┌──────────────────────────────────────────────┐
│        (x_x)  GAME OVER                      │  header + death quote
│        "Hard head, soft worm."               │
│ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐        │  this run: numbers count up
│ │ SCORE  │ │SNACKS│ │LENGTH│ │ TIME │        │
│ └────────┘ └──────┘ └──────┘ └──────┘        │
│   (rocks destroyed) (top speed) (best hat)   │  chips, only the ones that apply
│        ╔═ NEW HIGH SCORE! ═╗                 │  ribbon: new best / #rank / points to top 10
│ ───────────── TOP 3 ─────────────            │
│            crown                             │  podium, this run glows and says YOU!
│   420     [ 520 ]     260                    │
│  [ 2 ]   [   1   ]   [ 3 ]                   │
│ ──────── UNLOCKED THIS RUN ────────          │  badges (or "Next goal" with a progress bar)
│ (First Bite) (Royal Noodle) (Rock Bottom)    │
│      [ Replay ⏎ ]   [ Records T ]            │  sticky: reachable even if the card scrolls
└──────────────────────────────────────────────┘
```

### Timeline (why the game doesn't restart immediately)

`showGameOver()` builds the dialog and plays it as a timeline. Times are from the moment of death:

| ms after death         | what happens                                                     |
|------------------------|------------------------------------------------------------------|
| 0                      | crash: shake, burst, death sound; the board stays visible         |
| 700 (`DEATH_PAUSE`)    | backdrop fades in, card **drops in** from above with a bounce     |
| +250, +340             | header, death quote **pop** in                                    |
| +430 ... +700          | the 4 stat tiles pop in (`STEP` = 90ms apart), numbers count up  |
| +790                   | chips                                                             |
| +940                   | ribbon **stamps** down (fanfare if it's a new high score)          |
| +1260 ... +1480        | podium: 3rd, 2nd, 1st steps **rise**, their scores pop 200ms later |
| +1640 ...              | "Unlocked this run" badges pop one by one (chime on the first),   |
|                        | or the "Next goal" card                                           |
| last + 220             | Replay / Records buttons pop in                                   |
| + `POP_MS` (450)       | Replay enables and starts pulsing: about 3.1s after death with no unlocks |

Until that last step, `overReady` is false and nothing restarts the game: Enter is ignored, Space and the
arrow keys do nothing on the game over screen, and the Replay button is disabled. Held keys (auto-repeat)
are ignored too, so someone still holding Enter from before can't skip through it.

## Animations

| Class / keyframes | Used for                                     | Feel                                      |
|-------------------|----------------------------------------------|-------------------------------------------|
| `drop-in`         | every card entering                          | falls from above, overshoots, settles     |
| `pop-out`         | every card leaving (200ms)                   | shrinks and fades                         |
| `pop`             | parts of a card, staggered with `--d`        | scale 0 → 1.12 → 1                        |
| `rise`            | podium steps                                 | grow up from the floor with a bounce      |
| `stamp`           | rank ribbon                                  | slams down from 2.6x, tilted              |
| `slide-in`        | ranking rows                                 | slide in from the left, staggered         |
| `toast`           | achievement toast                            | drops from the top, bounces, retracts     |
| `pulse`           | Replay once it's ready                       | gentle throb + pink ring                  |
| `bump`            | HUD pill whose number just went up           | quick scale bump                          |
| `bob`, `wiggle`, `shine` | logo, crown, dead face, badges, best ribbon | idle life                            |

`prefers-reduced-motion: reduce` swaps all of these for short fades (the timeline and its delays stay, so
the replay lock behaves the same). Low FX (`L`) skips the HUD bump.

## Keys

| Key            | title  | play          | pause   | over (dialog ready) | records open        |
|----------------|--------|---------------|---------|---------------------|---------------------|
| Enter          | start  | pause         | resume  | **replay**          | press focused button, else close |
| Space          | start  | pause         | resume  | nothing             | nothing             |
| Arrows / WASD  | start + turn | turn    | resume + turn | nothing       | ←/→ switch tab      |
| Esc / P        |        | pause         | resume  |                     | close (Esc)         |
| T              | records| pause + records | records | records           | close               |
| M / L          | mute / low FX everywhere                                                    |
