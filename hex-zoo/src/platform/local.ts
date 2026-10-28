import type { Platform, StorageLike } from './types';

/** Development adapter: no SDK, no network, no simulated ad rewards. */
export class LocalPlatform implements Platform {
  readonly kind = 'local' as const;
  readonly language: string;
  readonly events: string[] = [];
  readonly adsAvailable = false;
  private loading = false;
  private playing = false;
  constructor(private storage: StorageLike = localStorage, language = navigator.language) {
    this.language = language || 'en';
  }
  async init() { this.events.push('init'); }
  loadingStart() {
    if (!this.loading) { this.loading = true; this.events.push('loadingStart'); }
  }
  loadingStop() {
    if (this.loading) { this.loading = false; this.events.push('loadingStop'); }
  }
  gameplayStart() {
    if (!this.playing) { this.playing = true; this.events.push('gameplayStart'); }
  }
  gameplayStop() {
    if (this.playing) { this.playing = false; this.events.push('gameplayStop'); }
  }
  happytime() { this.events.push('happytime'); }
  async rewardedAd() { return false; }
  async getItem(key: string) { return this.storage.getItem(key); }
  async setItem(key: string, value: string) { this.storage.setItem(key, value); }
  onMute(listener: (muted: boolean) => void) { listener(false); return () => {}; }
}
