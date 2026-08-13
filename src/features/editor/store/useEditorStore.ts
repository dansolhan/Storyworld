import { create } from 'zustand';
// Removed unused imports
import type { EditorState } from './editorTypes';
import { createGraphSlice } from './slices/graphSlice';
import { createPageSlice } from './slices/pageSlice';
import { createParagraphSlice } from './slices/paragraphSlice';
import { createChoiceSlice } from './slices/choiceSlice';
import { createUISlice } from './slices/uiSlice';
import { createVariableSlice } from './slices/variableSlice';
import { createEventSlice } from './slices/eventSlice';
import { createMetadataSlice } from './slices/metadataSlice';
import { createAudioSlice } from './slices/audioSlice';
import { createAtmosphereSlice } from './slices/atmosphereSlice';
import { createItemSlice } from './slices/itemSlice';
import { createStatusDataSlice } from './slices/statusDataSlice';
import { createContextualTextSlice } from './slices/contextualTextSlice';

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
  ...createMetadataSlice(...a),
  ...createEventSlice(...a),
  ...createAudioSlice(...a),
  ...createAtmosphereSlice(...a),
  ...createItemSlice(...a),
  ...createStatusDataSlice(...a),
  ...createContextualTextSlice(...a),
}));

/**
 * What actually lands in IndexedDB: an explicit whitelist of domain state, so
 * UI state never leaks into a saved story. `version` is the snapshot envelope's
 * own version, independent of the story schema's `CURRENT_VERSION`.
 */
interface PersistedSnapshot {
  version: number;
  state: Pick<
    EditorState,
    | 'nodes'
    | 'edges'
    | 'pages'
    | 'variables'
    | 'items'
    | 'audio'
    | 'atmospheres'
    | 'subplots'
    | 'statusData'
    | 'contextualText'
    | 'storyTitle'
    | 'storyTitleLocId'
    | 'storyDescription'
    | 'storyDescriptionLocId'
    | 'startPageId'
  >;
}

// Queue mechanism to prevent IndexedDB race conditions when dragging nodes rapidly
// This now runs outside of Zustand persist so we can dynamically save to `story-${storyId}`
let isSaving = false;
let pendingSave: { name: string; value: PersistedSnapshot } | null = null;

const processSaveQueue = async () => {
  if (isSaving || !pendingSave) return;
  isSaving = true;

  const { name, value } = pendingSave;
  pendingSave = null;

  try {
    const { set } = await import('idb-keyval');
    await set(name, value);
    // Surfaced by the rail footer as "Autosaved 12:04".
    useEditorStore.getState().setLastSavedAt(Date.now());
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

/**
 * The fields that actually reach IndexedDB. Everything else in the store is UI
 * state, and a change to it is not a reason to write.
 */
const PERSISTED_KEYS = [
  'storyId',
  'nodes',
  'edges',
  'pages',
  'variables',
  'items',
  'audio',
  'atmospheres',
  'subplots',
  'statusData',
  'contextualText',
  'storyTitle',
  'storyTitleLocId',
  'storyDescription',
  'storyDescriptionLocId',
  'startPageId',
] as const satisfies readonly (keyof EditorState)[];

type PersistedKey = (typeof PERSISTED_KEYS)[number];

let lastPersistedRefs: Partial<Record<PersistedKey, unknown>> | null = null;

/**
 * Slices replace persisted collections immutably, so a reference comparison is
 * both exact and cheap — far cheaper than deep-comparing the node array on
 * every store write.
 *
 * This guard is load-bearing, not an optimisation: `processSaveQueue` writes
 * `lastSavedAt` back into this same store, and without it that write would
 * re-trigger this subscription and autosave would loop forever. It also stops
 * ordinary UI churn — selecting a page, hovering a node — from scheduling
 * pointless IndexedDB writes.
 */
const hasPersistedChange = (state: EditorState): boolean => {
  if (!lastPersistedRefs) return true;
  return PERSISTED_KEYS.some((key) => lastPersistedRefs![key] !== state[key]);
};

const rememberPersistedRefs = (state: EditorState): void => {
  const refs: Partial<Record<PersistedKey, unknown>> = {};
  for (const key of PERSISTED_KEYS) refs[key] = state[key];
  lastPersistedRefs = refs;
};

useEditorStore.subscribe((state) => {
  // Only save if hydrated and inside a valid story.
  // CRITICAL: Bypass auto-save during active dragging or panning to prevent jitter.
  if (!state._hasHydrated || !state.storyId || state.isDragging || state.isPanning) {
    if ((state.isDragging || state.isPanning) && saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
    }
    return;
  }

  if (!hasPersistedChange(state)) return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

  saveDebounceTimer = setTimeout(() => {
    // We get the LATEST state from the store itself at the time of execution
    const state = useEditorStore.getState();

    /*
     * Essential state snapshot for persistence — performed only after debouncing.
     *
     * `savedAt` sits on the envelope rather than inside `state` on purpose: it is
     * not store state, so it cannot trip `hasPersistedChange` and restart the
     * autosave loop the way `lastSavedAt` would. The dashboard reads it for
     * "edited 2 hours ago"; a story saved before this existed simply has none.
     */
    const snapshot = {
      version: 3,
      savedAt: Date.now(),
      state: {
        nodes: state.nodes,
        edges: state.edges,
        pages: state.pages,
        variables: state.variables,
        items: state.items || {},
        audio: state.audio || {},
        atmospheres: state.atmospheres || {},
        subplots: state.subplots || [],
        statusData: state.statusData || [],
        contextualText: state.contextualText || {},
        storyTitle: state.storyTitle,
        storyTitleLocId: state.storyTitleLocId,
        storyDescription: state.storyDescription,
        storyDescriptionLocId: state.storyDescriptionLocId,
        startPageId: state.startPageId,
      },
    };
    rememberPersistedRefs(state);
    pendingSave = { name: `story-${state.storyId}`, value: snapshot };
    processSaveQueue();
  }, 300);
});
