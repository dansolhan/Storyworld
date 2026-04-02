import type { EvaluationContext } from '../../../domain/Conditionals/Conditional';
import type { StoryEvent } from '../../../domain/Events/StoryEvent';
import type { ActionContext } from '../../../domain/Actions/Action';
import { evaluateEventVisibility, executeLogicTree } from './executeLogicTree';

interface EvaluatableItem {
  events?: StoryEvent[];
}

/**
 * Evaluates whether an item (Choice or Paragraph) should be visible based on its events limiters.
 * It looks for an 'onEvaluate' event and evaluates its LogicTree (implicitly ANDing roots).
 * It also looks for 'calculateVisibility' event and executes it, respecting the setVisibility action.
 * Defaults to true if no constraints hide it.
 */
export function evaluateVisibility(item: EvaluatableItem, context: EvaluationContext<Record<string, unknown>>): boolean {
  if (!item.events || item.events.length === 0) {
    return true;
  }

  // Support legacy onEvaluate event for backwards compatibility (especially for Choices)
  const legacyEvalEvents = item.events.filter(e => e.name === 'onEvaluate');
  for (const event of legacyEvalEvents) {
    if (!evaluateEventVisibility(event.logicTree || [], context)) {
      return false;
    }
  }

  // Support new calculateVisibility event (which executes actions like "Hide Paragraph")
  const calcEvents = item.events.filter(e => e.name === 'calculateVisibility');
  let isVisible = true;
  
  if (calcEvents.length > 0) {
    const actionContext: ActionContext = {
      variables: context.variables,
      setVariable: () => { 
        console.warn('Cannot set variables during visibility calculation'); 
      },
      postMessage: () => {},
      setVisibility: (visible: boolean) => {
        // If an action decides to hide it, it becomes false.
        isVisible = visible; 
      }
    };

    for (const event of calcEvents) {
      executeLogicTree(event.logicTree || [], context, actionContext);
    }
  }

  return isVisible;
}
