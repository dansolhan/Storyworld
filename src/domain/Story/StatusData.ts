import type { LogicNode } from './LogicNode';

export interface StatusData {
  id: string;
  title: string;
  titleLocId?: string;
  priority?: number;    // default 0; higher = shown earlier
  value?: string;       // supports {{ variableName }} interpolation (optional)
  valueLocId?: string;
  color?: string;       // optional CSS color (e.g. '#ff4444')
  /**
   * When this entry is shown. Empty means always.
   *
   * A `LogicNode[]` rather than the design's single node, so it is the same shape
   * as every other condition in the story — `RuleEditor` renders it and
   * `evaluateEventVisibility` reads it with no adapter in between. Several roots
   * are implicitly ANDed, exactly as an event's logic tree is.
   *
   * Replaced `conditionals: Conditional[]` at schema 1.2.0. That shape could not
   * be evaluated without a conversion, and the one place that tried it cast
   * straight across and silently hid nothing.
   */
  condition?: LogicNode[];
}
