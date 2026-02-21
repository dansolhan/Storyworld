import type { Conditional } from '../Conditionals/Conditional';

export interface Paragraph {
  id: string;
  text: string;
  conditionals?: Conditional[];
}
