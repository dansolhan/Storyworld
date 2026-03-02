import { create } from 'zustand';
// Removed unused imports
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

/**
 * useEditorStore is now simply the central coordinator that combines all our
 * domain-specific slices into one performant Zustand context.
 */
export const useEditorStore = create<EditorState>()((...a) => ({
  ...createUISlice(...a),
  ...createGraphSlice(...a),
  ...createPageSlice(...a),
  ...createParagraphSlice(...a),
  ...createChoiceSlice(...a),
  ...createVariableSlice(...a),
  ...createConditionalSlice(...a),
  ...createMetadataSlice(...a),
  ...createActionSlice(...a),
}));

// Queue mechanism to prevent IndexedDB race conditions when dragging nodes rapidly
// This now runs outside of Zustand persist so we can dynamically save to `story-${storyId}`
let isSaving = false;
let pendingSave: { name: string; value: any } | null = null;

const processSaveQueue = async () => {
  if (isSaving || !pendingSave) return;
  isSaving = true;

  const { name, value } = pendingSave;
  pendingSave = null;

  try {
    const { set } = await import('idb-keyval');
    await set(name, value);
  } catch (error) {
    console.error('Failed to save state to IndexedDB', error);
  } finally {
    isSaving = false;
    if (pendingSave) {
      processSaveQueue();
    }
  }
};

useEditorStore.subscribe((state) => {
  // Only save if we are successfully hydrated and actually inside a valid story with an ID
  if (state._hasHydrated && state.storyId) {
    const snapshot = {
      version: 2, // Editor storage version
      state: {
        nodes: state.nodes,
        edges: state.edges,
        variables: state.variables,
        storyTitle: state.storyTitle,
        storyDescription: state.storyDescription,
        startPageId: state.startPageId,
      }
    };
    pendingSave = { name: `story-${state.storyId}`, value: snapshot };
    processSaveQueue();
  }
});
