import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import type { RailCountKey } from '../../components/EditorShell/railConfig';
import type { Page } from '../../../../domain/Page/Page';

export type RailCounts = Record<RailCountKey, number>;

/**
 * Contextual entries have no collection of their own — they live as marks
 * inside paragraph HTML. `ContextManager` extracts them with a DOMParser,
 * which is far more than a rail badge needs, so the count is taken from the
 * class token directly.
 */
const CONTEXTUAL_MARK_CLASS = 'contextual-text-mark';

const countContextualMarks = (pages: Record<string, Page>): number => {
  let total = 0;
  for (const page of Object.values(pages)) {
    for (const paragraph of page.paragraphs) {
      let index = paragraph.text.indexOf(CONTEXTUAL_MARK_CLASS);
      while (index !== -1) {
        total += 1;
        index = paragraph.text.indexOf(CONTEXTUAL_MARK_CLASS, index + CONTEXTUAL_MARK_CLASS.length);
      }
    }
  }
  return total;
};

/**
 * The trailing figures on the rail's DATA items. Recomputed only when the
 * underlying collections change identity — slices replace them immutably, so
 * ordinary UI churn never re-counts.
 */
export const useRailCounts = (): RailCounts => {
  const collections = useEditorStore(
    useShallow((state) => ({
      items: state.items,
      variables: state.variables,
      audio: state.audio,
      atmospheres: state.atmospheres,
      statusData: state.statusData,
      pages: state.pages,
    }))
  );

  return useMemo(
    () => ({
      items: Object.keys(collections.items ?? {}).length,
      variables: Object.keys(collections.variables ?? {}).length,
      audio: Object.keys(collections.audio ?? {}).length,
      atmospheres: Object.keys(collections.atmospheres ?? {}).length,
      statusData: (collections.statusData ?? []).length,
      context: countContextualMarks(collections.pages ?? {}),
    }),
    [collections]
  );
};
