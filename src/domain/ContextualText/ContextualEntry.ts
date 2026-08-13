export interface ContextualEntry {
  id: string;
  /**
   * The words this entry was first written against, e.g. "small window".
   *
   * The entry's identity for a reader of the workspace — the design lists rows by
   * phrase rather than by title, because a title was optional and most entries
   * never had one. It is not the anchor: the same entry can be marked on other
   * phrases, and the marked words in the prose are whatever the author marked.
   */
  phrase: string;
  /** Optional heading for the reader's popover. */
  title?: string;
  /** What the reader is told. */
  text: string;
}

/**
 * Contextual entries, keyed by id.
 *
 * Shared from schema 1.3.0: before it, every mark carried its own copy of the text
 * inside the paragraph HTML, so the same note written on three pages was three
 * unrelated copies. Marks now reference an entry, and editing it changes every
 * place it appears.
 *
 * Which pages use an entry is deliberately *not* stored — it is derived from the
 * marks, the same way item and variable usage is. A stored list would drift the
 * first time a paragraph was edited.
 */
export type ContextualEntries = Record<string, ContextualEntry>;
