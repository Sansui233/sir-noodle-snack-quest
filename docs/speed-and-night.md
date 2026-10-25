# Speed and the Night (moon) mechanic

How fast Sir Noodle moves, why it keeps getting faster, and how the moon pickup brings it back down.
All numbers come from `src/game.js` and `src/config.js`. If you change the code, update the tables here too.

## The problem it solves

Every snack makes the snake faster, and before the moon pickup nothing could undo that. Within about 40 snacks
the game ran at double speed for good, and with a chili on top it got unplayable. The only slowdown was the
ice cube (chill), which is random and lasts just 6 seconds.

The night mechanic gives the player a **reliable, obvious way to reset the speed**. It's a whole-board event
you can't miss, not a quiet number change.

## Speed level

- `speedLvl` starts at 0 and goes up by **1 for everything you eat**: snacks, bombs, shields and power-ups
  (`snack()` in `src/game.js`). So early on it's basically your snack count.
- It's capped at `MAX_LVL = 38`.
- Eating does **not** raise it while the night is active (sleeping noodles don't speed up).
- `eaten` (the Snacks counter in the HUD) is just a stat now and doesn't affect speed.

Time per step: `interval() = max(75, 150 - 2 × speedLvl)` milliseconds, then effect multipliers are applied.

### Speed stage table

| Speed level (≈ snacks) | Time per step | Cells / sec | Meter number | Meter bar | Crossing the 20-cell board | Moon chance |
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
| **38 (max)** | 75 ms | 13.3 | **2.0×** | 100% | 1.5 s | |

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

## The moon / night effect

**Pickup:** the moon (`PICKUPS.moon`, effect `night`). Like other power-ups it gives 30 points × multiplier and
grows the snake by 2.

**When it spawns:** it's added to the special-item pool in `pickSpecialKind()` only when it's useful, and gets more
likely as the game speeds up. It never spawns while a night is already active.

| Speed level | Moon entries in the pool | Rough chance a special item is a moon |
|---|---|---|
| below 15 | 0 | 0% |
| 15–24 | 1 | ~10–15% |
| 25–32 | 2 | ~25% |
| 33+ | 4 | ~30–50% |

(The pool also holds 4–9 other items depending on score, rocks and shields, so these chances are approximate.)

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

## Design notes

- **Why a night and not tea:** a lasting slowdown from a drink would be a silent number change that's easy to miss.
  A night (dark board, sleeping face, draining meter, morning banner) explains itself without any text.
- **Why drain instead of an instant reset:** the meter sliding to zero over 7 s shows the player what the moon does.
- **Why slower than the starting speed while asleep:** the night is also a breather. You get a few relaxed seconds
  before play picks up again from 1.0×.
- **Why it's gated by speed level:** a moon at level 3 would be a wasted pickup. Tying its weight to speed means
  help shows up when it's needed.

## Tuning knobs

| What | Where | Current value |
|---|---|---|
| Starting step time, ms per level, floor | `interval()` | 150 ms, −2 ms, 75 ms |
| Level cap | `MAX_LVL` | 38 |
| Night length | `EFFECTS.night.ms` | 7000 ms |
| Night slowdown | `interval()`, `iv *= 1.8` | ×1.8 |
| Moon spawn thresholds | `pickSpecialKind()` | 15 / 25 / 33 |
| Spicy / chill multipliers | `interval()` | ×0.6 / ×1.7 |
