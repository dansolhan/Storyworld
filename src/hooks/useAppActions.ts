import { useEditorStore } from '../features/editor/store/useEditorStore';
import { compileGraphToStory } from '../lib/storyMapper';
import { exportToJson, exportToStoryworld } from '../utils/exportUtils';
import type { StoryData } from '../domain/Story/StoryData';

export const useAppActions = (
  setMode: (mode: 'dashboard' | 'editor' | 'player') => void,
  setPlayingStory: (story: StoryData | null) => void
) => {
  const handlePlay = () => {
    const { nodes, edges, pages, variables, items, storyTitle, storyDescription, startPageId, audio, atmospheres, statusData } = useEditorStore.getState();
    const compiledStory = compileGraphToStory(nodes, edges, pages, variables, items, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    }, audio, atmospheres, statusData);
    setPlayingStory(compiledStory);
    setMode('player');
  };

  const handleExportJson = () => {
    const { nodes, edges, pages, variables, items, storyTitle, storyDescription, startPageId, audio, atmospheres, statusData } = useEditorStore.getState();
    const storyData = compileGraphToStory(nodes, edges, pages, variables, items, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    }, audio, atmospheres, statusData);
    exportToJson(storyData);
  };

  const handleExportStoryworld = () => {
    const { nodes, edges, pages, variables, items, storyTitle, storyDescription, startPageId, audio, atmospheres, statusData } = useEditorStore.getState();
    const storyData = compileGraphToStory(nodes, edges, pages, variables, items, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    }, audio, atmospheres, statusData);
    exportToStoryworld(storyData);
  };

  return {
    handlePlay,
    handleExportJson,
    handleExportStoryworld,
  };
};
