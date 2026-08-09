import React, { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { EditorMenuBar } from './components/EditorShell/EditorMenuBar';
import { EditorRail } from './components/EditorShell/EditorRail';
import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { FlowView } from './components/FlowView/FlowView';
import { EditorDashboard } from './components/EditorDashboard/EditorDashboard';
import { usePersistenceState } from './hooks/core/usePersistenceState';
import { useNodesCount } from './hooks/core/useNodesCount';
import { useEditorLayoutActions } from './hooks/core/useEditorLayoutActions';
import { useEditorStore } from './store/useEditorStore';
import type { MenuConfig } from '../../components/ui/MenuBar/MenuBar';

import styles from './GraphEditor.module.css';

export interface GraphEditorProps {
  /** File / Story / View groups, shown behind the wordmark. */
  menus: MenuConfig[];
  onPlay: () => void;
}

/**
 * The editor shell: menu bar across the top, then rail, working surface and
 * inspector in a row. Panels sit beside the canvas rather than over it.
 */
export const GraphEditor: React.FC<GraphEditorProps> = ({ menus, onPlay }) => {
  const { _hasHydrated } = usePersistenceState();
  const nodesCount = useNodesCount();
  const { addPage } = useEditorLayoutActions();

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
      </div>

      {/*
        Still the bottom drawer, so it sits below the row rather than inside it
        — as a full-width, non-shrinking flex child it would take the whole row
        and collapse the canvas to nothing. It becomes the persistent 400px
        inspector column in the next step, and moves inside `body` then.
      */}
      <EditorSidebar />

      <EditorDashboard />
    </div>
  );
};
