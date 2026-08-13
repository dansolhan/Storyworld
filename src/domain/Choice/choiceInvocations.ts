import type { Choice } from './Choice';
import type { Action } from '../Actions/Action';
import type { LogicNode } from '../Story/LogicNode';

export interface BlueprintInvocation {
  blueprintId: string;
  params: Record<string, unknown>;
}

/**
 * Every blueprint a choice invokes, wherever it is attached.
 *
 * Choices carried their behaviour in `actions` before schema 1.0.0 and in
 * `events[].logicTree` after it. Anything asking "what does this choice do" has to
 * read both, and reading only the legacy field is how the canvas lost its crossing
 * and action markers: the 1.0.0 migration moves `actions` into `events` and *drops*
 * the old field, so `choice.actions` is empty for every migrated story and the
 * synthetic nodes silently stopped being created.
 *
 * Walks to the bottom of a logic tree, since an action inside a condition's THEN
 * branch is still something the choice can do.
 */
export const choiceInvocations = (choice: Choice): BlueprintInvocation[] => {
  const found: BlueprintInvocation[] = [];

  const add = (blueprintId: string | undefined, params: unknown): void => {
    if (blueprintId) {
      found.push({ blueprintId, params: (params ?? {}) as Record<string, unknown> });
    }
  };

  const walkTree = (nodes: LogicNode[] | undefined): void => {
    for (const node of nodes ?? []) {
      if (node.type === 'action') add(node.blueprintId, node.params);
      walkTree(node.children);
    }
  };

  const walkActions = (actions: Action[] | undefined): void => {
    for (const action of actions ?? []) {
      add(action.blueprintId, action.params);
      for (const conditional of action.conditionals ?? []) {
        add(conditional.blueprintId, conditional.params);
      }
    }
  };

  walkActions(choice.actions);
  for (const event of choice.events ?? []) walkTree(event.logicTree);

  return found;
};

/** The subplot crossing a choice performs, if any. */
export const crossingOf = (
  choice: Choice
): { subplotId: string | null; targetPageId: string | null } | undefined => {
  const crossing = choiceInvocations(choice).find(
    (invocation) => invocation.blueprintId === 'go_to_subplot'
  );
  if (!crossing) return undefined;

  const asId = (value: unknown): string | null => (typeof value === 'string' ? value : null);
  return {
    // A null subplot means the crossing returns to the main plot.
    subplotId: asId(crossing.params.subplotId),
    targetPageId: asId(crossing.params.targetPageId),
  };
};
