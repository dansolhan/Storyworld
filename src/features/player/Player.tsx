import React, { useState, useMemo, useEffect } from 'react';
import type { StoryData } from '../../domain/Story/StoryData';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Popover } from '../../components/ui/Popover/Popover';
import { parseTextTokens } from '../../utils/textParser';
import { useContextualPopover } from './hooks/useContextualPopover';
import { evaluateVisibility } from './conditionals/evaluator';
import styles from './Player.module.css';

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ storyData, startPageId, onExit }) => {
  const { contextualPopover, setContextualPopover } = useContextualPopover();
  const defaultStartId = startPageId || storyData?.pages?.[0]?.id;
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(defaultStartId);
  const [visitedPageIds, setVisitedPageIds] = useState<string[]>([]);

  // Track visited pages
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

  // Derive evaluated visible choices
  const visibleChoices = useMemo(() => {
    if (!currentPage || !currentPage.choices) return [];

    const context = {
      variables: storyData.variables || {},
      visitedPageIds,
      currentPageId
    };

    return currentPage.choices.filter(choice => evaluateVisibility(choice, context));
  }, [currentPage, storyData.variables, visitedPageIds, currentPageId]);

  // Derive evaluated visible paragraphs
  const visibleParagraphs = useMemo(() => {
    if (!currentPage || !currentPage.paragraphs) return [];

    const context = {
      variables: storyData.variables || {},
      visitedPageIds,
      currentPageId
    };

    return currentPage.paragraphs.filter(p => evaluateVisibility(p, context));
  }, [currentPage, storyData.variables, visitedPageIds, currentPageId]);

  const handleChoiceClick = (targetPageId: string) => {
    setCurrentPageId(targetPageId);
  };

  const handleRestart = () => {
    setVisitedPageIds([]);
    setCurrentPageId(defaultStartId);
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
        <Card padding="lg" className={styles.storyCard}>
          <h2 className={styles.pageTitle}>{currentPage.title}</h2>

          <div className={styles.paragraphs}>
            {visibleParagraphs.map((p) => {
              const parsedHtml = parseTextTokens(p.text, storyData.variables || {});
              return (
                <div
                  key={p.id}
                  className={styles.paragraphText}
                  dangerouslySetInnerHTML={{ __html: parsedHtml }}
                />
              );
            })}
          </div>

          <div className={styles.choicesContainer}>
            {visibleChoices && visibleChoices.length > 0 ? (
              <div className={styles.choicesList}>
                {visibleChoices.map((choice) => (
                  <Button
                    key={choice.id}
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => handleChoiceClick(choice.targetPageId)}
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
          </div>
        </Card>
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
