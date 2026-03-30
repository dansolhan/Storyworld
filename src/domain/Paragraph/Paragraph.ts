import type { StoryEvent } from '../Events/StoryEvent';

export interface Paragraph {
  id: string;
  text: string;
  events?: StoryEvent[];
}
