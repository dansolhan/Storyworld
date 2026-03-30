import type { LogicNode } from '../Story/LogicNode';

export interface StoryEvent {
  id: string;
  name: string; // e.g. 'onEnter', 'onEvaluate', 'onClick'
  comment?: string;
  logicTree: LogicNode[];
}
