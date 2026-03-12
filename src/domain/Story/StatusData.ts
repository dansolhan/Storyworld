import type { Conditional } from '../Conditionals/Conditional';

export interface StatusData {
  id: string;
  title: string;
  priority?: number;    // default 0; higher = shown earlier
  value?: string;       // supports {{ variableName }} interpolation (optional)
  color?: string;       // optional CSS color (e.g. '#ff4444')
  conditionals?: Conditional[];
}
