import type { LogicNode } from '../../../../domain/Story/LogicNode';

/**
 * Pure edits on a logic tree.
 *
 * The tree shape is unchanged from the drag-and-drop builder — this step is a
 * rewrite of the presentation, not of the data — so these operate on the same
 * `LogicNode[]` the evaluator reads.
 */

const clone = (nodes: LogicNode[]): LogicNode[] =>
  nodes.map((node) => ({ ...node, children: node.children ? clone(node.children) : undefined }));

/** Applies `edit` to the child list of `parentId`, or to the roots when null. */
export const editChildren = (
  nodes: LogicNode[],
  parentId: string | null,
  edit: (children: LogicNode[]) => LogicNode[]
): LogicNode[] => {
  if (parentId === null) return edit(clone(nodes));

  const walk = (list: LogicNode[]): LogicNode[] =>
    list.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: edit([...(node.children ?? [])]) };
      }
      return node.children ? { ...node, children: walk(node.children) } : node;
    });

  return walk(clone(nodes));
};

export const insertNode = (
  nodes: LogicNode[],
  parentId: string | null,
  node: LogicNode
): LogicNode[] => editChildren(nodes, parentId, (children) => [...children, node]);

export const removeNode = (nodes: LogicNode[], nodeId: string): LogicNode[] => {
  const walk = (list: LogicNode[]): LogicNode[] =>
    list
      .filter((node) => node.id !== nodeId)
      .map((node) => (node.children ? { ...node, children: walk(node.children) } : node));
  return walk(clone(nodes));
};

/**
 * Moves a node one place within its own list.
 *
 * Order is load-bearing: actions run in sequence, so giving an item then setting
 * a flag is not the same as the reverse. The drag-and-drop tree is gone, but the
 * capability is not.
 */
export const moveNode = (nodes: LogicNode[], nodeId: string, delta: -1 | 1): LogicNode[] => {
  const walk = (list: LogicNode[]): LogicNode[] => {
    const index = list.findIndex((node) => node.id === nodeId);
    if (index !== -1) {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const reordered = [...list];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    }
    return list.map((node) => (node.children ? { ...node, children: walk(node.children) } : node));
  };
  return walk(clone(nodes));
};

export const updateNodeParams = (
  nodes: LogicNode[],
  nodeId: string,
  params: Record<string, unknown>
): LogicNode[] => {
  const walk = (list: LogicNode[]): LogicNode[] =>
    list.map((node) => {
      if (node.id === nodeId) return { ...node, params: { ...node.params, ...params } };
      return node.children ? { ...node, children: walk(node.children) } : node;
    });
  return walk(clone(nodes));
};

/** The branch of a condition that holds a given kind of child. */
export const branchOf = (
  node: LogicNode,
  type: 'branch_then' | 'branch_else' | 'branch_conditions'
): LogicNode | undefined => node.children?.find((child) => child.type === type);

export const BRANCH_LABELS = {
  branch_then: 'Then',
  branch_else: 'Else',
  branch_conditions: 'Conditions',
} as const;
