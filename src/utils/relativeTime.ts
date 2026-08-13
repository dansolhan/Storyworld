const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

/**
 * How long ago something happened, in words.
 *
 * Stops being relative after a week: "edited 23 days ago" is harder to place than
 * a date, and the point of the phrase is to be read at a glance rather than
 * arithmetic. `now` is a parameter so this stays pure and testable.
 */
export const relativeTime = (timestamp: number, now: number = Date.now()): string => {
  const elapsed = now - timestamp;

  if (elapsed < 0) return 'just now';
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (elapsed < 2 * DAY) return 'yesterday';
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} days ago`;

  return `on ${DATE_FORMAT.format(timestamp)}`;
};
