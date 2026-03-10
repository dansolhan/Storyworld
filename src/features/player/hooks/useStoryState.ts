import { usePlayerStore } from '../store/usePlayerStore';
import { evaluateVisibility } from '../conditionals/evaluator';
import { useMemo } from 'react';
import { usePageId } from '../context/PageContext';

export const useCurrentPage = (overridePageId?: string) => {
  const storyData = usePlayerStore((s) => s.storyData);
  const globalPageId = usePlayerStore((s) => s.currentPageId);
  const contextPageId = usePageId();

  const activeId = overridePageId ?? contextPageId ?? globalPageId;

  return useMemo(() => {
    return storyData?.pages.find((p) => p.id === activeId);
  }, [storyData, activeId]);
};

export const useVisibleParagraphs = (overridePageId?: string) => {
  const currentPage = useCurrentPage(overridePageId);
  const variables = usePlayerStore((s) => s.variables);
  const visitedPageIds = usePlayerStore((s) => s.visitedPageIds);
  const inventory = usePlayerStore((s) => s.inventory);
  const globalPageId = usePlayerStore((s) => s.currentPageId);
  const contextPageId = usePageId();

  const activeId = overridePageId ?? contextPageId ?? globalPageId;

  return useMemo(() => {
    if (!currentPage || !currentPage.paragraphs) return [];
    const context = { variables, visitedPageIds, currentPageId: activeId, inventory };
    return currentPage.paragraphs.filter(p => evaluateVisibility(p, context));
  }, [currentPage, variables, visitedPageIds, inventory, activeId]);
};

export const useVisibleChoices = (overridePageId?: string) => {
  const currentPage = useCurrentPage(overridePageId);
  const variables = usePlayerStore((s) => s.variables);
  const visitedPageIds = usePlayerStore((s) => s.visitedPageIds);
  const inventory = usePlayerStore((s) => s.inventory);
  const globalPageId = usePlayerStore((s) => s.currentPageId);
  const contextPageId = usePageId();

  const activeId = overridePageId ?? contextPageId ?? globalPageId;

  return useMemo(() => {
    if (!currentPage || !currentPage.choices) return [];
    const context = { variables, visitedPageIds, currentPageId: activeId, inventory };
    return currentPage.choices.filter(c => evaluateVisibility(c, context));
  }, [currentPage, variables, visitedPageIds, inventory, activeId]);
};
