/**
 * The one definition of a derived-text token in paragraph HTML.
 *
 * Same reasoning as `contextualMark`: the editor writes these, the player resolves
 * them and Story Health counts them, so a second opinion about the markup would
 * show up as a token one of them cannot see.
 *
 * An empty inline element rather than a wrapper, because a derived text has no
 * words of its own — it *is* the placeholder, and what it says depends on state.
 */
export const DERIVED_TOKEN_CLASS = 'derived-text-token';
export const DERIVED_ID_ATTR = 'data-derived-id';

const TOKEN = /<span\b[^>]*\bdata-derived-id="([^"]*)"[^>]*>\s*<\/span>/g;

/** Every derived text this paragraph uses, in the order they appear. */
export const derivedIdsIn = (html: string): string[] => {
  const ids: string[] = [];
  for (const match of html.matchAll(TOKEN)) ids.push(match[1]);
  return ids;
};

/**
 * Replaces each token with what it resolves to.
 *
 * A token whose derived text has been deleted resolves to nothing and closes over
 * itself, so a reader meets a shorter sentence rather than a stray artefact.
 */
export const resolveDerivedTokens = (html: string, resolve: (id: string) => string): string =>
  html.replace(TOKEN, (_whole, id: string) => resolve(id));

/** The token as the editor stores it. */
export const renderDerivedToken = (id: string): string =>
  `<span class="${DERIVED_TOKEN_CLASS}" ${DERIVED_ID_ATTR}="${id}"></span>`;
