import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { DebugSnapshot } from '../../../../domain/Story/DebugSnapshot';

/**
 * The author's saved play states.
 *
 * They live in the editor rather than the player because they are authoring
 * data — written once from the debug console, then persisted with the story and
 * offered back on the next play. The player receives them as props, so nothing
 * under `features/player` ever imports this store.
 */
export const createDebugSnapshotSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    'debugSnapshots' | 'setDebugSnapshots' | 'addDebugSnapshot' | 'renameDebugSnapshot' | 'removeDebugSnapshot'
  >
> = (set) => ({
  debugSnapshots: [],

  setDebugSnapshots: (debugSnapshots) => set({ debugSnapshots }),

  /** Newest first, which is the order the console lists them in. */
  addDebugSnapshot: (snapshot: DebugSnapshot) => {
    set((state) => ({ debugSnapshots: [snapshot, ...state.debugSnapshots] }));
    return snapshot.id;
  },

  renameDebugSnapshot: (id, name) =>
    set((state) => ({
      debugSnapshots: state.debugSnapshots.map((snapshot) =>
        snapshot.id === id ? { ...snapshot, name } : snapshot
      ),
    })),

  removeDebugSnapshot: (id) =>
    set((state) => ({
      debugSnapshots: state.debugSnapshots.filter((snapshot) => snapshot.id !== id),
    })),
});
