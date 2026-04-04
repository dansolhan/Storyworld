import type { LogicNode } from '../Story/LogicNode';

export interface StoryEvent {
  id: string;
  name: string; // e.g. 'onEnter', 'onEvaluate', 'onClick'
  comment?: string;
  logicTree: LogicNode[];
}

export interface EventDefinition {
  name: string;
  label: string;
  domainContext?: string[]; // The target types (domains) where this event makes sense
}

export const AVAILABLE_EVENTS: EventDefinition[] = [
  { name: 'onEnter', label: 'onEnter', domainContext: ['page'] },
  { name: 'onExit', label: 'onExit', domainContext: ['page'] },
  { name: 'onEvaluate', label: 'onEvaluate (Conditionals)', domainContext: ['page', 'choice'] },
  { name: 'calculateVisibility', label: 'Calculate Visibility', domainContext: ['paragraph', 'choice'] },
  { name: 'onSelect', label: 'onSelect', domainContext: ['choice'] },
  { name: 'onHover', label: 'onHover', domainContext: ['choice'] }
];
