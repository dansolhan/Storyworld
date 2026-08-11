import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

export interface AudioPreview {
  isPlaying: boolean;
  /** Seconds elapsed. */
  position: number;
  /** Seconds total, or 0 until the track has loaded. */
  duration: number;
  toggle: () => void;
  stop: () => void;
  /** Jump to a fraction of the track, 0–1. */
  seekTo: (fraction: number) => void;
}

/**
 * Auditioning a track in the editor.
 *
 * Deliberately its own Howl rather than going through `audioManager`: that keeps
 * per-category bookkeeping for the *player* — which track is the active bgm,
 * what should fade out when another starts — and an author previewing a sound
 * has no business disturbing it.
 *
 * Position is polled on an animation frame while playing. Howler exposes `seek()`
 * but emits no progress event, so there is nothing to subscribe to.
 */
export const useAudioPreview = (src: string | undefined): AudioPreview => {
  const howlRef = useRef<Howl | null>(null);
  const frameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastSrc, setLastSrc] = useState(src);

  if (src !== lastSrc) {
    // Adjusting state during render rather than in the effect below: a new track
    // must not briefly show the previous one's position.
    setLastSrc(src);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }

  // One Howl per track, torn down when the track changes or the row closes.
  useEffect(() => {
    if (!src) {
      howlRef.current = null;
      return;
    }

    const howl = new Howl({ src: [src], html5: false });
    howlRef.current = howl;

    howl.on('load', () => setDuration(howl.duration()));
    howl.on('end', () => {
      setIsPlaying(false);
      setPosition(0);
    });
    howl.on('play', () => setIsPlaying(true));
    howl.on('pause', () => setIsPlaying(false));
    howl.on('stop', () => {
      setIsPlaying(false);
      setPosition(0);
    });

    return () => {
      howl.off();
      howl.unload();
      howlRef.current = null;
    };
  }, [src]);

  // Howler has no progress event, so the position is sampled while playing.
  useEffect(() => {
    if (!isPlaying) return;

    const sample = () => {
      const howl = howlRef.current;
      if (howl) {
        const seek = howl.seek();
        if (typeof seek === 'number') setPosition(seek);
      }
      frameRef.current = requestAnimationFrame(sample);
    };

    frameRef.current = requestAnimationFrame(sample);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [isPlaying]);

  const toggle = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;
    if (howl.playing()) howl.pause();
    else howl.play();
  }, []);

  const stop = useCallback(() => {
    howlRef.current?.stop();
  }, []);

  const seekTo = useCallback((fraction: number) => {
    const howl = howlRef.current;
    if (!howl) return;
    const target = Math.max(0, Math.min(1, fraction)) * (howl.duration() || 0);
    howl.seek(target);
    setPosition(target);
  }, []);

  return { isPlaying, position, duration, toggle, stop, seekTo };
};
