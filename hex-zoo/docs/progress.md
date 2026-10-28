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

## Milestone 3 — Playable UI
- Menu, nineteen-cell board, touch/mouse select/place and drag, arrows, rewards/removal, four-offer shop/lock/restock, deck/snacks, pause/settings, collection, keepers, end and Endless connected to the rules.
- DOM/CSS keeps one focal board. Board uses the actual remaining portrait height; dialogs scroll and keep decision buttons visible. Bundled local Nunito, no CDN fonts.
- Daily continuation checks today's seed and active phase; a persisted result ledger prevents repeat wins on reload. Regression tests included.
- The platform boundary/adapters and art lookup are included with UI boot because the playable entry imports them. SDK behavior is verified separately in milestone 4.

## Milestone 4 — CrazyGames platform
- SDK v3 production adapter, local dev mock and awaited Data migration verified. Loading, real-play lifecycle, pause/dialog/ad stops, SDK locale, mute listener and completion-only ad reward callbacks implemented.
- Seven adapter tests pass. Built nested-path browser check validates lifecycle, migration, initial-download budget, no external resources except the SDK, and first-refusal button disabling using an explicit SDK double.
- Native WebAudio gain instrumentation verifies that host mute and music/sound toggles silence existing notes, even after another tap resumes the AudioContext.
- Live portal ads, Data synchronization on real Safari/iOS and provider iframe behavior remain untested because no upload or sign-in was authorized.


## Milestone 5 — Polish, art pipeline and final checks
- 2026-10-28 19:52 +07:00 — DONE for implementation/verification scope. Ordered subtotal animation, floating feedback, multiplier shake, goal burst, original synthesized music/SFX and independent audio gain buses implemented. Final-art family symbols remain visible for colour-blind recognition.
- Art manifest: 56 optional entries, 56 standalone prompts, 53 runtime assets and 3 marketing covers. All paths intentionally null until owner imports art. Pillow importer self-test PASS; missing-input run: 0 imported / 56 skipped. Nunito OFL license bundled. Marketing covers automatically excluded by build.
- Final `npm run build:crazygames`: PASS, 37 tests (28 core / 7 platform / 2 progress), typecheck clean, Vite build clean. Log: artifacts/build.log.
- Production output: 495,760 bytes (0.473 MiB). Initial game resources: 134,568 bytes (0.128 MiB), excluding the substituted provider SDK. Nested path /qa/hex-zoo/: 0 HTTP/console/page errors. Report: artifacts/build-check.json. SDK-double Data/lifecycle/locale/ad-refusal/native-audio assertions PASS; this is not live provider validation.
- `npm run sim`: rerun on final unchanged core. 1,000 runs each, random 0.1% win / 100% day-1 clear; greedy 31.1% win, 40.071 mean placements, 2.6714 placement-only minutes. Maximum animal 54.34%, charm 51.45%. Stalled ticks and seconds: 0. Results: docs/balance.md and docs/balance-results.json; log: artifacts/sim.log.
- `node tools/shots.mjs`: PASS, 30 screenshots, all five requested sizes. All 30 visually reviewed through five contact sheets, plus individual 800×450 and 311×530 dialogs. Fixed collection class collision, board/hand overlap, glyph/text spill and footer occlusion. Screenshot paths: artifacts/screenshots/; contact sheets: artifacts/review/contact-*.png. Portrait cards scroll within a dedicated content box; decision footer is a separate row.
- `node tools/portrait-popups.mjs`: PASS, 84 checks, all six requested sizes, both end states and saved-run menu; content scroll top/middle/bottom, visible button/text bounds, board/hand overlap and 12px text audit at 800×450.
- `node tools/firstplay.mjs`: PASS, one click to gameplay, tutorial won via arrows. First placement: 0.753s at 390×844, 0.689s at 1280×720. Mouse drag and touch/offline-after-load placement pass. Report: artifacts/firstplay.json.
- Additional actual-UI runs: loss on day 6, win on day 12 and Endless day 13, rewards/removal/shop/snacks tested; 0 stalls/errors. Daily UTC/continuation/result-ledger and tomorrow-event regressions PASS. Reports: artifacts/ui-run.json, artifacts/meta-regression.json.
- Runtime requirements remaining: placement-only 10–15 minutes is UNMET (incompatible with the specified maximum 96 placements at 4 seconds). Human retention/playtime and real provider host/cloud/ads remain unmeasured. Final art remains NOT READY; no submission is prepared. No sign-in, upload, deployment or remote push performed.

## Local milestone history
1. Implement seeded hex zoo rules and scoring — 76b5372.
2. Add zoo content and tune headless bot balance — 76879ea.
3. Build responsive playable zoo interface — 159b0f7.
4. Verify CrazyGames SDK lifecycle and progress saves — b686938.
5. Polish game feedback and add art production checks — final milestone commit containing this log.

## Agent exchange log (workspace-local)
- 2026-10-28 19:14 +07:00 — Split core/content/sim, platform/audio and art documentation into parallel tasks; root integrated UI. Shared Obsidian board read only because this task forbids edits outside hex-zoo.
- 2026-10-28 19:30 +07:00 — Independent review found Daily result replay, SDK-muted pending audio and winning-placement animation issues; fixed and added regression checks.
- 2026-10-28 19:52 +07:00 — Final browser and simulation evidence audited; hand-off records duration mismatch and final-art/live-platform limits explicitly.
