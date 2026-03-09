import React, { useState, useMemo, useEffect } from 'react';
import type { StoryData } from '../../domain/Story/StoryData';
import type { StoryVariable } from '../../domain/Story/Variable';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Popover } from '../../components/ui/Popover/Popover';
import { useContextualPopover } from './hooks/useContextualPopover';
import { useChoiceSound } from './hooks/useChoiceSound';
import { evaluateVisibility } from './conditionals/evaluator';
import { actionBlueprints } from '../../domain/Actions/registry';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerText } from './components/PlayerText';
import { PlayerChoices } from './components/PlayerChoices';
import { PlayerRightFrame } from './components/PlayerRightFrame';
import './player-theme.css';
import styles from './Player.module.css';

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ storyData, startPageId, onExit }) => {
  const { contextualPopover, setContextualPopover } = useContextualPopover();
  const { play } = useChoiceSound();
  const defaultStartId = startPageId || storyData?.startPageId || storyData?.pages?.[0]?.id;
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(defaultStartId);
  const [visitedPageIds, setVisitedPageIds] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, StoryVariable>>(storyData.variables || {});

  // Track visited pages and execute page actions

  useEffect(() => {
    if (currentPageId) {
      play();
      setVisitedPageIds(prev => {
        if (!prev.includes(currentPageId)) {
          return [...prev, currentPageId];
        }
        return prev;
      });
    }
  }, [currentPageId, play]);

  // Derive the current page from the state
  const currentPage = useMemo(() => {
    return storyData.pages.find((p) => p.id === currentPageId);
  }, [storyData, currentPageId]);

  // Execute actions on page load
  useEffect(() => {
    if (currentPage && currentPage.actions) {
      setVariables((currentVars) => {
        let nextVars = { ...currentVars };

        const actionContext = {
          variables: nextVars,
          setVariable: (key: string, value: unknown) => {
            const currentVar = nextVars[key];
            const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
            nextVars[key] = { type, value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value) };
          },
          postMessage: () => { }
        };

        const evalContext = {
          variables: nextVars,
          visitedPageIds,
          currentPageId,
        };

        currentPage.actions!.forEach(action => {
          if (action.conditionals && action.conditionals.length > 0) {
            // @ts-ignore - duck typing for evaluator which expects { conditionals: ... }
            if (!evaluateVisibility({ conditionals: action.conditionals }, evalContext)) {
              return;
            }
          }
          const blueprint = actionBlueprints[action.blueprintId];
          if (blueprint) {
            blueprint.execute(action.params, actionContext);
          }
        });

        return nextVars;
      });
    }
  }, [currentPage]); // Only run when currentPage object changes (i.e. we navigated)

  // Derive evaluated visible choices
  const visibleChoices = useMemo(() => {
    if (!currentPage || !currentPage.choices) return [];

    const context = {
      variables,
      visitedPageIds,
      currentPageId
    };

    return currentPage.choices.filter(choice => evaluateVisibility(choice, context));
  }, [currentPage, variables, visitedPageIds, currentPageId]);

  // Derive evaluated visible paragraphs
  const visibleParagraphs = useMemo(() => {
    if (!currentPage || !currentPage.paragraphs) return [];

    const context = {
      variables,
      visitedPageIds,
      currentPageId
    };

    return currentPage.paragraphs.filter(p => evaluateVisibility(p, context));
  }, [currentPage, variables, visitedPageIds, currentPageId]);

  const handleChoiceClick = (choiceId: string, targetPageId?: string) => {
    const choice = currentPage?.choices.find(c => c.id === choiceId);
    if (choice && choice.actions) {
      setVariables((currentVars) => {
        let nextVars = { ...currentVars };
        const actionContext = {
          variables: nextVars,
          setVariable: (key: string, value: unknown) => {
            const currentVar = nextVars[key];
            const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
            nextVars[key] = { type, value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value) };
          },
          postMessage: () => { }
        };
        const evalContext = { variables: nextVars, visitedPageIds, currentPageId };

        choice.actions!.forEach(action => {
          if (action.conditionals && action.conditionals.length > 0) {
            // @ts-ignore
            if (!evaluateVisibility({ conditionals: action.conditionals }, evalContext)) return;
          }
          const blueprint = actionBlueprints[action.blueprintId];
          if (blueprint) blueprint.execute(action.params, actionContext);
        });

        return nextVars;
      });
    }

    if (targetPageId) {
      setCurrentPageId(targetPageId);
    }
  };

  const handleRestart = () => {
    setVisitedPageIds([]);
    setCurrentPageId(defaultStartId);
    setVariables(storyData.variables || {});
  };



  if (!storyData || !storyData.pages || storyData.pages.length === 0) {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.errorCard}>
          <p>No story data available.</p>
        </Card>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.errorCard}>
          <p>Could not find page with ID: {currentPageId}</p>
          <Button onClick={handleRestart} className={styles.restartButton}>Restart Story</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Storyworld Engine</h1>
        {onExit && <Button variant="secondary" size="sm" onClick={onExit}>Exit Player</Button>}
      </header>

      <main className={styles.mainContent}>
        <div className={styles.storyContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <PlayerText
                title={currentPage.title}
                paragraphs={visibleParagraphs}
                variables={variables}
              />

              <PlayerChoices
                choices={visibleChoices}
                onChoiceClick={handleChoiceClick}
                onRestart={handleRestart}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <PlayerRightFrame />
      </main>

      <Popover
        isOpen={!!contextualPopover}
        onClose={() => setContextualPopover(null)}
        x={contextualPopover?.x || 0}
        y={contextualPopover?.y || 0}
        className={styles.popover}
      >
        <div className={styles.popoverDecorations} />
        <div className={styles.popoverArrow} />
        <p className={styles.popoverText}>{contextualPopover?.text}</p>
      </Popover>
    </div>
  );
};
