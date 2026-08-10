/**
 * The parameter type for a blueprint that takes no parameters.
 *
 * `{}` would be wrong here: it means "any non-nullish value", so a blueprint
 * declared with it would accept `0` or `""` as its params. `Record<string,
 * never>` says what is actually meant — an object with no keys.
 */
export type NoParams = Record<string, never>;
