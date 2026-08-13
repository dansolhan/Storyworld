import React from 'react';
import type { PreviewEntry } from './statusPreview';
import styles from './StatusDataWorkspace.module.css';

export interface StatusLedgerPreviewProps {
  entries: PreviewEntry[];
}

/**
 * What the reader would see at the start of the story.
 *
 * Hidden entries are greyed with their reason rather than omitted — in the editor
 * the useful thing is seeing that an entry exists and why it is not showing. The
 * player omits them entirely, which is why the note below says so out loud.
 */
export const StatusLedgerPreview: React.FC<StatusLedgerPreviewProps> = ({ entries }) => (
  <aside className={styles.preview} aria-label="Ledger preview">
    <h2 className={styles.previewTitle}>The reader’s ledger</h2>
    <p className={styles.previewNote}>At the start of the story, with the starting values.</p>

    {entries.length === 0 ? (
      <p className={styles.previewEmpty}>Nothing to show yet.</p>
    ) : (
      <ul className={styles.previewList}>
        {entries.map(({ entry, value, isVisible, reason }) => (
          <li key={entry.id} className={styles.previewEntry} data-hidden={!isVisible || undefined}>
            <span className={styles.previewRow}>
              {/* No title is a real shape — a value-only entry like "☠ Poisoned".
                  The player omits the label entirely there, so this does too. */}
              {entry.title && (
                <span className={styles.previewLabel} style={entry.color ? { color: entry.color } : undefined}>
                  {entry.title}
                  {value ? ':' : ''}
                </span>
              )}
              {value && <span className={styles.previewValue}>{value}</span>}
            </span>
            {!isVisible && <span className={styles.previewReason}>{reason}</span>}
          </li>
        ))}
      </ul>
    )}

    {entries.some((entry) => !entry.isVisible) && (
      <p className={styles.previewFootnote}>
        Greyed entries are shown here only. The reader sees nothing in their place.
      </p>
    )}
  </aside>
);
