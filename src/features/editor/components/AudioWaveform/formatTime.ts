/**
 * Seconds as `m:ss`, for the readout beside the waveform.
 *
 * Clamps negatives to zero — Howler reports 0 before a track has loaded, and a
 * seek can momentarily overshoot the duration.
 */
export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, '0')}`;
};
