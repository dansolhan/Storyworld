import { useState, useEffect, useCallback } from 'react';
import { get, keys, del, set as idbSet } from 'idb-keyval';
import { useEditorStore } from '../../editor/store/useEditorStore';
import { parseStoryToGraph } from '../../../lib/storyMapper';
import exampleStoryRaw from '../../../data/exampleStory.json';
import type { StoryData } from '../../../domain/Story/StoryData';

const exampleStory = exampleStoryRaw as StoryData;

export interface StoryIndexItem {
  id: string;
  title: string;
  description: string;
}

export const useStories = () => {
  const [stories, setStories] = useState<StoryIndexItem[]>([]);
  const { setStoryId, loadStory, setHasHydrated } = useEditorStore();

  const loadStoriesList = useCallback(async () => {
    try {
      const allKeys = await keys();
      const storyKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('story-'));
      const loadedStories: StoryIndexItem[] = [];

      for (const key of storyKeys) {
        const data = await get(key);
        if (data && data.state) {
          loadedStories.push({
            id: (key as string).replace('story-', ''),
            title: data.state.storyTitle || 'Untitled Story',
            description: data.state.storyDescription || 'No description',
          });
        }
      }
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
        description: exampleStory.description,
        startPageId: exampleStory.startPageId
      },
      subplots: exampleStory.subplots || [],
      audio: exampleStory.audio || {},
      atmospheres: exampleStory.atmospheres || {},
      statusData: exampleStory.statusData || []
    });
    setHasHydrated(true);
    onOpen();
  }, [loadStory, setStoryId, setHasHydrated]);

  const handleOpenExisting = useCallback(async (id: string, onOpen: () => void) => {
    try {
      const data = await get(`story-${id}`);
      if (data && data.state) {
        setHasHydrated(false);
        setStoryId(id);
        
        let loadedPages = data.state.pages;
        if (!loadedPages) {
          loadedPages = {};
          (data.state.nodes || []).filter((n: any) => n.type === 'pageNode').forEach((node: any) => {
            loadedPages[node.id] = {
              id: node.id,
              title: node.data.title || 'Untitled',
              subplotId: node.data.subplotId,
              atmosphereId: node.data.atmosphereId,
              paragraphs: node.data.paragraphs || [],
              choices: node.data.choices || [],
              actions: node.data.actions || []
            };
          });
        }

        loadStory({
          nodes: data.state.nodes || [],
          edges: data.state.edges || [],
          pages: loadedPages,
          variables: data.state.variables || {},
          items: data.state.items || {},
          metadata: {
            title: data.state.storyTitle,
            description: data.state.storyDescription,
            startPageId: data.state.startPageId
          },
          subplots: data.state.subplots || [],
          audio: data.state.audio || {},
          atmospheres: data.state.atmospheres || {},
          statusData: data.state.statusData || []
        });
        setHasHydrated(true);
        onOpen();
      }
    } catch (error) {
      console.error('Failed to open story:', error);
    }
  }, [loadStory, setStoryId, setHasHydrated]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this story? It cannot be undone.')) {
      await del(`story-${id}`);
      await loadStoriesList();
    }
  }, [loadStoriesList]);

  return {
    stories,
    handleCreateNew,
    handleLoadDemo,
    handleOpenExisting,
    handleDelete,
  };
};
