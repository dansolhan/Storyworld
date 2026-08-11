import type { LogicNode, LogicNodeType } from '../../../../domain/Story/LogicNode';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';

const branch = (type: LogicNodeType, name: string): LogicNode => ({
  id: crypto.randomUUID(),
  type,
  name,
  children: [],
});

/**
 * Builds the node a picked blueprint becomes.
 *
 * Conditions arrive with the branches they need: `branch_then` and
 * `branch_else` so there is somewhere to put consequences, plus
 * `branch_conditions` for a group, which is where its clauses live. Getting this
 * wrong is how a rule ends up unevaluatable, since the evaluator looks the
 * branches up by type.
 */
export const newRuleNode = (kind: 'action' | 'condition', blueprintId: string): LogicNode => {
  const blueprint =
    kind === 'action' ? actionBlueprints[blueprintId] : conditionalBlueprints[blueprintId];

  const node: LogicNode = {
    id: crypto.randomUUID(),
    type: kind,
    name: blueprint?.name ?? blueprintId,
    blueprintId,
    // Cloned, or every rule of the same kind would share one params object.
    params: JSON.parse(JSON.stringify(blueprint?.defaultParams ?? {})),
  };

  if (kind !== 'condition') return node;

  const isGroup = Boolean(
    (conditionalBlueprints[blueprintId] as { isGroup?: boolean } | undefined)?.isGroup
  );

  node.children = [
    ...(isGroup ? [branch('branch_conditions', 'Conditions')] : []),
    branch('branch_then', 'Then'),
    branch('branch_else', 'Else'),
  ];

  return node;
};
