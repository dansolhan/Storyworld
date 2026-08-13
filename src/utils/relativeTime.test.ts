import { describe, it, expect } from 'vitest';
import { relativeTime } from './relativeTime';

const NOW = new Date('2026-08-11T12:00:00Z').getTime();
const ago = (ms: number): number => NOW - ms;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  it('reads as just now within the minute', () => {
    expect(relativeTime(ago(0), NOW)).toBe('just now');
    expect(relativeTime(ago(59_000), NOW)).toBe('just now');
  });

  it('counts minutes, then hours', () => {
    expect(relativeTime(ago(MINUTE), NOW)).toBe('1 minute ago');
    expect(relativeTime(ago(42 * MINUTE), NOW)).toBe('42 minutes ago');
    expect(relativeTime(ago(HOUR), NOW)).toBe('1 hour ago');
    expect(relativeTime(ago(5 * HOUR), NOW)).toBe('5 hours ago');
  });

  it('says yesterday rather than 1 day ago', () => {
    expect(relativeTime(ago(DAY), NOW)).toBe('yesterday');
    expect(relativeTime(ago(47 * HOUR), NOW)).toBe('yesterday');
  });

  it('counts days up to a week', () => {
    expect(relativeTime(ago(2 * DAY), NOW)).toBe('2 days ago');
    expect(relativeTime(ago(6 * DAY), NOW)).toBe('6 days ago');
  });

  /* Past a week a date is easier to place than arithmetic on a day count. */
  it('gives a date once it is more than a week old', () => {
    expect(relativeTime(ago(7 * DAY), NOW)).toMatch(/^on /);
    expect(relativeTime(ago(90 * DAY), NOW)).toMatch(/^on /);
  });

  it('does not read as the future when a clock has drifted', () => {
    expect(relativeTime(NOW + 5 * MINUTE, NOW)).toBe('just now');
  });
});
