import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { EditorState } from '../editorTypes';

export const createGraphSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect' | 'setNodes' | 'setEdges' | 'loadStory' | 'syncSyntheticNodes'>> = (set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as EditorState['nodes'],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    // Determine source page, choice, and target page and push through our custom action
    // so that nodes and edges stay perfectly locked in sync
    const sourcePageId = connection.source;
    const choiceId = connection.sourceHandle;
    const targetPageId = connection.target;

    if (sourcePageId && choiceId && targetPageId) {
      // If we don't cast to any, TypeScript will yell since get() won't know about the
      // full EditorState in this partial slice context, but our central store has it.
      (get() as any).setChoiceDestination(sourcePageId, choiceId, targetPageId);
    } else {
      // Fallback
      set({
        edges: addEdge(connection, get().edges),
      });
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  loadStory: (nodes, edges, variables, metadata, subplots) => set(() => ({
    nodes,
    edges,
    ...(variables ? { variables } : {}),
    ...(metadata?.title ? { storyTitle: metadata.title } : {}),
    ...(metadata?.description !== undefined ? { storyDescription: metadata.description } : {}),
    ...(metadata?.startPageId !== undefined ? { startPageId: metadata.startPageId } : {}),
    ...(subplots !== undefined ? { subplots } : {}),
  })),

  syncSyntheticNodes: (newSynNodes, newSynEdges) => {
    const { nodes, edges } = get();

    // ── Early-return guard ────────────────────────────────────────────────────
    // If the set of synthetic node IDs and their data hasn't changed, skip
    // calling set() entirely. Without this guard, the useEffect that calls this
    // action would trigger a re-render on every cycle → infinite loop.
    const existingSynNodes = nodes.filter((n) => n.type !== 'pageNode');
    const existingMap = new Map(existingSynNodes.map((n) => [n.id, n]));

    const noChange =
      existingSynNodes.length === newSynNodes.length &&
      newSynNodes.every((newNode) => {
        const existing = existingMap.get(newNode.id);
        return existing && JSON.stringify(newNode.data) === JSON.stringify(existing.data);
      });

    if (noChange) return;

    // ── Merge ─────────────────────────────────────────────────────────────────
    const newEdgeIds = new Set(newSynEdges.map((e) => e.id));
    const realNodes = nodes.filter((n) => n.type === 'pageNode');

    // Preserve positions the user has already dragged the nodes to
    const existingPositions: Record<string, { x: number; y: number }> = {};
    existingSynNodes.forEach((n) => {
      existingPositions[n.id] = n.position;
    });

    const mergedSynNodes = newSynNodes.map((n) => ({
      ...n,
      position: existingPositions[n.id] ?? n.position,
    }));

    const realEdges = edges.filter((e) => !e.id.startsWith('se-'));
    const mergedEdges = [
      ...realEdges.filter((e) => !newEdgeIds.has(e.id)),
      ...newSynEdges,
    ];

    set({ nodes: [...realNodes, ...mergedSynNodes], edges: mergedEdges });
  },
});
