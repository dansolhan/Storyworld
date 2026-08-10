import type { ActionBlueprint } from './Action';
import type { NoParams } from '../Blueprints/NoParams';
import { readVariableValue } from '../Story/Variable';

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
  messageLocId?: string;
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

export const hideParagraphBlueprint: ActionBlueprint<NoParams> = {
  id: 'hide_paragraph',
  name: 'Hide Paragraph',
  template: 'Hide this paragraph',
  domainContext: ['paragraph'],
  eventContext: ['calculateVisibility'],
  defaultParams: {},
  execute: (_params, context) => {
    if (context.setVisibility) {
      context.setVisibility(false);
    }
  },
};

export const hideChoiceBlueprint: ActionBlueprint<NoParams> = {
  id: 'hide_choice',
  name: 'Hide Choice',
  template: 'Hide this choice',
  domainContext: ['choice'],
  eventContext: ['calculateVisibility'],
  defaultParams: {},
  execute: (_params, context) => {
    if (context.setVisibility) {
      context.setVisibility(false);
    }
  },
};

export const preventMoveToPageBlueprint: ActionBlueprint<NoParams> = {
  id: 'prevent_move_to_page',
  name: 'Prevent Move to Page',
  template: 'Prevent moving to the next page',
  domainContext: ['choice'],
  eventContext: ['onSelect'],
  defaultParams: {},
  execute: (_params, context) => {
    if (context.preventMove) {
      context.preventMove();
    }
  },
};

export interface EndStoryParams {
  data: Array<{
    key: string;
    value: string;
    isVariable: boolean;
  }>;
}

export const endStoryBlueprint: ActionBlueprint<EndStoryParams> = {
  id: 'end_story',
  name: 'End Story',
  template: 'End the story and return: {{data}}',
  defaultParams: {
    data: [],
  },
  execute: (params, context) => {
    const resolvedData: Record<string, unknown> = {};
    (params.data || []).forEach((entry) => {
      if (entry.isVariable) {
        resolvedData[entry.key] = readVariableValue(context.variables, entry.value);
      } else {
        resolvedData[entry.key] = entry.value;
      }
    });
    if (context.endStory) {
      context.endStory(resolvedData);
    }
  },
};

export interface ChangeChoiceTextParams {
  text: string;
}

export const changeChoiceTextBlueprint: ActionBlueprint<ChangeChoiceTextParams> = {
  id: 'change_choice_text',
  name: 'Change Choice Text',
  template: 'Change choice text to "{{text}}"',
  domainContext: ['choice'],
  eventContext: ['onHover', 'onSelect'],
  defaultParams: {
    text: '',
  },
  execute: (params, context) => {
    if (context.setChoiceText && params.text) {
      context.setChoiceText(params.text);
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
  [hideParagraphBlueprint.id]: hideParagraphBlueprint as unknown as ActionBlueprint<unknown>,
  [hideChoiceBlueprint.id]: hideChoiceBlueprint as unknown as ActionBlueprint<unknown>,
  [preventMoveToPageBlueprint.id]: preventMoveToPageBlueprint as unknown as ActionBlueprint<unknown>,
  [changeChoiceTextBlueprint.id]: changeChoiceTextBlueprint as unknown as ActionBlueprint<unknown>,
  [endStoryBlueprint.id]: endStoryBlueprint as unknown as ActionBlueprint<unknown>,
};
