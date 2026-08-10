import { KIND_ORDER, type SearchEntry } from './searchEntry';

export interface SearchMatch {
  entry: SearchEntry;
  /** Where the first term hit, for excerpting long prose and for ranking. */
  matchIndex: number;
}

/**
 * Splits a query into the terms that must all be present.
 *
 * Exported because the palette's action list is filtered the same way, and one
 * definition of "does this query match" is better than two.
 */
export const queryTerms = (query: string): string[] =>
  query.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Whether every term appears somewhere in `haystack`, and where the first one
 * hit. Returns -1 when the text does not match.
 *
 * Substring rather than fuzzy: it explains itself, ranks predictably, and the
 * near-misses fuzzy produces read as noise in a list this short. Swapping in a
 * fuzzy scorer means replacing this function and nothing else.
 */
export const matchPosition = (haystack: string, terms: string[]): number => {
  if (terms.length === 0) return 0;

  let firstIndex = -1;
  for (const term of terms) {
    const index = haystack.indexOf(term);
    if (index === -1) return -1;
    if (firstIndex === -1 || index < firstIndex) firstIndex = index;
  }
  return firstIndex;
};

/**
 * Ranking: page titles before choices before prose, then an earlier match, then
 * shorter text — a title that *is* the query should beat one that merely
 * contains it.
 */
const compareMatches = (a: SearchMatch, b: SearchMatch): number => {
  const byKind = KIND_ORDER.indexOf(a.entry.kind) - KIND_ORDER.indexOf(b.entry.kind);
  if (byKind !== 0) return byKind;

  if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex;
  return a.entry.text.length - b.entry.text.length;
};

/**
 * What an untyped palette shows: pages, alphabetically.
 *
 * Matching an empty query against everything would list every choice and
 * paragraph too, which is noise — and with no query there is no match position
 * to rank by, so the order would come down to title length. Opening the palette
 * is mostly a way to jump to a page, so that is what it offers.
 */
export const browseEntries = (entries: SearchEntry[]): SearchMatch[] =>
  entries
    .filter((entry) => entry.kind === 'page')
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((entry) => ({ entry, matchIndex: 0 }));

export const matchEntries = (entries: SearchEntry[], query: string): SearchMatch[] => {
  const terms = queryTerms(query);
  const matches: SearchMatch[] = [];

  for (const entry of entries) {
    const matchIndex = matchPosition(entry.haystack, terms);
    if (matchIndex !== -1) matches.push({ entry, matchIndex });
  }

  return matches.sort(compareMatches);
};
