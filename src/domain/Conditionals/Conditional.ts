export interface EvaluationContext<TVariables = Record<string, unknown>> {
  variables: TVariables;
  visitedPageIds: string[];
  currentPageId?: string;
}

export interface Conditional<TParams = Record<string, unknown>> {
  id: string;
  blueprintId: string;
  params: TParams;
}

export type ConditionalLogic = 'AND' | 'OR';

export interface ConditionalBlueprint<
  TParams = Record<string, unknown>,
  TVariables = Record<string, unknown>
> {
  id: string;
  name: string;
  template: string;
  defaultParams: TParams;
  evaluate: (params: TParams, context: EvaluationContext<TVariables>) => boolean;
}
