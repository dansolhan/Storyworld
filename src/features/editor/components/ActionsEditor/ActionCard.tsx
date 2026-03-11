import React from 'react';
import type { Action, ActionBlueprint, ActionTrigger } from '../../../../domain/Actions/Action';
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
  const { removeAction } = useEditorStore();

  const handleChangeParam = (key: string, value: unknown) => {
    useEditorStore.getState().updateAction(targetType, pageId, targetId, action.id, {
      ...(action.params as Record<string, unknown>),
      [key]: value,
    });
  };

  const handleChangeTrigger = (trigger: ActionTrigger) => {
    // Directly patch the trigger field on the matching action in the node data
    const nodes = useEditorStore.getState().nodes;
    const patchedNodes = nodes.map((node) => {
      if (node.id !== pageId || node.type !== 'pageNode') return node;
      if (targetType === 'page') {
        return {
          ...node,
          data: {
            ...node.data,
            actions: (node.data.actions || []).map((a: Action) =>
              a.id === action.id ? { ...a, trigger } : a
            ),
          },
        };
      }
      // choice
      return {
        ...node,
        data: {
          ...node.data,
          choices: (node.data.choices || []).map((c: any) =>
            c.id === targetId
              ? {
                ...c,
                actions: (c.actions || []).map((a: Action) =>
                  a.id === action.id ? { ...a, trigger } : a
                ),
              }
              : c
          ),
        },
      };
    });
    useEditorStore.setState({ nodes: patchedNodes });
  };

  const handleRemove = () => {
    removeAction(targetType, pageId, targetId, action.id);
  };

  return (
    <BlueprintCard
      template={blueprint.template}
      params={action.params as Record<string, unknown>}
      trigger={action.trigger ?? 'on_enter'}
      onChangeTrigger={handleChangeTrigger}
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
