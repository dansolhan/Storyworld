import React from 'react';
import styles from './EmptyShelf.module.css';

export interface EmptyShelfProps {
  onCreateNew: () => void;
  onLoadDemo: () => void;
  onImport: () => void;
}

/**
 * What the dashboard says before there is anything to say.
 *
 * A dashed panel rather than an empty grid, and it offers the three ways in
 * rather than only the obvious one — most people meeting this app want to read
 * the demo before writing anything.
 */
export const EmptyShelf: React.FC<EmptyShelfProps> = ({ onCreateNew, onLoadDemo, onImport }) => (
  <section className={styles.panel}>
    <p className={styles.kicker}>With nothing on the shelf</p>
    <h2 className={styles.heading}>Begin a story</h2>
    <p className={styles.guidance}>
      A story is a handful of pages and the choices between them. Start with one page and see where
      the reader could go.
    </p>

    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={onCreateNew}>
        + New story
      </button>
      <button type="button" className={styles.link} onClick={onLoadDemo}>
        Load the demo
      </button>
      <button type="button" className={styles.link} onClick={onImport}>
        Import a file
      </button>
    </div>
  </section>
);
