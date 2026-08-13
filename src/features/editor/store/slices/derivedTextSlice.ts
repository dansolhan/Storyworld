import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { DerivedText } from '../../../../domain/DerivedText/DerivedText';

export const createDerivedTextSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    'derivedTexts' | 'setDerivedTexts' | 'addDerivedText' | 'updateDerivedText' | 'removeDerivedText'
  >
> = (set) => ({
  derivedTexts: {},

  setDerivedTexts: (derivedTexts) => set({ derivedTexts }),

  addDerivedText: (text: DerivedText) => {
    set((state) => ({ derivedTexts: { ...state.derivedTexts, [text.id]: text } }));
    return text.id;
  },

  updateDerivedText: (id, updates) =>
    set((state) => {
      const existing = state.derivedTexts[id];
      if (!existing) return state;
      return { derivedTexts: { ...state.derivedTexts, [id]: { ...existing, ...updates } } };
    }),

  /**
   * Removes the derived text, leaving any token that referenced it in the prose.
   *
   * The same bargain contextual entries strike: rewriting an author's paragraphs as
   * a side effect of a delete is too much to do quietly. The token resolves to
   * nothing, so the sentence closes over it, and Story Health names the page.
   */
  removeDerivedText: (id) =>
    set((state) => {
      const next = { ...state.derivedTexts };
      delete next[id];
      return { derivedTexts: next };
    }),
});
