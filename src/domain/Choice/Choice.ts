import type { Conditional } from '../Conditionals/Conditional';

export interface Choice {
  id: string;
  text: string;
  targetPageId: string;
  conditionals?: Conditional[];
}
