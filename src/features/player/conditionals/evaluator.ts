import type { Choice } from '../../../domain/Choice/Choice';
import type { EvaluationContext } from '../../../domain/Conditionals/Conditional';
import { conditionalBlueprints } from '../../../domain/Conditionals/registry';

/**
 * Evaluates whether a choice should be visible based on its conditionals.
 * Defaults to true if there are no conditionals or unknown blueprints.
 */
export function evaluateChoiceStatus(choice: Choice, context: EvaluationContext<Record<string, unknown>>): boolean {
  if (!choice.conditionals || choice.conditionals.length === 0) {
    return true;
  }

  const logic = choice.conditionalLogic || 'AND';

  const results = choice.conditionals.map(cond => {
    const blueprint = conditionalBlueprints[cond.blueprintId];
    if (!blueprint) {
      console.warn(`Unknown conditional blueprint: ${cond.blueprintId}`);
      return true; // fail-open
    }

    try {
      return blueprint.evaluate(cond.params, context);
    } catch (err) {
      console.error(`Error evaluating conditional ${cond.id}:`, err);
      return true;
    }
  });

  if (logic === 'AND') {
    return results.every(res => res === true);
  } else {
    return results.some(res => res === true);
  }
}
