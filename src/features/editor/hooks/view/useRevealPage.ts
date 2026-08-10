import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useEditorStore } from '../../store/useEditorStore';
import type { InspectorTab } from '../../store/inspectorTab';
import type { RevealRequest } from '../../store/revealRequest';

const FRAME_DURATION = 800;
const FRAME_MAX_ZOOM = 1;

export type RevealPage = (request: RevealRequest, tab?: InspectorTab) => void;

/**
 * Navigates to a page and frames it on the canvas, optionally opening a tab and
 * asking it to reveal a particular paragraph or choice.
 *
 * Shared because three callers need exactly this: the command palette, the
 * Choices tab's target link, and Story Health's "show on canvas" when it
 * arrives. Depends on `useReactFlow`, so it only works inside
 * `ReactFlowProvider` — true of everything in the editor shell.
 */
export const useRevealPage = (): RevealPage => {
  const { fitView, setNodes } = useReactFlow();

  return useCallback(
    (request, tab) => {
      const { setSelectedPage, setInspectorTab, setRevealRequest, setActiveWorkspace } =
        useEditorStore.getState();

      // A reveal can arrive while a data workspace covers the canvas.
      setActiveWorkspace('graph');
      setSelectedPage(request.pageId);
      setRevealRequest(request);
      if (tab) setInspectorTab(tab);

      setNodes((nodes) => nodes.map((node) => ({ ...node, selected: node.id === request.pageId })));

      // React Flow needs the selection committed before it can frame the node.
      setTimeout(
        () => fitView({ nodes: [{ id: request.pageId }], duration: FRAME_DURATION, maxZoom: FRAME_MAX_ZOOM }),
        50
      );
    },
    [fitView, setNodes]
  );
};
