import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import type { Action } from '../../../../domain/Actions/Action';
import { syncSyntheticNodes } from '../../utils/syncSyntheticNodes';

export const createActionSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'addAction' | 'updateAction' | 'removeAction'>
> = (set) => ({
  addAction: (targetType, pageId, targetId, blueprintId) =>
    set((state) => {
      const blueprint = actionBlueprints[blueprintId];
      if (!blueprint) return state;

      const params = Object.assign({}, blueprint.defaultParams) as Record<string, any>;
      if (blueprintId === 'post_message') {
        params.messageLocId = crypto.randomUUID();
      }

      const newAction = {
        id: crypto.randomUUID(),
        blueprintId,
        params,
        conditionals: [],
      };

      const page = state.pages[pageId];
      if (!page) return state;

      const updatedPage = { ...page };
      if (targetType === 'page') {
        updatedPage.actions = [...(page.actions || []), newAction];
      } else if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: any) =>
          c.id === targetId ? { ...c, actions: [...(c.actions || []), newAction] } : c
        );
      }

      const nextPages = { ...state.pages, [pageId]: updatedPage };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    }),

  updateAction: (targetType, pageId, targetId, actionId, params) =>
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const updatedPage = { ...page };
      if (targetType === 'page') {
        updatedPage.actions = (page.actions || []).map((act) =>
          act.id === actionId ? { ...act, params } : act
        );
      } else if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: any) =>
          c.id === targetId ? {
            ...c,
            actions: (c.actions as Action[] | undefined)?.map((act: Action) =>
              act.id === actionId ? { ...act, params } : act
            ) || [],
          } : c
        );
      }

      const nextPages = { ...state.pages, [pageId]: updatedPage };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    }),

  removeAction: (targetType, pageId, targetId, actionId) =>
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const updatedPage = { ...page };
      if (targetType === 'page') {
        updatedPage.actions = (page.actions || []).filter((a) => a.id !== actionId);
      } else if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: any) =>
          c.id === targetId ? {
            ...c,
            actions: (c.actions as Action[] | undefined)?.filter((a: Action) => a.id !== actionId) || [],
          } : c
        );
      }

      const nextPages = { ...state.pages, [pageId]: updatedPage };
      const synced = syncSyntheticNodes(state.nodes, state.edges, nextPages, state.subplots || [], state.currentPlotId);
      return { pages: nextPages, nodes: synced.nodes, edges: synced.edges };
    }),
});
