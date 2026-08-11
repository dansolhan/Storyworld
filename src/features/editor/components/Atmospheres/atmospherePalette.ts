/**
 * The four colours the design offers for an atmosphere, drawn from the Classical
 * ramp so a tinted node still sits on the warm ground.
 *
 * A custom picker sits beside them: stories written before this existed carry
 * arbitrary hex, and the swatches are a nudge rather than a restriction.
 */
export const ATMOSPHERE_COLOURS = [
  { value: '#c28d41', label: 'Gold' },
  { value: '#7d5411', label: 'Amber' },
  { value: '#5a3b0a', label: 'Umber' },
  { value: '#736c63', label: 'Ash' },
] as const;

export const isPaletteColour = (colour: string | undefined): boolean =>
  ATMOSPHERE_COLOURS.some((entry) => entry.value.toLowerCase() === colour?.toLowerCase());
