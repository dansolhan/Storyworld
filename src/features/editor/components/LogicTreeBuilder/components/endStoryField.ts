/** One key/value row of the End Story action's payload. */
export interface EndStoryField {
  key: string;
  value: string;
  isVariable: boolean;
}

/**
 * Params arrive from a saved logic tree as `unknown`, so the rows are read
 * defensively rather than asserted into shape.
 */
export const endStoryFields = (value: unknown): EndStoryField[] =>
  Array.isArray(value)
    ? value.map((row) => {
        const record = (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
        return {
          key: typeof record.key === 'string' ? record.key : '',
          value: typeof record.value === 'string' ? record.value : '',
          isVariable: record.isVariable === true,
        };
      })
    : [];
