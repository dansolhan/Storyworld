import { useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { buildSearchIndex } from '../../search/buildSearchIndex';
import type { SearchEntry } from '../../search/searchEntry';

/**
 * The story flattened into searchable rows.
 *
 * Memoised on the identity of `pages`, which slices replace immutably — so it
 * rebuilds when the story is edited and never when unrelated UI state moves.
 */
export const useSearchIndex = (): SearchEntry[] => {
  const pages = useEditorStore((state) => state.pages);
  return useMemo(() => buildSearchIndex(pages ?? {}), [pages]);
};
