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

function isSamePos(p1: NodePos, p2: NodePos) {
  return p1.x === p2.x && p1.y === p2.y && p1.w === p2.w && p1.h === p2.h;
}

/**
 * Returns throttled node position coordinates.
 */
export function useThrottledNodePos(
  node: InternalNode | null | undefined,
  delay: number
): NodePos {
  const [pos, setPos] = useState<NodePos>(ZERO_POS);
  const latestRef = useRef<NodePos>(ZERO_POS);
  const lastRanRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync ref immediately to have the freshest data available for effects/callbacks
  useEffect(() => {
    if (node) {
      latestRef.current = extractPos(node);
    }
  }, [node]);

  useEffect(() => {
    if (!node) return;

    const current = latestRef.current;

    if (delay <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // ONLY set state if values actually changed to prevent render loops
      setPos(prev => isSamePos(prev, current) ? prev : current);
      return;
    }

    const now = Date.now();
    const remaining = delay - (now - lastRanRef.current);

    if (remaining <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastRanRef.current = now;
      setPos(prev => isSamePos(prev, current) ? prev : current);
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        lastRanRef.current = Date.now();
        const latest = latestRef.current;
        setPos(prev => isSamePos(prev, latest) ? prev : latest);
      }, remaining);
    }
  }, [node, delay]); // Added proper dependencies

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return node ? pos : ZERO_POS;
}
