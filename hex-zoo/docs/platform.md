# Platform integration

The public boundary is `src/platform/types.ts`; `createPlatform()` selects a local adapter in dev and SDK v3 in the `crazygames` build. The production adapter dynamically loads only `https://sdk.crazygames.com/crazygames-sdk-v3.js`. There are no accounts, external navigation, or other advertising providers.

Boot calls `loadingStart`, awaits `init`, reads progress, renders the menu, then calls `loadingStop`. SDK lifecycle calls made before initialization are queued. There is deliberately no initialization timeout or fallback to a blank local save. A network or Data-module error must reach the boot recovery UI. `gameplayStart` is for an active board; menus, rewards, shops, settings, and other overlays stop gameplay. These calls are idempotent. `happytime` marks day goals and run victory; the live portal should verify the desired celebration frequency.

Storage is asynchronous at our boundary, even though SDK Data operations themselves are synchronous after initialization. `hex-zoo-save` is the canonical save key. On the first successful SDK initialization only, an absent cloud save is copied from the first present legacy key (`hex-zoo-save`, `hex-zoo-save-v1`, `hexZooSave`). An existing Data save always wins. The Data migration marker is written before legacy keys are removed. Afterward all reads and writes use Data; localStorage is used only by the local adapter and this one-time migration. When later preparing an upload, enable **Progress Save: Yes, using the Data Module from the CrazyGames SDK** in the portal. No upload has been made.

`rewardedAd` returns true only from `adFinished`. `adError` or a synchronous request failure returns false and permanently disables more requests in this page session, so Basic Launch does not repeat refusals. Concurrent requests are refused. Game activity stops and audio is muted before requesting. Audio is restored according to the current SDK settings after completion or failure. The caller decides whether its current screen permits resuming gameplay. There is no timeout that could grant an unearned reward.

SDK language is read from `user.systemInfo.locale` after initialization. The slice's text is English; the locale is exposed for future localization. Initial `game.settings.muteAudio` and changes from `addSettingsChangeListener` always override both music and sound settings. The synthesized soundtrack and effects are original and generated locally by WebAudio in `src/main.ts`. Every pointerdown calls `resumeAudio`, which invokes `AudioContext.resume()` each time. The platform mute listener and document visibility handling control audio alongside the player toggles.

## Verification and practical limits

Unit tests use a dependency-injected SDK double to check delayed initialization, one-time migration, preservation of cloud saves, failure propagation, gameplay bracketing, reward completion, refusal suppression, and mute priority. These tests do not validate the live portal, Safari cloud synchronization, ad inventory, or portal QA tools. The final portal integration must be exercised after final art and before submission; this repository has not signed in or published anywhere.

## Official references checked 2026-10-28

- [SDK v3 introduction](https://docs.crazygames.com/sdk/intro/) — script URL and mandatory asynchronous initialization.
- [Data module](https://docs.crazygames.com/sdk/data/) — guest/account storage through Data, initialization prerequisite, synchronous key/value methods and submission toggle.
- [Game module](https://docs.crazygames.com/sdk/game/) — loading/gameplay calls, happytime, initial mute setting and settings listener.
- [Video ads](https://docs.crazygames.com/sdk/video-ads/) — rewarded callbacks, audio/pause handling, refusals including Basic Launch.
- [User system information](https://docs.crazygames.com/sdk/user/) — locale source without authentication.
