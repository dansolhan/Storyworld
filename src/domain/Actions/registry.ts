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

export interface GoToSubplotParams {
  subplotId: string | null;
  targetPageId: string | null;
}

export const goToSubplotBlueprint: ActionBlueprint<GoToSubplotParams> = {
  id: 'go_to_subplot',
  name: 'Go to Subplot',
  template: 'Go to Subplot {{subplotId}} starting at page {{targetPageId}}',
  defaultParams: {
    subplotId: null,
    targetPageId: null,
  },
  execute: (params) => {
    // Engine execution logic: Navigate to the target page ID
    // E.g., context.navigate(params.targetPageId) (depends on how player works)
    console.log(`Navigating to subplot ${params.subplotId}, page ${params.targetPageId}`);
  },
};


// Expose a central registry of blueprints for easy selection
export const actionBlueprints: Record<string, ActionBlueprint<unknown>> = {
  [setVariableBlueprint.id]: setVariableBlueprint as unknown as ActionBlueprint<unknown>,
  [goToSubplotBlueprint.id]: goToSubplotBlueprint as unknown as ActionBlueprint<unknown>,
};
