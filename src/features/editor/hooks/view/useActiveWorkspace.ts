import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import type { EditorWorkspace } from '../../store/editorWorkspace';

export interface ActiveWorkspaceState {
  activeWorkspace: EditorWorkspace;
  setActiveWorkspace: (workspace: EditorWorkspace) => void;
}

/**
 * The one surface the editor is showing, plus the setter that moves between
 * them. Both the left rail and the modal host read from here.
 */
export const useActiveWorkspace = (): ActiveWorkspaceState =>
  useEditorStore(
    useShallow((state) => ({
      activeWorkspace: state.activeWorkspace,
      setActiveWorkspace: state.setActiveWorkspace,
    }))
  );

/**
 * Narrower still: whether one specific workspace is the active one. Lets a
 * component subscribe to a boolean instead of re-rendering on every move
 * between two workspaces it does not care about.
 */
export const useIsWorkspaceActive = (workspace: EditorWorkspace): boolean =>
  useEditorStore((state) => state.activeWorkspace === workspace);
