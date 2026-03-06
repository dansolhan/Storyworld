export type StoryVariableType = 'string' | 'number' | 'boolean';

export interface StoryVariable {
  type: StoryVariableType;
  value: string | number | boolean;
  tags?: string[];
}
