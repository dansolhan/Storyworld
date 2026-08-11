import type { LogicNode } from '../Story/LogicNode';

export interface StoryEvent {
  id: string;
  name: string; // e.g. 'onEnter', 'onEvaluate', 'onClick'
  comment?: string;
  logicTree: LogicNode[];
}

export interface EventDefinition {
  name: string;
  /**
   * The moment in plain language, used to title a section of rules. The stored
   * `name` is unchanged — this is wording, not schema.
   */
  label: string;
  domainContext?: string[]; // The target types (domains) where this event makes sense
  /**
   * A name the engine still reads but authors should no longer choose.
   *
   * `onEvaluate` was renamed to `calculateVisibility` by the version 2 migration.
   * Stories written before it still carry the old name, so it keeps its label —
   * but offering it alongside its replacement would put two moments with the
   * same title in front of the author, one of them deprecated.
   */
  legacy?: boolean;
}

export const AVAILABLE_EVENTS: EventDefinition[] = [
  { name: 'onEnter', label: 'When the reader arrives', domainContext: ['page'] },
  { name: 'onExit', label: 'When the reader leaves', domainContext: ['page'] },
  { name: 'onEvaluate', label: 'Whether this is shown at all', domainContext: ['page', 'choice'], legacy: true },
  { name: 'calculateVisibility', label: 'Whether this is shown at all', domainContext: ['page', 'paragraph', 'choice'] },
  { name: 'onSelect', label: 'When the reader chooses this', domainContext: ['choice'] },
  { name: 'onHover', label: 'When the reader hovers this', domainContext: ['choice'] }
];

/**
 * The section title for a stored event name.
 *
 * Falls back to the raw name so a story carrying a moment this build does not
 * know about still shows its rules rather than losing them.
 */
export const eventLabel = (name: string): string =>
  AVAILABLE_EVENTS.find((event) => event.name === name)?.label ?? name;

/** The moments an author can add to a page, paragraph or choice. */
export const eventsForDomain = (domain: string): EventDefinition[] =>
  AVAILABLE_EVENTS.filter(
    (event) => !event.legacy && (!event.domainContext || event.domainContext.includes(domain))
  );
