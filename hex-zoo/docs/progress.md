# Hex Zoo progress

All work stays inside hex-zoo. The shared Obsidian board was read; it has no Hex Zoo task. It was not edited because this task explicitly forbids changes outside hex-zoo.

- 2026-10-28 — IN_PROGRESS: Core rules, content/simulation, UI, platform integration and verification.

## Milestone 1 — Core rules
- Seeded immutable rules, 19 axial cells, draw/hand/deck, log scoring and day/reward/shop/endless transitions implemented.
- 21 core tests pass, including order, every animal ability, tutorial seeds and state flows. Content data included here because the engine and fixtures import it; balancing/content verification remains milestone 2.

## Milestone 2 — Content and simulation
- 40 animals, 12 snacks, 20 charms, 3 keepers, 6 event rules. Keeper rosters are distinct and seeded.
- 1,000 runs/bot: random 0.1% wins and 100% day-1 clears; greedy 31.1% wins. Maximum winning-deck animal prevalence 54.34%; charm 51.45%. No stalled ticks/seconds.
- Placement-only mean is 2.67 minutes at 4 seconds/placement; this fails the requested 10–15 minute target, which cannot coexist with the explicit day/place ceiling. No artificial waits or inflated result are used.
- 28 core tests cover trigger order, abilities, snacks, charms, event types, rosters and state transitions. Machine-readable results: docs/balance-results.json.
