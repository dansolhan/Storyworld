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
  execute: (params, context) => {
    if (params.targetPageId && context.goToPage) {
      context.goToPage(params.targetPageId);
    }
  },
};

export interface PostMessageParams {
  message: string;
  displayStyle?: 'styled' | 'paragraph';
}

export const postMessageBlueprint: ActionBlueprint<PostMessageParams> = {
  id: 'post_message',
  name: 'Post Message',
  template: 'Post message: "{{message}}" as {{displayStyle}}',
  defaultParams: {
    message: '',
    displayStyle: 'styled',
  },
  execute: (params, context) => {
    if (!params.message) return;
    context.postMessage(params.message, params.displayStyle);
  },
};

// Expose a central registry of blueprints for easy selection
export const actionBlueprints: Record<string, ActionBlueprint<unknown>> = {
  [setVariableBlueprint.id]: setVariableBlueprint as unknown as ActionBlueprint<unknown>,
  [goToSubplotBlueprint.id]: goToSubplotBlueprint as unknown as ActionBlueprint<unknown>,
  [postMessageBlueprint.id]: postMessageBlueprint as unknown as ActionBlueprint<unknown>,
};
