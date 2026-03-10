import { create } from 'zustand';
import type { StoryData } from '../../../domain/Story/StoryData';
import type { StoryVariable } from '../../../domain/Story/Variable';

export interface PlayerMessage {
  id: string;
  text: string;
  pageId?: string;
  displayStyle?: 'styled' | 'paragraph';
}

interface PlayerState {
  storyData: StoryData | null;
  currentPageId: string | undefined;
  visitedPageIds: string[];
  variables: Record<string, StoryVariable>;
  messages: PlayerMessage[];
  shownMessageActionIds: Set<string>;
  contextualPopover: { text: string; x: number; y: number } | null;
  inventory: Record<string, number>;

  // Actions
  initialize: (storyData: StoryData, startPageId?: string) => void;
  setCurrentPageId: (id: string | undefined) => void;
  addVisitedPageId: (id: string) => void;
  setVariables: (variables: Record<string, StoryVariable>) => void;
  setVariable: (key: string, value: unknown) => void;
  setMessages: (messages: PlayerMessage[] | ((prev: PlayerMessage[]) => PlayerMessage[])) => void;
  addMessages: (messages: PlayerMessage[]) => void;
  markActionsShown: (ids: string[]) => void;
  setContextualPopover: (popover: { text: string; x: number; y: number } | null) => void;
  modifyInventory: (itemId: string, amount: number) => void;
  restart: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  storyData: null,
  currentPageId: undefined,
  visitedPageIds: [],
  variables: {},
  messages: [],
  shownMessageActionIds: new Set(),
  contextualPopover: null,
  inventory: {},

  initialize: (storyData: StoryData, startPageId?: string) => {
    const defaultStartId = startPageId || storyData?.startPageId || storyData?.pages?.[0]?.id;
    set({
      storyData,
      currentPageId: defaultStartId,
      visitedPageIds: [],
      variables: storyData.variables || {},
      messages: [],
      shownMessageActionIds: new Set(),
      contextualPopover: null,
      inventory: {},
    });
  },

  setCurrentPageId: (id: string | undefined) => set({ currentPageId: id }),

  addVisitedPageId: (id: string) => set((state) => {
    if (state.visitedPageIds.includes(id)) return state;
    return { visitedPageIds: [...state.visitedPageIds, id] };
  }),

  setVariables: (variables: Record<string, StoryVariable>) => set({ variables }),

  setVariable: (key: string, value: unknown) => set((state) => {
    const nextVars = { ...state.variables };
    const currentVar = nextVars[key];
    const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
    nextVars[key] = {
      type,
      value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value)
    };
    return { variables: nextVars };
  }),

  setMessages: (messagesOrFn) => set((state) => ({
    messages: typeof messagesOrFn === 'function' ? messagesOrFn(state.messages) : messagesOrFn
  })),

  addMessages: (newMessages: PlayerMessage[]) => set((state) => ({
    messages: [...state.messages, ...newMessages]
  })),

  markActionsShown: (ids: string[]) => set((state) => {
    const next = new Set(state.shownMessageActionIds);
    ids.forEach(id => next.add(id));
    return { shownMessageActionIds: next };
  }),

  setContextualPopover: (contextualPopover) => set({ contextualPopover }),

  modifyInventory: (itemId: string, amount: number) => set((state) => {
    const nextInventory = { ...state.inventory };
    const current = nextInventory[itemId] || 0;
    const nextAmount = current + amount;

    if (nextAmount <= 0) {
      delete nextInventory[itemId];
    } else {
      nextInventory[itemId] = nextAmount;
    }

    return { inventory: nextInventory };
  }),

  restart: () => set((state) => {
    if (!state.storyData) return state;
    const defaultStartId = state.storyData.startPageId || state.storyData.pages?.[0]?.id;
    return {
      currentPageId: defaultStartId,
      visitedPageIds: [],
      variables: state.storyData.variables || {},
      messages: [],
      shownMessageActionIds: new Set(),
      contextualPopover: null,
      inventory: {},
    };
  }),
}));
