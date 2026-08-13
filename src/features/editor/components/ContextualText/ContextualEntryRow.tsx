import React from 'react';
import { Crosshair } from 'lucide-react';
import type { ContextualRow } from './contextualGroups';
import type { ContextualEntry } from '../../../../domain/ContextualText/ContextualEntry';
import styles from './ContextualTextWorkspace.module.css';

export interface ContextualEntryRowProps {
  row: ContextualRow;
  onChange: (updates: Partial<ContextualEntry>) => void;
  onDelete: () => void;
  onRevealPage: (pageId: string) => void;
}

/** How many page chips fit before the rest are counted, per the design's "+ n more". */
const CHIP_LIMIT = 3;

/**
 * One entry, edited in place.
 *
 * The phrase is the row's identity and its heading; the text is editable inline
 * because an entry has one field worth changing and a detail panel for it would be
 * a click in the way.
 */
export const ContextualEntryRow: React.FC<ContextualEntryRowProps> = ({
  row,
  onChange,
  onDelete,
  onRevealPage,
}) => {
  const { entry, pageIds, pageTitles } = row;
  const shown = pageIds.slice(0, CHIP_LIMIT);
  const overflow = pageIds.length - shown.length;

  return (
    <article className={styles.row}>
      <div className={styles.rowPhrase}>
        <span className={styles.phrase}>{entry.phrase}</span>
        {entry.title && <span className={styles.rowTitle}>{entry.title}</span>}
      </div>

      <div className={styles.rowBody}>
        <textarea
          className={styles.text}
          value={entry.text}
          rows={2}
          aria-label={`Text for “${entry.phrase}”`}
          placeholder="What the reader is told…"
          onChange={(event) => onChange({ text: event.target.value })}
        />

        <div className={styles.chips}>
          {shown.map((pageId, index) => (
            <button
              key={pageId}
              type="button"
              className={styles.chip}
              onClick={() => onRevealPage(pageId)}
              title="Show on canvas"
            >
              <Crosshair className={styles.chipIcon} aria-hidden="true" />
              {pageTitles[index]}
            </button>
          ))}
          {overflow > 0 && <span className={styles.more}>+ {overflow} more</span>}
          {pageIds.length === 0 && <span className={styles.more}>Not marked anywhere</span>}

          <button type="button" className={styles.delete} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};
