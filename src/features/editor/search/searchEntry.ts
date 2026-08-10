/**
 * One searchable thing in the story, flattened out of the page graph.
 *
 * The palette groups by `kind` in the order the design draws: pages, then the
 * choices that wire them together, then prose, then actions (which are not
 * entries — they are built separately, since they do not come from the story).
 */
export type SearchEntryKind = 'page' | 'choice' | 'paragraph';

export interface SearchEntry {
  /** Stable row id, unique across kinds. */
  id: string;
  kind: SearchEntryKind;
  /** Lower-cased `text`, kept alongside it so matching never re-lowercases. */
  haystack: string;
  /** What the row shows: page title, choice text, or the paragraph's prose. */
  text: string;
  /** Where it lives — "The Forgotten Shrine · paragraph 2". */
  detail?: string;
  /** The page to reveal when the row is chosen. */
  pageId: string;
  /** Set on paragraph entries, so the Write tab can scroll to it. */
  paragraphId?: string;
  /** Set on choice entries, so the Choices tab can mark it. */
  choiceId?: string;
}

/** Group order in the palette, and the tie-break when scores are equal. */
export const KIND_ORDER: SearchEntryKind[] = ['page', 'choice', 'paragraph'];

export const KIND_HEADINGS: Record<SearchEntryKind, string> = {
  page: 'Pages',
  choice: 'Choices',
  paragraph: 'In text',
};
