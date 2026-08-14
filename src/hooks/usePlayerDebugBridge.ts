import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../features/editor/store/useEditorStore';
import type { PlayerDebugBridge } from '../features/player/components/DebugConsole/PlayerDebugBridge';

/**
 * Hands the player the editor's snapshot list and the three ways to change it.
 *
 * This hook is the only join between the two state applications, and it sits in
 * the app shell rather than in either feature — which is what lets the player
 * stay ignorant of `useEditorStore` and the editor stay ignorant of the engine.
 */
export const usePlayerDebugBridge = (): PlayerDebugBridge =>
  useEditorStore(
    useShallow((state) => ({
      snapshots: state.debugSnapshots,
      onSaveSnapshot: state.addDebugSnapshot,
      onRenameSnapshot: state.renameDebugSnapshot,
      onDeleteSnapshot: state.removeDebugSnapshot,
    }))
  );
