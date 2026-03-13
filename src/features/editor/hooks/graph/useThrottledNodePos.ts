import { useState, useRef, useEffect } from 'react';
import type { InternalNode } from '@xyflow/react';

interface NodePos {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZERO_POS: NodePos = { x: 0, y: 0, w: 0, h: 0 };

function extractPos(node: InternalNode): NodePos {
  return {
    x: node.internals.positionAbsolute.x,
    y: node.internals.positionAbsolute.y,
    w: node.measured.width ?? 0,
    h: node.measured.height ?? 0,
  };
}

/**
 * Returns throttled node position coordinates.
 *
 * - When `delay` is 0 (or node is not dragging), updates are immediate.
 * - When `delay > 0`, updates are throttled: the first change goes through
 *   immediately, then subsequent ones are batched and applied at most once
 *   per `delay` ms, always capturing the latest value.
 */
export function useThrottledNodePos(
  node: InternalNode | null | undefined,
  delay: number
): NodePos {
  const [pos, setPos] = useState<NodePos>(ZERO_POS);
  const latestRef = useRef<NodePos>(ZERO_POS);
  const lastRanRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always sync the latest value into the ref (not state — avoids re-render)
  if (node) {
    latestRef.current = extractPos(node);
  }

  useEffect(() => {
    if (!node) return;

    const current = latestRef.current;

    if (delay <= 0) {
      // Immediate mode — no throttle
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPos(current);
      return;
    }

    const now = Date.now();
    const remaining = delay - (now - lastRanRef.current);

    if (remaining <= 0) {
      // Enough time has passed — update immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastRanRef.current = now;
      setPos(current);
    } else if (!timerRef.current) {
      // Schedule a trailing update at the end of the throttle window
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        lastRanRef.current = Date.now();
        setPos({ ...latestRef.current });
      }, remaining);
    }
    // If a timer is already running, it will fire with the latest latestRef value
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return node ? pos : ZERO_POS;
}
