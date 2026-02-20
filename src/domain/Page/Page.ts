import type { Paragraph } from '../Paragraph/Paragraph';
import type { Choice } from '../Choice/Choice';

export interface Page {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  choices: Choice[];
}
