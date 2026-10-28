import type { Platform } from './types';
import { LocalPlatform } from './local';
export type { Platform } from './types';
export { SAVE_KEY } from './types';

/** Build-time branch keeps the SDK script and adapter out of local dev boot. */
export function createPlatform(): Platform {
  if (import.meta.env.MODE === 'crazygames') return new LazyCrazyGamesPlatform();
  return new LocalPlatform();
}
// The dynamic import also prevents loading any SDK-related code during dev.
class LazyCrazyGamesPlatform implements Platform {
  readonly kind = 'crazygames' as const;
  private adapter?: Platform;
  private pending: ((platform: Platform) => void)[] = [];
  private initialization?: Promise<void>;
  get language() { return this.adapter?.language ?? 'en'; }
  get adsAvailable() { return this.adapter?.adsAvailable ?? true; }
  init() {
    return this.initialization ??= (async () => {
      const { CrazyGamesPlatform } = await import('./crazygames');
      this.adapter = new CrazyGamesPlatform();
      for (const action of this.pending.splice(0)) action(this.adapter);
      await this.adapter.init();
    })();
  }
  private call(action: (platform: Platform) => void) {
    if (this.adapter) action(this.adapter); else this.pending.push(action);
  }
  loadingStart() { this.call(p => p.loadingStart()); }
  loadingStop() { this.call(p => p.loadingStop()); }
  gameplayStart() { this.call(p => p.gameplayStart()); }
  gameplayStop() { this.call(p => p.gameplayStop()); }
  happytime() { this.call(p => p.happytime()); }
  async rewardedAd() { await this.init(); return this.adapter!.rewardedAd(); }
  async getItem(key: string) { await this.init(); return this.adapter!.getItem(key); }
  async setItem(key: string, value: string) { await this.init(); return this.adapter!.setItem(key, value); }
  onMute(listener: (muted: boolean) => void) {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    this.call(p => { if (active) unsubscribe = p.onMute(listener); });
    return () => { active = false; unsubscribe?.(); };
  }
}
