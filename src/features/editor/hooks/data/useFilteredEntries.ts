import { useMemo } from 'react';
import { matchPosition, queryTerms } from '../../search/matchEntries';

export interface FilterableEntry {
  /** Everything the filter should look at, joined and lower-cased. */
  haystack: string;
}

/**
 * Filters table rows with the same rules as the command palette — every term
 * must appear somewhere. One notion of "matches" across the app.
 */
export const useFilteredEntries = <T extends FilterableEntry>(entries: T[], filter: string): T[] => {
  return useMemo(() => {
    const terms = queryTerms(filter);
    if (terms.length === 0) return entries;
    return entries.filter((entry) => matchPosition(entry.haystack, terms) !== -1);
  }, [entries, filter]);
};
