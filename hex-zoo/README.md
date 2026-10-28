# Hex Zoo

Playable local vertical slice. **Placeholder art — do not submit this build.** No deployment, upload or remote push is part of this project.

```sh
npm install
npm run dev
npm test
npm run sim
npm run build:crazygames
```

Open http://localhost:5173 to play. The local platform stores progress in localStorage and requests no SDK or runtime service. After the page loads, the game continues offline. Production output is `dist-crazygames/` (relative paths, SDK v3 only). Serve that folder inside the CrazyGames preview environment; SDK initialization intentionally has no timeout/local fallback.

Browser QA (keep `npm run dev` running in another terminal):

```sh
node tools/shots.mjs
node tools/portrait-popups.mjs
node tools/firstplay.mjs
node tools/meta-regression.mjs
node tools/ui-run.mjs
node tools/check-build.mjs
```

Playwright Chromium must be available (`npx playwright install chromium` if needed). Browser scripts write evidence to `artifacts/`. `check-build` serves the production folder from a sub-path and intercepts the SDK script with a strict test double; this validates integration wiring, not live portal ads/cloud.

Final art workflow and copy/paste prompts: [docs/art-prompts.md](docs/art-prompts.md). Art is optional until imported through `tools/import-art.py`; manifest entries are null until then. Marketing covers are automatically excluded from runtime output.

Design, real balance results, store draft, platform limitations and verification log are in `docs/`. **The requested 10–15 minutes at 4 seconds per placement is incompatible with 12 days of 5–8 placements; it remains unmet.** Actual player session duration needs playtesting.
