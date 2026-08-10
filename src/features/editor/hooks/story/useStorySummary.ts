import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';

export interface StorySummary {
  title: string;
  description: string;
  pageCount: number;
  choiceCount: number;
  subplotCount: number;
  /** Pages with no choices and no way onward — worth knowing about. */
  deadEndCount: number;
  startPageTitle: string | null;
}

/**
 * Story-level facts for the inspector's resting state.
 *
 * Deliberately only things the app can actually determine from the graph — the
 * same rule the Story Health view will follow.
 */
export const useStorySummary = (): StorySummary => {
  const source = useEditorStore(
    useShallow((state) => ({
      title: state.storyTitle,
      description: state.storyDescription,
      pages: state.pages,
      subplots: state.subplots,
      startPageId: state.startPageId,
    }))
  );

  return useMemo(() => {
    const pages = Object.values(source.pages ?? {});
    const choiceCount = pages.reduce((total, page) => total + page.choices.length, 0);
    const deadEndCount = pages.filter((page) => page.choices.length === 0).length;
    const startPage = source.startPageId ? source.pages[source.startPageId] : undefined;

    return {
      title: source.title,
      description: source.description,
      pageCount: pages.length,
      choiceCount,
      subplotCount: (source.subplots ?? []).length,
      deadEndCount,
      startPageTitle: startPage?.title ?? null,
    };
  }, [source]);
};
