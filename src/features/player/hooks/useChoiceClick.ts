import { usePlayerStore, type PlayerMessage } from '../store/usePlayerStore';
import { executeLogicTree } from '../logic/executeLogicTree';
import type { ActionContext } from '../../../domain/Actions/Action';

export const useChoiceClick = () => {
  const {
    currentPageId,
    storyData,
    visitedPageIds,
    variables,
    setVariables,
    setMessages,
    setCurrentPageId,
    inventory,
    modifyInventory
  } = usePlayerStore();
  const setTransitioning = usePlayerStore((s) => s.setTransitioning);

  const handleChoiceClick = (choiceId: string, targetPageId?: string) => {
    setTransitioning(true);

    setTimeout(() => {
      const currentPage = storyData?.pages.find(p => p.id === currentPageId);
      const choice = currentPage?.choices.find(c => c.id === choiceId);
      let nextTargetId = targetPageId;

      if (choice && choice.events) {
        const clickEvents = choice.events.filter(e => e.name === 'onClick');
        
        if (clickEvents.length > 0) {
          const nextVars = { ...variables };
          const newMessages: PlayerMessage[] = [];

          const evalContext = {
            variables: nextVars,
            visitedPageIds,
            currentPageId,
            inventory
          };

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
                newMessages.push({
                  id: crypto.randomUUID(),
                  text: message,
                  displayStyle: displayStyle || 'styled',
                  pageId: nextTargetId || currentPageId
                });
            },
            goToPage: (pageId: string) => {
              nextTargetId = pageId;
              newMessages.forEach(m => { if (!m.pageId) m.pageId = pageId; });
            }
          };

          clickEvents.forEach(event => {
            executeLogicTree(event.logicTree || [], evalContext, actionContext);
          });

          setVariables(nextVars);

          if (nextTargetId) {
            newMessages.forEach(m => { m.pageId = m.pageId || nextTargetId; });
            setMessages(newMessages);
          } else {
            newMessages.forEach(m => { m.pageId = m.pageId || currentPageId; });
            setMessages(prev => [...prev, ...newMessages]);
          }
        } else if (nextTargetId) {
          setMessages([]);
        }
      } else if (nextTargetId) {
        setMessages([]);
      }

      if (nextTargetId) {
        setCurrentPageId(nextTargetId);
      }

      setTransitioning(false);
    }, 250); 
  };

  return { handleChoiceClick };
};
