import type { Paragraph } from '../Paragraph/Paragraph';
import type { Choice } from '../Choice/Choice';
import type { StoryEvent } from '../Events/StoryEvent';

export type PageType = 'location' | 'plot';

export interface Page {
  id: string;
  type?: PageType;
  title: string;
  subplotId?: string;
  atmosphereId?: string;
  paragraphs: Paragraph[];
  choices: Choice[];
  events?: StoryEvent[];
}
