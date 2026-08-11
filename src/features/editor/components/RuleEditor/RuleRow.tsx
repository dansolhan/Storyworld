import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { BlueprintRenderer } from './sentence/BlueprintRenderer';
import { ConditionSentence } from './ConditionSentence';
import { branchOf } from './ruleTree';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import styles from './RuleEditor.module.css';

export interface RuleActions {
  onChangeParam: (nodeId: string, key: string, value: unknown) => void;
  onRemove: (nodeId: string) => void;
  onMove: (nodeId: string, delta: -1 | 1) => void;
  /** Opens the picker to add into a branch, or into the roots when null. */
  onAdd: (parentId: string | null, into: 'then' | 'else' | 'rule') => void;
}

export interface RuleRowProps extends RuleActions {
  node: LogicNode;
  /** Whether this row can move up or down within its own list. */
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const Controls: React.FC<{
  nodeId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: RuleActions['onMove'];
  onRemove: RuleActions['onRemove'];
}> = ({ nodeId, canMoveUp, canMoveDown, onMove, onRemove }) => (
  <span className={styles.controls}>
    {/*
      Replaces the tree's drag handles. Order matters for actions, so the
      capability stays — and unlike dragging, this works from the keyboard.
    */}
    <button
      type="button"
      className={styles.control}
      disabled={!canMoveUp}
      aria-label="Move up"
      onClick={() => onMove(nodeId, -1)}
    >
      <ChevronUp className={styles.controlIcon} aria-hidden="true" />
    </button>
    <button
      type="button"
      className={styles.control}
      disabled={!canMoveDown}
      aria-label="Move down"
      onClick={() => onMove(nodeId, 1)}
    >
      <ChevronDown className={styles.controlIcon} aria-hidden="true" />
    </button>
    <button
      type="button"
      className={styles.control}
      aria-label="Remove rule"
      onClick={() => onRemove(nodeId)}
    >
      <X className={styles.controlIcon} aria-hidden="true" />
    </button>
  </span>
);

const Branch: React.FC<
  RuleActions & {
    label: string;
    branch: LogicNode | undefined;
    parentId: string;
    kind: 'then' | 'else';
  }
> = ({ label, branch, parentId, kind, ...actions }) => {
  const children = branch?.children ?? [];

  return (
    <div className={styles.branch} data-kind={kind}>
      <span className={styles.branchLabel}>{label}</span>

      <div className={styles.branchBody}>
        {children.length === 0 ? (
          <p className={styles.doNothing}>do nothing</p>
        ) : (
          children.map((child, index) => (
            <RuleRow
              key={child.id}
              node={child}
              canMoveUp={index > 0}
              canMoveDown={index < children.length - 1}
              {...actions}
            />
          ))
        )}

        <button
          type="button"
          className={styles.addInline}
          onClick={() => actions.onAdd(branch?.id ?? parentId, kind)}
        >
          + {kind}…
        </button>
      </div>
    </div>
  );
};

/**
 * One rule.
 *
 * An action is a sentence. A condition is a sentence beginning "If", followed by
 * its Then and Else branches — which is the whole of the design's structure, and
 * why the tree's chevrons and drag handles are gone.
 */
export const RuleRow: React.FC<RuleRowProps> = ({ node, canMoveUp, canMoveDown, ...actions }) => {
  const { onChangeParam, onMove, onRemove } = actions;

  if (node.type === 'action') {
    const blueprint = node.blueprintId ? actionBlueprints[node.blueprintId] : undefined;

    return (
      <div className={styles.rule}>
        <span className={styles.sentence}>
          {blueprint ? (
            <BlueprintRenderer
              template={blueprint.template}
              params={node.params ?? {}}
              onChangeParam={(key, value) => onChangeParam(node.id, key, value)}
            />
          ) : (
            <span className={styles.unknownRule}>
              an unrecognised action ({node.blueprintId})
            </span>
          )}
        </span>
        <Controls
          nodeId={node.id}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
    );
  }

  if (node.type !== 'condition') return null;

  const isGroup = Boolean(
    node.blueprintId
      ? (conditionalBlueprints[node.blueprintId] as { isGroup?: boolean } | undefined)?.isGroup
      : false
  );

  return (
    <div className={styles.conditionRule}>
      <div className={styles.rule}>
        <span className={styles.sentence}>
          <span className={styles.ifWord}>If </span>
          <ConditionSentence node={node} onChangeParam={onChangeParam} />
        </span>
        <Controls
          nodeId={node.id}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>

      {isGroup && (
        <button
          type="button"
          className={styles.addClause}
          onClick={() => actions.onAdd(branchOf(node, 'branch_conditions')?.id ?? node.id, 'rule')}
        >
          + another condition
        </button>
      )}

      <Branch
        label="Then"
        kind="then"
        branch={branchOf(node, 'branch_then')}
        parentId={node.id}
        {...actions}
      />
      <Branch
        label="Else"
        kind="else"
        branch={branchOf(node, 'branch_else')}
        parentId={node.id}
        {...actions}
      />
    </div>
  );
};
