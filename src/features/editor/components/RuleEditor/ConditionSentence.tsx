import React from 'react';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { BlueprintRenderer } from './sentence/BlueprintRenderer';
import { branchOf } from './ruleTree';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import styles from './RuleEditor.module.css';

export interface ConditionSentenceProps {
  node: LogicNode;
  onChangeParam: (nodeId: string, key: string, value: unknown) => void;
  /** Nesting depth, so a group inside a group can be bracketed. */
  depth?: number;
}

/**
 * A condition as a clause.
 *
 * A group does not render as a header with an indented list — it joins its
 * clauses inline with "and" or "or", which is what makes the rule read left to
 * right. A group nested inside another is bracketed, so "a and (b or c)" cannot
 * be misread as "a and b or c".
 */
export const ConditionSentence: React.FC<ConditionSentenceProps> = ({
  node,
  onChangeParam,
  depth = 0,
}) => {
  const blueprint = node.blueprintId ? conditionalBlueprints[node.blueprintId] : undefined;
  const group = blueprint as { isGroup?: boolean; joinWord?: 'and' | 'or' } | undefined;

  if (group?.isGroup) {
    const clauses = branchOf(node, 'branch_conditions')?.children ?? [];

    if (clauses.length === 0) {
      return <span className={styles.emptyClause}>no conditions yet</span>;
    }

    const joined = (
      <>
        {clauses.map((clause, index) => (
          <React.Fragment key={clause.id}>
            {index > 0 && <span className={styles.joinWord}> {group.joinWord ?? 'and'} </span>}
            <ConditionSentence node={clause} onChangeParam={onChangeParam} depth={depth + 1} />
          </React.Fragment>
        ))}
      </>
    );

    // Only bracket when nested, so the common single-level case stays clean.
    return depth > 0 && clauses.length > 1 ? <span>({joined})</span> : joined;
  }

  if (!blueprint) {
    return <span className={styles.unknownRule}>an unrecognised condition ({node.blueprintId})</span>;
  }

  return (
    <BlueprintRenderer
      template={blueprint.template}
      params={node.params ?? {}}
      onChangeParam={(key, value) => onChangeParam(node.id, key, value)}
    />
  );
};
