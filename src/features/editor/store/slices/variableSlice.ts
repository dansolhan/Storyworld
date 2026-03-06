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
  addVariable: (key, variable) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [key]: variable,
      },
    }));
  },
  updateVariable: (key, variable) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [key]: variable,
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
