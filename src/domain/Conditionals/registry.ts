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

export interface FirstVisitParams {
  not: boolean;
}

export const firstVisitBlueprint: ConditionalBlueprint<FirstVisitParams> = {
  id: 'first_visit',
  name: 'First visit',
  template: '{{not}} first visit of current page',
  defaultParams: {
    not: false,
  },
  evaluate: (params, context) => {
    if (!context.currentPageId) return true;

    // Filter visited pages for the current page
    const visits = context.visitedPageIds.filter((id) => id === context.currentPageId);

    // Because evaluate might be called before the useEffect in Player.tsx appends the current 
    // page to visitedPageIds, we check if the LAST item in visitedPageIds is the current page.
    // If it is, the effect has already run once for this visit. 
    // If it isn't, this is a fresh evaluation for a new visit that hasn't been logged yet.
    const isAlreadyLogged = context.visitedPageIds.length > 0 && context.visitedPageIds[context.visitedPageIds.length - 1] === context.currentPageId;

    const visitCount = isAlreadyLogged ? visits.length : visits.length + 1;
    const isFirstVisit = visitCount === 1;

    return params.not ? !isFirstVisit : isFirstVisit;
  },
};

export interface VariableEqualsParams {
  variableKey: string | null;
  comparison: 'equal' | 'greater than' | 'greater or equal' | 'less or equal' | 'less than';
  value: string;
}

export const variableEqualsBlueprint: ConditionalBlueprint<VariableEqualsParams> = {
  id: 'variable_equals',
  name: 'Check Variable Value',
  template: 'Variable {{variable}} {{comparison}} {{value}}',
  defaultParams: {
    variableKey: null,
    comparison: 'equal',
    value: '',
  },
  evaluate: (params, context) => {
    if (!params.variableKey) return true;
    const variables = context.variables as Record<string, any>;
    const variable = variables[params.variableKey];
    if (!variable) return false;

    const comparison = params.comparison ?? 'equal';

    // For numeric comparisons that aren't 'equal', parse both as numbers
    if (comparison !== 'equal') {
      const actual = parseFloat(String(variable.value));
      const target = parseFloat(String(params.value));
      if (isNaN(actual) || isNaN(target)) return false;
      if (comparison === 'greater than') return actual > target;
      if (comparison === 'greater or equal') return actual >= target;
      if (comparison === 'less or equal') return actual <= target;
      if (comparison === 'less than') return actual < target;
    }

    // Equal: string comparison (works for strings, booleans, and numbers)
    return String(variable.value) === String(params.value);
  },
};

export interface HasItemParams {
  itemId: string | null;
}

export const hasItemBlueprint: ConditionalBlueprint<HasItemParams> = {
  id: 'has_item',
  name: 'Has Item',
  template: 'Has {{itemId}}',
  defaultParams: {
    itemId: null,
  },
  evaluate: (params, context) => {
    if (!params.itemId) return true;
    return !!(context.inventory && (context.inventory[params.itemId] || 0) > 0);
  },
};

export interface HasItemCountParams {
  itemId: string | null;
  comparison: 'more than' | 'less than' | 'exactly' | 'greater or equal' | 'less or equal';
  count: number;
}

export const hasItemCountBlueprint: ConditionalBlueprint<HasItemCountParams> = {
  id: 'has_item_count',
  name: 'Has Item Count',
  template: 'Has {{comparison}} {{count}} {{itemId}}',
  defaultParams: {
    itemId: null,
    comparison: 'exactly',
    count: 1,
  },
  evaluate: (params, context) => {
    if (!params.itemId) return true;
    const current = context.inventory?.[params.itemId] || 0;
    if (params.comparison === 'more than') return current > params.count;
    if (params.comparison === 'greater or equal') return current >= params.count;
    if (params.comparison === 'less than') return current < params.count;
    if (params.comparison === 'less or equal') return current <= params.count;
    return current === params.count;
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
  [firstVisitBlueprint.id]: firstVisitBlueprint as unknown as ConditionalBlueprint<unknown>,
  [variableEqualsBlueprint.id]: variableEqualsBlueprint as unknown as ConditionalBlueprint<unknown>,
  [hasItemBlueprint.id]: hasItemBlueprint as unknown as ConditionalBlueprint<unknown>,
  [hasItemCountBlueprint.id]: hasItemCountBlueprint as unknown as ConditionalBlueprint<unknown>,
  [andGroupBlueprint.id]: andGroupBlueprint as unknown as ConditionalBlueprint<unknown>,
  [orGroupBlueprint.id]: orGroupBlueprint as unknown as ConditionalBlueprint<unknown>,
};
