import type { EvaluationContext } from '../../../domain/Conditionals/Conditional';
import type { StoryEvent } from '../../../domain/Events/StoryEvent';
import { evaluateEventVisibility } from '../logic/executeLogicTree';

interface EvaluatableItem {
  events?: StoryEvent[];
}

/**
 * Evaluates whether an item (Choice or Paragraph) should be visible based on its events limiters.
 * It looks for an 'onEvaluate' event and evaluates its LogicTree (implicitly ANDing roots).
 * Defaults to true if there is no onEvaluate event.
 */
export function evaluateVisibility(item: EvaluatableItem, context: EvaluationContext<Record<string, unknown>>): boolean {
  if (!item.events || item.events.length === 0) {
    return true;
  }

  const evalEvents = item.events.filter(e => e.name === 'onEvaluate');
  // If no explicitly configured constraints are present, it is visible
  if (evalEvents.length === 0) return true;

  // Implicitly AND multiple onEvaluate events
  for (const event of evalEvents) {
    if (!evaluateEventVisibility(event.logicTree || [], context)) {
      return false;
    }
  }

  return true;
}
