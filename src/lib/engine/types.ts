import type { StoryData } from '../../domain/Story/StoryData';
import type { StoryVariable } from '../../domain/Story/Variable';
import type { DebugSnapshot } from '../../domain/Story/DebugSnapshot';

export interface PlayerMessage {
  id: string;
  text: string;
  pageId?: string;
  displayStyle?: 'styled' | 'paragraph';
}

export type StoryEffect = 
  | {
      type: 'PLAY_SOUND';
      payload: {
        soundId: string;
        category?: 'bgm' | 'sfx';
        /** Milliseconds to reach full volume; from the atmosphere. */
        fadeIn?: number;
        /** Fraction of the category's level, 0–1; from the atmosphere. */
        volume?: number;
      };
    }
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

/**
 * The `DEBUG_*` messages exist so the debug console never writes to the store
 * directly. Reaching past `dispatch` would fork the state machine, and the first
 * thing to diverge would be variable coercion — the exact thing an author opened
 * the console to inspect.
 */
export type StoryMessage =
  | { type: 'INITIALIZE'; payload: { storyData: StoryData; startPageId?: string } }
  | { type: 'SELECT_CHOICE'; payload: { choiceId: string; targetPageId?: string } }
  | { type: 'HOVER_CHOICE'; payload: { choiceId: string; isHovering: boolean } }
  | { type: 'EXECUTE_ITEM_CHOICE'; payload: { itemId: string; choiceId: string } }
  | { type: 'RESTART' }
  | { type: 'DEBUG_SET_VARIABLE'; payload: { key: string; value: string | number | boolean } }
  | { type: 'DEBUG_SET_INVENTORY'; payload: { itemId: string; count: number } }
  | { type: 'DEBUG_SET_VISITED'; payload: { pageId: string; visited: boolean } }
  | { type: 'DEBUG_APPLY_SNAPSHOT'; payload: { snapshot: DebugSnapshot } }
  /** Re-runs the current page's `onEnter` events, as if it had just been walked into. */
  | { type: 'DEBUG_REENTER_PAGE' }
  /** Moves the reader to a page without running the choice that would have led there. */
  | { type: 'DEBUG_GO_TO_PAGE'; payload: { pageId: string } };
