import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useEngine } from '../../adapter/useEngine';
import { useEngineStore } from '../../adapter/useEngineStore';
import styles from './DebugConsole.module.css';

/**
 * Every item the story defines, carried or not.
 *
 * Listing only what is held would make the tab useless for the thing authors
 * actually need it for — putting an item into the reader's pocket to see what a
 * later page does with it.
 */
export const DebugInventoryTab: React.FC = () => {
  const engine = useEngine();
  const inventory = useEngineStore((state) => state.inventory);
  const items = useEngineStore((state) => state.storyData?.items);
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return Object.entries(items ?? {})
      .filter(([id, item]) =>
        !query || id.toLowerCase().includes(query) || item.name?.toLowerCase().includes(query)
      )
      .sort(([, a], [, b]) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [items, filter]);

  const setCount = (itemId: string, count: number) =>
    engine.dispatch({ type: 'DEBUG_SET_INVENTORY', payload: { itemId, count } });

  return (
    <div className={styles.tabBody}>
      <input
        type="search"
        className={styles.field}
        placeholder="Filter items"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      <div className={styles.rows}>
        {rows.map(([itemId, item]) => {
          const count = inventory[itemId] ?? 0;

          return (
            <div key={itemId} className={styles.row}>
              <div className={styles.rowLabel}>
                <span className={styles.rowName}>
                  {count > 0 && <span className={styles.dirtyDot} aria-label="Carried" />}
                  {item.name || itemId}
                </span>
                <span className={styles.rowMeta}>{item.multiple ? 'stackable' : 'single'}</span>
              </div>

              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setCount(itemId, count - 1)}
                  disabled={count === 0}
                  aria-label={`Remove one ${item.name || itemId}`}
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  className={`${styles.field} ${styles.fieldCount}`}
                  value={count}
                  min={0}
                  onChange={(event) => setCount(itemId, Number(event.target.value))}
                  aria-label={`${item.name || itemId} count`}
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  /* A non-stackable item is held or not; the step is capped at one. */
                  onClick={() => setCount(itemId, item.multiple ? count + 1 : 1)}
                  disabled={!item.multiple && count > 0}
                  aria-label={`Add one ${item.name || itemId}`}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className={styles.empty}>
            {filter ? 'No item matched.' : 'This story defines no items.'}
          </p>
        )}
      </div>
    </div>
  );
};
