import { describe, it, expect } from 'vitest';
import { parseTextTokens } from './textParser';

import type { StoryVariable } from '../domain/Story/Variable';

describe('parseTextTokens', () => {
  const mockVariables: Record<string, StoryVariable> = {
    playerName: { type: 'string', value: 'Alice' },
    score: { type: 'number', value: 150 },
    currentLocation: { type: 'string', value: 'The Dark Cave' }
  };

  it('should return empty string for empty input', () => {
    expect(parseTextTokens('', mockVariables)).toBe('');
  });

  it('should return the original string if no tokens are present', () => {
    expect(parseTextTokens('Hello world, this is a test.', mockVariables)).toBe('Hello world, this is a test.');
  });

  it('should replace a single valid token', () => {
    expect(parseTextTokens('Welcome back, {{playerName}}!', mockVariables)).toBe('Welcome back, Alice!');
  });

  it('should replace multiple instances of the same token', () => {
    expect(parseTextTokens('{{playerName}}, oh {{playerName}}, where art thou?', mockVariables)).toBe('Alice, oh Alice, where art thou?');
  });

  it('should replace multiple different tokens', () => {
    expect(parseTextTokens('{{playerName}} scored {{score}} points in {{currentLocation}}.', mockVariables))
      .toBe('Alice scored 150 points in The Dark Cave.');
  });

  it('should tolerate whitespace inside the token brackets', () => {
    expect(parseTextTokens('Welcome back, {{ playerName }}!', mockVariables)).toBe('Welcome back, Alice!');
    expect(parseTextTokens('Score: {{  score  }}', mockVariables)).toBe('Score: 150');
  });

  it('should leave unknown tokens unparsed', () => {
    expect(parseTextTokens('Hello {{unknownVar}}!', mockVariables)).toBe('Hello {{unknownVar}}!');
  });

  it('should handle undefined variables gracefully when replacing', () => {
    // Note: Our variables are typed as Record<string, string>, but at runtime one could be missing
    const missingVars: Record<string, StoryVariable> = { playerName: { type: 'string', value: 'Alice' } };
    expect(parseTextTokens('{{playerName}} has {{gold}} gold.', missingVars)).toBe('Alice has {{gold}} gold.');
  });
});
