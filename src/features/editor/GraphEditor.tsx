import React, { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { EditorMenuBar } from './components/EditorShell/EditorMenuBar';
import { EditorRail } from './components/EditorShell/EditorRail';
import { NewSubplotDialog } from './components/EditorShell/NewSubplotDialog';
import { Inspector } from './components/Inspector/Inspector';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { FlowView } from './components/FlowView/FlowView';
import { EditorDashboard } from './components/EditorDashboard/EditorDashboard';
import { usePersistenceState } from './hooks/core/usePersistenceState';
import { useNodesCount } from './hooks/core/useNodesCount';
import { useEditorLayoutActions } from './hooks/core/useEditorLayoutActions';
import { useDeselectOnEscape } from './hooks/view/useDeselectOnEscape';
import { useEditorStore } from './store/useEditorStore';
import type { MenuConfig } from '../../config/menuConfig';

import styles from './GraphEditor.module.css';

export interface GraphEditorProps {
  /** File / Story groups, shown behind the wordmark. */
  menus: MenuConfig[];
  /** Starts playback, optionally from a page other than the story's start. */
  onPlay: (startAtPageId?: string) => void;
}

/**
 * The editor shell: menu bar across the top, then rail, canvas and inspector
 * in a row. Nothing covers the canvas.
 */
export const GraphEditor: React.FC<GraphEditorProps> = ({ menus, onPlay }) => {
  const { _hasHydrated } = usePersistenceState();
  const nodesCount = useNodesCount();
  const { addPage } = useEditorLayoutActions();

  useDeselectOnEscape();

  // Initialization: add one starting node if canvas is empty
  useEffect(() => {
    if (_hasHydrated && nodesCount === 0) {
      // Use the actual store state to avoid double-processing during React's
      // strict mode remounts or simultaneous render cycles.
      if (useEditorStore.getState().nodes.length === 0) {
        addPage(100, 100);
      }
    }
  }, [nodesCount, addPage, _hasHydrated]);

  return (
    <div className={styles.shell}>
      <EditorMenuBar menus={menus} onPlay={onPlay} />

      <div className={styles.body}>
        <EditorRail />

        <main className={styles.surface}>
          <EditorToolbar />
          <FlowView />
        </main>

        <Inspector onPlayFromPage={onPlay} />
      </div>

      <EditorDashboard />
      <NewSubplotDialog />
    </div>
  );
};
