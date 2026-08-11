import type { Atmosphere } from './Atmosphere';

/**
 * What the player used to hardcode, now the default when an atmosphere does not
 * say otherwise. Changing these changes how every story without explicit values
 * sounds, so they are named rather than inlined.
 */
export const DEFAULT_FADE_IN_MS = 1000;
export const DEFAULT_VOLUME = 1;

export const MAX_FADE_IN_MS = 10_000;

export interface AtmosphereSettings {
  fadeIn: number;
  volume: number;
}

/**
 * Resolves an atmosphere's playback settings, filling in the defaults.
 *
 * The single place absence is handled, so the editor's controls and the player's
 * playback cannot disagree about what an unset field means.
 */
export const atmosphereSettings = (atmosphere: Atmosphere | undefined): AtmosphereSettings => ({
  fadeIn: atmosphere?.fadeIn ?? DEFAULT_FADE_IN_MS,
  volume: atmosphere?.volume ?? DEFAULT_VOLUME,
});
