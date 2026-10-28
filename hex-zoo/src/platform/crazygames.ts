import { LEGACY_KEYS, MIGRATION_KEY, SAVE_KEY, type Platform, type StorageLike } from './types';

export interface SDKSettings { muteAudio?: boolean }
export interface AdCallbacks {
  adStarted(): void;
  adFinished(): void;
  adError(error?: unknown): void;
}
export interface CrazySDK {
  init(): Promise<void>;
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    happytime(): void;
    settings: SDKSettings;
    addSettingsChangeListener(listener: (settings: SDKSettings) => void): void;
    removeSettingsChangeListener?(listener: (settings: SDKSettings) => void): void;
  };
  data: StorageLike;
  user?: { systemInfo?: { locale?: string } };
  ad: { requestAd(type: 'rewarded', callbacks: AdCallbacks): void };
}
declare global { interface Window { CrazyGames?: { SDK: CrazySDK } } }

/** Only called by the crazygames build. The SDK is never downloaded in dev. */
export async function loadCrazySDK(): Promise<CrazySDK> {
  if (window.CrazyGames?.SDK) return window.CrazyGames.SDK;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('The zoo could not connect. Check your connection and retry.')); };
    document.head.append(script);
  });
  if (!window.CrazyGames?.SDK) throw new Error('The zoo platform did not start. Please retry.');
  return window.CrazyGames.SDK;
}

export class CrazyGamesPlatform implements Platform {
  readonly kind = 'crazygames' as const;
  language = 'en';
  adsAvailable = true;
  private sdk?: CrazySDK;
  private initPromise?: Promise<void>;
  private ready = false;
  private loading = false;
  private playing = false;
  private adPending = false;
  private hostMuted = false;
  private adMuted = false;
  private listeners = new Set<(muted: boolean) => void>();
  private queued: (() => void)[] = [];
  constructor(private loader: () => Promise<CrazySDK> = loadCrazySDK, private legacy: StorageLike = localStorage) {}

  init(): Promise<void> {
    // Intentionally no timeout or local fallback: slow cloud loads must not overwrite saves.
    return this.initPromise ??= this.initialize();
  }
  private async initialize() {
    this.sdk = await this.loader();
    await this.sdk.init();
    this.ready = true;
    for (const call of this.queued.splice(0)) call();
    this.language = this.sdk.user?.systemInfo?.locale || 'en';
    this.hostMuted = Boolean(this.sdk.game.settings?.muteAudio);
    this.sdk.game.addSettingsChangeListener(settings => {
      this.hostMuted = Boolean(settings.muteAudio);
      this.emitMute();
    });
    this.emitMute();
    // Data module is the sole source of truth after this migration. Cloud wins.
    if (this.sdk.data.getItem(MIGRATION_KEY) !== '1') {
      if (this.sdk.data.getItem(SAVE_KEY) === null) {
        for (const key of LEGACY_KEYS) {
          const value = this.legacy.getItem(key);
          if (value !== null) {
            this.sdk.data.setItem(SAVE_KEY, value);
            break;
          }
        }
      }
      this.sdk.data.setItem(MIGRATION_KEY, '1');
      for (const key of LEGACY_KEYS) this.legacy.removeItem(key);
    }
  }
  private call(fn: (sdk: CrazySDK) => void) {
    if (this.ready && this.sdk) fn(this.sdk);
    else this.queued.push(() => fn(this.sdk!));
  }
  loadingStart() {
    if (this.loading) return;
    this.loading = true;
    this.call(sdk => sdk.game.loadingStart());
  }
  loadingStop() {
    if (!this.loading) return;
    this.loading = false;
    this.call(sdk => sdk.game.loadingStop());
  }
  gameplayStart() {
    if (this.playing || this.adPending) return;
    this.playing = true;
    this.call(sdk => sdk.game.gameplayStart());
  }
  gameplayStop() {
    if (!this.playing) return;
    this.playing = false;
    this.call(sdk => sdk.game.gameplayStop());
  }
  happytime() { this.call(sdk => sdk.game.happytime()); }
  async getItem(key: string) {
    await this.init();
    return this.sdk!.data.getItem(key);
  }
  async setItem(key: string, value: string) {
    await this.init();
    this.sdk!.data.setItem(key, value);
  }
  onMute(listener: (muted: boolean) => void) {
    this.listeners.add(listener);
    listener(this.hostMuted || this.adMuted);
    return () => { this.listeners.delete(listener); };
  }
  private emitMute() { for (const listener of this.listeners) listener(this.hostMuted || this.adMuted); }
  async rewardedAd(): Promise<boolean> {
    await this.init();
    if (!this.adsAvailable || this.adPending) return false;
    this.gameplayStop();
    this.adPending = true;
    // Silence before requesting, including provider overlays before adStarted.
    this.adMuted = true;
    this.emitMute();
    return new Promise(resolve => {
      let settled = false;
      const finish = (completed: boolean) => {
        if (settled) return;
        settled = true;
        this.adPending = false;
        this.adMuted = false;
        if (!completed) this.adsAvailable = false;
        this.emitMute();
        resolve(completed);
      };
      try {
        this.sdk!.ad.requestAd('rewarded', {
          adStarted: () => { this.adMuted = true; this.emitMute(); },
          adFinished: () => finish(true),
          adError: () => finish(false),
        });
      } catch { finish(false); }
    });
  }
}
