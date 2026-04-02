import type { Paragraph } from '../Paragraph/Paragraph';
import type { Choice } from '../Choice/Choice';
import type { StoryEvent } from '../Events/StoryEvent';
import type { Action } from '../Actions/Action';

export type PageType = 'location' | 'plot';

export interface Page {
  id: string;
  type?: PageType;
  title: string;
  titleLocId?: string;
  actions?: Action[];
  conditionals?: any[];
  subplotId?: string;
  atmosphereId?: string;
  paragraphs: Paragraph[];
  choices: Choice[];
  events?: StoryEvent[];
}
