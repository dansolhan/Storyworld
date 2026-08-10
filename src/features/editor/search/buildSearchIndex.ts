import type { Page } from '../../../domain/Page/Page';
import { stripHtml } from './stripHtml';
import type { SearchEntry } from './searchEntry';

const UNTITLED = 'Untitled Page';

/**
 * Flattens the page graph into rows the palette can filter.
 *
 * Built once per story change rather than per keystroke: HTML stripping is the
 * expensive part, and it does not depend on the query. The rail's Text search
 * view will read the same index when it is built.
 */
export const buildSearchIndex = (pages: Record<string, Page>): SearchEntry[] => {
  const entries: SearchEntry[] = [];

  for (const page of Object.values(pages)) {
    const title = page.title || UNTITLED;

    entries.push({
      id: `page:${page.id}`,
      kind: 'page',
      text: title,
      haystack: title.toLowerCase(),
      pageId: page.id,
    });

    page.choices.forEach((choice) => {
      const text = choice.text?.trim();
      if (!text) return;
      entries.push({
        id: `choice:${page.id}:${choice.id}`,
        kind: 'choice',
        text,
        haystack: text.toLowerCase(),
        detail: title,
        pageId: page.id,
        choiceId: choice.id,
      });
    });

    page.paragraphs.forEach((paragraph, index) => {
      const text = stripHtml(paragraph.text);
      if (!text) return;
      entries.push({
        id: `paragraph:${page.id}:${paragraph.id}`,
        kind: 'paragraph',
        text,
        haystack: text.toLowerCase(),
        detail: `${title} · paragraph ${index + 1}`,
        pageId: page.id,
        paragraphId: paragraph.id,
      });
    });
  }

  return entries;
};
