import { useState, useEffect, useCallback } from 'react';
import { get, keys, del, set as idbSet } from 'idb-keyval';
import { useEditorStore } from '../../editor/store/useEditorStore';
import { parseStoryToGraph } from '../../../lib/storyMapper';
import { migrateStory } from '../../../domain/Story/migrations/migrations';
import exampleStoryRaw from '../../../data/exampleStory.json';
import { summariseStory, type StorySummary } from '../storySummary';
import {
  deleteStoryBackup,
  readStoryBackup,
  restoreStoryBackup,
  saveStoryBackup,
} from '../storyBackup';
import { CURRENT_VERSION } from '../../../domain/Story/migrations/migrations';

const exampleStory = migrateStory(exampleStoryRaw);

export const useStories = () => {
  const [stories, setStories] = useState<StorySummary[]>([]);
  const { setStoryId, loadStory, setHasHydrated } = useEditorStore();

  const loadStoriesList = useCallback(async () => {
    try {
      const allKeys = await keys();
      /* `story-backup-…` also starts with `story-`, and is not a story on the shelf. */
      const storyKeys = allKeys.filter(
        (k) => typeof k === 'string' && k.startsWith('story-') && !k.startsWith('story-backup-')
      );
      const loadedStories: StorySummary[] = [];

      for (const key of storyKeys) {
        const data = await get(key);
        if (data && data.state) {
          const storyId = (key as string).replace('story-', '');
          const backup = await readStoryBackup(storyId);
          loadedStories.push({
            ...summariseStory(storyId, data),
            backup: backup && { takenAt: backup.takenAt, fromVersion: backup.fromVersion },
          });
        }
      }

      /*
       * Most recently edited first, which is almost always the one being opened.
       * A story saved before the envelope carried a timestamp sorts last rather
       * than jumping to the top on a missing value.
       */
      loadedStories.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
      setStories(loadedStories);
    } catch (error) {
      console.error('Failed to load stories list', error);
    }
  }, []);

  useEffect(() => {
    const handleInitialLoad = async () => {
      const legacyData = await get('storyworld-editor-storage');
      if (legacyData) {
        const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData;
        if (parsed && parsed.state && parsed.state.nodes?.length > 1) {
          const newId = crypto.randomUUID();
          await idbSet(`story-${newId}`, parsed);
        }
        await del('storyworld-editor-storage');
      }
      await loadStoriesList();
    };
    handleInitialLoad();
  }, [loadStoriesList]);

  const handleCreateNew = useCallback((onOpen: () => void) => {
    const newId = crypto.randomUUID();
    setHasHydrated(false);
    loadStory({
      nodes: [],
      edges: [],
      pages: {},
      variables: {
        hp: { type: 'number', value: 100 },
        maxHp: { type: 'number', value: 100 },
        gold: { type: 'number', value: 0 },
      },
      statusData: [
        { id: 'sd-hp', title: 'HP', value: '{{hp}} / {{maxHp}}', priority: 100 },
        { id: 'sd-gold', title: 'Gold', value: '{{gold}}', priority: 90, color: '#c9a84c' },
      ],
      metadata: { title: 'Untitled Story', description: '' }
    });
    setStoryId(newId);
    setHasHydrated(true);
    onOpen();
  }, [loadStory, setStoryId, setHasHydrated]);

  const handleLoadDemo = useCallback((onOpen: () => void) => {
    const { nodes, edges, pages } = parseStoryToGraph(exampleStory);
    const newId = crypto.randomUUID();
    setHasHydrated(false);
    setStoryId(newId);
    loadStory({
      nodes,
      edges,
      pages,
      variables: exampleStory.variables || {},
      items: exampleStory.items || {},
      metadata: {
        title: exampleStory.title,
        titleLocId: exampleStory.titleLocId,
        description: exampleStory.description,
        descriptionLocId: exampleStory.descriptionLocId,
        startPageId: exampleStory.startPageId
      },
      subplots: exampleStory.subplots || [],
      audio: exampleStory.audio || {},
      atmospheres: exampleStory.atmospheres || {},
      statusData: exampleStory.statusData || [],
      contextualText: exampleStory.contextualText || {},
      derivedTexts: exampleStory.derivedTexts || {}
    });
    setHasHydrated(true);
    onOpen();
  }, [loadStory, setStoryId, setHasHydrated]);

  const handleOpenExisting = useCallback(async (id: string, onOpen: () => void) => {
    try {
      const data = await get(`story-${id}`);
      if (data && data.state) {
        /*
         * Back the story up before upgrading it, and before anything can autosave over
         * it. An upgrade is the one edit an author never asked for, and there is a
         * single snapshot per story — so without this, a migration that gets something
         * wrong overwrites the only copy of the original.
         */
        const storedVersion = data.storyVersion ? String(data.storyVersion) : undefined;
        if (storedVersion !== CURRENT_VERSION) {
          await saveStoryBackup(id, data, storedVersion, CURRENT_VERSION);
        }

        setHasHydrated(false);
        setStoryId(id);
        
        const parsedData = migrateStory({
          ...data.state,
          /*
           * The snapshot keeps pages keyed by id — the editor's shape — while
           * `StoryData` wants a list. `ensurePagesArray` inside the migration chain
           * used to do this by accident, so skipping migrations for an
           * already-current story broke opening it outright. The conversion belongs
           * at this boundary, where the two shapes actually meet.
           */
          pages: Array.isArray(data.state.pages)
            ? data.state.pages
            : Object.values(data.state.pages ?? {}),
          /*
           * The story's own schema version, not the snapshot envelope's. Passing
           * `data.version` here — the envelope's `3` — made every open re-run the
           * whole migration chain over data that was already current. A save made
           * before `storyVersion` existed has none, and falls back to the old
           * behaviour, which the migrations tolerate.
           */
          version: data.storyVersion ?? data.version,
          title: data.state.storyTitle,
          titleLocId: data.state.storyTitleLocId,
          description: data.state.storyDescription,
          descriptionLocId: data.state.storyDescriptionLocId,
        });

        const { nodes: parsedNodes, edges: parsedEdges, pages: parsedPages } = parseStoryToGraph(parsedData);

        loadStory({
          nodes: parsedNodes,
          edges: parsedEdges,
          pages: parsedPages,
          variables: parsedData.variables || {},
          items: parsedData.items || {},
          metadata: {
            title: parsedData.title,
            titleLocId: parsedData.titleLocId,
            description: parsedData.description,
            descriptionLocId: parsedData.descriptionLocId,
            startPageId: parsedData.startPageId
          },
          subplots: parsedData.subplots || [],
          audio: parsedData.audio || {},
          atmospheres: parsedData.atmospheres || {},
          statusData: parsedData.statusData || [],
          contextualText: parsedData.contextualText || {},
          derivedTexts: parsedData.derivedTexts || {},
          debugSnapshots: parsedData.debugSnapshots || []
        });
        setHasHydrated(true);
        onOpen();
      }
    } catch (error) {
      console.error('Failed to open story:', error);
    }
  }, [loadStory, setStoryId, setHasHydrated]);

  /* Confirmation is the caller's job now — `DeleteStoryDialog` can say what is lost. */
  const handleDelete = useCallback(async (id: string) => {
    await del(`story-${id}`);
    /* Its backup goes with it, so deleting a story does not leave one orphaned. */
    await deleteStoryBackup(id);
    await loadStoriesList();
  }, [loadStoriesList]);

  /** Puts a story back as it was before its last schema upgrade. */
  const handleRevertToBackup = useCallback(async (id: string) => {
    await restoreStoryBackup(id);
    await loadStoriesList();
  }, [loadStoriesList]);

  return {
    stories,
    handleRevertToBackup,
    handleCreateNew,
    handleLoadDemo,
    handleOpenExisting,
    handleDelete,
  };
};
