import { create } from 'zustand';
import type { EditorState } from '../domain/editorTypes';
import { createGraphSlice } from '../domain/Graph/graphSlice';
import { createPageSlice } from '../domain/Page/pageSlice';
import { createParagraphSlice } from '../domain/Paragraph/paragraphSlice';
import { createChoiceSlice } from '../domain/Choice/choiceSlice';

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
