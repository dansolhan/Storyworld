import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('pads the seconds', () => {
    expect(formatTime(42)).toBe('0:42');
    expect(formatTime(9)).toBe('0:09');
  });

  it('rolls over into minutes', () => {
    expect(formatTime(135)).toBe('2:15');
    expect(formatTime(600)).toBe('10:00');
  });

  it('floors part-seconds, so the readout never runs ahead', () => {
    expect(formatTime(41.9)).toBe('0:41');
  });

  /* Howler reports 0 before a track loads, and a seek can overshoot. */
  it('clamps what is not a time', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});
