# Verification evidence — local vertical slice

All paths below are relative to `hex-zoo/`. Reports are generated locally under ignored `artifacts/`; they are present in this working folder and can be regenerated with the commands below. No upload, sign-in, submission or remote push was performed. **The full “Done when” list is not satisfied:** the duration target is unmet, and final art/live provider QA remain outstanding.

## Required evidence matrix

| Requirement | Result and scope | Evidence |
|---|---|---|
| Production tests, typecheck, build | **PASS**: `npm run build:crazygames` ran after final source changes: 37 tests green (28 core, 7 platform, 2 progress), clean typecheck, Vite production build. Output: `artifacts/build.log`. | `package.json`; final command output/progress log. |
| Folder size <15 MB; initial download <5 MB; nested sub-path without 404s | **PASS** in the recorded local production-bundle check. The current report records 495,760 build bytes and 134,568 initial downloaded bytes. These are placeholder-build measurements, not a final-art budget guarantee. SDK request bytes are substituted by a test double and excluded from local resource totals. | `node tools/check-build.mjs`; `artifacts/build-check.json`, served at `/qa/hex-zoo/`. |
| 1,000 runs per bot; random <5%; random day 1 >90%; greedy 25–45%; no animal/charm >60% of greedy wins | **PASS**. Random 1/1,000 (0.1%); first-day clears 100%. Greedy 311/1,000 (31.1%). Maximum animal Rill Platypus 54.34%; maximum charm Glass Acorn 51.45%. No stalled decision ticks/seconds. | `npm run sim`; `docs/balance.md`, `docs/balance-results.json`. |
| Greedy average 10–15 minutes at 4 seconds per placement | **UNMET**. Mean 40.071 placements = 2.6714 minutes; select/place/other-choice model = 7.8673 minutes. The 12×8×4-second upper bound is only 6.4 minutes before early clears/losses. No human duration claim is made. | `docs/balance-results.json`; constraint explanation in `docs/design.md`. |
| Six views × five requested screenshot sizes, without page/console errors | **PASS**: 30 screenshots, empty recorded error list. Views: menu, midrun, reward/pick-one, shop, end, collection. Sizes: 1280×720, 907×510, 800×450, 390×844, 311×530; device scale factor 1. All 30 screenshots were visually reviewed in five contact sheets; individual short-screen dialogs were also inspected. Sibling overlap, collection grid and footer occlusion issues were fixed before final capture. | `node tools/shots.mjs`; `artifacts/shots.json`; `artifacts/screenshots/<view>-<width>x<height>.png`. Contact sheets: `artifacts/review/contact-<width>x<height>.png`. |
| Menu/every popup viewport/text containment | **PASS**: 84 viewport/view checks in the current report, including scroll positions. Sizes: 311×530, 320×480, 375×600, 390×664, 844×390, 800×450. Visible button bounds and text-node bounds are checked; vertical overflow is permitted only inside a scroll container. | `node tools/portrait-popups.mjs`; `artifacts/portrait-popups.json`. |
| Fresh save: one click to play, arrow tutorial wins, first placement <10 s | **PASS**. Recorded 390×844: 0.753 s, 2 guided placements; 1280×720: 0.689 s, 3 guided placements (early goal clear is allowed). Both use one click to reach gameplay. Times are synthetic local browser measurements, not real-player conversion telemetry. | `node tools/firstplay.mjs`; `artifacts/firstplay.json`. |
| Dev local mock; offline after load | **PASS** for both first-play probe sizes. Each probe also completes a pointer-drag placement, then an offline placement after resources load. This is not an offline-reload guarantee. | `artifacts/firstplay.json`; `src/platform/local.ts`. |
| Requested documents exist and match code | **PASS** locally: design, balance, art prompts, names, store draft and progress are present. Art prompts have 56 headings matching all 56 manifest IDs; all 53 required runtime-art IDs resolve, with 3 marketing covers separate. Snack/charm offers intentionally use a generic symbol fallback rather than requiring extra images. | `docs/`; `public/art-manifest.json`; `src/ui/assets.ts`. |
| One local commit per milestone, no attribution trailers | **PASS**: five local milestone commits, plain messages, no attribution trailers. See the five milestone entries in `docs/progress.md` and local history. | `git log --format=full -- hex-zoo`; `docs/progress.md`. |

## Additional regression evidence

- `node tools/meta-regression.mjs` → `artifacts/meta-regression.json`: **PASS** for completed-Daily blocking, yesterday/today separation, active-Daily continuation, no duplicate win after reload and no duplicate win through Endless. Recorded errors: `[]`.
- `node tools/ui-run.mjs` → `artifacts/ui-run.json`: **PASS** for an actual UI-driven loss and a full win, including reward/shop flow and continuation into Endless. The recorded sessions use `balance-v1-0` (loss, day 6, 31 placements) and `balance-v1-1` (win, day 12, 35 placements); both record zero stalled states and no page/console errors.
- `tools/check-build.mjs` intercepts only the official SDK script URL and checks boot loading calls, no gameplay on the menu, gameplay pause/resume, Data migration and first-refusal ad disabling. The final report also passes native master/music/sound gain assertions: host mute stays authoritative after taps and ad callbacks. SDK double use is explicit.
- `tools/import-art.py --self-test`: **PASS** for soft green keying, spill removal, transparent padding, resizing, palette PNG and missing-input fallback. Normal import with this placeholder workspace reports `0 imported; 56 missing inputs skipped`.

## Reproduce

Start `npm run dev` in one terminal. In another, from `hex-zoo/`:

```sh
node tools/shots.mjs
node tools/portrait-popups.mjs
node tools/firstplay.mjs
node tools/meta-regression.mjs
node tools/ui-run.mjs
npm run build:crazygames
node tools/check-build.mjs
npm run sim
```

Playwright requires its Chromium browser installed locally. The browser tools use `http://127.0.0.1:5173/` by default; set `HEX_ZOO_URL` to override. The production sub-path checker starts and stops its own local HTTP server and does not need the dev server.

## Submission and metric limits

**Final art: NOT READY.** All 56 manifest paths are null in this slice; the existing coloured animal shapes are placeholders. Generate/import the first family portraits and style-test them before the remaining art. No placeholder submission is prepared.

**Live SDK: NOT VALIDATED.** The official APIs were checked against provider documentation and adapter tests cover initialization, Data, lifecycle, mute and ad callbacks. Local production wiring uses a double. Safari/iOS Data continuity, real hosted iframe behavior, ad inventory and portal QA still need the owner's authorized preview tests.

**Retention and session duration: NOT VALIDATED.** Bot policy and synthetic first-play probes cannot establish human playtime, conversion or D1 retention. The named tomorrow event, daily seed and persistent progress implement the intended return hook; their effect requires player evidence. The specific placement-only duration criterion remains unmet and requires a design decision.

Final local check timestamp: 2026-10-28 19:52 +07:00. The last short-portrait end layout keeps tomorrow's named event above its action footer. At 800×450, visible game text is at least 12 CSS pixels.
