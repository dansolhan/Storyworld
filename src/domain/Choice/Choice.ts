import type { Conditional } from '../Conditionals/Conditional';
import type { Action } from '../Actions/Action';

export interface Choice {
  id: string;
  text: string;
  targetPageId: string;
  conditionals?: Conditional[];
  actions?: Action[];
}
