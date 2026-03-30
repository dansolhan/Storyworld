import { useEffect } from 'react';
import { usePlayerStore, type PlayerMessage } from '../store/usePlayerStore';
import { useCurrentPage } from './useStoryState';
import { executeLogicTree } from '../logic/executeLogicTree';
import type { ActionContext } from '../../../domain/Actions/Action';

export const usePageEnterEvents = () => {
  const currentPage = useCurrentPage();
  const {
    currentPageId,
    variables,
    visitedPageIds,
    setVariables,
    setMessages,
    setCurrentPageId,
    inventory,
    modifyInventory
  } = usePlayerStore();

  useEffect(() => {
    if (currentPage && currentPage.events) {
      const enterEvents = currentPage.events.filter(e => e.name === 'onEnter');
      if (enterEvents.length === 0) return;

      const nextVars = { ...variables };
      const newMessages: PlayerMessage[] = [];
      let navigateToPage: string | null = null;

      const evalContext = {
        variables: nextVars,
        visitedPageIds,
        currentPageId,
        inventory
      };

      // Mock action context wrapper to intercept engine state changes
      const actionContext: ActionContext = {
        variables: nextVars as any,
        modifyInventory,
        setVariable: (key: string, value: unknown) => {
          const currentVar = nextVars[key];
          const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
          nextVars[key] = {
            type,
            value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value)
          };
        },
        postMessage: (message: string, displayStyle?: 'styled' | 'paragraph') => {
            // We just generate unique IDs for messages here as we don't have distinct node IDs for every message 
            // inside a loop, but we can dedupe by checking if the exact message text was already pushed maybe?
            // Actually, LogicTree doesn't restrict shown instances by ID natively in this simplified context unless we track node IDs.
            // Let's just push it.
            newMessages.push({
              id: crypto.randomUUID(),
              text: message,
              displayStyle: displayStyle || 'styled',
              pageId: navigateToPage || currentPageId
            });
        },
        goToPage: (pageId: string) => {
          navigateToPage = pageId;
          newMessages.forEach(m => { if (!m.pageId) m.pageId = pageId; });
        }
      };

      enterEvents.forEach(event => {
        executeLogicTree(event.logicTree || [], evalContext, actionContext);
      });

      // Commit changes back to store
      setVariables(nextVars);
      
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
