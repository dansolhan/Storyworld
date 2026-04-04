import type { StoryData } from '../../domain/Story/StoryData';
import type { StoryVariable } from '../../domain/Story/Variable';

export interface PlayerMessage {
  id: string;
  text: string;
  pageId?: string;
  displayStyle?: 'styled' | 'paragraph';
}

export type StoryEffect = 
  | { type: 'PLAY_SOUND'; payload: { soundId: string; category?: 'bgm' | 'sfx' } }
  | { type: 'STOP_ALL_SOUNDS' }
  | { type: 'SHOW_POPOVER'; payload: { text: string; title?: string; x: number; y: number; width: number; height: number } }
  | { type: 'ON_STORY_END'; payload: { data: Record<string, unknown> } };

export interface EngineState {
  storyData: StoryData | null;
  currentPageId: string | undefined;
  visitedPageIds: string[];
  variables: Record<string, StoryVariable>;
  inventory: Record<string, number>;
  messages: PlayerMessage[];
  choiceOverrides?: Record<string, { text?: string }>;
  lastEffect?: StoryEffect;
}

export type StoryMessage =
  | { type: 'INITIALIZE'; payload: { storyData: StoryData; startPageId?: string } }
  | { type: 'SELECT_CHOICE'; payload: { choiceId: string; targetPageId?: string } }
  | { type: 'HOVER_CHOICE'; payload: { choiceId: string; isHovering: boolean } }
  | { type: 'EXECUTE_ITEM_CHOICE'; payload: { itemId: string; choiceId: string } }
  | { type: 'RESTART' };
