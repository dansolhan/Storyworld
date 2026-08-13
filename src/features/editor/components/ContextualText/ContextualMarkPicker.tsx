import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useContextualUsage } from '../../hooks/data/useContextualUsage';
import { Popover } from '../../../../components/ui/Popover/Popover';
import type { ContextualTextPickerProps } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import styles from './ContextualMarkPicker.module.css';

const pluralise = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Choosing which entry a phrase points at.
 *
 * A picker, not a blank form — which is the whole change at 6a. Before, marking a
 * phrase always wrote a fresh copy of the note, so the same explanation ended up
 * duplicated across pages with no way to edit them together. Now the existing
 * entries come first and writing a new one is the fallback.
 */
export const ContextualMarkPicker: React.FC<ContextualTextPickerProps> = ({
  request,
  onAttach,
  onCancel,
}) => {
  const { contextualText, addContextualEntry } = useEditorStore(
    useShallow((state) => ({
      contextualText: state.contextualText,
      addContextualEntry: state.addContextualEntry,
    }))
  );
  const usage = useContextualUsage();

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string | null>(null);

  const entries = useMemo(() => {
    const all = Object.values(contextualText ?? {});
    const terms = query.trim().toLowerCase();
    if (!terms) return all;
    return all.filter((entry) =>
      `${entry.phrase} ${entry.title ?? ''} ${entry.text}`.toLowerCase().includes(terms)
    );
  }, [contextualText, query]);

  const writeNew = () => {
    const id = `ctx-${crypto.randomUUID().slice(0, 8)}`;
    addContextualEntry({ id, phrase: request.phrase, text: draft ?? '' });
    onAttach(id);
  };

  return (
    <Popover
      isOpen
      onClose={onCancel}
      x={request.x}
      y={request.y}
      className={styles.panel}
    >
      <div className={styles.picker}>
        <header className={styles.header}>
          <p className={styles.kicker}>Contextual text</p>
          <p className={styles.phrase}>“{request.phrase}”</p>
        </header>

        {draft === null ? (
          <>
            <input
              className={styles.query}
              value={query}
              autoFocus
              aria-label="Search contextual entries"
              placeholder="Search existing entries…"
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className={styles.list} role="listbox" aria-label="Contextual entries">
              {entries.length === 0 ? (
                <p className={styles.empty}>
                  {Object.keys(contextualText ?? {}).length === 0
                    ? 'No entries yet. Write the first one.'
                    : 'No entry matches that.'}
                </p>
              ) : (
                entries.map((entry) => {
                  const pages = usage.pageIds[entry.id]?.length ?? 0;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="option"
                      aria-selected={entry.id === request.entryId}
                      className={styles.entry}
                      data-current={entry.id === request.entryId || undefined}
                      onClick={() => onAttach(entry.id)}
                    >
                      <span className={styles.entryPhrase}>{entry.phrase}</span>
                      <span className={styles.entryText}>{entry.text || 'No text yet'}</span>
                      <span className={styles.entryMeta}>
                        {pages > 0 ? `on ${pluralise(pages, 'page')}` : 'not marked anywhere yet'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <footer className={styles.footer}>
              <button type="button" className={styles.newEntry} onClick={() => setDraft('')}>
                + Write a new entry
              </button>
            </footer>
          </>
        ) : (
          <div className={styles.draft}>
            <label className={styles.draftField}>
              <span className={styles.kicker}>What the reader is told</span>
              <textarea
                className={styles.draftInput}
                value={draft}
                autoFocus
                rows={3}
                placeholder="Looks onto an old shrine…"
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>

            <div className={styles.draftActions}>
              <button type="button" className={styles.cancel} onClick={() => setDraft(null)}>
                Back to the list
              </button>
              <button
                type="button"
                className={styles.save}
                disabled={draft.trim() === ''}
                onClick={writeNew}
              >
                Attach
              </button>
            </div>
          </div>
        )}
      </div>
    </Popover>
  );
};
