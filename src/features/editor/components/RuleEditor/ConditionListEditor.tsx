import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { ConditionSentence } from './ConditionSentence';
import { RulePicker } from './RulePicker';
import { branchOf, insertNode, moveNode, removeNode, updateNodeParams } from './ruleTree';
import { newRuleNode } from './newRuleNode';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import type { RuleOption } from './rulePickerOptions';
import styles from './RuleEditor.module.css';

export interface ConditionListEditorProps {
  /** Empty means "always". Several roots are ANDed. */
  condition: LogicNode[];
  onChange: (condition: LogicNode[]) => void;
  /** What the list says when it is empty, e.g. "Always shown." */
  emptyLabel: string;
  addLabel?: string;
}

/**
 * A standalone list of conditions, as sentences.
 *
 * `RuleEditor` owns rules attached to a page, paragraph or choice and writes
 * through the event slice. This owns a bare `LogicNode[]` and hands it back — what
 * status-data visibility needs, and what derived-text outcomes will need. The
 * sentence rendering and the picker are the same ones, so a condition reads
 * identically wherever it is asked.
 *
 * No THEN or ELSE: a condition here is a question, not a rule with consequences,
 * and visibility evaluation never reads those branches.
 */
export const ConditionListEditor: React.FC<ConditionListEditorProps> = ({
  condition,
  onChange,
  emptyLabel,
  addLabel = 'Add a condition',
}) => {
  /**
   * Where a picked condition will land: a branch id, `null` for the root list, or
   * `undefined` when the picker is closed. Tracking the destination is what lets a
   * group be filled — appending to the root instead would leave "all of these
   * hold" permanently empty.
   */
  const [pendingParentId, setPendingParentId] = useState<string | null | undefined>(undefined);

  const insert = (option: RuleOption) => {
    if (pendingParentId === undefined) return;
    onChange(insertNode(condition, pendingParentId, newRuleNode('condition', option.blueprintId)));
    setPendingParentId(undefined);
  };

  return (
    <div className={styles.editor}>
      {condition.length === 0 ? (
        <p className={styles.doNothing}>{emptyLabel}</p>
      ) : (
        condition.map((node, index) => (
          <div key={node.id} className={styles.rule}>
            <span className={styles.sentence}>
              {index > 0 && <span className={styles.joinWord}>and </span>}
              <ConditionSentence
                node={node}
                onChangeParam={(nodeId, key, value) =>
                  onChange(updateNodeParams(condition, nodeId, { [key]: value }))
                }
              />
            </span>

            <span className={styles.controls}>
              <button
                type="button"
                className={styles.control}
                disabled={index === 0}
                aria-label="Move up"
                onClick={() => onChange(moveNode(condition, node.id, -1))}
              >
                <ChevronUp className={styles.controlIcon} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.control}
                disabled={index === condition.length - 1}
                aria-label="Move down"
                onClick={() => onChange(moveNode(condition, node.id, 1))}
              >
                <ChevronDown className={styles.controlIcon} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.control}
                aria-label="Remove condition"
                onClick={() => onChange(removeNode(condition, node.id))}
              >
                <X className={styles.controlIcon} aria-hidden="true" />
              </button>
            </span>
          </div>
        ))
      )}

      {condition.map((node) => {
        // A group holds its clauses in its own branch, so it needs its own way in.
        const clauses = branchOf(node, 'branch_conditions');
        if (!clauses) return null;
        return (
          <button
            key={`${node.id}-clause`}
            type="button"
            className={styles.addClause}
            onClick={() => setPendingParentId(clauses.id)}
          >
            + another clause
          </button>
        );
      })}

      <button type="button" className={styles.addRule} onClick={() => setPendingParentId(null)}>
        <Plus className={styles.addIcon} aria-hidden="true" />
        {addLabel}
      </button>

      {pendingParentId !== undefined && (
        <RulePicker
          destination="this entry"
          only="condition"
          onCancel={() => setPendingParentId(undefined)}
          onPick={insert}
        />
      )}
    </div>
  );
};
