# UI hierarchy and screen flow

The world is drawn on the canvas. Everything you click or read in a box (title, pause, game over, records,
toasts) is DOM stacked on top of the canvas, so it gets real buttons, keyboard focus and CSS animations, and
costs nothing while the game loop sleeps. Code: `src/ui.js`, styles: `css/ui.css`.

## Page layout

```
body
├─ main#board               header + stage as one piece; carries the effect glow (GLOWS)
│  ├─ header#hud            the HUD, glued to the top of the board (css/hud.css)
│  │  ├─ .hud-row
│  │  │  ├─ button#profile        [avatar  PLAYER / name]   opens the profile dialog
│  │  │  ├─ .counters             (coin) score · (snack bag) snacks · (crown) best     read-outs, not buttons
│  │  │  └─ .hud-btns             (trophy + unlocked count) records · (speaker) mute · (sparkle/feather) FX · 中/EN language
│  │  └─ .hud-status              speed meter ................................ current effect / shields
│  └─ #stage                the square board (container for cqw font sizing)
│     ├─ canvas#c           z0  world: grass, rocks, pickups, Sir Noodle, particles, "×N" pops, banners, bubbles
│     ├─ .screen #scr-title     z2  ┐
│     ├─ .screen #scr-pause     z2  ├ at most one of these, picked by the game state
│     ├─ .screen #scr-over      z2  ┘
│     ├─ .screen.modal #scr-records  z3  ┐ open on top of any state (opening one during play pauses)
│     ├─ .screen.modal #scr-profile  z3  │
│     ├─ .screen.modal #scr-share    z3  ┘
│     └─ #toasts            z4  achievement toasts, never block input (pointer-events: none)
└─ .hint                    controls
```

Title, pause and game over have **no backdrop**: the board stays bright behind the card, so a break still
feels like part of the game. The two modals get a light pink frosting (never a dark dim). Card text is sized
in `em` off `2.5cqw` (2.5% of the board width, clamped to 10-16px), so every dialog scales with the board.

## Borders mean "you can press this"

Only clickable things get an ink border: buttons, tabs, the "Playing as" chip, avatar choices, the name field.
Everything read-only (stat tiles and chips, ribbons, badges, achievement tiles, ranking rows, podium steps,
toasts, avatars, progress bars) is borderless, and has no blurred shadow either: soft shadows clash with the
flat ink art. The only shadows are the hard ink offsets on buttons, dialog cards and the board (plus the
rarity glows). Fills are rare too: the big score tile keeps its pink, the pause stat chips have none.
Dialog cards and the board keep their frame as containers.

## HUD: buttons vs read-outs

The old HUD was a row of identical pills, so nobody could tell what was clickable. Now there are two looks:

| Kind       | Items                                   | Look                                                        |
|------------|-----------------------------------------|-------------------------------------------------------------|
| Buttons    | profile, records, mute, FX, language    | white, raised (dark bottom edge), round or pill; lift on hover, sink on press |
| Read-outs  | score, snacks, best                     | just icon + number on the header, no frame; bump when a number goes up |
| Status     | speed meter, current effect             | one sunken strip under the top row, so it reads as separate from both |

Every stat has its own icon everywhere it appears (HUD, pause chips, game over tiles):
`coin` = score, `snackbag` = snacks, `crown` = best, `worm` = length, `clock` = time.
The name always sits right of the avatar (cut with … when long); small boards drop the "PLAYER" label, and
tiny ones (under 300px) show the avatar alone.

## Window fit

The board is sized from the window so its frame is never cut off by the window edge. `fitWindow()`
(`src/main.js`) runs once on boot and 150ms after the last resize event (debounced, not per event):

- `--ui`: 1 on roomy windows, down to 0.75 on small ones (`min(width / 760, height / 860)`). Scales what sits
  around the board: page padding (18px), gaps (12px), the hint (13px, so 10px at 75%) and its icons.
- `--chrome` / `--hud-k`: the measured height of the hint + padding, and header height / board width
  (~0.15, more on tiny boards where the header text stops shrinking). The board width solves
  `board * (1 + hud-k) = window height - chrome`, so a smaller hint gives the board more room.
- No text is smaller than 10px (`--min-font`): sub-1em sizes are written `max(var(--min-font), .7em)`, and
  canvas text (`text()`, bubbles, "×N" pops) is floored at `minTextPx`, 10 screen px in board units.
- Windows under 520px tall (landscape phones) hide the hint.
- The game over stat tiles (score, snacks, length, time) go 2x2 when the card is under 30em wide
  (container query on `.over-card`), instead of clipping the numbers.

## Profile

