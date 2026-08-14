import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get, set, del } from 'idb-keyval';
import {
  deleteStoryBackup,
  readStoryBackup,
  restoreStoryBackup,
  saveStoryBackup,
} from './storyBackup';
import type { StoredSnapshot } from './storySummary';

/** A tiny in-memory stand-in for IndexedDB, so the round trip is real. */
const store = new Map<string, unknown>();

const snapshot = (title: string): StoredSnapshot => ({
  version: 3,
  storyVersion: '1.2.0',
  state: { storyTitle: title, pages: {} },
} as StoredSnapshot);

describe('storyBackup', () => {
  beforeEach(() => {
    store.clear();
    vi.mocked(set).mockImplementation(async (key, value) => {
      store.set(key as string, value);
    });
    vi.mocked(get).mockImplementation(async (key) => store.get(key as string));
    vi.mocked(del).mockImplementation(async (key) => {
      store.delete(key as string);
    });
  });

  it('keeps the story under its own key, apart from the story itself', async () => {
    await saveStoryBackup('abc', snapshot('Before'), '1.2.0', '1.3.0');

    expect(store.has('story-backup-abc')).toBe(true);
    expect(store.has('story-abc')).toBe(false);
  });

  it('records what it was upgraded from and to', async () => {
    await saveStoryBackup('abc', snapshot('Before'), '1.2.0', '1.3.0');
    const backup = await readStoryBackup('abc');

    expect(backup).toMatchObject({ fromVersion: '1.2.0', toVersion: '1.3.0' });
    expect(backup!.takenAt).toBeGreaterThan(0);
  });

  it('has nothing to offer for a story that was never upgraded', async () => {
    expect(await readStoryBackup('abc')).toBeUndefined();
  });

  it('ignores a value that is not a backup', async () => {
    store.set('story-backup-abc', { nonsense: true });
    expect(await readStoryBackup('abc')).toBeUndefined();
  });

  /*
   * The point of the whole thing: the upgraded story is replaced by the copy taken
   * before the upgrade touched it.
   */
  it('puts the pre-upgrade story back over the current one', async () => {
    await saveStoryBackup('abc', snapshot('Before the upgrade'), '1.2.0', '1.3.0');
    store.set('story-abc', snapshot('After the upgrade'));

    expect(await restoreStoryBackup('abc')).toBe(true);
    expect((store.get('story-abc') as StoredSnapshot).state!.storyTitle).toBe('Before the upgrade');
  });

  /* Reverting is often the first step in working out what went missing. */
  it('keeps the backup after restoring, so it can be used twice', async () => {
    await saveStoryBackup('abc', snapshot('Before'), '1.2.0', '1.3.0');
    await restoreStoryBackup('abc');

    expect(await readStoryBackup('abc')).toBeTruthy();
  });

  it('says so rather than throwing when there is nothing to restore', async () => {
    expect(await restoreStoryBackup('abc')).toBe(false);
  });

  it('replaces an older backup, because the newest pre-upgrade copy is the useful one', async () => {
    await saveStoryBackup('abc', snapshot('Very old'), '1.1.0', '1.2.0');
    await saveStoryBackup('abc', snapshot('Yesterday'), '1.2.0', '1.3.0');

    const backup = await readStoryBackup('abc');
    expect(backup!.fromVersion).toBe('1.2.0');
    expect(backup!.snapshot.state!.storyTitle).toBe('Yesterday');
  });

  it('is dropped with the story it belongs to', async () => {
    await saveStoryBackup('abc', snapshot('Before'), '1.2.0', '1.3.0');
    await deleteStoryBackup('abc');

    expect(await readStoryBackup('abc')).toBeUndefined();
  });

  /* The envelope's own number is not a schema version, so it is not shown as one. */
  it('records no version for a save that never had one', async () => {
    await saveStoryBackup('abc', snapshot('Before'), undefined, '1.3.0');
    const backup = await readStoryBackup('abc');

    expect(backup).toBeTruthy();
    expect(backup!.fromVersion).toBeUndefined();
  });
});
