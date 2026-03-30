import type { StoryEvent } from '../Events/StoryEvent';

export interface Choice {
  id: string;
  text: string;
  targetPageId?: string; // Optional: a choice may be action-only with no destination page
  events?: StoryEvent[];
}

