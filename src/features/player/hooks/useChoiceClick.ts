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

  const handleChoiceClick = (choiceId: string, targetPageId?: string) => {
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
                // If this choice takes us to a new page, associate message with that page.
                // Otherwise, associate it with the current page.
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
              // Retroactively update pageId for any messages generated BEFORE goToPage was called in the action list
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
        // Tag messages with the target page ID so they only appear when that page appears
        newMessages.forEach(m => { m.pageId = m.pageId || nextTargetId; });
        setMessages(newMessages); // clean slate + transition messages when navigating
      } else {
        // Associate with current page if staying
        newMessages.forEach(m => { m.pageId = m.pageId || currentPageId; });
        setMessages(prev => [...prev, ...newMessages]); // append logically if repeating page
      }
    } else if (nextTargetId) {
      setMessages([]); // clean slate unconditionally if navigating
    }

    if (nextTargetId) {
      setCurrentPageId(nextTargetId);
    }
  };

  return { handleChoiceClick };
};