Everyone starts as **Anonymous** with a calm grey, minimal face (`av_anon`). The profile button (HUD) or the
"Playing as" chip (title card) opens `#scr-profile`: big preview, name field (14 chars, "Random name" picks a
funny one), 13 avatars (`AVATARS` in `src/config.js`, art in `tools/art.js`), Save (Enter) / Cancel (Esc).
While it's open, every key goes to the name field (no muting on M, no records on T).
Name and avatar appear in the HUD, title and pause cards, the game over header, the podium and the ranking.
Each ranking entry keeps the name and avatar it was played with.

## Snack milestones

Every 5th snack a small "(snack bag) ×N" pops out beside Sir Noodle's head, floats up and fades (1.2s);
every 10th is bigger and gold, with sparkles. Code: `milestone()` (`src/particles.js`), `drawPops()`
(`src/render/overlays.js`), the `pops` array.

## Screens

| State   | Screen            | Contents                                                                 | Leaves via                          |
|---------|-------------------|--------------------------------------------------------------------------|-------------------------------------|
| `title` | `#scr-title`      | logo, name, **Play**, **Records** (the only dialog with it; also HUD / T), best score + achievement count chips   | Play / Enter / Space / arrow / tap  |
| `play`  | none              | canvas + HUD; toasts drop in when an achievement unlocks                  | Space/P/Esc pause, T records, death |
| `pause` | `#scr-pause`      | avatar, a silly "<name> is munching" line, score / snacks / time chips, **Resume** | Resume / Space / arrow / tap        |
| `over`  | `#scr-over`       | game over dialog (below)                                                  | Replay / Space / Enter, once landed |
| any     | `#scr-profile`    | name + avatar picker (above)                                              | Save / Enter, Cancel / Esc / backdrop |
| over    | `#scr-share`      | share picture preview, editable text, Share… / copy / save, X / Weibo / Facebook | ✕ / Esc / backdrop |
| any     | `#scr-records`    | tabs: **Ranking** (top 10 + lifetime totals, reset) / **Achievements**    | ✕ / Esc / T / Enter / backdrop      |

Every state change goes through `setState()` (`src/game.js`), which calls `syncScreens()` to show the right one.

## Game over dialog

```
┌──────────────────────────────────────────────┐
│     (avatar, seeing stars)  GAME OVER        │  header + death quote
│        "Hard head, soft worm."               │
│ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐        │  this run: numbers count up
│ │ SCORE  │ │SNACKS│ │LENGTH│ │ TIME │        │
│ └────────┘ └──────┘ └──────┘ └──────┘        │
│   (rocks destroyed) (top speed) (best hat)   │  chips, only the ones that apply
│        ╔═ NEW HIGH SCORE! ═╗                 │  ribbon: new best / #rank / points to top 10
│ ───────────── TOP 3 ─────────────            │
│            crown                             │  podium, this run glows and says YOU!
│  (cat)     (frog)     (you)                  │  avatars, names, "YOU!"
│   420     [ 520 ]     260                    │
│  [ 2 ]   [   1   ]   [ 3 ]                   │
│ ──────── UNLOCKED THIS RUN ────────          │  badges in their rarity look, rarest first
│ (First Bite) (Royal Noodle) (Rock Bottom)    │
│             [ Replay Space ]                 │  sticky: reachable even if the card scrolls
│                                   (eye)(✈)   │  top-right corner: peek, share (with the buttons)
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

While peeking (game over card hidden), any key or click brings the card back and never replays.
The share dialog, like the profile dialog, owns the keyboard (typing in its text box); Esc closes it.

## Peek and share (game over)

Two round buttons in the game over card's top-right corner (`src/share.js`):

- **Peek** (eye): the card slides off the bottom (`#scr-over.peek`, using `translate` so it stacks on the
  drop-in animation) and a "Show results" pill appears, so the crash scene and HUD can be screenshotted.
  Any click on the board, any key or the pill brings the card back. Space / Enter don't replay while peeking.
- **Share** (paper plane): opens `#scr-share`. `drawShareImage()` paints a 720x960 picture on its own canvas:
  title, the board as it is at the crash (copied from the game canvas), avatar + name, "new high score" or the
  death quote, the four stats and the link. The text is a sentence from `tr('shareText')`, editable before sharing.
  - **Share…** uses the Web Share API (phones, Chrome / Edge / Safari on desktop), with the picture when the
    browser can share files. **Copy image** / **Save image** / **Copy text** cover everything else.
  - **X / Weibo / Facebook** open their share pages with the text and link; links can't carry a picture, so the
    tooltip says to attach the saved one. Weibo comes first in Chinese.
  - Opened from `file://`, the game canvas is tainted by the local PNGs it drew, so no picture can be exported:
    the dialog says so and the text options still work. Online (http/https) everything works.
  - The link is the page's own address online, `PLAY_URL` otherwise.
