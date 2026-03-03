import type { StoryData } from '../StoryData';

export const CURRENT_VERSION = 4;

type MigrationFunction = (oldStory: any) => any;

const migrateV1ToV2: MigrationFunction = (v1Story) => {
  // Version 2 introduces uiMetadata containing nodePositions for Editor layout.
  return {
    ...v1Story,
  };
};

const migrateV2ToV3: MigrationFunction = (v2Story) => {
  // Version 3 introduces subplots.
  return {
    ...v2Story,
    subplots: v2Story.subplots || [],
  };
};

const migrateV3ToV4: MigrationFunction = (v3Story) => {
  // Version 4 changes:
  // - Choice.targetPageId becomes optional (undefined) instead of empty string.
  //   Any choice with targetPageId === '' is normalised to undefined so that
  //   action-only choices can be cleanly distinguished from wired-up choices.
  // - Actions gain an optional `trigger` field ('on_enter' | 'on_exit').
  //   Existing actions without a trigger default to 'on_enter' at runtime,
  //   so no explicit field needs to be written here (undefined === on_enter).
  const pages = (v3Story.pages || []).map((page: any) => ({
    ...page,
    choices: (page.choices || []).map((choice: any) => ({
      ...choice,
      targetPageId: choice.targetPageId || undefined,
    })),
  }));

  return {
    ...v3Story,
    pages,
  };
};

// A dictionary mapping the *starting* version to the migration function
// that upgrades it to starting version + 1.
const migrationSteps: Record<number, MigrationFunction> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
};

export function migrateStory(storyJson: any): StoryData {
  if (!storyJson) throw new Error('Cannot migrate undefined or null story structure.');

  let migratedStory =
    typeof structuredClone === 'function'
      ? structuredClone(storyJson)
      : JSON.parse(JSON.stringify(storyJson));

  // If the story doesn't have a version at all, assume it predates versioning (version 1).
  const startingVersion = migratedStory.version || 1;

  for (let v = startingVersion; v < CURRENT_VERSION; v++) {
    const migrationFunc = migrationSteps[v];
    if (migrationFunc) {
      migratedStory = migrationFunc(migratedStory);
    } else {
      throw new Error(`Missing migration script to step from version ${v} to ${v + 1}`);
    }
  }

  migratedStory.version = CURRENT_VERSION;
  return migratedStory as StoryData;
}
