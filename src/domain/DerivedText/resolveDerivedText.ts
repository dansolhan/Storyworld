import type { EvaluationContext } from '../Conditionals/Conditional';
import { evaluateEventVisibility } from '../../lib/engine/logic/executeLogicTree';
import type { DerivedText, DerivedTextOutcome } from './DerivedText';

/**
 * The first outcome whose condition holds.
 *
 * Order is the whole semantics: an author writes the most specific case first and
 * leaves a condition-less outcome last as the fallback. Returns `undefined` when
 * nothing matches, which happens when every outcome carries a condition and none
 * of them hold — the caller decides what to show for that.
 */
export const resolveOutcome = (
  derived: DerivedText,
  context: EvaluationContext<Record<string, unknown>>
): DerivedTextOutcome | undefined =>
  derived.outcomes.find((outcome) => evaluateEventVisibility(outcome.condition ?? [], context));

/**
 * What a derived text reads as, for a reader.
 *
 * Falls back to an empty string rather than to a placeholder: if no outcome
 * applies, the sentence should close over the gap rather than show the reader
 * scaffolding. Story Health reports a derived text that can resolve to nothing.
 */
export const resolveDerivedText = (
  derived: DerivedText,
  context: EvaluationContext<Record<string, unknown>>
): string => resolveOutcome(derived, context)?.text ?? '';

/** Whether any outcome is unconditional, and so guaranteed to catch. */
export const hasFallback = (derived: DerivedText): boolean =>
  derived.outcomes.some((outcome) => (outcome.condition ?? []).length === 0);
