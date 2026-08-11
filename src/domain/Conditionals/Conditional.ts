import type { BlueprintCategory } from '../Blueprints/BlueprintCategory';
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
  /**
   * The condition as a clause, with `{{token}}` holes for its params — written so
   * it reads inside a sentence beginning "If the reader…".
   */
  template: string;
  /** Which group the rule picker files this under. */
  category: BlueprintCategory;
  /**
   * A group joins its children into one clause rather than nesting them, so
   * `and_group` renders as "… and …" on a single line.
   */
  isGroup?: boolean;
  /** The word a group joins its children with. */
  joinWord?: 'and' | 'or';
  domainContext?: string[]; // e.g. ['page', 'choice', 'paragraph']. If omitted, visible in all domains.
  eventContext?: string[]; // e.g. ['onEnter', 'onClick']. If omitted, visible in all events.
  defaultParams: TParams;
  evaluate: (
    params: TParams,
    context: EvaluationContext<TVariables>,
    children?: Conditional[],
    evaluateNode?: (cond: Conditional) => boolean
  ) => boolean;
}
