import React, { useState, useMemo, useEffect } from 'react';
import type { StoryData } from '../../domain/Story/StoryData';
import type { StoryVariable } from '../../domain/Story/Variable';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Popover } from '../../components/ui/Popover/Popover';
import { parseTextTokens } from '../../utils/textParser';
import { useContextualPopover } from './hooks/useContextualPopover';
import { evaluateVisibility } from './conditionals/evaluator';
import { actionBlueprints } from '../../domain/Actions/registry';
import { motion, AnimatePresence } from 'motion/react';
import { useTicker } from './hooks/useTicker';
import styles from './Player.module.css';

const TypewriterParagraph: React.FC<{ html: string; isTicking: boolean; onComplete: () => void; skip: boolean; secondsToRender?: number }> = ({ html, isTicking, onComplete, skip, secondsToRender = 0.5 }) => {
  const { displayedText } = useTicker(html, secondsToRender, isTicking, skip, onComplete);
  return <div className={styles.paragraphText} dangerouslySetInnerHTML={{ __html: displayedText || '&nbsp;' }} />;
};

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ storyData, startPageId, onExit }) => {
  const { contextualPopover, setContextualPopover } = useContextualPopover();
  const defaultStartId = startPageId || storyData?.startPageId || storyData?.pages?.[0]?.id;
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(defaultStartId);
  const [visitedPageIds, setVisitedPageIds] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, StoryVariable>>(storyData.variables || {});

  const [tickingIndex, setTickingIndex] = useState(0);
  const [skipTicker, setSkipTicker] = useState(false);

  useEffect(() => {
    setTickingIndex(0);
    setSkipTicker(false);
  }, [currentPageId]);

  // Track visited pages and execute page actions

  useEffect(() => {
    if (currentPageId) {
      setVisitedPageIds(prev => {
        if (!prev.includes(currentPageId)) {
          return [...prev, currentPageId];
        }
        return prev;
      });
    }
  }, [currentPageId]);

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
    setTickingIndex(0);
    setSkipTicker(false);
    setCurrentPageId(defaultStartId);
    setVariables(storyData.variables || {});
  };

  const isTickerComplete = skipTicker || tickingIndex >= (visibleParagraphs.length || 0);



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
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            >
              <div
                className={styles.textContent}
                onClick={() => { if (!isTickerComplete) setSkipTicker(true); }}
                style={{ cursor: isTickerComplete ? 'default' : 'pointer' }}
              >
                <h2 className={styles.pageTitle}>{currentPage.title}</h2>

                <div className={styles.paragraphs}>
                  {visibleParagraphs.map((p, idx) => {
                    const parsedHtml = parseTextTokens(p.text, variables);
                    if (idx > tickingIndex && !skipTicker) return null;
                    return (
                      <TypewriterParagraph
                        key={p.id}
                        html={parsedHtml}
                        isTicking={idx === tickingIndex}
                        onComplete={() => {
                          if (idx === tickingIndex) setTickingIndex(idx + 1);
                        }}
                        skip={skipTicker}
                        secondsToRender={0}
                      />
                    );
                  })}
                </div>

              </div>

              {isTickerComplete && (
                <motion.div
                  className={styles.choicesContainer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {visibleChoices && visibleChoices.length > 0 ? (
                    <div className={styles.choicesList}>
                      {visibleChoices.map((choice) => (
                        <Button
                          key={choice.id}
                          variant="primary"
                          size="lg"
                          fullWidth
                          onClick={() => handleChoiceClick(choice.id, choice.targetPageId)}
                          className={styles.choiceButton}
                        >
                          {choice.text}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.endContainer}>
                      <p className={styles.endText}>You have reached the end of this path.</p>
                      <Button variant="secondary" size="lg" onClick={handleRestart}>
                        Restart Story
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.rightFrame}>
          {/* Empty for now */}
        </div>
      </main>

      <Popover
        isOpen={!!contextualPopover}
        onClose={() => setContextualPopover(null)}
        x={contextualPopover?.x || 0}
        y={contextualPopover?.y || 0}
        className={styles.popover}
      >
        <div className={styles.popoverArrow} />
        <p className={styles.popoverText}>{contextualPopover?.text}</p>
      </Popover>
    </div>
  );
};
