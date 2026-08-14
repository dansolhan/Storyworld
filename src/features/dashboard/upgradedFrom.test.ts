import { describe, it, expect } from 'vitest';
import { upgradedFrom } from './upgradedFrom';

describe('upgradedFrom', () => {
  it('names the version when the save recorded one', () => {
    expect(upgradedFrom('1.2.0')).toBe('version 1.2.0');
  });

  /* Rather than the snapshot envelope's number, which is not a schema version. */
  it('says "an earlier version" when it did not', () => {
    expect(upgradedFrom(undefined)).toBe('an earlier version');
  });
});
