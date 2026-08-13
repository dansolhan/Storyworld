import type { Page } from './Page';

/** Prose is rich text, so `<p></p>` and `<p><br></p>` are empty despite having length. */
const hasProse = (text: string): boolean => text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

/**
 * Whether a page has no prose yet.
 *
 * Derived rather than flagged: the moment an author writes a sentence the page
 * stops being unwritten, with nothing to remember to clear. It follows that an
 * action-only page carries the mark permanently — which is honest, since it has
 * nothing for the reader to read.
 */
export const isUnwritten = (page: Pick<Page, 'paragraphs'>): boolean =>
  !(page.paragraphs ?? []).some((paragraph) => hasProse(paragraph.text));
