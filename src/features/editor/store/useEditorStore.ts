import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { EditorState } from './editorTypes';
import { createGraphSlice } from './slices/graphSlice';
import { createPageSlice } from './slices/pageSlice';
import { createParagraphSlice } from './slices/paragraphSlice';
import { createChoiceSlice } from './slices/choiceSlice';
import { createUISlice } from './slices/uiSlice';
import { createVariableSlice } from './slices/variableSlice';
import { createConditionalSlice } from './slices/conditionalSlice';
import { createMetadataSlice } from './slices/metadataSlice';
import { createActionSlice } from './slices/actionSlice';

const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

/**
 * useEditorStore is now simply the central coordinator that combines all our
 * domain-specific slices into one performant Zustand context.
 * 
 * Never dump domain logic directly into this file. Add a Slice instead!
 */
export const useEditorStore = create<EditorState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createGraphSlice(...a),
      ...createPageSlice(...a),
      ...createParagraphSlice(...a),
      ...createChoiceSlice(...a),
      ...createVariableSlice(...a),
      ...createConditionalSlice(...a),
      ...createMetadataSlice(...a),
      ...createActionSlice(...a),
    }),
    {
      name: 'storyworld-editor-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        variables: state.variables,
        storyTitle: state.storyTitle,
        storyDescription: state.storyDescription,
        startPageId: state.startPageId,
      }),
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
