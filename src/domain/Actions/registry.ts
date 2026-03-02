import type { ActionBlueprint } from './Action';

export interface SetVariableParams {
  variableKey: string | null;
  value: string; // Everything is stored as strings in variables for now based on EditorState
}

export const setVariableBlueprint: ActionBlueprint<SetVariableParams> = {
  id: 'set_variable',
  name: 'Set Variable',
  template: 'Set variable {{variable}} to {{value}}',
  defaultParams: {
    variableKey: null,
    value: '',
  },
  execute: (params, context) => {
    if (!params.variableKey) return;
    context.setVariable(params.variableKey, params.value);
  },
};

// Expose a central registry of blueprints for easy selection
export const actionBlueprints: Record<string, ActionBlueprint<unknown>> = {
  [setVariableBlueprint.id]: setVariableBlueprint as unknown as ActionBlueprint<unknown>,
};
