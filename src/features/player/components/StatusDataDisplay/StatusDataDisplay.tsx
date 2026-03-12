import React, { useMemo } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { evaluateVisibility } from '../../conditionals/evaluator';
import styles from './StatusDataDisplay.module.css';

/**
 * Interpolates {{ varName }} placeholders in a template string using the
 * current runtime variable values from the player store.
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
  const storyData = usePlayerStore((s) => s.storyData);
  const variables = usePlayerStore((s) => s.variables);
  const visitedPageIds = usePlayerStore((s) => s.visitedPageIds);
  const currentPageId = usePlayerStore((s) => s.currentPageId);
  const inventory = usePlayerStore((s) => s.inventory);

  const evalContext = useMemo(
    () => ({ variables, visitedPageIds, currentPageId, inventory }),
    [variables, visitedPageIds, currentPageId, inventory]
  );

  const visibleEntries = useMemo(() => {
    const entries = storyData?.statusData ?? [];
    return entries
      .slice() // don't mutate
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .filter((entry) => evaluateVisibility({ conditionals: entry.conditionals }, evalContext));
  }, [storyData?.statusData, evalContext]);

  if (visibleEntries.length === 0) return null;

  return (
    <div className={styles.statusContainer}>
      <h2 className={styles.statusTitle}>Status</h2>
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
              {entry.title && (
                <span className={styles.statusLabel}>
                  {entry.title}{hasValue ? ':' : ''}
                </span>
              )}
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
