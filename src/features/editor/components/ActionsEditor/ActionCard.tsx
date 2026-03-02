import React from 'react';
import type { Action, ActionBlueprint } from '../../../../domain/Actions/Action';
import { useEditorStore } from '../../store/useEditorStore';
import { ConditionalsEditor } from '../ConditionalsEditor/ConditionalsEditor';
import { BlueprintCard } from '../shared/BlueprintCard';

interface ActionCardProps {
  targetType: 'choice' | 'page';
  pageId: string;
  targetId: string;
  action: Action;
  blueprint: ActionBlueprint<any>;
}

export const ActionCard: React.FC<ActionCardProps> = ({ targetType, pageId, targetId, action, blueprint }) => {
  const { updateAction, removeAction } = useEditorStore();

  const handleChangeParam = (key: string, value: unknown) => {
    updateAction(targetType, pageId, targetId, action.id, {
      ...action.params,
      [key]: value,
    });
  };

  const handleRemove = () => {
    removeAction(targetType, pageId, targetId, action.id);
  };

  return (
    <BlueprintCard
      template={blueprint.template}
      params={action.params}
      onChangeParam={handleChangeParam}
      onRemove={handleRemove}
    >
      <ConditionalsEditor
        targetType="action"
        pageId={pageId}
        targetId={action.id}
        conditionals={action.conditionals || []}
      />
    </BlueprintCard>
  );
};
