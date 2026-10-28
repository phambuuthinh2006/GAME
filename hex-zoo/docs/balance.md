# Balance evidence

Seed set: `balance-v1-0` through `balance-v1-999`. 1,000 complete runs per bot. Run with `npm run sim`. No wall-clock randomness is used.

| Metric | Random | Greedy immediate score |
|---|---:|---:|
| Full 12-day wins | 1/1000 (0.1%) | 311/1000 (31.1%) |
| Day 1 cleared | 100.0% | 100.0% |
| Mean day reached | 3.23 | 9.49 |
| Mean placements | 18.96 | 40.07 |
| Placement-only minutes at 4s each | 1.26 | 2.67 |
| Select+place+other decisions at 4s each | 3.03 | 7.87 |
| Invalid/stalled gameplay states | 0 | 0 |
| Stalled seconds (4s decision ticks) | 0 | 0 |

## Duration constraint

The requested placement-only 10–15 minute average is mathematically incompatible with 12 days and at most 8 placements per day: even a winning run using every place has a96 × 4s = 384s (6.4min) ceiling. Failures and early day clears make the mean shorter. We retain the explicit 12-day / 5–8 place rules. The additional select/place/choice estimate above is labelled separately and is not a human playtime claim. Human decision time, learning and score animation may extend sessions; only real player telemetry can establish 10–15 minutes. No forced waits were added to manufacture duration. This done criterion is unmet.

## Bot policy

Random picks a uniformly random legal animal/space pair and offer, sometimes removes a random deck animal, buys affordable shop stock and uses held snacks. Greedy evaluates every legal pair with the same deterministic UI scoring engine, picks the highest immediate score, ranks draft animals by short expected ability value and snacks by their temporary point/multiplier gain, thins the weakest animal above 7 deck size, buys higher-scoring charms first and uses snacks. A bot step must either place an animal or complete a phase transition. The simulator throws if a playing state has no legal actions or a run exceeds its guard; stalled seconds count failed 4-second decision ticks (zero observed), not browser reaction time. Neither bot knows future draws or future event selection. Charm slots are capped at 5. Mira's starter roster is drawn reproducibly from the full 40-animal set, with 3 Grove animals. Oren starts with 6 edge/corner specialists; Niko starts with at least 2 animals from each family; no compulsory species. Prevalence counts unique species in the final winning deck, not copies or placements.

## Greedy winning-deck prevalence

| Animal | Share of wins |
|---|---:|
| Rill Platypus | 54.3% |
| Starlit Potoo | 53.1% |
| Clover Hare | 52.1% |
| Ripple Puffin | 49.8% |
| Orchard Lemur | 49.8% |
| Spray Pelican | 47.9% |
| Amber Meerkat | 47.3% |
| Apricot Quokka | 46.6% |
| Twilight Kakapo | 44.4% |
| Pebble Armadillo | 39.9% |
| Moonlit Fossa | 38.3% |
| Fern Finch | 19.0% |
| Drift Capuchin | 4.8% |
| Canopy Tapir | 4.5% |
| Sunbeam Wombat | 3.9% |
| Cloud Civet | 2.9% |
| Thistle Pangolin | 2.3% |
| Seafoam Seal | 2.3% |
| Mist Kingfisher | 1.9% |
| Citrine Serval | 1.9% |
| Aurora Colugo | 1.9% |
| Bramble Badger | 1.3% |
| Ink Sengi | 1.0% |
| Glow Aardvark | 0.6% |
| Cinder Porcupine | 0.6% |
| Bloom Binturong | 0.6% |
| Saffron Oryx | 0.6% |
| Kelp Dugong | 0.3% |
| Coral Axolotl | 0.3% |
| Plum Tarsier | 0.3% |
| Acorn Dormouse | 0.3% |

| Charm | Share of wins |
|---|---:|
| Glass Acorn | 51.4% |
| Keeper Notebook | 38.9% |
| Trail Marker | 35.0% |
| Field Journal | 35.0% |
| Soft Blanket | 34.4% |
| Friendship Knot | 33.8% |
| Wind Mobile | 29.9% |
| Picnic Cloth | 27.0% |
| Painted Fence | 27.0% |
| Copper Spade | 22.5% |
| Echo Chime | 20.3% |
| Braided Vine | 19.0% |
| Violet Ribbon | 17.4% |
| Rain Bucket | 17.4% |
| Sun Pendant | 16.7% |
| Rainbow Bell | 16.7% |
| Shell Pin | 16.4% |
| Prism Feather | 14.5% |
| Ticket Stamp | 13.8% |
| Leaf Brooch | 12.9% |

Highest animal prevalence: Rill Platypus (54.3%). Highest charm prevalence: Glass Acorn (51.4%).

## Goal curve and pacing

Base daily challenge units are multiplied by zoo reputation 1.65^(day − 1) in both the goal and score log. This lets the UI grow from tens to six figures while keeping the source of each multiplier visible. Reputation itself does not improve the relative odds; adjacency, repeats, snacks and charms must meet increasing unscaled challenges. Day 1 has 8 places and three +8 tutorial spaces. Days 4, 8, 12 apply one of 6 seeded event rules; Quiet Hours has one fewer place. Later days have 7 places. Endless goals continue to scale after the day 12 win.

Termination distribution (day 1–12; day 12 includes wins): random 0, 468, 311, 28, 82, 44, 9, 32, 17, 1, 6, 2; greedy 0, 0, 19, 5, 85, 115, 20, 65, 129, 64, 134, 364.
