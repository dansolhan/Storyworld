import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createAtmosphereSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'atmospheres' | 'setAtmospheres' | 'addAtmosphere' | 'updateAtmosphere' | 'removeAtmosphere'>
> = (set) => ({
  atmospheres: {},
  setAtmospheres: (atmospheres) => {
    set({ atmospheres });
  },
  addAtmosphere: (id, atmosphere) => {
    set((state) => ({
      atmospheres: {
        ...state.atmospheres,
        [id]: atmosphere,
      },
    }));
  },
  updateAtmosphere: (id, updates) => {
    set((state) => {
      const existing = state.atmospheres[id];
      if (!existing) return state;
      return {
        atmospheres: {
          ...state.atmospheres,
          [id]: { ...existing, ...updates },
        },
      };
    });
  },
  removeAtmosphere: (id) => {
    set((state) => {
      const newAtmospheres = { ...state.atmospheres };
      delete newAtmospheres[id];
      return { atmospheres: newAtmospheres };
    });
  },
});
