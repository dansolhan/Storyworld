import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { StatusData } from '../../../../domain/Story/StatusData';
import styles from './StatusDataWorkspace.module.css';

export interface StatusDataRowProps {
  entry: StatusData;
  columns: string;
  /** The entry's condition as a sentence, or empty for always. */
  shownWhen: string;
  isSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onMove: (delta: -1 | 1) => void;
}

export const StatusDataRow: React.FC<StatusDataRowProps> = ({
  entry,
  columns,
  shownWhen,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onMove,
}) => (
  <div
    role="row"
    aria-selected={isSelected}
    tabIndex={0}
    className={styles.row}
    style={{ gridTemplateColumns: columns }}
    data-selected={isSelected || undefined}
    onClick={onSelect}
    onFocus={onSelect}
  >
    <span className={styles.rowTitle}>
      {entry.color && (
        <span className={styles.colourDot} style={{ backgroundColor: entry.color }} aria-hidden="true" />
      )}
      {/* A title-less entry is deliberate, not unfinished: the value carries it. */}
      {entry.title || <span className={styles.valueOnly}>value only</span>}
    </span>

    <span className={styles.rowValue}>{entry.value || '—'}</span>

    {/* "Always" is stated rather than left blank: a blank cell reads as unfinished. */}
    <span className={shownWhen ? styles.rowCondition : styles.rowAlways}>
      {shownWhen || 'Always'}
    </span>

    <span className={styles.rowOrder}>
      <button
        type="button"
        className={styles.control}
        disabled={!canMoveUp}
        aria-label={`Move ${entry.title || 'entry'} up`}
        onClick={(event) => {
          event.stopPropagation();
          onMove(-1);
        }}
      >
        <ChevronUp className={styles.controlIcon} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.control}
        disabled={!canMoveDown}
        aria-label={`Move ${entry.title || 'entry'} down`}
        onClick={(event) => {
          event.stopPropagation();
          onMove(1);
        }}
      >
        <ChevronDown className={styles.controlIcon} aria-hidden="true" />
      </button>
    </span>
  </div>
);
