import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { contextIdsIn } from '../../../../domain/ContextualText/contextualMark';

export interface ContextualUsage {
  /** Distinct page ids each entry is marked on, keyed by entry id. */
  pageIds: Record<string, string[]>;
  /**
   * How many marks point at each entry.
   *
   * Not the same as the page count: one entry can be marked on two phrases in a
   * single paragraph, which is reuse even though it touches one page.
   */
  markCounts: Record<string, number>;
  /** Marks referring to an entry that no longer exists. */
  dangling: { pageId: string; pageTitle: string; entryId: string }[];
}

/**
 * Which pages mark each contextual entry.
 *
 * Derived from the marks rather than stored on the entry: a `usedOnPageIds` field
 * would drift the first time a paragraph was edited, and the marks are the truth
 * about where an entry appears.
 */
export const useContextualUsage = (): ContextualUsage => {
  const sources = useEditorStore(
    useShallow((state) => ({ pages: state.pages, contextualText: state.contextualText }))
  );

  return useMemo(() => {
    const pageIds: Record<string, Set<string>> = {};
    const markCounts: Record<string, number> = {};
    const dangling: ContextualUsage['dangling'] = [];

    for (const page of Object.values(sources.pages ?? {})) {
      for (const paragraph of page.paragraphs) {
        for (const entryId of contextIdsIn(paragraph.text)) {
          if (!(sources.contextualText ?? {})[entryId]) {
            dangling.push({ pageId: page.id, pageTitle: page.title, entryId });
            continue;
          }
          (pageIds[entryId] ??= new Set()).add(page.id);
          markCounts[entryId] = (markCounts[entryId] ?? 0) + 1;
        }
      }
    }

    return {
      pageIds: Object.fromEntries(
        Object.entries(pageIds).map(([entryId, ids]) => [entryId, [...ids]])
      ),
      markCounts,
      dangling,
    };
  }, [sources]);
};
