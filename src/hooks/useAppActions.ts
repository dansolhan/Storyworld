import { useEditorStore } from '../features/editor/store/useEditorStore';
import { compileGraphToStory } from '../lib/storyMapper';
import { exportToJson, exportToStoryworld } from '../utils/exportUtils';
import type { StoryData } from '../domain/Story/StoryData';

export interface PlaySession {
  story: StoryData;
  /** Where to begin. Undefined plays the story from its own start page. */
  startPageId?: string;
}

/**
 * Compiles whatever the editor is currently holding into a story.
 *
 * Play, JSON export and storyworld export all wanted the identical fifteen-field
 * destructure, so the argument list had been copied out three times — and a new
 * field like `debugSnapshots` had to be threaded through each of them or one path
 * would quietly ship without it.
 */
const compileCurrentStory = (): StoryData => {
  const {
    nodes, edges, pages, variables, items, storyTitle, storyDescription, startPageId,
    audio, atmospheres, statusData, contextualText, derivedTexts, debugSnapshots,
  } = useEditorStore.getState();

  return compileGraphToStory(
    nodes, edges, pages, variables, items,
    { title: storyTitle, description: storyDescription, startPageId },
    audio, atmospheres, statusData, contextualText, derivedTexts, debugSnapshots
  );
};

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
    setPlaySession({ story: compileCurrentStory(), startPageId: startAtPageId });
    setMode('player');
  };

  const handleExportJson = () => exportToJson(compileCurrentStory());

  const handleExportStoryworld = () => exportToStoryworld(compileCurrentStory());

  return {
    handlePlay,
    handleExportJson,
    handleExportStoryworld,
  };
};
