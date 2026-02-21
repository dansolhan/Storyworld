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
    if (!params.pageId) {
      // If no page is selected it's incomplete, we can say it defaults to true
      // or false based on requirement. Default to true allows progression if unset.
      return true;
    }
    const hasVisited = context.visitedPageIds.includes(params.pageId);
    return params.not ? !hasVisited : hasVisited;
  },
};

// Expose a central registry of blueprints for easy selection
export const conditionalBlueprints: Record<string, ConditionalBlueprint<unknown>> = {
  [visitedPageBlueprint.id]: visitedPageBlueprint as unknown as ConditionalBlueprint<unknown>,
};
