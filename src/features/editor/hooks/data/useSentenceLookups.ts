import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import type { SentenceLookups } from '../../components/RuleEditor/sentence/conditionText';

/**
 * What a condition needs to render as text: page titles, item names, subplot names.
 *
 * Memoised on the identity of the collections it reads, so a table of condition
 * sentences does not rebuild the title map per row.
 */
export const useSentenceLookups = (): SentenceLookups => {
  const sources = useEditorStore(
    useShallow((state) => ({
      pages: state.pages,
      items: state.items,
      subplots: state.subplots,
    }))
  );

  return useMemo(() => {
    const pageTitles: Record<string, string> = {};
    for (const page of Object.values(sources.pages ?? {})) {
      pageTitles[page.id] = page.title || 'Untitled page';
    }
    return {
      pageTitles,
      items: sources.items ?? {},
      subplots: sources.subplots ?? [],
    };
  }, [sources]);
};
