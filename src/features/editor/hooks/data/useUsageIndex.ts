import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { buildUsageIndex } from '../../usage/buildUsageIndex';
import { EMPTY_USAGE, type UsageEntry, type UsageIndex, type UsageKind } from '../../usage/usageReference';

/**
 * Every reference from the story to the things it is built out of.
 *
 * Memoised on the identity of the collections it scans — slices replace them
 * immutably, so it recomputes on an edit and never on UI churn.
 */
export const useUsageIndex = (): UsageIndex => {
  const sources = useEditorStore(
    useShallow((state) => ({
      pages: state.pages,
      items: state.items,
      atmospheres: state.atmospheres,
      statusData: state.statusData,
    }))
  );

  return useMemo(
    () =>
      buildUsageIndex({
        pages: sources.pages ?? {},
        items: sources.items ?? {},
        atmospheres: sources.atmospheres ?? {},
        statusData: sources.statusData ?? [],
      }),
    [sources]
  );
};

/** Usage for one entity, with an empty entry rather than undefined. */
export const usageFor = (index: UsageIndex, kind: UsageKind, id: string): UsageEntry =>
  index[kind][id] ?? EMPTY_USAGE;
