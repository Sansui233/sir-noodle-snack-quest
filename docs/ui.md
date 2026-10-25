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
| `over`  | `#scr-over`       | game over dialog (below)                                                  | Replay / Space / Enter, once landed |
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
│ ──────── UNLOCKED THIS RUN ────────          │  badges in their rarity look, rarest first
│ (First Bite) (Royal Noodle) (Rock Bottom)    │
│      [ Replay Space ]   [ Records T ]        │  sticky: reachable even if the card scrolls
└──────────────────────────────────────────────┘
```

### Timeline (when the game can restart)

`showGameOver()` builds the dialog and plays it as a timeline. Times are from the moment of death:

| ms after death          | what happens                                                       |
|-------------------------|--------------------------------------------------------------------|
| 0                       | crash: shake, burst, death sound; the board stays visible           |
| 600 (`DEATH_PAUSE`)     | backdrop fades in, card **drops in** from above with a bounce       |
| +160 (`ACT_AT`)         | Replay / Records buttons pop in with the card (pinned to its bottom) |
| +620 (`LANDED_MS`)      | **card has landed: Replay works** (Space, Enter or the button), and starts pulsing. ~1.2s after death |
| +240, +320              | header, death quote **pop** in                                      |
| +400 ... +640           | the 4 stat tiles pop in (`STEP` = 80ms apart), numbers count up    |
| +720 ... +1410          | chips, ribbon **stamps** down (+870), podium steps **rise** (3rd, 2nd, 1st) |
| +1570 ...               | "Unlocked this run" badges, rarest first, or the "Next goal" card   |

The results keep animating after Replay is enabled; a player who wants to read them can, and a player
mashing Space restarts as soon as the dialog has popped up. Before it has landed, `overReady` is false and
Space / Enter / the (disabled) button do nothing, so the death itself can't be skipped by a key that was
already being pressed. Held keys (auto-repeat) are always ignored.

## Animations

| Class / keyframes | Used for                                     | Feel                                      |
|-------------------|----------------------------------------------|-------------------------------------------|
| `drop-in`         | every card entering                          | falls from above, overshoots, settles     |
| `pop-out`         | every card leaving (200ms)                   | shrinks and fades                         |
| `pop`             | parts of a card, staggered with `--d`        | scale 0 → 1.12 → 1                        |
| `rise`            | podium steps                                 | grow up from the floor with a bounce      |
| `stamp`           | rank ribbon                                  | slams down from 2.6x, tilted              |
| `slide-in`        | ranking rows                                 | slide in from the left, staggered         |
| `toast`           | achievement toast (legendary: bigger, 3.6s)  | drops from the top, bounces, retracts     |
| `spin`, `twinkle` | epic / legendary medallions                  | sunburst rays, star glint on the rim      |
| `pulse`           | Replay once it's ready                       | gentle throb + pink ring                  |
| `bump`            | HUD pill whose number just went up           | quick scale bump                          |
| `bob`, `wiggle`, `shine` | logo, crown, dead face, badges, best ribbon | idle life                            |

`prefers-reduced-motion: reduce` swaps all of these for short fades (the timeline and its delays stay, so
the replay lock behaves the same). Low FX (`L`) skips the HUD bump.

## Rarity looks

Every achievement icon sits in a medallion (`emblem()` in `src/ui.js`, `.emb.t-<tier>` in `css/ui.css`):

| Tier      | Medallion                                         | Tile / badge / toast                         | Sound / in-game            |
|-----------|---------------------------------------------------|----------------------------------------------|----------------------------|
| Common    | plain white                                       | cream                                        | chime                      |
| Rare      | blue gradient, blue ring                          | light blue                                   | chime                      |
| Epic      | purple gradient, glowing ring, twinkling star     | lavender with purple glow                    | chime + purple confetti ring around Sir Noodle |
| Legendary | gold, spinning sunburst behind it, glow, twinkle  | gold with a shine sweep; bigger, longer toast | fanfare + gold confetti, screen flash |

Locked achievements keep their tier frame (so you can see what is rare) with a greyed-out icon.
The records grid is grouped by tier, with a per-tier count at the top.

## Keys

| Key            | title  | play          | pause   | over (dialog ready) | records open        |
|----------------|--------|---------------|---------|---------------------|---------------------|
| Enter          | start  | pause         | resume  | **replay**          | press focused button, else close |
| Space          | start  | pause         | resume  | **replay**          | nothing             |
| Arrows / WASD  | start + turn | turn    | resume + turn | nothing       | ←/→ switch tab      |
| Esc / P        |        | pause         | resume  |                     | close (Esc)         |
| T              | records| pause + records | records | records           | close               |
| M / L          | mute / low FX everywhere                                                    |
