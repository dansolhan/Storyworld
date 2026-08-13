import React, { useMemo } from 'react';
import { useEngineStore } from '../../adapter/useEngineStore';
import {
  byStatusPriority,
  statusEntryIsVisible,
} from '../../../../lib/engine/logic/statusVisibility';
import styles from './StatusDataDisplay.module.css';

/**
 * Interpolates {{ varName }} placeholders in a template string using the
 * current runtime variable values from the engine store.
 */
function interpolate(
  template: string,
  variables: Record<string, { value: string | number | boolean }>
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = variables[key];
    return v !== undefined ? String(v.value) : `{{${key}}}`;
  });
}

export const StatusDataDisplay: React.FC = () => {
  const storyData = useEngineStore((s) => s.storyData);
  const variables = useEngineStore((s) => s.variables);
  const visitedPageIds = useEngineStore((s) => s.visitedPageIds);
  const currentPageId = useEngineStore((s) => s.currentPageId);
  const inventory = useEngineStore((s) => s.inventory);

  const evalContext = useMemo(
    () => ({ 
      variables, 
      visitedPageIds, 
      currentPageId: currentPageId || '', 
      inventory 
    }),
    [variables, visitedPageIds, currentPageId, inventory]
  );

  const visibleEntries = useMemo(() => {
    const entries = storyData?.statusData ?? [];
    return byStatusPriority(entries).filter((entry) => statusEntryIsVisible(entry, evalContext));
  }, [storyData?.statusData, evalContext]);

  if (visibleEntries.length === 0) return null;

  /*
   * No heading: the verso already says "The reader's ledger", and a second title
   * over three rows would be furniture rather than information.
   */
  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusList}>
        {visibleEntries.map((entry) => {
          const hasValue = entry.value !== undefined && entry.value.trim() !== '';
          const resolvedValue = hasValue ? interpolate(entry.value!, variables) : '';

          return (
            <div
              key={entry.id}
              className={styles.statusEntry}
              style={entry.color ? { color: entry.color } : undefined}
            >
              {entry.title && <span className={styles.statusLabel}>{entry.title}</span>}
              {hasValue && (
                <span className={styles.statusValue}>{resolvedValue}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
