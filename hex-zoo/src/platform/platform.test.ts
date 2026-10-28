import { describe, expect, it, vi } from 'vitest';
import { CrazyGamesPlatform, type CrazySDK, type AdCallbacks, type SDKSettings } from './crazygames';
import { LocalPlatform } from './local';
import { MIGRATION_KEY, SAVE_KEY, type StorageLike } from './types';

function memory(values: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(values));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } };
}
function fakeSDK() {
  let listener = (_settings: SDKSettings) => {};
  let callbacks: AdCallbacks | undefined;
  const sdk: CrazySDK = {
    init: vi.fn(async () => {}),
    data: memory(), user: { systemInfo: { locale: 'vi-VN' } },
    game: {
      loadingStart: vi.fn(), loadingStop: vi.fn(), gameplayStart: vi.fn(), gameplayStop: vi.fn(), happytime: vi.fn(),
      settings: { muteAudio: false }, addSettingsChangeListener: vi.fn(fn => { listener = fn; }),
    },
    ad: { requestAd: vi.fn((_type, cb) => { callbacks = cb; }) },
  };
  return { sdk, settings: (muted: boolean) => listener({ muteAudio: muted }), callbacks: () => callbacks! };
}

describe('CrazyGames SDK boundary', () => {
  it('waits for init before Data access, queues loading start, and initializes once', async () => {
    const fake = fakeSDK();
    let release!: () => void;
    fake.sdk.init = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
    const reads = vi.spyOn(fake.sdk.data, 'getItem');
    const platform = new CrazyGamesPlatform(async () => fake.sdk, memory());
    platform.loadingStart();
    const result = platform.getItem('progress');
    await Promise.resolve();
    expect(reads).not.toHaveBeenCalled();
    expect(fake.sdk.game.loadingStart).not.toHaveBeenCalled();
    release();
    expect(await result).toBe(null);
    await platform.init();
    expect(fake.sdk.init).toHaveBeenCalledTimes(1);
    expect(fake.sdk.game.loadingStart).toHaveBeenCalledOnce();
    platform.loadingStop();
    expect(fake.sdk.game.loadingStop).toHaveBeenCalledOnce();
    expect(platform.language).toBe('vi-VN');
  });
  it('migrates legacy once, lets cloud data win and removes old keys only after success', async () => {
    const fake = fakeSDK();
    const legacy = memory({ [SAVE_KEY]: 'legacy' });
    const platform = new CrazyGamesPlatform(async () => fake.sdk, legacy);
    expect(await platform.getItem(SAVE_KEY)).toBe('legacy');
    expect(fake.sdk.data.getItem(MIGRATION_KEY)).toBe('1');
    expect(legacy.getItem(SAVE_KEY)).toBe(null);
    fake.sdk.data.setItem(SAVE_KEY, 'cloud');
    legacy.setItem(SAVE_KEY, 'stale-local');
    const second = new CrazyGamesPlatform(async () => fake.sdk, legacy);
    expect(await second.getItem(SAVE_KEY)).toBe('cloud');
  });
  it('preserves cloud progress on first migration', async () => {
    const fake = fakeSDK();
    fake.sdk.data.setItem(SAVE_KEY, 'cloud');
    const platform = new CrazyGamesPlatform(async () => fake.sdk, memory({ [SAVE_KEY]: 'older' }));
    expect(await platform.getItem(SAVE_KEY)).toBe('cloud');
  });
  it('does not silently fall back or mark migration when Data fails', async () => {
    const fake = fakeSDK();
    const legacy = memory({ [SAVE_KEY]: 'keep-me' });
    fake.sdk.data.setItem = vi.fn(() => { throw new Error('disabled'); });
    const platform = new CrazyGamesPlatform(async () => fake.sdk, legacy);
    await expect(platform.init()).rejects.toThrow('disabled');
    expect(legacy.getItem(SAVE_KEY)).toBe('keep-me');
  });
  it('brackets gameplay and only grants on finished; failure disables later requests', async () => {
    const fake = fakeSDK();
    const platform = new CrazyGamesPlatform(async () => fake.sdk, memory());
    await platform.init();
    platform.gameplayStart(); platform.gameplayStart();
    expect(fake.sdk.game.gameplayStart).toHaveBeenCalledTimes(1);
    const rewarded = platform.rewardedAd();
    await Promise.resolve();
    expect(fake.sdk.game.gameplayStop).toHaveBeenCalledOnce();
    expect(await platform.rewardedAd()).toBe(false); // no concurrent ad request
    fake.callbacks().adStarted();
    fake.callbacks().adFinished();
    expect(await rewarded).toBe(true);
    expect(platform.adsAvailable).toBe(true);
    platform.gameplayStart();
    const refused = platform.rewardedAd();
    await Promise.resolve();
    fake.callbacks().adError({ code: 'adsDisabled' });
    fake.callbacks().adFinished(); // malformed double callback cannot grant reward
    expect(await refused).toBe(false);
    expect(platform.adsAvailable).toBe(false);
    expect(await platform.rewardedAd()).toBe(false);
    expect(fake.sdk.ad.requestAd).toHaveBeenCalledTimes(2);
  });
  it('host mute overrides ad restoration and listeners unsubscribe', async () => {
    const fake = fakeSDK();
    const platform = new CrazyGamesPlatform(async () => fake.sdk, memory());
    await platform.init();
    const listener = vi.fn();
    const stop = platform.onMute(listener);
    fake.settings(true);
    const ad = platform.rewardedAd();
    await Promise.resolve();
    fake.callbacks().adFinished();
    await ad;
    expect(listener).toHaveBeenLastCalledWith(true);
    fake.settings(false);
    expect(listener).toHaveBeenLastCalledWith(false);
    stop();
    const before = listener.mock.calls.length;
    fake.settings(true);
    expect(listener).toHaveBeenCalledTimes(before);
  });
});

describe('local development adapter', () => {
  it('persists without SDK or network and refuses unavailable ads', async () => {
    const storage = memory();
    const local = new LocalPlatform(storage, 'en-GB');
    await local.init();
    await local.setItem('progress', 'saved');
    expect(await new LocalPlatform(storage, 'en').getItem('progress')).toBe('saved');
    expect(local.adsAvailable).toBe(false);
    expect(await local.rewardedAd()).toBe(false);
  });
});
