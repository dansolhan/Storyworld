import type { Subplot } from './Subplot';

/**
 * The colours a plot can take, from the design's own lane palette.
 *
 * The main plot is always the accent — it is the story's spine, and the accent is
 * what the rest of the app already spends on "the thing you are in".
 */
export const MAIN_PLOT_COLOUR = '#e1ad66';

export const SUBPLOT_COLOURS = ['#9b7232', '#605d5d', '#7d5411', '#4f5a52'] as const;

/**
 * A plot's colour: whatever it was given, or one derived from its position.
 *
 * Derived by default so a story written before subplots had colours still shows
 * distinct dots without a migration. `color` is an optional field an author can set;
 * absent, the order in `subplots` decides, which is stable as long as the list is.
 */
export const subplotColour = (subplots: Subplot[], subplotId: string | null): string => {
  if (!subplotId) return MAIN_PLOT_COLOUR;

  const index = subplots.findIndex((subplot) => subplot.id === subplotId);
  if (index === -1) return MAIN_PLOT_COLOUR;

  return subplots[index].color ?? SUBPLOT_COLOURS[index % SUBPLOT_COLOURS.length];
};
