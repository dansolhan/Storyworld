import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useHealthReport } from '../data/useHealthReport';
import type { RailCountKey } from '../../components/EditorShell/railConfig';

export type RailCounts = Record<RailCountKey, number>;

/**
 * The trailing figures on the rail's DATA items. Recomputed only when the
 * underlying collections change identity — slices replace them immutably, so
 * ordinary UI churn never re-counts.
 */
export const useRailCounts = (): RailCounts => {
  const health = useHealthReport();
  const collections = useEditorStore(
    useShallow((state) => ({
      items: state.items,
      variables: state.variables,
      audio: state.audio,
      atmospheres: state.atmospheres,
      statusData: state.statusData,
      contextualText: state.contextualText,
    }))
  );

  return useMemo(
    () => ({
      health: health.breakingCount,
      items: Object.keys(collections.items ?? {}).length,
      variables: Object.keys(collections.variables ?? {}).length,
      audio: Object.keys(collections.audio ?? {}).length,
      atmospheres: Object.keys(collections.atmospheres ?? {}).length,
      statusData: (collections.statusData ?? []).length,
      /*
       * Entries, not marks. They were the same figure until 1.3.0 made entries
       * shared — an entry marked on three pages is one thing to edit, and the
       * workspace lists one row for it.
       */
      context: Object.keys(collections.contextualText ?? {}).length,
    }),
    [collections, health.breakingCount]
  );
};
