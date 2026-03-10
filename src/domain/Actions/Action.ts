import type { Conditional } from '../Conditionals/Conditional';

/**
 * Controls when an action fires relative to page display.
 * - 'on_enter': fires immediately when the page/choice is triggered, before content is shown
 * - 'on_exit': fires after the page content has been shown, as the player transitions away
 */
export type ActionTrigger = 'on_enter' | 'on_exit';

export interface ActionContext<TVariables = Record<string, unknown>> {
  variables: TVariables;
  setVariable: (key: string, value: unknown) => void;
  postMessage: (message: string, displayStyle?: 'styled' | 'paragraph') => void;
  goToPage?: (pageId: string) => void;
  modifyInventory?: (itemId: string, amount: number) => void;
}

export interface Action<TParams = Record<string, unknown>> {
  id: string;
  blueprintId: string;
  params: TParams;
  trigger?: ActionTrigger; // defaults to 'on_enter' if omitted
  conditionals?: Conditional[]; // Actions can have conditions to execute
}

export interface ActionBlueprint<
  TParams = Record<string, unknown>,
  TVariables = Record<string, unknown>
> {
  id: string;
  name: string;
  template: string; // Follows the same "{{token}}" pattern as Conditionals
  defaultParams: TParams;
  execute: (
    params: TParams,
    context: ActionContext<TVariables>
  ) => void;
}
