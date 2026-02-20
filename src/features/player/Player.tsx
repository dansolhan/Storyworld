import React, { useState, useMemo, useEffect } from 'react';
import type { StoryData } from '../../domain/Story/StoryData';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { parseTextTokens } from '../../utils/textParser';
import styles from './Player.module.css';

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ storyData, startPageId, onExit }) => {
  const defaultStartId = startPageId || storyData.pages[0]?.id;
  const [currentPageId, setCurrentPageId] = useState<string | undefined>(defaultStartId);
  const [contextualPopover, setContextualPopover] = useState<{ text: string; x: number; y: number } | null>(null);

  // Derive the current page from the state
  const currentPage = useMemo(() => {
    return storyData.pages.find((p) => p.id === currentPageId);
  }, [storyData, currentPageId]);

  const handleChoiceClick = (targetPageId: string) => {
    setCurrentPageId(targetPageId);
  };

  const handleRestart = () => {
    setCurrentPageId(defaultStartId);
  };

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('contextual-text-mark')) {
        const text = target.getAttribute('data-context');
        if (text) {
          // Calculate a rough position right below the clicked word
          const rect = target.getBoundingClientRect();
          setContextualPopover({
            text,
            x: rect.left + rect.width / 2, // center horizontally
            y: rect.bottom + 8, // below the text
          });
        }
      } else {
        // Close popover if clicking anywhere else
        setContextualPopover(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

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
            {currentPage.paragraphs.map((p) => {
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
            {currentPage.choices && currentPage.choices.length > 0 ? (
              <div className={styles.choicesList}>
                {currentPage.choices.map((choice) => (
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

      {contextualPopover && (
        <div
          className={styles.popover}
          style={{
            left: `${contextualPopover.x}px`,
            top: `${contextualPopover.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.popoverArrow} />
          <p className={styles.popoverText}>{contextualPopover.text}</p>
        </div>
      )}
    </div>
  );
};
