import type { Paragraph } from '../Paragraph/Paragraph';
import type { Choice } from '../Choice/Choice';
import type { StoryEvent } from '../Events/StoryEvent';
import type { Action } from '../Actions/Action';
import type { Conditional } from '../Conditionals/Conditional';

export type PageType = 'location' | 'plot';

export interface Page {
  id: string;
  type?: PageType;
  title: string;
  titleLocId?: string;
  actions?: Action[];
  /** Pre-1.0.0 shape, superseded by `events`. Still read as a fallback. */
  conditionals?: Conditional[];
  subplotId?: string;
  atmosphereId?: string;
  paragraphs: Paragraph[];
  choices: Choice[];
  events?: StoryEvent[];
}
