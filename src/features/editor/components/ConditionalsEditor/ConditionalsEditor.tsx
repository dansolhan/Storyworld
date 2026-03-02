import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { Conditional } from '../../../../domain/Conditionals/Conditional';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { ConditionalCard } from './ConditionalCard';
import styles from './ConditionalsEditor.module.css';

interface ConditionalsEditorProps {
  targetType: 'choice' | 'paragraph' | 'action';
  pageId: string;
  targetId: string;
  conditionals: Conditional[];
  parentId?: string;
}

export const ConditionalsEditor: React.FC<ConditionalsEditorProps> = ({
  targetType,
  pageId,
  targetId,
  conditionals,
  parentId
}) => {
  const { addConditional } = useEditorStore();

  return (
    <div className={styles.container} style={parentId ? { marginTop: '0.25rem', border: 'none', paddingLeft: '0.5rem', background: 'transparent' } : {}}>
      {!parentId && (
        <div className={styles.header}>
          <span>Conditionals ({conditionals.length})</span>
        </div>
      )}

      {conditionals.map((cond) => {
        const blueprint = conditionalBlueprints[cond.blueprintId];
        if (!blueprint) return null;
        return (
          <ConditionalCard
            key={cond.id}
            targetType={targetType}
            pageId={pageId}
            targetId={targetId}
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
            addConditional(targetType, pageId, targetId, e.target.value, parentId);
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
