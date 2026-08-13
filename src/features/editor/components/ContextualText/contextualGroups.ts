import type { ContextualEntries, ContextualEntry } from '../../../../domain/ContextualText/ContextualEntry';

export interface ContextualRow {
  entry: ContextualEntry;
  pageIds: string[];
  pageTitles: string[];
  /** Marks pointing at this entry, which can exceed the page count. */
  markCount: number;
}

export interface ContextualGroups {
  /**
   * Marked in more than one place — editing it changes them all.
   *
   * Counted by marks rather than pages: two phrases in one paragraph pointing at
   * the same entry is reuse, and calling that "used once" would be a lie.
   */
  reused: ContextualRow[];
  usedOnce: ContextualRow[];
  /** Written but not marked anywhere, so no reader can reach them. */
  unused: ContextualRow[];
  /**
   * Entries sharing identical text, keyed by that text.
   *
   * The migration refuses to guess that two identical notes are the same entry, so
   * this is how an existing story reaches the REUSED group: the author is offered
   * the join, and it stays their decision.
   */
  duplicates: { text: string; entries: ContextualEntry[] }[];
}

/**
 * Contextual entries grouped by reuse, as the design orders them.
 *
 * Grouped by how many marks point at an entry rather than by page, because the
 * useful question is "is this shared?" — the answer changes what editing it does.
 */
export const groupContextualEntries = (
  entries: ContextualEntries,
  pageIdsByEntry: Record<string, string[]>,
  markCounts: Record<string, number>,
  pageTitles: Record<string, string>
): ContextualGroups => {
  const rows: ContextualRow[] = Object.values(entries ?? {})
    .map((entry) => {
      const pageIds = pageIdsByEntry[entry.id] ?? [];
      return {
        entry,
        pageIds,
        pageTitles: pageIds.map((pageId) => pageTitles[pageId] ?? pageId),
        markCount: markCounts[entry.id] ?? 0,
      };
    })
    .sort((a, b) => a.entry.phrase.localeCompare(b.entry.phrase));

  const byText = new Map<string, ContextualEntry[]>();
  for (const { entry } of rows) {
    const key = entry.text.trim();
    if (key === '') continue;
    const bucket = byText.get(key);
    if (bucket) bucket.push(entry);
    else byText.set(key, [entry]);
  }

  return {
    reused: rows.filter((row) => row.markCount > 1),
    usedOnce: rows.filter((row) => row.markCount === 1),
    unused: rows.filter((row) => row.markCount === 0),
    duplicates: [...byText.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([text, group]) => ({ text, entries: group })),
  };
};
