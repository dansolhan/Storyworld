import { describe, it, expect } from 'vitest';
import { MAIN_PLOT_COLOUR, SUBPLOT_COLOURS, subplotColour } from './subplotColour';
import type { Subplot } from './Subplot';

const plot = (id: string, color?: string): Subplot => ({ id, name: id, description: '', color });

const SUBPLOTS = [plot('a'), plot('b'), plot('c')];

describe('subplotColour', () => {
  it('gives the main plot the accent — it is the story’s spine', () => {
    expect(subplotColour(SUBPLOTS, null)).toBe(MAIN_PLOT_COLOUR);
  });

  /* Derived, so a story written before subplots had colours needs no migration. */
  it('derives a distinct colour per subplot from its position', () => {
    expect(subplotColour(SUBPLOTS, 'a')).toBe(SUBPLOT_COLOURS[0]);
    expect(subplotColour(SUBPLOTS, 'b')).toBe(SUBPLOT_COLOURS[1]);
    expect(subplotColour(SUBPLOTS, 'c')).toBe(SUBPLOT_COLOURS[2]);
  });

  it('prefers a colour the author chose', () => {
    expect(subplotColour([plot('a', '#123456')], 'a')).toBe('#123456');
  });

  it('wraps round rather than running out', () => {
    const many = Array.from({ length: SUBPLOT_COLOURS.length + 1 }, (_, i) => plot(`p${i}`));
    expect(subplotColour(many, `p${SUBPLOT_COLOURS.length}`)).toBe(SUBPLOT_COLOURS[0]);
  });

  it('falls back to the accent for a plot that is not there', () => {
    expect(subplotColour(SUBPLOTS, 'gone')).toBe(MAIN_PLOT_COLOUR);
    expect(subplotColour([], 'a')).toBe(MAIN_PLOT_COLOUR);
  });
});
