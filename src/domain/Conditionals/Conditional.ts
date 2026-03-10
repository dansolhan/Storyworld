export interface EvaluationContext<TVariables = Record<string, unknown>> {
  variables: TVariables;
  visitedPageIds: string[];
  currentPageId?: string;
  inventory?: Record<string, number>;
}

export interface Conditional<TParams = Record<string, unknown>> {
  id: string;
  blueprintId: string;
  params: TParams;
  children?: Conditional[];
}

export interface ConditionalBlueprint<
  TParams = Record<string, unknown>,
  TVariables = Record<string, unknown>
> {
  id: string;
  name: string;
  template: string;
  isGroup?: boolean;
  defaultParams: TParams;
  evaluate: (
    params: TParams,
    context: EvaluationContext<TVariables>,
    children?: Conditional[],
    evaluateNode?: (cond: Conditional) => boolean
  ) => boolean;
}
