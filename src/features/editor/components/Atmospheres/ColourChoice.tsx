import React from 'react';
import { ATMOSPHERE_COLOURS, isPaletteColour } from './atmospherePalette';
import styles from './AtmosphereRow.module.css';

export interface ColourChoiceProps {
  colour: string | undefined;
  onChange: (colour: string) => void;
}

/**
 * The four palette swatches, plus a custom picker.
 *
 * A colour already set outside the palette gets its own swatch, so choosing from
 * the four is never the only way to keep what a story already has.
 */
export const ColourChoice: React.FC<ColourChoiceProps> = ({ colour, onChange }) => {
  const showsExisting = Boolean(colour) && !isPaletteColour(colour);

  return (
    <div className={styles.colours}>
      {ATMOSPHERE_COLOURS.map((entry) => (
        <button
          key={entry.value}
          type="button"
          className={styles.swatch}
          data-selected={entry.value.toLowerCase() === colour?.toLowerCase() || undefined}
          style={{ backgroundColor: entry.value }}
          aria-label={entry.label}
          aria-pressed={entry.value.toLowerCase() === colour?.toLowerCase()}
          onClick={() => onChange(entry.value)}
        />
      ))}

      {showsExisting && (
        <span
          className={styles.swatch}
          data-selected
          style={{ backgroundColor: colour }}
          title={`${colour} — already set on this atmosphere`}
        />
      )}

      <label className={styles.customColour}>
        <span className={styles.customColourLabel}>Custom</span>
        <input
          type="color"
          className={styles.colourInput}
          value={colour || ATMOSPHERE_COLOURS[0].value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
};
