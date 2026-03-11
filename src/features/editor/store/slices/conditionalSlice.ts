import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { Choice } from '../../../../domain/Choice/Choice';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';
import type { Action } from '../../../../domain/Actions/Action';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { addConditionalToTree, updateConditionalInTree, removeConditionalFromTree } from '../utils/conditionalUtils';

export const createConditionalSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<
    EditorState,
    | 'addConditional'
    | 'updateConditional'
    | 'removeConditional'
  >
> = (set) => ({
  addConditional: (targetType, pageId, targetId, blueprintId, parentId) => {
    const blueprint = conditionalBlueprints[blueprintId];
    if (!blueprint) return;

    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const newConditional = {
        id: `cond-${Date.now()}`,
        blueprintId,
        params: JSON.parse(JSON.stringify(blueprint.defaultParams)), // deep copy defaults
      };

      const updatedPage = { ...page };
      if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: Choice) =>
          c.id === targetId ? { ...c, conditionals: addConditionalToTree(c.conditionals, parentId || null, newConditional) } : c
        );
      } else if (targetType === 'paragraph') {
        updatedPage.paragraphs = (page.paragraphs || []).map((p: Paragraph) =>
          p.id === targetId ? { ...p, conditionals: addConditionalToTree(p.conditionals, parentId || null, newConditional) } : p
        );
      } else if (targetType === 'action') {
        updatedPage.actions = (page.actions || []).map((a: Action) =>
          a.id === targetId ? { ...a, conditionals: addConditionalToTree(a.conditionals, parentId || null, newConditional) } : a
        );
      }

      return { pages: { ...state.pages, [pageId]: updatedPage } };
    });
  },

  updateConditional: (targetType, pageId, targetId, conditionalId, params) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const updatedPage = { ...page };
      if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: Choice) =>
          c.id === targetId && c.conditionals ? { ...c, conditionals: updateConditionalInTree(c.conditionals, conditionalId, params) } : c
        );
      } else if (targetType === 'paragraph') {
        updatedPage.paragraphs = (page.paragraphs || []).map((p: Paragraph) =>
          p.id === targetId && p.conditionals ? { ...p, conditionals: updateConditionalInTree(p.conditionals, conditionalId, params) } : p
        );
      } else if (targetType === 'action') {
        updatedPage.actions = (page.actions || []).map((a: Action) =>
          a.id === targetId && a.conditionals ? { ...a, conditionals: updateConditionalInTree(a.conditionals, conditionalId, params) } : a
        );
      }
      return { pages: { ...state.pages, [pageId]: updatedPage } };
    });
  },

  removeConditional: (targetType, pageId, targetId, conditionalId) => {
    set((state) => {
      const page = state.pages[pageId];
      if (!page) return state;

      const updatedPage = { ...page };
      if (targetType === 'choice') {
        updatedPage.choices = (page.choices || []).map((c: Choice) =>
          c.id === targetId && c.conditionals ? { ...c, conditionals: removeConditionalFromTree(c.conditionals, conditionalId) } : c
        );
      } else if (targetType === 'paragraph') {
        updatedPage.paragraphs = (page.paragraphs || []).map((p: Paragraph) =>
          p.id === targetId && p.conditionals ? { ...p, conditionals: removeConditionalFromTree(p.conditionals, conditionalId) } : p
        );
      } else if (targetType === 'action') {
        updatedPage.actions = (page.actions || []).map((a: Action) =>
          a.id === targetId && a.conditionals ? { ...a, conditionals: removeConditionalFromTree(a.conditionals, conditionalId) } : a
        );
      }
      return { pages: { ...state.pages, [pageId]: updatedPage } };
    });
  },
});
