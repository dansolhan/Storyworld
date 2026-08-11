import { describe, it, expect } from 'vitest';
import {
  atmosphereSettings,
  DEFAULT_FADE_IN_MS,
  DEFAULT_VOLUME,
} from './atmosphereSettings';

describe('atmosphereSettings', () => {
  it('supplies what the player did before, when nothing is set', () => {
    const settings = atmosphereSettings({ id: 'a', title: 'Dusk' });
    expect(settings).toEqual({ fadeIn: DEFAULT_FADE_IN_MS, volume: DEFAULT_VOLUME });
  });

  it('keeps explicit values', () => {
    const settings = atmosphereSettings({ id: 'a', title: 'Dusk', fadeIn: 2500, volume: 0.4 });
    expect(settings).toEqual({ fadeIn: 2500, volume: 0.4 });
  });

  /*
   * Zero is a legitimate choice for both — no fade, and silent — so it must
   * survive rather than being replaced by the default.
   */
  it('respects zero', () => {
    const settings = atmosphereSettings({ id: 'a', title: 'Dusk', fadeIn: 0, volume: 0 });
    expect(settings).toEqual({ fadeIn: 0, volume: 0 });
  });

  it('falls back for a missing atmosphere', () => {
    expect(atmosphereSettings(undefined)).toEqual({
      fadeIn: DEFAULT_FADE_IN_MS,
      volume: DEFAULT_VOLUME,
    });
  });
});
