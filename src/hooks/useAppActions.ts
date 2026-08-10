import { useEditorStore } from '../features/editor/store/useEditorStore';
import { compileGraphToStory } from '../lib/storyMapper';
import { exportToJson, exportToStoryworld } from '../utils/exportUtils';
import type { StoryData } from '../domain/Story/StoryData';

export interface PlaySession {
  story: StoryData;
  /** Where to begin. Undefined plays the story from its own start page. */
  startPageId?: string;
}

export const useAppActions = (
  setMode: (mode: 'dashboard' | 'editor' | 'player') => void,
  setPlaySession: (session: PlaySession | null) => void
) => {
  /**
   * `startAtPageId` backs the inspector's "Play from here". It is a transient
   * override, never written to the story — the engine already accepts a start
   * page, so nothing about the schema changes.
   */
  const handlePlay = (startAtPageId?: string) => {
    const { nodes, edges, pages, variables, items, storyTitle, storyDescription, startPageId, audio, atmospheres, statusData } = useEditorStore.getState();
    const compiledStory = compileGraphToStory(nodes, edges, pages, variables, items, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    }, audio, atmospheres, statusData);
    setPlaySession({ story: compiledStory, startPageId: startAtPageId });
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
