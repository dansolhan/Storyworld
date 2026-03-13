import { usePlayerStore, type PlayerMessage } from '../store/usePlayerStore';
import { actionBlueprints } from '../../../domain/Actions/registry';
import { evaluateVisibility } from '../conditionals/evaluator';

export const useChoiceClick = () => {
  const {
    currentPageId,
    storyData,
    visitedPageIds,
    variables,
    shownMessageActionIds,
    setVariables,
    setMessages,
    markActionsShown,
    setCurrentPageId,
    inventory,
    modifyInventory
  } = usePlayerStore();
  const setTransitioning = usePlayerStore((s) => s.setTransitioning);

  const handleChoiceClick = (choiceId: string, targetPageId?: string) => {
    // 1. Start transition (fade out)
    setTransitioning(true);

    // 2. Wait for fade out to complete (matching Player.tsx transition duration)
    setTimeout(() => {
      const currentPage = storyData?.pages.find(p => p.id === currentPageId);
      const choice = currentPage?.choices.find(c => c.id === choiceId);
      let nextTargetId = targetPageId;

      if (choice && choice.actions) {
        const nextVars = { ...variables };
        const newMessages: PlayerMessage[] = [];
        const newlyShownActions = new Set<string>();

        const evalContext = {
          variables: nextVars,
          visitedPageIds,
          currentPageId,
          inventory
        };

        choice.actions.forEach(action => {
          if (action.conditionals && action.conditionals.length > 0) {
            // @ts-ignore
            if (!evaluateVisibility({ conditionals: action.conditionals }, evalContext)) return;
          }
          const blueprint = actionBlueprints[action.blueprintId];
          if (blueprint) {
            const actionContext = {
              variables: nextVars,
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
                if (!shownMessageActionIds.has(action.id) && !newlyShownActions.has(action.id)) {
                  newMessages.push({
                    id: crypto.randomUUID(),
                    text: message,
                    displayStyle: displayStyle || 'styled',
                    pageId: nextTargetId || currentPageId
                  });
                  newlyShownActions.add(action.id);
                }
              },
              goToPage: (pageId: string) => {
                nextTargetId = pageId;
                newMessages.forEach(m => { if (!m.pageId) m.pageId = pageId; });
              }
            };
            blueprint.execute(action.params, actionContext);
          }
        });

        setVariables(nextVars);

        if (newlyShownActions.size > 0) {
          markActionsShown(Array.from(newlyShownActions));
        }

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

      if (nextTargetId) {
        setCurrentPageId(nextTargetId);
      }

      // 3. End transition (fade back in)
      setTransitioning(false);
    }, 250); // Small buffer over 0.2s transition
  };

  return { handleChoiceClick };
};
