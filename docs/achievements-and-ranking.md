# Achievements and ranking

Code: `src/achievements.js` (definitions, run stats, unlocking), `src/storage.js` (save file, ranking),
`src/ui.js` (toasts, game over dialog, records modal). If you change a goal in code, update this table.

## Achievements (34, in 4 rarity tiers)

"Run" ones must be reached inside a single game; their progress bar shows your best run.
"Life" ones add up over every game. Tier looks (medallion, tile, toast, sound) are in [ui.md](ui.md#rarity-looks).

| Tier      | Id               | Name               | Goal                                   | Scope | Stat (`run.*`)     |
|-----------|------------------|--------------------|----------------------------------------|-------|--------------------|
| Common    | `first_bite`     | First Bite         | eat 1 snack                            | run   | `snacks`           |
| Common    | `triple_digit`   | Triple Digits      | score 100                              | run   | `score`            |
| Common    | `bonk`           | Rock Bottom        | die to a rock                          | run   | `death === 'rock'` |
| Common    | `ouroboros`      | Ouroboros          | bite your own tail                     | run   | `death === 'self'` |
| Common    | `sweet_dreams`   | Sweet Dreams       | eat a moon                             | run   | `moons`            |
| Common    | `close_call`     | Close Call         | a shield saves you                     | run   | `saves`            |
| Common    | `regular`        | Regular Customer   | finish 10 games                        | life  | `lifeGames`        |
| Rare      | `snack_attack`   | Snack Attack       | eat 50 snacks                          | run   | `snacks`           |
| Rare      | `tycoon`         | Snack Tycoon       | score 1,000                            | run   | `score`            |
| Rare      | `royal`          | Royal Noodle       | reach the crown (5th hat, 25 snacks)   | run   | `hat`              |
| Rare      | `speed_demon`    | Speed Demon        | speed level 38 (meter full)            | run   | `maxSpeed`         |
| Rare      | `demolition`     | Demolition Crew    | destroy 15 rocks (any way)             | run   | `rocks`            |
| Rare      | `fortress`       | Fortress           | hold 3 shields at once                 | run   | `maxShields`       |
| Rare      | `yeet`           | YEET!              | monkey paws fling 5 rocks              | run   | `flung`            |
| Rare      | `triple`         | Triple Threat      | 3 effects active at once               | run   | `maxActive`        |
| Rare      | `night_owl`      | Night Owl          | 3 moons in one run                     | run   | `moons`            |
| Rare      | `taste_tester`   | Taste Tester       | try all 6 power-up effects             | life  | `lifeTried`        |
| Epic      | `bottomless`     | Bottomless Belly   | eat 100 snacks                         | run   | `snacks`           |
| Epic      | `legend`         | Noodle Legend      | score 3,000                            | run   | `score`            |
| Epic      | `longcat`        | Loooong Noodle     | grow to 100 segments                   | run   | `length`           |
| Epic      | `marathon`       | Marathon Noodle    | survive 3:00 (paused time excluded)    | run   | `time`             |
| Epic      | `iron_stomach`   | Iron Stomach       | survive 10:00                          | run   | `time`             |
| Epic      | `kaboom`         | KA-BOOM            | clear 8 rocks with one super bomb      | run   | `superBest`        |
| Epic      | `unstoppable`    | Unstoppable        | smash 5 rocks in one God Mode          | run   | `godBest`          |
| Epic      | `quarry_boss`    | Quarry Boss        | destroy 50 rocks                       | run   | `rocks`            |
| Epic      | `glutton`        | Glutton            | eat 1,000 snacks                       | life  | `lifeSnacks`       |
| Epic      | `devotee`        | Noodle Devotee     | finish 100 games                       | life  | `lifeGames`        |
| Legendary | `gourmet`        | Five-Star Gourmet  | eat 200 snacks                         | run   | `snacks`           |
| Legendary | `grandmaster`    | Grandmaster Noodle | score 10,000                           | run   | `score`            |
| Legendary | `armageddon`     | Armageddon         | clear 12 rocks with one super bomb (rock cap is 16, needs score ≥ 960; at 12+ rocks every bomb is a super bomb) | run | `superBest` |
| Legendary | `rampage`        | Divine Rampage     | smash 10 rocks in one 7s God Mode      | run   | `godBest`          |
| Legendary | `cocktail`       | Effect Cocktail    | 4 effects active at once (spicy and chill cancel each other) | run | `maxActive` |
| Legendary | `bottomless_pit` | Bottomless Pit     | eat 10,000 snacks                      | life  | `lifeSnacks`       |
| Legendary | `hall_of_fame`   | Hall of Fame       | unlock all 33 others                   | life  | count of unlocked  |

"Rocks destroyed" counts every way a rock goes away: God Mode crunch, shield break, bomb, super bomb, monkey fling.

### When they unlock

`checkAchievements()` runs after every step. A new unlock during play shows a toast in its tier's look (one at a time, 2.8s each, legendary 3.6s); its sound
plays when the toast shows (chime, fanfare for legendary), and epic / legendary also burst confetti around Sir Noodle. Unlocks on the final step (e.g. Rock Bottom) are listed in the game over dialog
instead, and any toasts still queued at death are dropped, because the dialog lists everything from the run.

### Adding one

1. Add `{ id, tier, icon, name, desc, goal, m: r => ... }` to `ACHIEVEMENTS` in its tier's group (`life: true` for
   lifetime totals). Pick the tier by how hard it is: common = happens by playing, rare = a good run,
   epic = a great run or real dedication, legendary = brag-worthy. Keep Hall of Fame last.
   `icon` must be one of the PNGs in `assets/`.
2. If it needs a new stat, add it to `newRun()` and bump it where it happens in `src/game.js`
   (or mirror it from game state at the top of `checkAchievements()`).
3. Add a row to the table above.

## Ranking

- The top **10** runs (`RANK_SIZE`), sorted by score; ties keep the older run ahead.
- A run is recorded when it ends with a score above 0: score, snacks, max length, time, date, and the
  player's name and avatar at that moment.
- The game over dialog shows the top 3 as a podium (the new run glows and says YOU!), plus a ribbon:
  new high score, `#2/#3 on the podium`, `Rank #N in your top 10`, or how many points short of the board.
- The **Records** modal (`T`, or the trophy button in the HUD) shows all 10 plus lifetime totals.
  "Reset records" (click twice) wipes the ranking, achievements, lifetime totals and the best score
  (not the profile).

## Save format

One localStorage key, `sirNoodleSave`. Loading validates every field and falls back to an empty save, so a
corrupt or blocked storage never breaks the game.

```js
{
  v: 1,
  profile:  { name: 'Anonymous', avatar: 'av_anon' },          // see docs/ui.md#profile
  ranking:  [{ score, snacks, length, time /* ms */, date /* epoch ms */, name, avatar }, ...],   // best first, max 10
  unlocked: { first_bite: 1729850000000, ... },     // id -> unlock time
  progress: { snack_attack: 23, ... },               // best value seen for run-scope achievements
  life:     { games, snacks, tried: ['spicy', ...] }  // lifetime totals
}
```

Older keys still used: `sirNoodleBest` (best score, kept from before the ranking existed) and
`sirNoodleLowFx`. The HUD's Best is the higher of `sirNoodleBest` and the top ranking entry.
