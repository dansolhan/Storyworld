import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

const FRAME_DURATION = 800;
const FRAME_MAX_ZOOM = 1;

/** How long React Flow needs for a just-added node to be measured. */
const SETTLE_MS = 50;

export type FramePage = (pageId: string) => void;

/**
 * Moves the camera to a page, and nothing else.
 *
 * Split out from `useRevealPage` because the two are different intents: revealing
 * a page selects it and hands the inspector over, while framing only points the
 * camera. Creating a page from a choice wants the second — the author is still
 * writing the choice list they are looking at.
 *
 * Only works inside `ReactFlowProvider`, which is true of the whole editor shell.
 */
export const useFramePage = (): FramePage => {
  const { fitView } = useReactFlow();

  return useCallback(
    (pageId) => {
      setTimeout(
        () => fitView({ nodes: [{ id: pageId }], duration: FRAME_DURATION, maxZoom: FRAME_MAX_ZOOM }),
        SETTLE_MS
      );
    },
    [fitView]
  );
};
