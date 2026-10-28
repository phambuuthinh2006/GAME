# Hex Zoo — implementation design

## Product and renderer

Plain TypeScript **DOM + CSS**, built with Vite. The focal scene is a 19-cell axial hexagon board (radius 2), with a hand of five animals. DOM was chosen over Phaser because real buttons, text layout, scrolling dialogs and pointer events make the narrow CrazyGames iframe easier to verify at 311×530. Hexagons use CSS clip paths; there is no game physics or canvas renderer to maintain. The desktop puts the hand beside the board; portrait puts it below. Layout uses the available width without a height rule forcing a larger width.

Family-colour shapes, animal names and numbers are clean placeholders explicitly requested for this slice. They are not final art or evidence of submission quality. Every portrait/backdrop/character/logo lookup resolves through the art manifest. Nothing is deployed or submitted.

## Rules and content

All board, deck, hand, scoring, seeded RNG and phase transitions live in pure TypeScript under `src/core/`; the browser UI calls that engine. Content comprises 40 animals in four families and three rarities, 12 snacks, 20 charms, three keepers and six event modifiers. Families have a colour, name and distinct UI symbol.

A run has 12 days. Each day starts with a fresh board, shuffled deck and five-card hand. Days 1–7 allow eight placements; days 8–12 allow seven. Quiet Hours removes one place, keeping the design within the requested 5–8 range. Meeting the goal ends the day immediately, even with places remaining. After a won day the player chooses one of three offers and can release one animal while retaining at least five. Gift shops follow days 3, 6 and 9. They sell snacks and passive charms, allow paid restocking and retain one locked offer for the next shop. Five charm slots are available. Day 12 offers a run victory; Endless continues through the same reward flow into day 13 and beyond.

Keeper starts are deliberately **seeded rosters**, rather than a fixed list of compulsory species. Mira gets three Grove animals and seven from the wider pool; Oren gets six edge/corner specialists and four others; Niko gets two of every family plus two others. Their passives differ. Oren unlocks after one win and Niko after three. Seeded variety preserves the different keeper identities without making a mandatory starter animal appear in every winning deck.

## Deterministic scoring

The authoritative order in `src/core/score.ts` is:

1. Animal base plus its temporary snack points.
2. Cell's additive points.
3. Neighbour, position or deck-size ability points.
4. Keeper and additive charm effects.
5. Cell/snack multipliers, family links, repeat/positional abilities, multiplier charms, event rules and zoo reputation.

A matching neighbour intrinsically contributes to **×(1 + 0.5 × matching neighbours)**, in addition to the printed animal ability. Counting and echo abilities repeat the complete subtotal without recursively triggering themselves. Garden and leaving-with-a-gift effects resolve after scoring, so they cannot change the score being calculated. Snack hand buffs reset on the next day. Each result includes an ordered log with an amount and subtotal for every stage.

The UI advances the score counter through those subtotals at 130 ms per stage, emits one readable floating label at a time and shakes the board on multipliers. A newer placement cancels the previous floating sequence. When a placement ends a day, the board remains visible for its score sequence and a goal burst before the reward/end dialog appears. Gameplay reporting stops during that settlement. Presentation updates use a fixed 60 Hz accumulator, independent of display refresh rate.

## Goal curve and balance

The unscaled daily challenge units are `[36, 160, 220, 300, 350, 410, 550, 670, 760, 950, 1000, 1150]`. Zoo reputation **×1.65^(day−1)** multiplies both goals and scores, so visible numbers grow while the increasing unscaled units require better combos. Reputation does not improve relative scoring odds. After day 12, challenge units also grow by ×1.32 per additional day.

These values were evaluated from `goalForDay()` in the code:

| Day | Goal | Normal places |
|---:|---:|---:|
| 1 | 36 | 8 |
| 2 | 264 | 8 |
| 3 | 599 | 8 |
| 4 | 1,348 | 8 |
| 5 | 2,594 | 8 |
| 6 | 5,014 | 8 |
| 7 | 11,099 | 8 |
| 8 | 22,308 | 7 |
| 9 | 41,753 | 7 |
| 10 | 86,115 | 7 |
| 11 | 149,568 | 7 |
| 12 | 283,806 | 7 |

Days 4, 8 and 12 select from six event rules: frozen outside cells, double Sun scoring, fewer places with boosted bonus cells, a centre pond with edge scoring, widespread flower bonuses, and a family-diversity multiplier. The event is seeded; Daily Zoo schedules its first event from the UTC date.

### Duration requirement remains unmet

The brief's **10–15 minute average at four seconds per placement** cannot coexist with 12 days of at most eight placements: even the loose ceiling is 96 × 4 = 384 seconds, or 6.4 minutes. Early goal clears and losses reduce the actual mean further. This implementation preserves the explicit 12-day/5–8-place structure. The greedy simulation currently averages about 2.67 placement-only minutes and about 7.87 minutes in its separately labelled select/place/choice model. Neither is measured human playtime. No forced waits were added to inflate duration. Reaching 10–15 minutes requires a product decision about run structure or a different, explicitly accepted pacing definition, followed by real playtesting.

## First minute, controls and return

One Play click opens the active board, with no first-visit popup. Day 1 highlights three suggested cells and adds generous bonuses there. The selected animal and a persistent short rule line explain the next action. Mouse and touch support select-then-place and pointer drag. Invalid placements show a short explanation. Desktop pointer preview gives the immediate score for a cell; touch players retain the selected animal's visible rule. The deck and snack basket are available without leaving the board scene.

Daily Zoo uses `daily-YYYY-MM-DD` with UTC dates and Mira for every player. The Daily button resumes only an unfinished run for today's seed; a completed or abandoned attempt cannot start again that day. A persistent result-seed ledger counts a run's result once across reloads and resume routes, including the transition to Endless. The end screen names tomorrow's first event and its 00:00 UTC reset. The collection tracks seen animals; wins, keeper unlocks, best score, settings and the current run persist. There is one current-run save slot; starting another run replaces it.

## Platform, audio and assets

`src/platform/` exposes one interface. The CrazyGames build loads only the SDK v3 script; development uses the local mock. Boot awaits SDK initialization without an early timeout, then reads SDK Data. An existing Data save wins over local data; legacy localStorage is migrated once. Subsequent production saves use Data. Snapshot writes are queued in order. Gameplay starts only for an active visible board and stops for menus, overlays, settlement, hidden tabs and ads. Rewards require `adFinished`; the first refusal disables further ad requests for that page session.

WebAudio in `src/main.ts` supplies the original simple synthesized music and short effects. Every pointerdown calls `AudioContext.resume()`. Master, music and sound gain buses enforce SDK/visibility mute and the player's independent toggles even when a context is resumed by input. SDK locale is exposed; this slice's text is English.

Nunito fonts are bundled with `@fontsource`; there are no runtime font/CDN dependencies. Development continues offline after its code and fonts load. The manifest's optional final images resolve through absolute `new URL(path, document.baseURI).href` URLs. Missing images retain placeholders without a failing request. The import tool soft-keys green cutouts and generates palette PNGs; marketing-only cover assets are removed from the runtime build.

## Verification and delivery limits

See `docs/balance.md` and `docs/balance-results.json` for reproducible bot evidence, `docs/verification.md` for the requirement matrix and artifact paths, and `docs/progress.md` for milestone history. Local browser QA includes all requested viewport sizes, first play, full UI runs, Daily result accounting and a built sub-path check. The production check substitutes an SDK test double; live CrazyGames cloud storage, ads and host behavior remain unvalidated. Screenshots document placeholders, not final store art. This build must not be submitted until final art and owner QA are complete.
