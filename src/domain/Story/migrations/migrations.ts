import type { StoryData } from '../StoryData';

export const CURRENT_VERSION = 2;

type MigrationFunction = (oldStory: any) => any;

const migrateV1ToV2: MigrationFunction = (v1Story) => {
  // Version 2 introduces uiMetadata containing nodePositions for Editor layout.
  // We simply step the version and ensure the object structure is prepared to receive it if needed.
  return {
    ...v1Story,
  };
};

// A dictionary mapping the *starting* version to the migration function
// that upgrades it to starting version + 1.
// Expected usage: If the story is version 1, it will run `migrationSteps[1]` to get version 2.
const migrationSteps: Record<number, MigrationFunction> = {
  1: migrateV1ToV2,
};

export function migrateStory(storyJson: any): StoryData {
  if (!storyJson) throw new Error("Cannot migrate undefined or null story structure.");

  let migratedStory = typeof structuredClone === 'function'
    ? structuredClone(storyJson)
    : JSON.parse(JSON.stringify(storyJson));

  // If the story doesn't have a version at all, assume the data shape is what we used before versioning
  // which we will consider conceptually as version 1.
  const startingVersion = migratedStory.version || 1;

  for (let v = startingVersion; v < CURRENT_VERSION; v++) {
    const migrationFunc = migrationSteps[v];
    if (migrationFunc) {
      migratedStory = migrationFunc(migratedStory);
    } else {
      throw new Error(`Missing migration script to step from version ${v} to ${v + 1}`);
    }
  }

  // Ensure the target version is stamped cleanly onto the payload
  migratedStory.version = CURRENT_VERSION;

  return migratedStory as StoryData;
}
