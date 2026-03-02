import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { Action } from '../../../../domain/Actions/Action';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { ActionCard } from './ActionCard';
import styles from '../ConditionalsEditor/ConditionalsEditor.module.css'; // Reusing the same css structure

interface ActionsEditorProps {
  targetType: 'choice' | 'page';
  pageId: string;
  targetId: string;
  actions: Action[];
}

export const ActionsEditor: React.FC<ActionsEditorProps> = ({
  targetType,
  pageId,
  targetId,
  actions,
}) => {
  const { addAction } = useEditorStore();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Actions ({actions.length})</span>
      </div>

      {actions.map((act) => {
        const blueprint = actionBlueprints[act.blueprintId];
        if (!blueprint) return null;
        return (
          <ActionCard
            key={act.id}
            targetType={targetType}
            pageId={pageId}
            targetId={targetId}
            action={act}
            blueprint={blueprint}
          />
        );
      })}

      <select
        className={styles.comboboxSelect}
        value=""
        onChange={(e) => {
          if (e.target.value) {
            addAction(targetType, pageId, targetId, e.target.value);
          }
        }}
      >
        <option value="" disabled>+ Add action...</option>
        {Object.values(actionBlueprints).map((bp) => (
          <option key={bp.id} value={bp.id}>{bp.name}</option>
        ))}
      </select>
    </div>
  );
};
