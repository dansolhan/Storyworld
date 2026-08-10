import React, { useMemo, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useSearchIndex } from '../../hooks/search/useSearchIndex';
import { usePaletteActions } from '../../hooks/search/usePaletteActions';
import { useRevealPage } from '../../hooks/view/useRevealPage';
import { browseEntries, matchEntries } from '../../search/matchEntries';
import { buildPaletteGroups, firstAction, flattenRows, type PaletteRow } from '../../search/paletteRows';
import { excerpt } from '../../search/excerpt';
import { hasShortcutModifier, shortcutLabel } from '../../../../utils/platform';
import type { MenuConfig } from '../../../../config/menuConfig';
import type { InspectorTab } from '../../store/inspectorTab';
import styles from './CommandPalette.module.css';

export interface PaletteContentProps {
  menus: MenuConfig[];
  onClose: () => void;
}

const LIST_ID = 'command-palette-results';

/**
 * The palette's query row and results.
 *
 * Mounted only while open — Radix unmounts dialog content on close — so the
 * query and highlight reset each time without any teardown code.
 */
export const PaletteContent: React.FC<PaletteContentProps> = ({ menus, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);

  const entries = useSearchIndex();
  const revealPage = useRevealPage();
  const actions = usePaletteActions({ query, menus, revealPage });

  const groups = useMemo(() => {
    const matches = query.trim() ? matchEntries(entries, query) : browseEntries(entries);
    return buildPaletteGroups(matches, actions);
  }, [entries, query, actions]);
  const rows = useMemo(() => flattenRows(groups), [groups]);

  if (query !== lastQuery) {
    // A new query means a new result set; the highlight belongs at the top.
    setLastQuery(query);
    setActiveIndex(0);
  }
  const highlighted = Math.min(activeIndex, Math.max(0, rows.length - 1));

  const openRow = (row: PaletteRow) => {
    if (row.type === 'action') {
      row.action.run();
    } else {
      const { entry } = row.match;
      const tab: InspectorTab | undefined =
        entry.kind === 'paragraph' ? 'write' : entry.kind === 'choice' ? 'choices' : undefined;
      revealPage(
        { pageId: entry.pageId, paragraphId: entry.paragraphId, choiceId: entry.choiceId },
        tab
      );
    }
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (rows.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + step + rows.length) % rows.length);
      return;
    }

    if (event.key !== 'Enter') return;
    event.preventDefault();

    /*
     * ⌘⏎ fires the first action whatever row is highlighted. The first action is
     * the best-matching command, or "New page …" when nothing else matched — so
     * typing a name that does not exist and pressing it creates the page.
     */
    if (hasShortcutModifier(event)) {
      const action = firstAction(actions);
      if (action) {
        action.run();
        onClose();
      }
      return;
    }

    const row = rows[highlighted];
    if (row) openRow(row);
  };

  const activeRowId = rows[highlighted]?.id;
  const storyTitle = useEditorStore((state) => state.storyTitle);

  return (
    <div className={styles.palette}>
      <div className={styles.queryRow}>
        <span className={styles.prompt} aria-hidden="true">
          ›
        </span>
        <input
          className={styles.input}
          value={query}
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={LIST_ID}
          aria-activedescendant={activeRowId ? `palette-row-${activeRowId}` : undefined}
          aria-label={`Search ${storyTitle || 'this story'}`}
          placeholder="Search pages, choices and text…"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className={styles.escHint}>esc</span>
      </div>

      <div className={styles.results} id={LIST_ID} role="listbox" aria-label="Results">
        {groups.length === 0 && <p className={styles.empty}>Nothing matches “{query}”.</p>}

        {groups.map((group) => (
          <section key={group.heading} className={styles.group}>
            <h3 className={styles.groupHeading}>
              {group.heading}
              {group.total > group.rows.length && (
                <span className={styles.groupCount}>
                  {group.rows.length} of {group.total} shown
                </span>
              )}
            </h3>

            {group.rows.map((row) => {
              const isActive = row.id === activeRowId;
              const isFirstAction = row.type === 'action' && row.id === firstAction(actions)?.id;

              return (
                <div
                  key={row.id}
                  id={`palette-row-${row.id}`}
                  role="option"
                  aria-selected={isActive}
                  className={styles.row}
                  data-active={isActive || undefined}
                  onMouseMove={() => setActiveIndex(rows.indexOf(row))}
                  onClick={() => openRow(row)}
                >
                  {row.type === 'action' ? (
                    <>
                      <span className={styles.rowLabel}>{row.action.label}</span>
                      {isFirstAction && (
                        <span className={styles.rowHint}>{shortcutLabel('⏎')}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className={styles.rowLabel}>
                        {row.match.entry.kind === 'paragraph'
                          ? `“${excerpt(row.match.entry.text, row.match.matchIndex)}”`
                          : row.match.entry.text}
                      </span>
                      <span className={styles.rowDetail}>
                        {row.match.entry.detail ?? 'jump to page'}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
};
