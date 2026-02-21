import type { Conditional, EvaluationContext } from '../../../domain/Conditionals/Conditional';
import { conditionalBlueprints } from '../../../domain/Conditionals/registry';

interface EvaluatableItem {
  conditionals?: Conditional[];
}

/**
 * Evaluates whether an item (Choice or Paragraph) should be visible based on its conditionals.
 * The root level of conditionals is evaluated as an implicit AND.
 * Defaults to true if there are no conditionals or unknown blueprints.
 */
export function evaluateVisibility(item: EvaluatableItem, context: EvaluationContext<Record<string, unknown>>): boolean {
  if (!item.conditionals || item.conditionals.length === 0) {
    return true;
  }

  return item.conditionals.every(cond => evaluateNode(cond, context));
}

function evaluateNode(cond: Conditional, context: EvaluationContext<Record<string, unknown>>): boolean {
  const blueprint = conditionalBlueprints[cond.blueprintId];
  if (!blueprint) {
    console.warn(`Unknown conditional blueprint: ${cond.blueprintId}`);
    return true; // fail-open
  }

  try {
    return blueprint.evaluate(
      cond.params,
      context,
      cond.children,
      (childNode) => evaluateNode(childNode, context)
    );
  } catch (err) {
    console.error(`Error evaluating conditional ${cond.id}:`, err);
    return true;
  }
}
