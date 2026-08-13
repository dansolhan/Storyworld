import React, { useState, useEffect, useRef } from 'react';
import { useEngine } from '../../adapter/useEngine';
import { useEngineStore } from '../../adapter/useEngineStore';
import { evaluateVisibility } from '../../../../lib/engine/logic/evaluator';
import styles from './Inventory.module.css';
import { conditionalsToLogicTree } from '../../../../domain/Conditionals/conditionalsToLogicTree';
import type { Item } from '../../../../domain/Item/Item';

export const Inventory: React.FC = () => {
  const engine = useEngine();
  const inventory = useEngineStore((s) => s.inventory);
  const storyData = useEngineStore((s) => s.storyData);
  const variables = useEngineStore((s) => s.variables);
  const visitedPageIds = useEngineStore((s) => s.visitedPageIds);
  const currentPageId = useEngineStore((s) => s.currentPageId);

  const [contextMenu, setContextMenu] = useState<{ itemId: string, x: number, y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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
        <h2 className={styles.title}>Carried</h2>
        <p className={styles.empty}>Nothing yet — your pockets are unsearched.</p>
      </div>
    );
  }

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ itemId, x: e.clientX, y: e.clientY });
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    handleContextMenu(e, itemId);
  };

  const handleExamine = (itemDef: Item) => {
    setContextMenu(null);
    engine.store.setState((prev) => ({
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          text: itemDef.description || 'It looks ordinary.',
          displayStyle: 'paragraph',
          pageId: currentPageId || undefined
        }
      ]
    }));
  };

  const handleContextChoiceClick = (itemId: string, choiceId: string) => {
    setContextMenu(null);
    engine.dispatch({ type: 'EXECUTE_ITEM_CHOICE', payload: { itemId, choiceId } });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Carried</h2>

      {/*
        Pills rather than cards with thumbnails: the ledger is a margin, and the
        design carries the count inside the label — "River Coin ×2" — so a row of
        them reads as one line of a list rather than a grid of tiles.
      */}
      <div className={styles.list}>
        {itemsArray.map(({ itemId, count, itemDef }) => (
          <button
            key={itemId}
            type="button"
            className={styles.itemPill}
            onClick={(e) => handleItemClick(e, itemId)}
            onContextMenu={(e) => handleContextMenu(e, itemId)}
          >
            {itemDef?.name ?? itemId}
            {itemDef?.multiple && count > 1 && <span className={styles.count}>×{count}</span>}
          </button>
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
              const itemDef = storyData?.items?.[contextMenu.itemId];
              if (itemDef) handleExamine(itemDef);
            }}
          >
            Examine
          </button>

          {(() => {
            const def = storyData?.items?.[contextMenu.itemId];
            if (!def || !def.contextChoices) return null;

            const evalContext = { variables, visitedPageIds, currentPageId: currentPageId || '', inventory };

            return def.contextChoices.map((choice) => {
              // Convert to EvaluatableItem format for evaluator
              const evaluatable = {
                events: choice.conditionals
                  ? [{
                      id: 'synthetic',
                      name: 'onEvaluate',
                      logicTree: conditionalsToLogicTree(choice.conditionals),
                    }]
                  : [],
              };
              if (!evaluateVisibility(evaluatable, evalContext)) return null;

              return (
                <button
                  key={choice.id}
                  className={styles.contextMenuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextChoiceClick(contextMenu.itemId, choice.id);
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
