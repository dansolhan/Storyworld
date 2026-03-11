import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { StatusData } from '../../../../domain/Story/StatusData';

export const createStatusDataSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'statusData'
    | 'setStatusData'
    | 'addStatusData'
    | 'updateStatusData'
    | 'removeStatusData'
  >
> = (set) => ({
  statusData: [],

  setStatusData: (statusData) => set({ statusData }),

  addStatusData: (entry: StatusData) =>
    set((state) => ({ statusData: [...state.statusData, entry] })),

  updateStatusData: (id: string, updates: Partial<StatusData>) =>
    set((state) => ({
      statusData: state.statusData.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  removeStatusData: (id: string) =>
    set((state) => ({
      statusData: state.statusData.filter((s) => s.id !== id),
    })),
});
