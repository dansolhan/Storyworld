import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { Choice } from '../../../../domain/Choice/Choice';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { ConditionalCard } from './ConditionalCard';
import styles from './ConditionalsEditor.module.css';

interface ConditionalsEditorProps {
  pageId: string;
  choice: Choice;
}

export const ConditionalsEditor: React.FC<ConditionalsEditorProps> = ({ pageId, choice }) => {
  const { addChoiceConditional, updateChoiceConditionalLogic } = useEditorStore();

  const conditionals = choice.conditionals || [];
  const logic = choice.conditionalLogic || 'AND';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Conditionals ({conditionals.length})</span>
        {conditionals.length > 1 && (
          <div className={styles.logicToggle}>
            <label>
              <input
                type="radio"
                name={`logic-${choice.id}`}
                checked={logic === 'AND'}
                onChange={() => updateChoiceConditionalLogic(pageId, choice.id, 'AND')}
              /> AND
            </label>
            <label>
              <input
                type="radio"
                name={`logic-${choice.id}`}
                checked={logic === 'OR'}
                onChange={() => updateChoiceConditionalLogic(pageId, choice.id, 'OR')}
              /> OR
            </label>
          </div>
        )}
      </div>

      {conditionals.map((cond) => {
        const blueprint = conditionalBlueprints[cond.blueprintId];
        if (!blueprint) return null;
        return (
          <ConditionalCard
            key={cond.id}
            pageId={pageId}
            choiceId={choice.id}
            conditional={cond}
            blueprint={blueprint}
          />
        );
      })}

      <select
        className={styles.comboboxSelect}
        value=""
        onChange={(e) => {
          if (e.target.value) {
            addChoiceConditional(pageId, choice.id, e.target.value);
          }
        }}
      >
        <option value="" disabled>+ Add conditional...</option>
        {Object.values(conditionalBlueprints).map((bp) => (
          <option key={bp.id} value={bp.id}>{bp.name}</option>
        ))}
      </select>
    </div>
  );
};
