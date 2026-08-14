import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';
import type { DebugSnapshot } from '../../../../domain/Story/DebugSnapshot';

const pristineState = useEditorStore.getState();

const snapshot = (id: string, name: string): DebugSnapshot => ({
  id,
  name,
  createdAt: 0,
  variables: {},
  inventory: {},
  visitedPageIds: [],
});

describe('debugSnapshotSlice', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
  });

  it('starts with none', () => {
    expect(useEditorStore.getState().debugSnapshots).toEqual([]);
  });

  it('lists the newest first, which is the order the console shows', () => {
    useEditorStore.getState().addDebugSnapshot(snapshot('s1', 'Early'));
    useEditorStore.getState().addDebugSnapshot(snapshot('s2', 'Late'));

    expect(useEditorStore.getState().debugSnapshots.map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('renames one without touching the rest', () => {
    useEditorStore.getState().addDebugSnapshot(snapshot('s1', 'Early'));
    useEditorStore.getState().addDebugSnapshot(snapshot('s2', 'Late'));

    useEditorStore.getState().renameDebugSnapshot('s1', 'Chapter one');

    const [late, early] = useEditorStore.getState().debugSnapshots;
    expect(early.name).toBe('Chapter one');
    expect(late.name).toBe('Late');
  });

  it('removes one by id', () => {
    useEditorStore.getState().addDebugSnapshot(snapshot('s1', 'Early'));
    useEditorStore.getState().addDebugSnapshot(snapshot('s2', 'Late'));

    useEditorStore.getState().removeDebugSnapshot('s2');

    expect(useEditorStore.getState().debugSnapshots.map((s) => s.id)).toEqual(['s1']);
  });

  /*
   * Snapshots belong to the story they were taken in. Carrying them across an
   * open would offer an author states built from another story's variables.
   */
  it('is replaced wholesale when another story is loaded', () => {
    useEditorStore.getState().addDebugSnapshot(snapshot('s1', 'Early'));

    useEditorStore.getState().loadStory({ nodes: [], edges: [], pages: {} });

    expect(useEditorStore.getState().debugSnapshots).toEqual([]);
  });
});
