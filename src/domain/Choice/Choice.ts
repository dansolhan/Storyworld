import type { Conditional, ConditionalLogic } from '../Conditionals/Conditional';

export interface Choice {
  id: string;
  text: string;
  targetPageId: string;
  conditionals?: Conditional[];
  conditionalLogic?: ConditionalLogic;
}
