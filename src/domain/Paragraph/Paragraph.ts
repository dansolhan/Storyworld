import type { StoryEvent } from '../Events/StoryEvent';
import type { Conditional } from '../Conditionals/Conditional';

export interface Paragraph {
  id: string;
  text: string;
  textLocId?: string;
  /** Pre-1.0.0 shape, superseded by `events`. Still read as a fallback. */
  conditionals?: Conditional[];
  events?: StoryEvent[];
}
