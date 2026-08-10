/**
 * Types and readers for story data of an *unknown, earlier* shape.
 *
 * Migrations are the one place in the codebase that handles data it cannot make
 * assumptions about: a `.storyworld` file written months ago, an IndexedDB
 * snapshot from a previous release, or something hand-edited. `any` used to
 * stand in for that, which silently promised every field access would work.
 * `LegacyRecord` says the truth — a JSON object whose values are unknown — and
 * the readers below are the only sanctioned way to get at them, so a malformed
 * save degrades to an empty list instead of throwing mid-migration.
 */

/** A JSON object from an older schema. Nothing about its fields is guaranteed. */
export type LegacyRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is LegacyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reads a field expected to hold a list of objects. Anything that is not an
 * array reads as empty, and non-object entries are dropped.
 */
export const recordList = (value: unknown): LegacyRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

/** Reads a field expected to hold a string, or `undefined` if it does not. */
export const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/** Reads a field expected to hold an object of params; anything else reads as `{}`. */
export const paramsOf = (value: unknown): LegacyRecord => (isRecord(value) ? value : {});

/**
 * Story pages have been stored two ways over the years: as an array, and as an
 * object keyed by page id. Both arrive here.
 */
export const ensurePagesArray = (pages: unknown): LegacyRecord[] => {
  if (Array.isArray(pages)) return pages.filter(isRecord);
  if (isRecord(pages)) return Object.values(pages).filter(isRecord);
  return [];
};
