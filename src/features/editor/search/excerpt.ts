const CONTEXT_BEFORE = 30;
const MAX_LENGTH = 110;
const ELLIPSIS = '…';
/** How far to hunt for a space before giving up and cutting mid-word. */
const BOUNDARY_SEARCH = 12;

/**
 * Moves an index forward to just after the next space, so a trimmed excerpt
 * starts on a whole word rather than "…ou arrive at".
 */
const forwardToWordStart = (text: string, index: number): number => {
  const limit = Math.min(text.length, index + BOUNDARY_SEARCH);
  for (let i = index; i < limit; i++) {
    if (text[i] === ' ') return i + 1;
  }
  return index;
};

/** Moves an index back to just before the previous space, for the same reason. */
const backToWordEnd = (text: string, index: number): number => {
  const limit = Math.max(0, index - BOUNDARY_SEARCH);
  for (let i = index; i > limit; i--) {
    if (text[i] === ' ') return i;
  }
  return index;
};

/**
 * Trims prose down to a window around the match, the way the design draws an
 * IN TEXT row: `“…the shrine is older than the forest around it.”`
 *
 * Ellipses only appear where text was actually dropped, so a short paragraph
 * reads as itself rather than as a fragment.
 */
export const excerpt = (text: string, matchIndex: number): string => {
  if (text.length <= MAX_LENGTH) return text;

  const rawStart = Math.max(0, matchIndex - CONTEXT_BEFORE);
  const start = rawStart === 0 ? 0 : forwardToWordStart(text, rawStart);

  const rawEnd = Math.min(text.length, start + MAX_LENGTH);
  const end = rawEnd === text.length ? text.length : backToWordEnd(text, rawEnd);

  const body = text.slice(start, end).trim();
  return `${start > 0 ? ELLIPSIS : ''}${body}${end < text.length ? ELLIPSIS : ''}`;
};
