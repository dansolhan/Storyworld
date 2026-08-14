import React, { useMemo, useState } from 'react';
import { CornerDownRight, RefreshCw } from 'lucide-react';
import { useEngine } from '../../adapter/useEngine';
import { useEngineStore } from '../../adapter/useEngineStore';
import styles from './DebugConsole.module.css';

/**
 * Where the reader has been, and where to put them next.
 *
 * The visited list is editable because it is a condition source in its own right —
 * "if the reader has seen the crypt" is as common a gate as any variable, and
 * without this tab the only way to satisfy one is to walk the graph.
 */
export const DebugPagesTab: React.FC = () => {
  const engine = useEngine();
  const pages = useEngineStore((state) => state.storyData?.pages);
  const visitedPageIds = useEngineStore((state) => state.visitedPageIds);
  const currentPageId = useEngineStore((state) => state.currentPageId);
  const [filter, setFilter] = useState('');

  const visited = useMemo(() => new Set(visitedPageIds), [visitedPageIds]);

  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return pages ?? [];
    return (pages ?? []).filter((page) => page.title?.toLowerCase().includes(query));
  }, [pages, filter]);

  return (
    <div className={styles.tabBody}>
      <div className={styles.actionBar}>
        <input
          type="search"
          className={styles.field}
          placeholder="Filter pages"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <button
          type="button"
          className={styles.action}
          onClick={() => engine.dispatch({ type: 'DEBUG_REENTER_PAGE' })}
          /*
           * The one place enter events are re-run on purpose. Loading a snapshot
           * deliberately does not, or the page would overwrite what was just loaded.
           */
          title="Run this page's onEnter events again"
        >
          <RefreshCw size={13} />
          Re-enter
        </button>
      </div>

      <div className={styles.rows}>
        {rows.map((page) => {
          const isCurrent = page.id === currentPageId;

          return (
            <div key={page.id} className={`${styles.row} ${isCurrent ? styles.rowCurrent : ''}`}>
              <label className={styles.rowLabel}>
                <input
                  type="checkbox"
                  checked={visited.has(page.id)}
                  onChange={(event) =>
                    engine.dispatch({
                      type: 'DEBUG_SET_VISITED',
                      payload: { pageId: page.id, visited: event.target.checked },
                    })
                  }
                  aria-label={`Visited ${page.title || page.id}`}
                />
                <span className={styles.rowName}>{page.title || page.id}</span>
              </label>

              {isCurrent ? (
                <span className={styles.rowMeta}>here</span>
              ) : (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() =>
                    engine.dispatch({ type: 'DEBUG_GO_TO_PAGE', payload: { pageId: page.id } })
                  }
                  title="Move here without taking a choice"
                  aria-label={`Go to ${page.title || page.id}`}
                >
                  <CornerDownRight size={13} />
                </button>
              )}
            </div>
          );
        })}

        {rows.length === 0 && <p className={styles.empty}>No page matched.</p>}
      </div>
    </div>
  );
};
