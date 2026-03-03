import type { Conditional } from '../Conditionals/Conditional';
import type { Action } from '../Actions/Action';

export interface Choice {
  id: string;
  text: string;
  targetPageId?: string; // Optional: a choice may be action-only with no destination page
  conditionals?: Conditional[];
  actions?: Action[];
}

