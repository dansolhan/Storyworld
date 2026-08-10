import type { EditorNode } from '../store/editorTypes';
import { findSmartNodePosition } from './layout';

const ORIGIN = { x: 100, y: 100 };

/**
 * Where a newly created page should land.
 *
 * Beside the selected page when there is one, so a page made while reading
 * another appears next to it; otherwise near the origin. `findSmartNodePosition`
 * then walks a grid until it finds a spot nothing occupies.
 *
 * Both `+ Page` and the palette's create action used `Math.random() * 400`,
 * which could drop a page on top of an existing one — and made the caller
 * impure, which React Compiler rightly objects to.
 */
export const nextPagePosition = (nodes: EditorNode[], selectedPageId: string | null): { x: number; y: number } => {
  const anchor = selectedPageId ? nodes.find((node) => node.id === selectedPageId) : undefined;
  const base = anchor?.position ?? ORIGIN;
  return findSmartNodePosition(nodes, base.x, base.y);
};
