import type { Conditional } from '../Conditionals/Conditional';

export interface StatusData {
  id: string;
  title: string;
  titleLocId?: string;
  priority?: number;    // default 0; higher = shown earlier
  value?: string;       // supports {{ variableName }} interpolation (optional)
  valueLocId?: string;
  color?: string;       // optional CSS color (e.g. '#ff4444')
  conditionals?: Conditional[];
}
