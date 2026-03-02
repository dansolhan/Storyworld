import { describe, it, expect } from 'vitest';
import { migrateStory, CURRENT_VERSION } from './migrations';

describe('Story Migrations', () => {
  it('should attach the current version to an unversioned story', () => {
    const oldStory = {
      title: 'Old Story',
      pages: [],
      variables: {},
    };

    const migrated = migrateStory(oldStory);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.title).toBe('Old Story');
  });

  it('should add an empty subplots array when migrating from V2 to V3', () => {
    const v2Story = {
      version: 2,
      title: 'V2 Story',
      pages: [],
      variables: {},
      uiMetadata: {}
    };

    const migrated = migrateStory(v2Story);
    expect(migrated.version).toBe(3);
    expect(migrated.subplots).toEqual([]);
  });

  // Adding a mock or ensuring that undefined/null throws properly
  it('should throw when no story structure is passed', () => {
    expect(() => migrateStory(null)).toThrow('Cannot migrate undefined or null story structure.');
  });
});
