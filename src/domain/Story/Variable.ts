export type StoryVariableType = 'string' | 'number' | 'boolean';

export interface StoryVariable {
  type: StoryVariableType;
  value: string | number | boolean;
  tags?: string[];
}

export const isStoryVariable = (value: unknown): value is StoryVariable =>
  typeof value === 'object' && value !== null && 'value' in value;

/**
 * Reads a variable's value out of a blueprint context.
 *
 * Blueprint contexts are generic over their variable map, so a blueprint only
 * knows it holds *some* object — which is why call sites were reaching for
 * `as any`. Narrowing here, in the module that owns the StoryVariable shape,
 * means an absent or malformed variable reads as `undefined` instead of
 * throwing on a property access.
 */
export const readVariableValue = (
  variables: unknown,
  key: string
): string | number | boolean | undefined => {
  if (typeof variables !== 'object' || variables === null) return undefined;
  const entry = (variables as Record<string, unknown>)[key];
  return isStoryVariable(entry) ? entry.value : undefined;
};
