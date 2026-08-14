import { get, set, del } from 'idb-keyval';
import type { StoredSnapshot } from './storySummary';

export interface StoryBackup {
  takenAt: number;
  /**
   * The schema version the story was at before it was upgraded.
   *
   * Absent for a save made before the version was recorded at all — the envelope's own
   * number is not a schema version, and showing it would be telling the author
   * something untrue.
   */
  fromVersion?: string;
  /** The version it was upgraded to. */
  toVersion: string;
  /** The saved story, exactly as it was before the upgrade touched it. */
  snapshot: StoredSnapshot;
}

const backupKey = (storyId: string): string => `story-backup-${storyId}`;
const storyKey = (storyId: string): string => `story-${storyId}`;

/**
 * Keeps the story as it was before a schema upgrade.
 *
 * Taken at the moment of upgrade and before anything can autosave over it, because an
 * upgrade is the one edit an author never asked for. A migration that gets something
 * wrong is otherwise unrecoverable: there is a single snapshot per story, so the
 * upgraded version overwrites the only copy of the original.
 *
 * One backup per story, replaced by each upgrade. It answers "the upgrade I just took
 * broke my story", so the most recent pre-upgrade copy is the useful one — an older
 * backup would be missing every edit made since. A full history is a different
 * feature.
 */
export const saveStoryBackup = async (
  storyId: string,
  snapshot: StoredSnapshot,
  fromVersion: string | undefined,
  toVersion: string
): Promise<void> => {
  const backup: StoryBackup = { takenAt: Date.now(), fromVersion, toVersion, snapshot };
  await set(backupKey(storyId), backup);
};

const isBackup = (value: unknown): value is StoryBackup =>
  typeof value === 'object' && value !== null && 'snapshot' in value;

export const readStoryBackup = async (storyId: string): Promise<StoryBackup | undefined> => {
  const stored = await get(backupKey(storyId));
  return isBackup(stored) ? stored : undefined;
};

/**
 * Puts the pre-upgrade story back.
 *
 * The backup is kept rather than consumed: reverting is usually the first step in
 * working out what went missing, and an author who reverts, looks, and re-upgrades
 * should not have spent their only copy doing it.
 */
export const restoreStoryBackup = async (storyId: string): Promise<boolean> => {
  const backup = await readStoryBackup(storyId);
  if (!backup) return false;

  await set(storyKey(storyId), backup.snapshot);
  return true;
};

/** Dropped alongside the story it belongs to, so deleting one does not orphan the other. */
export const deleteStoryBackup = async (storyId: string): Promise<void> => {
  await del(backupKey(storyId));
};
