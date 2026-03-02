import React from 'react';
import type { Conditional, ConditionalBlueprint } from '../../../../domain/Conditionals/Conditional';
import { useEditorStore } from '../../store/useEditorStore';
import { ConditionalsEditor } from './ConditionalsEditor';
import { BlueprintCard } from '../shared/BlueprintCard';

interface ConditionalCardProps {
  targetType: 'choice' | 'paragraph' | 'action';
  pageId: string;
  targetId: string;
  conditional: Conditional;
  blueprint: ConditionalBlueprint<any>;
}

export const ConditionalCard: React.FC<ConditionalCardProps> = ({ targetType, pageId, targetId, conditional, blueprint }) => {
  const { updateConditional, removeConditional } = useEditorStore();

  const handleChangeParam = (key: string, value: unknown) => {
    updateConditional(targetType, pageId, targetId, conditional.id, {
      ...conditional.params,
      [key]: value,
    });
  };

  const handleRemove = () => {
    removeConditional(targetType, pageId, targetId, conditional.id);
  };

  return (
    <BlueprintCard
      template={blueprint.template}
      isGroup={blueprint.isGroup}
      params={conditional.params}
      onChangeParam={handleChangeParam}
      onRemove={handleRemove}
    >
      {blueprint.isGroup && (
        <ConditionalsEditor
          targetType={targetType}
          pageId={pageId}
          targetId={targetId}
          conditionals={conditional.children || []}
          parentId={conditional.id}
        />
      )}
    </BlueprintCard>
  );
};
