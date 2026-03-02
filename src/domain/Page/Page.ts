import type { Paragraph } from '../Paragraph/Paragraph';
import type { Choice } from '../Choice/Choice';
import type { Action } from '../Actions/Action';

export type PageType = 'location' | 'plot';

export interface Page {
  id: string;
  type?: PageType;
  title: string;
  subplotId?: string;
  paragraphs: Paragraph[];
  choices: Choice[];
  actions?: Action[];
}
