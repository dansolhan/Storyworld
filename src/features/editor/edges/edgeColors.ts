/**
 * Edge stroke colours, shared by the edge component and its arrow markers so
 * the two can never drift apart.
 *
 * The palette has one accent, so entry and exit are no longer emerald and
 * indigo. Emphasis is the accent at two steps, and which way an edge runs is
 * carried by the arrow icon on its label — colour was always the weaker signal
 * of the two.
 *
 * CSS custom properties resolve in SVG `stroke` and `fill`, so these stay
 * tokens rather than hexes.
 */
export const EDGE_COLOR_ENTRY = 'var(--color-accent)';
export const EDGE_COLOR_EXIT = 'var(--color-accent-line)';
export const EDGE_COLOR_DEFAULT = 'var(--color-edge-default)';

/** The design draws edges as hairlines, and emphasised ones barely thicker. */
export const EDGE_WIDTH_DEFAULT = 1;
export const EDGE_WIDTH_EMPHASIS = 1.6;

export type EdgeEmphasis = 'entry' | 'exit' | null | undefined;

export const edgeColorFor = (emphasis: EdgeEmphasis): string | undefined => {
  if (emphasis === 'entry') return EDGE_COLOR_ENTRY;
  if (emphasis === 'exit') return EDGE_COLOR_EXIT;
  return undefined;
};
