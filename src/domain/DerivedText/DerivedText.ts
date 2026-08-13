import type { LogicNode } from '../Story/LogicNode';

export interface DerivedTextOutcome {
  id: string;
  /** What the sentence says when this outcome wins. */
  text: string;
  /**
   * When this outcome applies. Empty means always, which makes it the fallback.
   *
   * A `LogicNode[]` like every other condition in the story, so `RuleEditor`'s
   * sentences and `evaluateEventVisibility` both read it with no adapter. The
   * design proposed `LogicNode | null`; an empty array says the same thing in the
   * shape the rest of the codebase already speaks.
   */
  condition: LogicNode[];
}

export interface DerivedText {
  id: string;
  /** Set when the author names it, which is what makes it reusable elsewhere. */
  name?: string;
  /** Evaluated in order: the first outcome whose condition holds wins. */
  outcomes: DerivedTextOutcome[];
}

/**
 * Derived texts, keyed by id.
 *
 * One collection for both inline and named entries — "reusable" is just `name`
 * being set. The alternative the handoff suggested, keeping inline outcomes inside
 * paragraph HTML, would put structured data back into prose: invisible to Story
 * Health, awkward to edit, and the exact shape schema 1.3.0 migrated away from.
 */
export type DerivedTexts = Record<string, DerivedText>;
