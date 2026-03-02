import type { Conditional } from '../Conditionals/Conditional';

export interface ActionContext<TVariables = Record<string, unknown>> {
  variables: TVariables;
  setVariable: (key: string, value: unknown) => void;
  // Extensible for future mutations (e.g. giveItem, addReputation)
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
  defaultParams: TParams;
  execute: (
    params: TParams,
    context: ActionContext<TVariables>
  ) => void;
}
