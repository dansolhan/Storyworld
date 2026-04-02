import type { StoryEvent } from '../Events/StoryEvent';

export interface Choice {
  id: string;
  text: string;
  textLocId?: string;
  conditionals?: any[];
  actions?: any[];
  events?: StoryEvent[];
}

