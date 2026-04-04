import type { Conditional } from '../Conditionals/Conditional';


export interface ActionContext<TVariables = Record<string, unknown>> {
  variables: TVariables;
  setVariable: (key: string, value: unknown) => void;
  postMessage: (message: string, displayStyle?: 'styled' | 'paragraph') => void;
  goToPage?: (pageId: string) => void;
  modifyInventory?: (itemId: string, amount: number) => void;
  setVisibility?: (visible: boolean) => void;
  setChoiceText?: (text: string) => void;
  preventMove?: () => void;
  endStory?: (data: Record<string, unknown>) => void;
  playSound?: (soundId: string, category: 'bgm' | 'sfx') => void;
  stopAllSounds?: () => void;
}

export interface Action<TParams = Record<string, unknown>> {
  id: string;
  blueprintId: string;
  params: TParams;
  conditionals?: Conditional[]; // Actions can have conditions to execute
}

export interface ActionBlueprint<
  TParams = Record<string, unknown>,
  TVariables = Record<string, unknown>
> {
  id: string;
  name: string;
  template: string; // Follows the same "{{token}}" pattern as Conditionals
  domainContext?: string[]; // e.g. ['page', 'choice', 'paragraph']. If omitted, visible in all domains.
  eventContext?: string[]; // e.g. ['onEnter', 'onClick']. If omitted, visible in all events.
  defaultParams: TParams;
  execute: (
    params: TParams,
    context: ActionContext<TVariables>
  ) => void;
}

