import React from 'react';
import { Pause, Play } from 'lucide-react';
import { useAudioPeaks, PEAK_COUNT } from '../../hooks/audio/useAudioPeaks';
import { useAudioPreview } from '../../hooks/audio/useAudioPreview';
import { formatTime } from './formatTime';
import styles from './AudioWaveform.module.css';

export interface AudioWaveformProps {
  /** The track's base64 data, or undefined when none is chosen. */
  src: string | undefined;
  label: string;
}

/** Flat bars while peaks are still being decoded, or if decoding failed. */
const FLAT = Array.from({ length: PEAK_COUNT }, () => 0.35);

/**
 * A track you can audition: play/pause, a waveform whose played portion fills,
 * a playhead, and a time readout. Clicking the waveform seeks.
 */
export const AudioWaveform: React.FC<AudioWaveformProps> = ({ src, label }) => {
  const peaks = useAudioPeaks(src);
  const { isPlaying, position, duration, toggle, seekTo } = useAudioPreview(src);

  const progress = duration > 0 ? position / duration : 0;
  const bars = peaks ?? FLAT;
  const playedBars = Math.round(progress * bars.length);

  return (
    <div className={styles.player}>
      <button
        type="button"
        className={styles.playButton}
        onClick={toggle}
        disabled={!src}
        aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
      >
        {isPlaying ? (
          <Pause className={styles.playIcon} aria-hidden="true" />
        ) : (
          <Play className={styles.playIcon} aria-hidden="true" />
        )}
      </button>

      {/*
        A slider rather than a bare div: seeking by clicking is the point, and it
        should work from the keyboard too.
      */}
      <div
        className={styles.waveform}
        role="slider"
        tabIndex={0}
        aria-label={`${label} position`}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
        onClick={(event) => {
          const { left, width } = event.currentTarget.getBoundingClientRect();
          seekTo((event.clientX - left) / width);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const step = (event.key === 'ArrowRight' ? 5 : -5) / (duration || 1);
          seekTo(progress + step);
        }}
      >
        {bars.map((peak, index) => (
          <span
            key={index}
            className={styles.bar}
            data-played={index < playedBars || undefined}
            data-playhead={isPlaying && index === playedBars ? true : undefined}
            style={{ height: `${Math.max(8, peak * 100)}%` }}
          />
        ))}
      </div>

      <span className={styles.time}>
        {formatTime(position)} / {formatTime(duration)}
      </span>
    </div>
  );
};
