import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';

export const createVariableSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'variables' | 'setVariables' | 'addVariable' | 'updateVariable' | 'removeVariable'>
> = (set) => ({
  variables: {},
  setVariables: (variables) => {
    set({ variables });
  },
  addVariable: (key, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [key]: value,
      },
    }));
  },
  updateVariable: (key, newValue) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [key]: newValue,
      },
    }));
  },
  removeVariable: (key) => {
    set((state) => {
      const newVars = { ...state.variables };
      delete newVars[key];
      return { variables: newVars };
    });
  },
});
