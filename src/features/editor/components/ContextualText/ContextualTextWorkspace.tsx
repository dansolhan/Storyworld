import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useContextualUsage } from '../../hooks/data/useContextualUsage';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import { groupContextualEntries, type ContextualRow } from './contextualGroups';
import { ContextualEntryRow } from './ContextualEntryRow';
import { DeleteEntityDialog } from '../DataWorkspace/DeleteEntityDialog';
import { EMPTY_USAGE } from '../../usage/usageReference';
import type { ContextualEntry } from '../../../../domain/ContextualText/ContextualEntry';
import styles from './ContextualTextWorkspace.module.css';

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Contextual entries, grouped by reuse.
 *
 * The design's ordering, and for a reason: whether an entry is shared changes what
 * editing it does, so that is the first thing to know. The phrase is the row's
 * identity — a title was optional and most entries never had one, which is why the
 * old explorer was a list of "(NO TITLE)".
 */
export const ContextualTextWorkspace: React.FC = () => {
  const { contextualText, pages, updateContextualEntry, removeContextualEntry, mergeContextualEntries } =
    useEditorStore(
      useShallow((state) => ({
        contextualText: state.contextualText,
        pages: state.pages,
        updateContextualEntry: state.updateContextualEntry,
        removeContextualEntry: state.removeContextualEntry,
        mergeContextualEntries: state.mergeContextualEntries,
      }))
    );

  const usage = useContextualUsage();
  const revealPage = useRevealPage();
  const [filter, setFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ContextualEntry | null>(null);

  const pageTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const page of Object.values(pages ?? {})) titles[page.id] = page.title || 'Untitled page';
    return titles;
  }, [pages]);

  const groups = useMemo(
    () => groupContextualEntries(contextualText ?? {}, usage.pageIds, usage.markCounts, pageTitles),
    [contextualText, usage.pageIds, usage.markCounts, pageTitles]
  );

  const matches = (row: ContextualRow): boolean => {
    const query = filter.trim().toLowerCase();
    if (!query) return true;
    return `${row.entry.phrase} ${row.entry.title ?? ''} ${row.entry.text}`
      .toLowerCase()
      .includes(query);
  };

  const section = (title: string, explanation: string, rows: ContextualRow[]) => {
    const visible = rows.filter(matches);
    if (visible.length === 0) return null;

    return (
      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <h2 className={styles.groupTitle}>{title}</h2>
          <span className={styles.groupCount}>{visible.length}</span>
        </header>
        <p className={styles.groupExplanation}>{explanation}</p>

        {visible.map((row) => (
          <ContextualEntryRow
            key={row.entry.id}
            row={row}
            onChange={(updates) => updateContextualEntry(row.entry.id, updates)}
            onDelete={() => setPendingDelete(row.entry)}
            onRevealPage={(pageId) => revealPage({ pageId })}
          />
        ))}
      </section>
    );
  };

  const total = Object.keys(contextualText ?? {}).length;

  return (
    <>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Contextual text</h1>
            <p className={styles.explanation}>
              Notes a reader can open from a marked phrase. One entry can be marked in many places.
            </p>
          </div>

          <input
            className={styles.filter}
            type="search"
            value={filter}
            placeholder="Filter entries…"
            aria-label="Filter entries"
            onChange={(event) => setFilter(event.target.value)}
          />
        </header>

        <div className={styles.body}>
          {total === 0 ? (
            <p className={styles.empty}>
              No entries yet. Select a phrase while writing and choose Contextual text.
            </p>
          ) : (
            <>
              {/*
                Offered rather than done: the migration will not decide that two
                identical notes are the same entry, because that guess cannot be
                taken back. Joining them is the author's call.
              */}
              {groups.duplicates.length > 0 && (
                <section className={styles.duplicates}>
                  <h2 className={styles.groupTitle}>Written more than once</h2>
                  <p className={styles.groupExplanation}>
                    These say exactly the same thing. Joining them means one entry to edit.
                  </p>
                  {groups.duplicates.map((duplicate) => (
                    <div key={duplicate.text} className={styles.duplicate}>
                      <span className={styles.duplicateText}>{duplicate.text}</span>
                      <span className={styles.duplicateMeta}>
                        {pluralise(duplicate.entries.length, 'entry').replace('entrys', 'entries')}
                      </span>
                      <button
                        type="button"
                        className={styles.join}
                        onClick={() =>
                          mergeContextualEntries(
                            duplicate.entries.map((entry) => entry.id),
                            duplicate.entries[0].id
                          )
                        }
                      >
                        Use one entry for all of these
                      </button>
                    </div>
                  ))}
                </section>
              )}

              {section(
                'Reused',
                'One entry, marked in several places. Editing it changes them all.',
                groups.reused
              )}
              {section('Used once', 'Marked in a single place.', groups.usedOnce)}
              {section(
                'Not marked anywhere',
                'Written, but no phrase points at them, so no reader can reach them.',
                groups.unused
              )}
            </>
          )}
        </div>
      </div>

      <DeleteEntityDialog
        name={pendingDelete?.phrase || 'this entry'}
        kind="contextual entry"
        usage={EMPTY_USAGE}
        isOpen={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeContextualEntry(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
};
