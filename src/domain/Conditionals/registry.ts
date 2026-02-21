import type { ConditionalBlueprint } from './Conditional';

export interface VisitedPageParams {
  not: boolean;
  pageId: string | null;
}

export const visitedPageBlueprint: ConditionalBlueprint<VisitedPageParams> = {
  id: 'visited_page',
  name: 'Visited page',
  template: 'The player has {{not}} visited {{page}}',
  defaultParams: {
    not: false,
    pageId: null,
  },
  evaluate: (params, context) => {
    if (!params.pageId) return true;
    const hasVisited = context.visitedPageIds.includes(params.pageId);
    return params.not ? !hasVisited : hasVisited;
  },
};

export const andGroupBlueprint: ConditionalBlueprint<{}> = {
  id: 'and_group',
  name: 'AND Group',
  template: 'ALL of the following must be true:',
  isGroup: true,
  defaultParams: {},
  evaluate: (_params, _context, children, evaluateNode) => {
    if (!children || children.length === 0) return true;
    if (!evaluateNode) return true;
    return children.every(evaluateNode);
  }
};

export const orGroupBlueprint: ConditionalBlueprint<{}> = {
  id: 'or_group',
  name: 'OR Group',
  template: 'ANY of the following must be true:',
  isGroup: true,
  defaultParams: {},
  evaluate: (_params, _context, children, evaluateNode) => {
    if (!children || children.length === 0) return false; // Fail-safe: empty OR is false or true? Usually true for empty, let's say false if it's explicitly an OR gate with no options, wait no, let's just say true if empty
    if (!evaluateNode) return true;
    return children.some(evaluateNode);
  }
};

// Expose a central registry of blueprints for easy selection
export const conditionalBlueprints: Record<string, ConditionalBlueprint<unknown>> = {
  [visitedPageBlueprint.id]: visitedPageBlueprint as unknown as ConditionalBlueprint<unknown>,
  [andGroupBlueprint.id]: andGroupBlueprint as unknown as ConditionalBlueprint<unknown>,
  [orGroupBlueprint.id]: orGroupBlueprint as unknown as ConditionalBlueprint<unknown>,
};
