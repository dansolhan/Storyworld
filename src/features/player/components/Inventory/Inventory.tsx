import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { evaluateVisibility } from '../../conditionals/evaluator';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import styles from './Inventory.module.css';

export const Inventory: React.FC = () => {
  const inventory = usePlayerStore((s) => s.inventory);
  const storyData = usePlayerStore((s) => s.storyData);

  const variables = usePlayerStore((s) => s.variables);
  const visitedPageIds = usePlayerStore((s) => s.visitedPageIds);
  const currentPageId = usePlayerStore((s) => s.currentPageId);
  const shownMessageActionIds = usePlayerStore((s) => s.shownMessageActionIds);
  const setVariables = usePlayerStore((s) => s.setVariables);
  const setMessages = usePlayerStore((s) => s.setMessages);
  const markActionsShown = usePlayerStore((s) => s.markActionsShown);
  const setCurrentPageId = usePlayerStore((s) => s.setCurrentPageId);
  const modifyInventory = usePlayerStore((s) => s.modifyInventory);

  const [contextMenu, setContextMenu] = useState<{ itemId: string, x: number, y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itemsArray = Object.entries(inventory).map(([id, count]) => {
    const itemDef = storyData?.items?.[id];
    return { itemId: id, count, itemDef };
  }).filter(info => info.itemDef && info.count > 0);

  if (itemsArray.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Inventory</h2>
        <div style={{ textAlign: 'center', color: 'var(--player-text-muted)', fontStyle: 'italic', marginTop: 'var(--space-4)' }}>
          Your inventory is empty.
        </div>
      </div>
    );
  }

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ itemId, x: e.clientX, y: e.clientY });
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    // Left click also opens context menu for better usability on touch devices
    handleContextMenu(e, itemId);
  };

  const handleExamine = (itemDef: any) => {
    setContextMenu(null);
    if (!contextMenu) return;

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: itemDef.description || 'It looks ordinary.',
        displayStyle: 'paragraph',
        pageId: currentPageId
      }
    ]);
  };

  const handleContextChoiceClick = (choice: any) => {
    setContextMenu(null);
    if (!choice.actions) return;

    const nextVars = { ...variables };
    const newMessages: any[] = [];
    const newlyShownActions = new Set<string>();
    let nextTargetId: string | undefined = undefined;

    const evalContext = {
      variables: nextVars,
      visitedPageIds,
      currentPageId,
      inventory
    };

    choice.actions.forEach((action: any) => {
      if (action.conditionals && action.conditionals.length > 0) {
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
      // @ts-ignore
      newMessages.forEach(m => { m.pageId = m.pageId || nextTargetId; });
      setMessages(newMessages);
      setCurrentPageId(nextTargetId);
    } else {
      // @ts-ignore
      newMessages.forEach(m => { m.pageId = m.pageId || currentPageId; });
      setMessages(prev => [...prev, ...newMessages]);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Inventory</h2>
      <div className={styles.list}>
        {itemsArray.map(({ itemId, count, itemDef }) => (
          <div
            key={itemId}
            className={styles.itemCard}
            onClick={(e) => handleItemClick(e, itemId)}
            onContextMenu={(e) => handleContextMenu(e, itemId)}
          >
            <div className={styles.imageContainer}>
              {itemDef?.imageUrl ? (
                <img src={itemDef.imageUrl} alt={itemDef.name} className={styles.image} />
              ) : (
                <span className={styles.placeholderImage}>?</span>
              )}
            </div>
            <div className={styles.info}>
              <h3 className={styles.name}>{itemDef?.name}</h3>
              {itemDef?.multiple && count > 1 && (
                <span className={styles.count}>x{count}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className={styles.contextMenuItem}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              const itemDef = storyData?.items?.[contextMenu.itemId];
              if (itemDef) handleExamine(itemDef);
            }}
          >
            Examine
          </button>

          {/* Render custom context choices here later, after evaluating conditionals */}
          {(() => {
            const def = storyData?.items?.[contextMenu.itemId];
            if (!def || !def.contextChoices) return null;

            const evalContext = { variables, visitedPageIds, currentPageId, inventory };

            return def.contextChoices.map((choice) => {
              if (choice.conditionals && choice.conditionals.length > 0) {
                if (!evaluateVisibility({ conditionals: choice.conditionals }, evalContext)) return null;
              }
              return (
                <button
                  key={choice.id}
                  className={styles.contextMenuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    handleContextChoiceClick(choice);
                  }}
                >
                  {choice.text}
                </button>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};
