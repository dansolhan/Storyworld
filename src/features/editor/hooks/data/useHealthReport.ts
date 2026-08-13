import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useUsageIndex } from './useUsageIndex';
import { buildHealthReport } from '../../health/buildHealthReport';
import type { HealthReport } from '../../health/healthFinding';

/**
 * What is wrong with the story, derived rather than stored.
 *
 * Memoised on the identity of the collections it reads — slices replace them
 * immutably, so it recomputes on an edit and never on UI churn. The rail reads
 * this too, which is why it has to be cheap enough to sit in the shell.
 */
export const useHealthReport = (): HealthReport => {
  const sources = useEditorStore(
    useShallow((state) => ({
      pages: state.pages,
      items: state.items,
      variables: state.variables,
      audio: state.audio,
      atmospheres: state.atmospheres,
      startPageId: state.startPageId,
    }))
  );
  const usage = useUsageIndex();

  return useMemo(
    () =>
      buildHealthReport({
        pages: sources.pages ?? {},
        items: sources.items ?? {},
        variables: sources.variables ?? {},
        audio: sources.audio ?? {},
        atmospheres: sources.atmospheres ?? {},
        startPageId: sources.startPageId ?? null,
        usage,
      }),
    [sources, usage]
  );
};
