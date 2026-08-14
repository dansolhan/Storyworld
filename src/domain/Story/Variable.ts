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

/** The strings that mean "off" when a written value lands in a boolean slot. */
const FALSEY_TEXT = new Set(['false', '0', 'no', 'off', '']);

/**
 * Forces a written value into a variable's declared type.
 *
 * The boolean case is not a plain `Boolean(value)` on purpose. `set_variable`
 * carries its value as a string — see `SetVariableParams` — so an author setting
 * a flag to "false" was writing the string "false", and `Boolean('false')` is
 * `true`. Every boolean an action turned off stayed on.
 */
export const coerceVariableValue = (
  value: unknown,
  type: StoryVariableType
): string | number | boolean => {
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return typeof value === 'string' ? !FALSEY_TEXT.has(value.trim().toLowerCase()) : Boolean(value);
    default:
      return String(value);
  }
};

/** What type an undeclared variable takes on its first write. */
export const inferVariableType = (value: unknown): StoryVariableType =>
  typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';

/**
 * Builds the variable that replaces `existing` when `value` is written to it.
 *
 * The declared type wins over the written one — a number variable stays a number
 * however it is assigned — and the author's tags survive the write, which they
 * did not when the engine rebuilt the variable from `{ type, value }` alone.
 *
 * Every write goes through here: actions during play, and the debug console's
 * live edits. Two paths coercing a value their own way is how a variable ends up
 * behaving differently depending on who set it.
 */
export const assignVariableValue = (
  existing: StoryVariable | undefined,
  value: unknown
): StoryVariable => {
  const type = existing ? existing.type : inferVariableType(value);
  const next: StoryVariable = { type, value: coerceVariableValue(value, type) };
  if (existing?.tags) next.tags = existing.tags;
  return next;
};
