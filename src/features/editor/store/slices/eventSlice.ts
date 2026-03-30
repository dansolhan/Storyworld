import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';
import type { StoryEvent } from '../../../../domain/Events/StoryEvent';

export const createEventSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'addEvent' | 'updateEvent' | 'removeEvent' | 'updateEventLogicTree'>
> = (set) => ({
  addEvent: (targetType, pageId, targetId, name) => {
    set((state) => {
      const nextPages = { ...state.pages };
      const page = nextPages[pageId];
      if (!page) return state;

      const newEvent: StoryEvent = {
        id: crypto.randomUUID(),
        name,
        logicTree: []
      };

      if (targetType === 'page' && pageId === targetId) {
        nextPages[pageId] = {
          ...page,
          events: [...(page.events || []), newEvent]
        };
      } else if (targetType === 'choice') {
        nextPages[pageId] = {
          ...page,
          choices: page.choices.map(c => 
            c.id === targetId ? { ...c, events: [...(c.events || []), newEvent] } : c
          )
        };
      } else if (targetType === 'paragraph') {
        nextPages[pageId] = {
          ...page,
          paragraphs: page.paragraphs.map(p => 
            p.id === targetId ? { ...p, events: [...(p.events || []), newEvent] } : p
          )
        };
      }

      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },

  updateEvent: (targetType, pageId, targetId, eventId, updates) => {
    set((state) => {
      const nextPages = { ...state.pages };
      const page = nextPages[pageId];
      if (!page) return state;

      const updateEventInList = (events: StoryEvent[] = []) => 
        events.map(e => e.id === eventId ? { ...e, ...updates } : e);

      if (targetType === 'page' && pageId === targetId) {
        nextPages[pageId] = { ...page, events: updateEventInList(page.events) };
      } else if (targetType === 'choice') {
        nextPages[pageId] = {
          ...page,
          choices: page.choices.map(c => c.id === targetId ? { ...c, events: updateEventInList(c.events) } : c)
        };
      } else if (targetType === 'paragraph') {
        nextPages[pageId] = {
          ...page,
          paragraphs: page.paragraphs.map(p => p.id === targetId ? { ...p, events: updateEventInList(p.events) } : p)
        };
      }

      return { pages: nextPages };
    });
  },

  removeEvent: (targetType, pageId, targetId, eventId) => {
    set((state) => {
      const nextPages = { ...state.pages };
      const page = nextPages[pageId];
      if (!page) return state;

      const filterEvents = (events: StoryEvent[] = []) => events.filter(e => e.id !== eventId);

      if (targetType === 'page' && pageId === targetId) {
        nextPages[pageId] = { ...page, events: filterEvents(page.events) };
      } else if (targetType === 'choice') {
        nextPages[pageId] = {
          ...page,
          choices: page.choices.map(c => c.id === targetId ? { ...c, events: filterEvents(c.events) } : c)
        };
      } else if (targetType === 'paragraph') {
        nextPages[pageId] = {
          ...page,
          paragraphs: page.paragraphs.map(p => p.id === targetId ? { ...p, events: filterEvents(p.events) } : p)
        };
      }

      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  },

  updateEventLogicTree: (targetType, pageId, targetId, eventId, logicTree) => {
    set((state) => {
      const nextPages = { ...state.pages };
      const page = nextPages[pageId];
      if (!page) return state;

      const updateTree = (events: StoryEvent[] = []) => 
        events.map(e => e.id === eventId ? { ...e, logicTree } : e);

      if (targetType === 'page' && pageId === targetId) {
        nextPages[pageId] = { ...page, events: updateTree(page.events) };
      } else if (targetType === 'choice') {
        nextPages[pageId] = {
          ...page,
          choices: page.choices.map(c => c.id === targetId ? { ...c, events: updateTree(c.events) } : c)
        };
      } else if (targetType === 'paragraph') {
        nextPages[pageId] = {
          ...page,
          paragraphs: page.paragraphs.map(p => p.id === targetId ? { ...p, events: updateTree(p.events) } : p)
        };
      }

      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    });
  }
});
