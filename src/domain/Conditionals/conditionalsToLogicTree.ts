import type { Conditional } from './Conditional';
import type { LogicNode } from '../Story/LogicNode';

/**
 * Adapts a `Conditional[]` into the logic tree the evaluator speaks.
 *
 * Three call sites needed this and all three used `as any` instead, which
 * looked harmless and was not: the evaluator only acts on nodes whose `type` is
 * `'condition'`, and a `Conditional` has no `type` field at all. Cast straight
 * across, every condition was skipped and the check silently passed. Status-data
 * visibility conditions in particular never hid anything.
 *
 * Only `branch_conditions` is produced. `branch_then` / `branch_else` exist for
 * sequential execution of actions; visibility evaluation never reads them.
 */
const conditionalToLogicNode = (conditional: Conditional): LogicNode => {
  const node: LogicNode = {
    id: conditional.id,
    type: 'condition',
    name: conditional.blueprintId,
    blueprintId: conditional.blueprintId,
    params: conditional.params,
  };

  const children = conditional.children ?? [];
  if (children.length > 0) {
    // Group blueprints read their operands from this branch.
    node.children = [
      {
        id: `${conditional.id}-conditions`,
        type: 'branch_conditions',
        name: 'Conditions',
        children: children.map(conditionalToLogicNode),
      },
    ];
  }

  return node;
};

export const conditionalsToLogicTree = (conditionals: Conditional[]): LogicNode[] =>
  conditionals.map(conditionalToLogicNode);
