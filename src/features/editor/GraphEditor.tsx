import React, { useEffect } from 'react';
import '@xyflow/react/dist/style.css';

import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { FlowView } from './components/FlowView/FlowView';
import { EditorDashboard } from './components/EditorDashboard/EditorDashboard';
import { usePersistenceState } from './hooks/core/usePersistenceState';
import { useNodesCount } from './hooks/core/useNodesCount';
import { useEditorLayoutActions } from './hooks/core/useEditorLayoutActions';
import { useEditorStore } from './store/useEditorStore';

import styles from './GraphEditor.module.css';

export const GraphEditor: React.FC = () => {
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
    <div className={styles.container}>
      <EditorToolbar />
      <FlowView />
      <EditorSidebar />
      <EditorDashboard />
    </div>
  );
};
