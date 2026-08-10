import { useCallback } from 'react';
import type React from 'react';
import { useInteractionStrategy } from '../interactions/useInteractionStrategy';
import { useInteractionState } from './view/useInteractionState';
import { useInspectorTab } from './view/useInspectorTab';
import { useEditorLayoutActions } from './core/useEditorLayoutActions';
import type { EditorNode } from '../store/editorTypes';

export const useFlowInteraction = () => {
  const { setSelectedPage, setCurrentPlotId } = useEditorLayoutActions();
  const { setInspectorTab } = useInspectorTab();
  const { setIsDragging, setIsPanning } = useInteractionState();

  const interactionStrategy = useInteractionStrategy();

  const onNodeDragStart = useCallback(() => setIsDragging(true), [setIsDragging]);
  const onNodeDragStop = useCallback(() => setIsDragging(false), [setIsDragging]);
  const onMoveStart = useCallback(() => setIsPanning(true), [setIsPanning]);
  const onMoveEnd = useCallback(() => setIsPanning(false), [setIsPanning]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: EditorNode) => {
    // Action and portal markers are synthetic; clicking one means the page or
    // plot behind it, never the marker itself.
    if (node.type === 'actionNode') {
      setSelectedPage(node.data.sourcePageId);
      return;
    }
    if (node.type === 'portalNode') return;
    interactionStrategy.onNodeClick(node.id);
  }, [setSelectedPage, interactionStrategy]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: EditorNode) => {
    if (node.type === 'actionNode') {
      // Actions hang off choices, so that is the tab that can show them.
      setSelectedPage(node.data.sourcePageId);
      setInspectorTab('choices');
      return;
    }
    if (node.type === 'portalNode') {
      const { subplotId } = node.data;
      if (subplotId) setCurrentPlotId(subplotId);
      return;
    }
    interactionStrategy.onNodeDoubleClick(node.id);
  }, [setSelectedPage, setInspectorTab, setCurrentPlotId, interactionStrategy]);

  const handlePaneClick = useCallback(() => {
    interactionStrategy.onPaneClick();
  }, [interactionStrategy]);

  return {
    interactionStrategy,
    onNodeDragStart,
    onNodeDragStop,
    onMoveStart,
    onMoveEnd,
    handleNodeClick,
    handleNodeDoubleClick,
    handlePaneClick,
  };
};
