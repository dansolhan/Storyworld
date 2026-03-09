import { useEffect } from 'react';
import { usePlayerStore, type PlayerMessage } from '../store/usePlayerStore';
import { useCurrentPage } from './useStoryState';
import { actionBlueprints } from '../../../domain/Actions/registry';
import { evaluateVisibility } from '../conditionals/evaluator';

export const usePageEnterActions = () => {
  const currentPage = useCurrentPage();
  const {
    currentPageId,
    variables,
    visitedPageIds,
    shownMessageActionIds,
    setVariables,
    setMessages,
    markActionsShown,
    setCurrentPageId
  } = usePlayerStore();

  useEffect(() => {
    if (currentPage && currentPage.actions) {
      const nextVars = { ...variables };
      const newMessages: PlayerMessage[] = [];
      let navigateToPage: string | null = null;
      const newlyShownActions = new Set<string>();

      const evalContext = {
        variables: nextVars,
        visitedPageIds,
        currentPageId,
      };

      let varChanges = false;
      currentPage.actions.forEach(action => {
        if (action.conditionals && action.conditionals.length > 0) {
          // @ts-ignore
          if (!evaluateVisibility({ conditionals: action.conditionals }, evalContext)) {
            return;
          }
        }
        const blueprint = actionBlueprints[action.blueprintId];
        if (blueprint) {
          const actionContext = {
            variables: nextVars,
            setVariable: (key: string, value: unknown) => {
              const currentVar = nextVars[key];
              const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
              nextVars[key] = {
                type,
                value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value)
              };
            },
            postMessage: (message: string, displayStyle?: 'styled' | 'paragraph') => {
              if (!shownMessageActionIds.has(action.id) && !newlyShownActions.has(action.id)) {
                newMessages.push({
                  id: crypto.randomUUID(),
                  text: message,
                  displayStyle: displayStyle || 'styled',
                  pageId: navigateToPage || currentPageId
                });
                newlyShownActions.add(action.id);
              }
            },
            goToPage: (pageId: string) => {
              navigateToPage = pageId;
              newMessages.forEach(m => { if (!m.pageId) m.pageId = pageId; });
            }
          };
          blueprint.execute(action.params, actionContext);
          varChanges = true;
        }
      });

      if (varChanges) {
        setVariables(nextVars);
      }
      if (newlyShownActions.size > 0) {
        markActionsShown(Array.from(newlyShownActions));
      }
      if (newMessages.length > 0) {
        newMessages.forEach(m => { m.pageId = m.pageId || currentPageId; });
        setMessages(prev => [...prev, ...newMessages]);
      }
      if (navigateToPage) {
        setCurrentPageId(navigateToPage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);
};
