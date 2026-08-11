import { useEffect, useState } from 'react';

/** How many bars the waveform draws. */
export const PEAK_COUNT = 96;

/**
 * Decoded peaks are expensive and never change for a given track, so they are
 * cached for the session. Tracks live in the story as base64, so the src string
 * is a sound identity.
 */
const cache = new Map<string, number[]>();

const audioContextFor = (): AudioContext | undefined => {
  const withPrefix = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext ?? withPrefix.webkitAudioContext;
  return Ctor ? new Ctor() : undefined;
};

/**
 * Tracks arrive two ways: uploaded ones are base64 data URIs stored in the
 * story, while the bundled example music is a path under `public/`. Assuming
 * base64 is why the demo's waveforms were flat.
 */
const audioBytes = async (src: string): Promise<ArrayBuffer> => {
  if (src.startsWith('data:')) {
    const binary = window.atob(src.slice(src.indexOf(',') + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not fetch ${src} (${response.status})`);
  return response.arrayBuffer();
};

const decodePeaks = async (src: string): Promise<number[]> => {
  const bytes = await audioBytes(src);

  const context = audioContextFor();
  if (!context) throw new Error('Web Audio is unavailable in this browser.');

  const buffer = await context.decodeAudioData(bytes);
  const samples = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(samples.length / PEAK_COUNT));

  const peaks: number[] = [];
  for (let i = 0; i < PEAK_COUNT; i++) {
    let sum = 0;
    const start = blockSize * i;
    for (let j = 0; j < blockSize; j++) sum += Math.abs(samples[start + j] ?? 0);
    peaks.push(sum / blockSize);
  }

  // Normalised, so a quiet track still fills the row.
  const loudest = Math.max(...peaks, Number.EPSILON);
  return peaks.map((peak) => peak / loudest);
};

interface PeaksState {
  src: string | undefined;
  peaks: number[] | null;
}

const stateFor = (src: string | undefined): PeaksState => ({
  src,
  peaks: src ? cache.get(src) ?? null : null,
});

/**
 * Peak amplitudes for a track, or null while decoding or if decoding fails.
 *
 * A null result is not an error to show the author — the waveform simply draws
 * flat bars, and playback still works.
 *
 * State is keyed by src and adjusted during render, so switching tracks never
 * shows the previous one's shape and the effect only ever starts the decode.
 */
export const useAudioPeaks = (src: string | undefined): number[] | null => {
  const [state, setState] = useState<PeaksState>(() => stateFor(src));

  if (state.src !== src) setState(stateFor(src));

  useEffect(() => {
    if (!src || cache.has(src)) return;

    let active = true;
    decodePeaks(src)
      .then((decoded) => {
        cache.set(src, decoded);
        if (active) setState({ src, peaks: decoded });
      })
      .catch((error) => {
        console.warn('Could not read the waveform for this track', error);
      });

    return () => {
      active = false;
    };
  }, [src]);

  return state.src === src ? state.peaks : null;
};
