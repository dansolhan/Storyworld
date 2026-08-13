import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { ContextualEntry } from '../../../../domain/ContextualText/ContextualEntry';
import { CONTEXT_ID_ATTR } from '../../../../domain/ContextualText/contextualMark';

/** Rewrites one id to another inside a paragraph's marks, touching nothing else. */
const repointMarks = (html: string, fromIds: Set<string>, intoId: string): string =>
  html.replace(
    new RegExp(`${CONTEXT_ID_ATTR}="([^"]*)"`, 'g'),
    (whole, id: string) => (fromIds.has(id) ? `${CONTEXT_ID_ATTR}="${intoId}"` : whole)
  );

export const createContextualTextSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'contextualText'
    | 'setContextualText'
    | 'addContextualEntry'
    | 'updateContextualEntry'
    | 'removeContextualEntry'
    | 'mergeContextualEntries'
  >
> = (set) => ({
  contextualText: {},

  setContextualText: (contextualText) => set({ contextualText }),

  addContextualEntry: (entry: ContextualEntry) => {
    set((state) => ({ contextualText: { ...state.contextualText, [entry.id]: entry } }));
    return entry.id;
  },

  updateContextualEntry: (id, updates) =>
    set((state) => {
      const existing = state.contextualText[id];
      if (!existing) return state;
      return { contextualText: { ...state.contextualText, [id]: { ...existing, ...updates } } };
    }),

  /**
   * Removes the entry and leaves the marks pointing at it.
   *
   * Deliberately not a cascade into the prose: rewriting an author's paragraphs as
   * a side effect of a delete is too much to do quietly. The marks render as plain
   * prose from then on and Story Health names them, which is the same bargain item
   * and variable deletion already strike.
   */
  removeContextualEntry: (id) =>
    set((state) => {
      const next = { ...state.contextualText };
      delete next[id];
      return { contextualText: next };
    }),

  /**
   * Joins several entries into one.
   *
   * This is how an existing story reaches the design's REUSED group: the migration
   * refuses to guess that two identical notes are the same entry, so merging is an
   * explicit act. Every mark on the merged-away entries is repointed, so no prose
   * is left dangling.
   */
  mergeContextualEntries: (fromIds, intoId) =>
    set((state) => {
      const ids = new Set(fromIds.filter((id) => id !== intoId));
      if (ids.size === 0 || !state.contextualText[intoId]) return state;

      const nextEntries = { ...state.contextualText };
      for (const id of ids) delete nextEntries[id];

      const nextPages = { ...state.pages };
      for (const [pageId, page] of Object.entries(nextPages)) {
        let changed = false;
        const paragraphs = page.paragraphs.map((paragraph) => {
          const text = repointMarks(paragraph.text, ids, intoId);
          if (text === paragraph.text) return paragraph;
          changed = true;
          return { ...paragraph, text };
        });
        if (changed) nextPages[pageId] = { ...page, paragraphs };
      }

      return { contextualText: nextEntries, pages: nextPages };
    }),
});
