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

export interface GiveItemParams {
  itemId: string | null;
  count: number;
}

export const giveItemBlueprint: ActionBlueprint<GiveItemParams> = {
  id: 'give_item',
  name: 'Give Item',
  template: 'Give {{count}} {{itemId}}',
  defaultParams: {
    itemId: null,
    count: 1,
  },
  execute: (params, context) => {
    if (!params.itemId || !context.modifyInventory) return;
    context.modifyInventory(params.itemId, params.count || 1);
  },
};

export interface RemoveItemParams {
  itemId: string | null;
  count: number;
  all: boolean;
}

export const removeItemBlueprint: ActionBlueprint<RemoveItemParams> = {
  id: 'remove_item',
  name: 'Remove Item',
  template: 'Remove {{count}} {{itemId}}',
  defaultParams: {
    itemId: null,
    count: 1,
    all: false,
  },
  execute: (params, context) => {
    if (!params.itemId || !context.modifyInventory) return;
    if (params.all) {
      context.modifyInventory(params.itemId, -9999999);
    } else {
      context.modifyInventory(params.itemId, -(params.count || 1));
    }
  },
};

// Expose a central registry of blueprints for easy selection
export const actionBlueprints: Record<string, ActionBlueprint<unknown>> = {
  [setVariableBlueprint.id]: setVariableBlueprint as unknown as ActionBlueprint<unknown>,
  [goToSubplotBlueprint.id]: goToSubplotBlueprint as unknown as ActionBlueprint<unknown>,
  [postMessageBlueprint.id]: postMessageBlueprint as unknown as ActionBlueprint<unknown>,
  [giveItemBlueprint.id]: giveItemBlueprint as unknown as ActionBlueprint<unknown>,
  [removeItemBlueprint.id]: removeItemBlueprint as unknown as ActionBlueprint<unknown>,
};
