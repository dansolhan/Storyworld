/**
 * Replaces tokens in the form {{token}} with their corresponding values from the variables record.
 */
import type { StoryVariable } from '../domain/Story/Variable';

export const parseTextTokens = (text: string, variables: Record<string, StoryVariable>): string => {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, tokenName) => {
    // Trim to allow spaces like {{ name }}
    const key = tokenName.trim();
    return variables[key] !== undefined ? String(variables[key].value) : match;
  });
};
