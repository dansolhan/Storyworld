import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { updateGraphVisibility } from '../../utils/visibility';

export const createMetadataSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'storyId' | 'setStoryId' | 'storyTitle' | 'storyTitleLocId' | 'storyDescription' | 'storyDescriptionLocId' | 'startPageId' | 'setStoryTitle' | 'setStoryDescription' | 'setStartPageId' | 'subplots' | 'currentPlotId' | 'setCurrentPlotId' | 'addSubplot' | 'updateSubplot' | 'deleteSubplot'>
> = (set) => ({
  storyId: null,
  setStoryId: (id) => set({ storyId: id }),
  storyTitle: 'Untitled Story',
  storyTitleLocId: crypto.randomUUID(),
  storyDescription: '',
  storyDescriptionLocId: crypto.randomUUID(),
  startPageId: null,

  subplots: [],
  currentPlotId: null,

  setStoryTitle: (title) => {
    set({ storyTitle: title });
  },

  setStoryDescription: (description) => {
    set({ storyDescription: description });
  },

  setStartPageId: (pageId) => {
    set({ startPageId: pageId });
  },

  setCurrentPlotId: (plotId) => {
    set((state) => {
      const { nodes, edges } = updateGraphVisibility(state.nodes, state.edges, plotId);
      return { currentPlotId: plotId, nodes, edges } as Partial<EditorState>;
    });
  },

  addSubplot: (name, description) => {
    const newId = `subplot-${crypto.randomUUID()}`;
    set((state) => ({
      subplots: [...state.subplots, { id: newId, name, description }],
      currentPlotId: newId,
    }));
    return newId;
  },

  updateSubplot: (id, name, description) => {
    set((state) => ({
      subplots: state.subplots.map((s) =>
        s.id === id ? { ...s, name, description } : s
      ),
    }));
  },

  deleteSubplot: (id) => {
    set((state) => ({
      subplots: state.subplots.filter((s) => s.id !== id),
      // Automatically navigate back to main plot if we delete the currently viewed plot
      currentPlotId: state.currentPlotId === id ? null : state.currentPlotId,
      // You may also want to trigger an effect outside to delete nodes that belong to this plot, 
      // but for now let's just detach or ignore them since the domain keeps plot nodes separate.
    }));
  },
});
