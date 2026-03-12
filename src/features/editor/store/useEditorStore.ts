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
import { createAudioSlice } from './slices/audioSlice';
import { createAtmosphereSlice } from './slices/atmosphereSlice';
import { createItemSlice } from './slices/itemSlice';
import { createStatusDataSlice } from './slices/statusDataSlice';

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
  ...createAudioSlice(...a),
  ...createAtmosphereSlice(...a),
  ...createItemSlice(...a),
  ...createStatusDataSlice(...a),
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
    console.log(`[Storage] Saved game data for story: ${name}`);
  } catch (error) {
    console.error('Failed to save state to IndexedDB', error);
  } finally {
    isSaving = false;
    if (pendingSave) {
      processSaveQueue();
    }
  }
};

// Debounce timer for saves — prevents flooding IndexedDB during node drags
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

useEditorStore.subscribe((state) => {
  // Only save if hydrated and inside a valid story.
  // CRITICAL: Bypass auto-save during active dragging to prevent jitter.
  if (!state._hasHydrated || !state.storyId || state.isDragging) {
    if (state.isDragging && saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
    }
    return;
  }

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

  saveDebounceTimer = setTimeout(() => {
    // We get the LATEST state from the store itself at the time of execution
    const state = useEditorStore.getState();

    // Essential state snapshot for persistence — performed only after debouncing
    const snapshot = {
      version: 3,
      state: {
        nodes: state.nodes,
        edges: state.edges,
        variables: state.variables,
        items: state.items || {},
        audio: state.audio || {},
        atmospheres: state.atmospheres || {},
        subplots: state.subplots || [],
        statusData: state.statusData || [],
        storyTitle: state.storyTitle,
        storyDescription: state.storyDescription,
        startPageId: state.startPageId,
      },
    };
    pendingSave = { name: `story-${state.storyId}`, value: snapshot };
    processSaveQueue();
  }, 300);
});
