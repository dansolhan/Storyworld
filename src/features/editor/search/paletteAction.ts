export interface PaletteAction {
  id: string;
  label: string;
  /** Lower-cased `label`, so filtering never re-lowercases. */
  haystack: string;
  run: () => void;
}

export const paletteAction = (id: string, label: string, run: () => void): PaletteAction => ({
  id,
  label,
  haystack: label.toLowerCase(),
  run,
});
