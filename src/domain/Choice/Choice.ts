import type { StoryEvent } from '../Events/StoryEvent';
import type { Conditional } from '../Conditionals/Conditional';
import type { Action } from '../Actions/Action';

export interface Choice {
  id: string;
  text: string;
  textLocId?: string;
  targetPageId?: string; // Optional target page ID
  /** Pre-1.0.0 shape, superseded by `events`. Still read as a fallback. */
  conditionals?: Conditional[];
  actions?: Action[];
  events?: StoryEvent[];
}

