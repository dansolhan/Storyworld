import React from 'react';
import { Plus } from 'lucide-react';
import styles from './DataWorkspace.module.css';

export interface DataWorkspaceProps {
  title: string;
  /** One line saying what these things are for. */
  explanation: string;
  filter: string;
  onFilterChange: (value: string) => void;
  filterPlaceholder: string;
  newLabel: string;
  onNew: () => void;
  /** Column headings, in order. */
  columns: string[];
  /** CSS grid template shared by the header row and every body row. */
  columnTemplate: string;
  /** Body rows, each rendered by the entity's own component. */
  children: React.ReactNode;
  /** The 400px panel; absent when nothing is selected. */
  detail?: React.ReactNode;
  /** Shown in place of rows when the collection or the filter yields nothing. */
  emptyMessage: string;
  isEmpty: boolean;
}

/**
 * The chrome every data surface shares: header, filter, a table frame and the
 * detail panel beside it.
 *
 * Deliberately not a generic table — the entities have almost no fields in
 * common, so each supplies its own rows and its own detail form. What is shared
 * is the shape of the screen, which is what makes them feel like one workspace.
 */
export const DataWorkspace: React.FC<DataWorkspaceProps> = ({
  title,
  explanation,
  filter,
  onFilterChange,
  filterPlaceholder,
  newLabel,
  onNew,
  columns,
  columnTemplate,
  children,
  detail,
  emptyMessage,
  isEmpty,
}) => (
  <div className={styles.workspace}>
    <div className={styles.main}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.explanation}>{explanation}</p>
        </div>

        <input
          className={styles.filter}
          type="search"
          value={filter}
          placeholder={filterPlaceholder}
          aria-label={filterPlaceholder}
          onChange={(event) => onFilterChange(event.target.value)}
        />

        <button type="button" className={styles.new} onClick={onNew}>
          <Plus className={styles.newIcon} aria-hidden="true" />
          {newLabel}
        </button>
      </header>

      <div className={styles.table} role="table" aria-label={title}>
        <div className={styles.headerRow} role="row" style={{ gridTemplateColumns: columnTemplate }}>
          {columns.map((column) => (
            <span key={column} role="columnheader" className={styles.columnHeading}>
              {column}
            </span>
          ))}
        </div>

        <div className={styles.rows}>
          {isEmpty ? <p className={styles.empty}>{emptyMessage}</p> : children}
        </div>
      </div>
    </div>

    {detail && <aside className={styles.detail}>{detail}</aside>}
  </div>
);
