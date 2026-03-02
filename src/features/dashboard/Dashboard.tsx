import React, { useEffect, useState } from 'react';
import { get, keys, del } from 'idb-keyval';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { useEditorStore } from '../editor/store/useEditorStore';

interface StoryIndexItem {
  id: string;
  title: string;
  description: string;
}

interface DashboardProps {
  onOpenStory: () => void;
  onImportClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenStory, onImportClick }) => {
  const [stories, setStories] = useState<StoryIndexItem[]>([]);
  const { setStoryId, loadStory, setHasHydrated } = useEditorStore();

  const loadStoriesList = async () => {
    try {
      // Find all storyworld- keys
      const allKeys = await keys();
      const storyKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('story-'));

      const loadedStories: StoryIndexItem[] = [];

      for (const key of storyKeys) {
        const data = await get(key as string);
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
  };

  useEffect(() => {
    const handleInitialLoad = async () => {
      // Implicit migration from old persist store to UUID
      const legacyData = await get('storyworld-editor-storage');
      if (legacyData) {
        const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData;
        if (parsed && parsed.state && parsed.state.nodes?.length > 1) { // Migrate if it has actual data
          const newId = crypto.randomUUID();
          const { set } = await import('idb-keyval');
          await set(`story-${newId}`, parsed);
        }
        await del('storyworld-editor-storage'); // Delete legacy to avoid repeating
      }

      await loadStoriesList();
    }
    handleInitialLoad();
  }, []);

  const handleCreateNew = () => {
    // We wipe the store completely!
    const newId = crypto.randomUUID();
    setHasHydrated(false); // Make sure hydration blocker is on

    // We call loadStory with empty arrays to clear it, but also initialize basic data
    loadStory([], [], {}, { title: 'Untitled Story', description: '' });

    setStoryId(newId);
    setHasHydrated(true); // Hydrated!
    onOpenStory();
  };

  const handleOpenExisting = async (id: string) => {
    try {
      const data = await get(`story-${id}`);
      if (data && data.state) {
        setHasHydrated(false);
        setStoryId(id);

        loadStory(
          data.state.nodes || [],
          data.state.edges || [],
          data.state.variables || {},
          {
            title: data.state.storyTitle,
            description: data.state.storyDescription,
            startPageId: data.state.startPageId
          }
        );

        setHasHydrated(true);
        onOpenStory();
      }
    } catch (error) {
      console.error('Failed to open story:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this story? It cannot be undone.')) {
      await del(`story-${id}`);
      await loadStoriesList();
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Storyworld AI</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={onImportClick}>Import Save File</Button>
          <Button variant="primary" onClick={handleCreateNew}>+ Create New Story</Button>
        </div>
      </header>

      {stories.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>No stories yet</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Create a new story or import an existing save file to get started.</p>
          <Button variant="primary" onClick={handleCreateNew}>Create New Story</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stories.map(story => (
            <Card key={story.id} padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{story.title}</h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {story.description || 'No description'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => handleDelete(story.id)}>Delete</Button>
                <Button variant="primary" onClick={() => handleOpenExisting(story.id)}>Open Editor</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
