# Speed, power-up spawns and the Night (moon)

How fast Sir Noodle moves, why it keeps getting faster, which items show up when, and how the moon brings
the speed back down. All numbers come from `src/game.js` and `src/config.js`. If you change the code, update
the tables here too.

## The problem it solves

Every snack makes the snake faster, and before the moon pickup nothing could undo that. Within about 40 snacks
the game ran at double speed for good, and with a chili on top it got unplayable. The only slowdown was the
ice cube (chill), which is random and lasts just 6 seconds.

The night mechanic gives the player a **reliable, obvious way to reset the speed**. It's a whole-board event
you can't miss, not a quiet number change. Around it, the item spawns lean toward help (shields, stars, ice,
moons, a choice of items) the harder the board gets.

## Speed level

- `speedLvl` starts at 0 and goes up by **1 for everything you eat**: snacks, bombs, shields and power-ups
  (`snack()` in `src/game.js`). So early on it's basically your snack count.
- It's capped at `MAX_LVL = 38`.
- Eating does **not** raise it while the night is active (sleeping noodles don't speed up).
- `eaten` (the Snacks counter in the HUD) is just a stat now and doesn't affect speed.

Time per step: `interval() = max(75, 150 - 2 × speedLvl)` milliseconds, then effect multipliers are applied.

### Speed stage table

| Speed level (≈ snacks) | Time per step | Cells / sec | Meter number | Meter bar | Crossing the 20-cell board | Moon |
|---|---|---|---|---|---|---|
| 0 (start) | 150 ms | 6.7 | 1.0× | 0% | 3.0 s | none |
| 5 | 140 ms | 7.1 | 1.1× | 13% | 2.8 s | none |
| 10 | 130 ms | 7.7 | 1.2× | 26% | 2.6 s | none |
| **15** | 120 ms | 8.3 | **1.3×** | 39% | 2.4 s | starts appearing |
| 20 | 110 ms | 9.1 | 1.4× | 53% | 2.2 s | low |
| **25** | 100 ms | 10.0 | **1.5×** | 66% | 2.0 s | more likely |
| 30 | 90 ms | 11.1 | 1.7× | 79% | 1.8 s | |
| **33** | 84 ms | 11.9 | **1.8×** | 87% | 1.7 s | very likely |
| 35 | 80 ms | 12.5 | 1.9× | 92% | 1.6 s | |
| **38 (max)** | 75 ms | 13.3 | **2.0×** | 100% | 1.5 s | guaranteed within 7 snacks |

How it feels: up to about 15 is comfortable, 25–30 feels fast, and 33+ is where most players struggle.

### Effects that change speed

Effect multipliers apply to the time per step, so they stack on top of the speed level.

| Effect | Pickup | Step-time multiplier | At max level (75 ms) | Meter number |
|---|---|---|---|---|
| Spicy | chili | ×0.6 (faster) | 45 ms | **3.3×** (the "insane" case) |
| Chill | ice cube | ×1.7 (slower) | 128 ms | 1.2× |
| Night | moon | ×1.8 (slower) | 135 ms, then slower as the level drains | 1.1× → 0.6× |

Spicy and chill cancel each other. Night stacks with both.

## The speed meter (HUD)

The pill between **Snacks** and the effect status:

- **Bar**: the base speed (`speedLvl / MAX_LVL`). It fills green → yellow → red as you eat. This is the part
  the moon resets. While asleep it turns blue and shows a Zzz.
- **Number**: the speed you're moving at right now, including effects (`150 / interval()`). 1.0× is the
  starting speed.

## Power-up spawns

Each normal snack rolls, in order: a rock (`maybeSpawnStone()`), a bomb (`maybeSpawnBomb()`), then a power-up.
The power-up roll only happens while no power-up is on the board, and succeeds with **25%** (score < 50) or
**40%** (score ≥ 50). Then `spawnSpecials()` decides how many items to offer and `pickSpecialKind()` picks each one.

### The weighted pool (`pickSpecialKind()`)

| Item | Weight | When |
|---|---|---|
| Chili (spicy), mushroom (dizzy), banana (monkey) | 1 each | always |
| Ice (chill) | `0.3 + 1.2 × speedLvl / 38` | always: 0.3 at the start, ~0.77 at 15, 1.5 at max |
| Star (god mode) | +1 | score ≥ 50 |
| Banana | +1 | 3+ rocks (paws help clear a crowded board) |
| Shield | +1 | score ≥ 50 |
| Star, shield | +1 each | 5+ rocks |
| Shield | +1 | speed 15+ |
| Star, shield | +1 each | speed 25+ |
| Star | +2 | speed 33+ |
| Moon | +1 / +1 / +2 | speed 15+ / 25+ / 33+, never during a night |

- Shield weight only counts while you have fewer than 3 shields, and is **×0.4 with 2 shields** (one short of
  full, so they don't crowd out everything else).
- So speed brings help in two steps: shields first (15+), then stars (25+, more at 33+).

Rough share of the moon among power-ups, with 4–9 other entries depending on score, rocks and shields:

| Speed level | Moon weight | Rough chance a power-up is a moon |
|---|---|---|
| below 15 | 0 | 0% |
| 15–24 | 1 | ~9–17% |
| 25–32 | 2 | ~14–22% |
| 33+ | 4 | ~22–31% |

### Choices: 2 or 3 items at once (`spawnSpecials()`)

The bigger the pool gets, the less likely any one item is, so the item you need gets harder to find. To make up
for that, a hard board can **offer a choice**: 2 or 3 different items appear at once, sharing one 9 s timer.
Eating one makes the others vanish (a pick, not a pile of effects). A "Pick one" bubble shows when it happens.

`difficulty()` goes from 0 to 1, each part capped at 1:

```
difficulty = 0.45 × speedLvl / 38  +  0.35 × (length − 3) / 147  +  0.20 × rocks / 12
```

Length counts up to 150, about where a normal player's run ends.

| Offer | Chance per power-up roll | At difficulty 0 | At difficulty 1 |
|---|---|---|---|
| 3 items | `CHOICE3_MAX` × difficulty | 0% | 5% |
| 2 items | (1 − that) × `CHOICE2_MAX` × difficulty | 0% | ~47% |
| 1 item | the rest | 100% | ~48% |

Three items stay rare on purpose: 5% is the most it ever gets.

## Bombs and super bombs (`maybeSpawnBomb()`)

Rocks start falling at score 50; the rock cap is `min(16, 4 + score / 120)`.

- **Bomb roll:** only with at least 1 rock and no bomb on the board. Chance `min(50%, 10% + 4% × rocks)`.
- **Super share** of those bombs: 0 below 6 rocks, otherwise
  `min(60%, 4% × (rocks − 5) + 0.3% × (length − 30) + 0.3% × snacks since the last super)`.
  The length part adds +36% by length 150.
- **12+ rocks** (`SUPER_SURE`): no roll. The next snack always spawns a super bomb, so the Armageddon
  achievement (12 rocks in one super bomb) comes from playing well, not from luck.

## The moon / night effect

**Pickup:** the moon (`PICKUPS.moon`, effect `night`). Like other power-ups it gives 30 points × multiplier and
grows the snake by 2.

**When it spawns:** see the pool above. It's only in the pool when it's useful (speed 15+), gets heavier as the
game speeds up, and never spawns while a night is already active.

**Moon guarantee at max speed** (`moonPity()`): at speed level 38, with no night and no moon on the board,
every snack counts up `maxRun`. On the 7th one (`MOON_PITY`) a moon spawns for sure, replacing whatever
power-ups are out. If the player lets it expire, the count starts again. So full speed lasts at most about
7 snacks per moon, unless the player keeps passing moons by.

**What happens, step by step:**

1. **Fall asleep.** You get a "GOOD NIGHT" banner and a lullaby. The current level is saved as `nightFrom`.
2. **Night lasts 7 s** (`EFFECTS.night.ms`):
   - The snake moves at ×1.8 step time.
   - `speedLvl` drains in a straight line from `nightFrom` to 0, so the meter bar visibly empties.
   - Snacks still score but don't add speed.
3. **Wake up** (`wakeUp()`): you get a "GOOD MORNING" banner with suns, a warm burst and a morning chirp, and
   `speedLvl = 0`. You're back at 1.0×.

Eating another moon during the night restarts the 7 s timer and drains from the current (already lower) level.

**How it looks:** the grass turns dark blue with a pool of moonlight around the head, stars twinkle, a moon sits in
the top-right corner, the board gets a navy vignette and the page background turns night-sky blue. Sir Noodle turns
lavender, gets droopy eyelids and puffs out Zzz's. Stars, the moon and the Zzz's still show in low-FX mode,
because they're how you tell it's night. The vignette and frost-style overlays don't.

## Score multipliers

Hard modes pay more. Every point earned while an effect is active is multiplied (`multiplier()`):
spicy ×2, dizzy ×3, god mode ×2, and they stack (spicy + dizzy = ×6). A snack is 10 × that. The effect banner
says "double points" / "triple points", and the HUD effect strip shows the total, e.g. "(×2)".

## Design notes

- **Why a night and not tea:** a lasting slowdown from a drink would be a silent number change that's easy to miss.
  A night (dark board, sleeping face, draining meter, morning banner) explains itself without any text.
- **Why drain instead of an instant reset:** the meter sliding to zero over 7 s shows the player what the moon does.
- **Why slower than the starting speed while asleep:** the night is also a breather. You get a few relaxed seconds
  before play picks up again from 1.0×.
- **Why it's gated by speed level:** a moon at level 3 would be a wasted pickup. Tying its weight to speed means
  help shows up when it's needed. The same goes for ice (a slow-down is wasted at the start) and for the extra
  shields and stars.
- **Why the guarantee is 7 snacks, not 3:** at 3 the game barely stayed at full speed and felt too relaxed.
  7 lets max speed bite for a while, but never for the rest of the run.
- **Why choices instead of more weight:** adding help to the pool dilutes every other item. Offering 2 or 3
  items lets the player pick the one they need, and eating one clears the rest so it stays a choice, not a bonus.

## Tuning knobs

| What | Where | Current value |
|---|---|---|
| Starting step time, ms per level, floor | `interval()` | 150 ms, −2 ms, 75 ms |
| Level cap | `MAX_LVL` | 38 |
| Night length | `EFFECTS.night.ms` | 7000 ms |
| Night slowdown | `interval()`, `iv *= 1.8` | ×1.8 |
| Spicy / chill step-time multipliers | `interval()` | ×0.6 / ×1.7 |
| Power-up roll | `consume()` | 25% / 40% (score < / ≥ 50) |
| Moon / shield / star speed thresholds | `pickSpecialKind()` | 15 / 25 / 33 |
| Ice weight | `pickSpecialKind()` | 0.3 → 1.5 with speed |
| Shield weight at 2 shields | `pickSpecialKind()` | ×0.4 |
| Choice of 2 / 3 at difficulty 1 | `CHOICE2_MAX` / `CHOICE3_MAX` | 50% / 5% |
| Difficulty mix | `difficulty()` | speed 0.45, length 0.35 (to 150), rocks 0.20 (to 12) |
| Moon guarantee at max speed | `MOON_PITY` | 7 snacks |
| Bomb chance | `maybeSpawnBomb()` | min(50%, 10% + 4% × rocks) |
| Super share | `maybeSpawnBomb()` | 4%/rock over 5, 0.3%/cell over 30, 0.3%/snack since last; cap 60% |
| Rocks for a sure super bomb | `SUPER_SURE` | 12 |
