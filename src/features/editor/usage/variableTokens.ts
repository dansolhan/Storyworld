const TOKEN = /\{\{\s*([A-Za-z0-9_$.-]+)\s*\}\}/g;

/**
 * Variable names printed by `{{token}}` in a piece of text.
 *
 * The same syntax `parseTextTokens` substitutes at render time, so the two agree
 * on what counts as a reference. Whitespace inside the braces is tolerated
 * because authors type it.
 */
export const variableTokensIn = (text: string): string[] => {
  const names: string[] = [];
  for (const match of text.matchAll(TOKEN)) {
    names.push(match[1]);
  }
  return names;
};
