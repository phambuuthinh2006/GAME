/** All persistent storage and host lifecycle calls pass through this boundary. */
export interface Platform {
  readonly kind: 'local' | 'crazygames';
  readonly language: string;
  readonly adsAvailable: boolean;
  init(): Promise<void>;
  loadingStart(): void;
  loadingStop(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  happytime(): void;
  /** True only after the provider reports adFinished; false never grants a reward. */
  rewardedAd(): Promise<boolean>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  /** Host mute always takes precedence over the game's own audio toggles. */
  onMute(listener: (muted: boolean) => void): () => void;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const SAVE_KEY = 'hex-zoo-save';
export const MIGRATION_KEY = 'hex-zoo-data-migrated-v1';
export const LEGACY_KEYS = [SAVE_KEY, 'hex-zoo-save-v1', 'hexZooSave'] as const;
