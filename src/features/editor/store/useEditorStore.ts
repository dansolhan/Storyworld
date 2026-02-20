import { create } from 'zustand';
import type { EditorState } from './editorTypes';
import { createGraphSlice } from './slices/graphSlice';
import { createPageSlice } from './slices/pageSlice';
import { createParagraphSlice } from './slices/paragraphSlice';
import { createChoiceSlice } from './slices/choiceSlice';

/**
 * useEditorStore is now simply the central coordinator that combines all our
 * domain-specific slices into one performant Zustand context.
 * 
 * Never dump domain logic directly into this file. Add a Slice instead!
 */
export const useEditorStore = create<EditorState>()((...a) => ({
  ...createGraphSlice(...a),
  ...createPageSlice(...a),
  ...createParagraphSlice(...a),
  ...createChoiceSlice(...a),
}));
