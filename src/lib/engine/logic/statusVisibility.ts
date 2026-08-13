import type { EvaluationContext } from '../../../domain/Conditionals/Conditional';
import type { StatusData } from '../../../domain/Story/StatusData';
import { evaluateEventVisibility } from './executeLogicTree';

/**
 * Whether a status entry is shown, given the reader's state.
 *
 * One function, shared by the player's ledger and the editor's preview of it. The
 * design shows hidden entries greyed in the editor and omits them entirely in the
 * player, which only works if both agree about *which* are hidden — two
 * implementations of "is it shown" would eventually disagree, and the preview
 * would be quietly lying.
 *
 * An empty condition means always shown; several roots are ANDed, as everywhere
 * else a logic tree carries conditions.
 */
export const statusEntryIsVisible = (
  entry: Pick<StatusData, 'condition'>,
  context: EvaluationContext<Record<string, unknown>>
): boolean => {
  const condition = entry.condition ?? [];
  if (condition.length === 0) return true;
  return evaluateEventVisibility(condition, context);
};

/** Highest priority first, which is the order the ledger reads in. */
export const byStatusPriority = <T extends Pick<StatusData, 'priority'>>(entries: T[]): T[] =>
  [...entries].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
