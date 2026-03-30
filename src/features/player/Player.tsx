import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Popover } from '../../components/ui/Popover/Popover';
import { useContextualPopover } from './hooks/useContextualPopover';
import { useChoiceSound } from './hooks/useChoiceSound';
import { useAtmosphere } from './hooks/useAtmosphere';
import { PlayerText } from './components/PlayerText';
import { PlayerChoices } from './components/PlayerChoices';
import { PlayerRightFrame } from './components/PlayerRightFrame';
import { usePlayerStore } from './store/usePlayerStore';
import { useCurrentPage } from './hooks/useStoryState';
import { usePageEnterEvents } from './hooks/usePageEnterEvents';
import { audioManager } from '../../lib/audioManager';
import { parseTextTokens } from '../../utils/textParser';
import type { StoryData } from '../../domain/Story/StoryData';
import { PageProvider } from './context/PageContext';
import './player-theme.css';
import styles from './Player.module.css';

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ storyData, startPageId, onExit }) => {
  const {
    currentPageId,
    initialize,
    addVisitedPageId,
    restart,
    contextualPopover,
    setContextualPopover,
    variables,
  } = usePlayerStore();

  const currentPage = useCurrentPage();
  const { play } = useChoiceSound();

  // Initialization: Wipe the store and load fresh data
  useEffect(() => {
    if (storyData) {
      initialize(storyData, startPageId);
    }
  }, [storyData, startPageId, initialize]);

  // Cleanup top-level audio on exit
  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, []);

  // Track visited pages and play entry sound
  useEffect(() => {
    if (currentPageId) {
      play();
      addVisitedPageId(currentPageId);
    }
  }, [currentPageId, play, addVisitedPageId]);

  // Handle atmosphere audio
  useAtmosphere();

  // Attach global click listener for contextual popovers
  useContextualPopover();

  // Execute actions on page entry
  usePageEnterEvents();

  const isTransitioning = usePlayerStore((s) => s.isTransitioning);

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
    if (currentPageId) {
      return (
        <div className={styles.container}>
          <Card padding="lg" className={styles.errorCard}>
            <p>Could not find page with ID: {currentPageId}</p>
            <Button onClick={restart} className={styles.restartButton}>Restart Story</Button>
          </Card>
        </div>
      );
    }
    return null;
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
              animate={{ opacity: isTransitioning ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              <PageProvider pageId={currentPageId}>
                <PlayerText />
                <PlayerChoices />
              </PageProvider>
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
        width={contextualPopover?.width || 0}
        height={contextualPopover?.height || 0}
        className={styles.popover}
      >
        <div className={styles.popoverDecorations} />
        <div className={styles.popoverArrow} />
        {contextualPopover?.title && (
          <h5 className={styles.popoverTitle}>
            {parseTextTokens(contextualPopover.title, variables)}
          </h5>
        )}
        {contextualPopover && (
          <div 
            className={styles.popoverText}
            dangerouslySetInnerHTML={{ 
              __html: parseTextTokens(contextualPopover.text, variables) 
            }}
          />
        )}
      </Popover>
    </div>
  );
};
