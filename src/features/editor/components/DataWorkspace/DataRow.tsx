import React from 'react';
import styles from './DataRow.module.css';

export interface DataRowProps {
  isSelected: boolean;
  onSelect: () => void;
  columnTemplate: string;
  /** Accessible name for the row, since its cells are not all text. */
  label: string;
  children: React.ReactNode;
}

/**
 * A selectable table row. The active marker occupies its 2px at rest, so
 * selecting never shifts the columns.
 */
export const DataRow: React.FC<DataRowProps> = ({
  isSelected,
  onSelect,
  columnTemplate,
  label,
  children,
}) => (
  <div
    role="row"
    aria-selected={isSelected}
    tabIndex={0}
    aria-label={label}
    className={styles.row}
    data-selected={isSelected || undefined}
    style={{ gridTemplateColumns: columnTemplate }}
    onClick={onSelect}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
      }
    }}
  >
    {children}
  </div>
);
