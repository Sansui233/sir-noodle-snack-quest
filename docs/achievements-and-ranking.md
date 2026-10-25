# Achievements and ranking

Code: `src/achievements.js` (definitions, run stats, unlocking), `src/storage.js` (save file, ranking),
`src/ui.js` (toasts, game over dialog, records modal). If you change a goal in code, update this table.

## Achievements (22)

"Run" ones must be reached inside a single game; their progress bar shows your best run.
"Life" ones add up over every game.

| Id             | Name             | Goal                                   | Scope | Stat (`run.*`)     |
|----------------|------------------|----------------------------------------|-------|--------------------|
| `first_bite`   | First Bite       | eat 1 snack                            | run   | `snacks`           |
| `snack_attack` | Snack Attack     | eat 50 snacks                          | run   | `snacks`           |
| `bottomless`   | Bottomless Belly | eat 100 snacks                         | run   | `snacks`           |
| `triple_digit` | Triple Digits    | score 100                              | run   | `score`            |
| `tycoon`       | Snack Tycoon     | score 1,000                            | run   | `score`            |
| `legend`       | Noodle Legend    | score 3,000                            | run   | `score`            |
| `royal`        | Royal Noodle     | reach the crown (5th hat, 25 snacks)   | run   | `hat`              |
| `bonk`         | Rock Bottom      | die to a rock                          | run   | `death === 'rock'` |
| `ouroboros`    | Ouroboros        | bite your own tail                     | run   | `death === 'self'` |
| `demolition`   | Demolition Crew  | destroy 15 rocks (any way)             | run   | `rocks`            |
| `kaboom`       | KA-BOOM          | clear 8 rocks with one super bomb      | run   | `superBest`        |
| `close_call`   | Close Call       | a shield saves you                     | run   | `saves`            |
| `fortress`     | Fortress         | hold 3 shields at once                 | run   | `maxShields`       |
| `unstoppable`  | Unstoppable      | smash 5 rocks in one God Mode          | run   | `godBest`          |
| `yeet`         | YEET!            | monkey paws fling 5 rocks              | run   | `flung`            |
| `sweet_dreams` | Sweet Dreams     | eat a moon                             | run   | `moons`            |
| `speed_demon`  | Speed Demon      | speed level 38 (meter full)            | run   | `maxSpeed`         |
| `triple`       | Triple Threat    | 3 effects active at once               | run   | `maxActive`        |
| `marathon`     | Marathon Noodle  | survive 3:00 (paused time excluded)    | run   | `time`             |
| `taste_tester` | Taste Tester     | try all 6 power-up effects             | life  | `lifeTried`        |
| `regular`      | Regular Customer | finish 10 games                        | life  | `lifeGames`        |
| `glutton`      | Glutton          | eat 1,000 snacks                       | life  | `lifeSnacks`       |

"Rocks destroyed" counts every way a rock goes away: God Mode crunch, shield break, bomb, super bomb, monkey fling.

### When they unlock

`checkAchievements()` runs after every step. A new unlock during play shows a toast (one at a time, 2.8s
each) with a chime. Unlocks on the final step (e.g. Rock Bottom) are listed in the game over dialog
instead, and any toasts still queued at death are dropped, because the dialog lists everything from the run.

### Adding one

1. Add `{ id, icon, name, desc, goal, m: r => ... }` to `ACHIEVEMENTS` (`life: true` for lifetime totals).
   `icon` must be one of the PNGs in `assets/`.
2. If it needs a new stat, add it to `newRun()` and bump it where it happens in `src/game.js`
   (or mirror it from game state at the top of `checkAchievements()`).
3. Add a row to the table above.

## Ranking

- The top **10** runs (`RANK_SIZE`), sorted by score; ties keep the older run ahead.
- A run is recorded when it ends with a score above 0: score, snacks, max length, time, date.
- The game over dialog shows the top 3 as a podium (the new run glows and says YOU!), plus a ribbon:
  new high score, `#2/#3 on the podium`, `Rank #N in your top 10`, or how many points short of the board.
- The **Records** modal (`T`, or the trophy button in the HUD) shows all 10 plus lifetime totals.
  "Reset records" (click twice) wipes the ranking, achievements, lifetime totals and the best score.

## Save format

One localStorage key, `sirNoodleSave`. Loading validates every field and falls back to an empty save, so a
corrupt or blocked storage never breaks the game.

```js
{
  v: 1,
  ranking:  [{ score, snacks, length, time /* ms */, date /* epoch ms */ }, ...],   // best first, max 10
  unlocked: { first_bite: 1729850000000, ... },     // id -> unlock time
  progress: { snack_attack: 23, ... },               // best value seen for run-scope achievements
  life:     { games, snacks, tried: ['spicy', ...] }  // lifetime totals
}
```

Older keys still used: `sirNoodleBest` (best score, kept from before the ranking existed) and
`sirNoodleLowFx`. The HUD's Best is the higher of `sirNoodleBest` and the top ranking entry.
