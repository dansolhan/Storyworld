import { useCallback } from 'react';
import { useInteractionStrategy } from '../interactions/useInteractionStrategy';
import { useInteractionState } from './view/useInteractionState';
import { useSidebarState } from './view/useSidebarState';
import { useEditorLayoutActions } from './core/useEditorLayoutActions';

export const useFlowInteraction = () => {
  const { setSelectedPage, setCurrentPlotId } = useEditorLayoutActions();
  const { setSidebarTab, setIsEditorSidebarExpanded } = useSidebarState();
  const { setIsDragging, setIsPanning } = useInteractionState();

  const interactionStrategy = useInteractionStrategy();

  const onNodeDragStart = useCallback(() => setIsDragging(true), [setIsDragging]);
  const onNodeDragStop = useCallback(() => setIsDragging(false), [setIsDragging]);
  const onMoveStart = useCallback(() => setIsPanning(true), [setIsPanning]);
  const onMoveEnd = useCallback(() => setIsPanning(false), [setIsPanning]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    if (node.id.startsWith('action-node-')) {
      setSelectedPage(node.data.sourcePageId);
      return;
    }
    if (node.id.startsWith('portal-node-')) return; 
    interactionStrategy.onNodeClick(node.id);
  }, [setSelectedPage, interactionStrategy]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: any) => {
    if (node.id.startsWith('action-node-')) {
      setSelectedPage(node.data.sourcePageId);
      setSidebarTab('actions');
      setIsEditorSidebarExpanded(true);
      return;
    }
    if (node.id.startsWith('portal-node-')) {
      const subplotId = node.data.subplotId;
      if (subplotId) setCurrentPlotId(subplotId);
      return;
    }
    interactionStrategy.onNodeDoubleClick(node.id);
  }, [setSelectedPage, setSidebarTab, setIsEditorSidebarExpanded, setCurrentPlotId, interactionStrategy]);

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
