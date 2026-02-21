import type { Conditional } from '../../../../domain/Conditionals/Conditional';

export function addConditionalToTree(
  conditionals: Conditional[] | undefined,
  parentId: string | null,
  newConditional: Conditional
): Conditional[] {
  const current = conditionals || [];

  if (!parentId) {
    // Add to root
    return [...current, newConditional];
  }

  return current.map(cond => {
    if (cond.id === parentId) {
      return {
        ...cond,
        children: [...(cond.children || []), newConditional]
      };
    }
    if (cond.children) {
      return {
        ...cond,
        children: addConditionalToTree(cond.children, parentId, newConditional)
      };
    }
    return cond;
  });
}

export function updateConditionalInTree(
  conditionals: Conditional[] | undefined,
  conditionalId: string,
  params: Record<string, unknown>
): Conditional[] {
  const current = conditionals || [];

  return current.map(cond => {
    if (cond.id === conditionalId) {
      return { ...cond, params };
    }
    if (cond.children) {
      return {
        ...cond,
        children: updateConditionalInTree(cond.children, conditionalId, params)
      };
    }
    return cond;
  });
}

export function removeConditionalFromTree(
  conditionals: Conditional[] | undefined,
  conditionalId: string
): Conditional[] {
  const current = conditionals || [];

  return current
    .filter(cond => cond.id !== conditionalId)
    .map(cond => {
      if (cond.children) {
        return {
          ...cond,
          children: removeConditionalFromTree(cond.children, conditionalId)
        };
      }
      return cond;
    });
}
