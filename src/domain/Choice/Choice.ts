import type { StoryEvent } from '../Events/StoryEvent';

export interface Choice {
  id: string;
  text: string;
  textLocId?: string;
  targetPageId?: string; // Optional target page ID
  conditionals?: any[];
  actions?: any[];
  events?: StoryEvent[];
}

