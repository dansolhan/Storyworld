import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../../components/ui/Card/Card';
import { Popover } from '../../components/ui/Popover/Popover';
import { useContextualPopover } from './hooks/useContextualPopover';
import { useEngine } from './adapter/useEngine';
import { useEngineStore } from './adapter/useEngineStore';
import { EngineProvider } from './adapter/EngineProvider';
import { usePlayerUIStore } from './adapter/usePlayerUI';
import { useEngineEffects } from './adapter/useEngineEffects';
import { parseTextTokens } from '../../utils/textParser';
import type { StoryData } from '../../domain/Story/StoryData';
import { migrateStory } from '../../domain/Story/migrations/migrations';
import { PageRenderer } from './components/PageRenderer';
import { ChoiceRenderer } from './components/ChoiceRenderer';
import { PlayerRightFrame } from './components/PlayerRightFrame';
import './player-theme.css';
import styles from './Player.module.css';

export interface PlayerProps {
  storyData: StoryData;
  startPageId?: string;
  onExit?: () => void;
  onStoryEnd?: (data: Record<string, unknown>) => void;
}

const PlayerContent: React.FC<PlayerProps> = ({ storyData, startPageId, onExit, onStoryEnd }) => {
  const engine = useEngine();
  const currentPageId = useEngineStore((s) => s.currentPageId);
  const variables = useEngineStore((s) => s.variables);
  const isTransitioning = usePlayerUIStore((s) => s.isTransitioning);
  const contextualPopover = usePlayerUIStore((s) => s.contextualPopover);
  const setContextualPopover = usePlayerUIStore((s) => s.setContextualPopover);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Adapters for side-effects and global listeners (register them BEFORE initialization)
  useEngineEffects({ onStoryEnd });
  useContextualPopover();

  // Initialize engine: Wipe and load fresh data
  useEffect(() => {
    if (storyData) {
      const migratedData = migrateStory(storyData);
      engine.dispatch({ type: 'INITIALIZE', payload: { storyData: migratedData, startPageId } });
    }
  }, [storyData, startPageId, engine]);

  if (!storyData || !storyData.pages || storyData.pages.length === 0) {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.errorCard}>
          <p>No story data available.</p>
        </Card>
      </div>
    );
  }

  if (!currentPageId) return null;

  return (
    <div className={styles.container}>
      {/*
        The 2c "open book": the desk, then a volume lying on it — story on the
        recto, the reader's ledger on the verso, a gutter down the middle. There is
        no header bar; the story's own title is the kicker at the head of the page.
      */}
      <main className={styles.book}>
        <div className={styles.recto}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageId}
              initial={{ opacity: 0 }}
              animate={{ opacity: isTransitioning ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.leaf}
            >
              <PageRenderer pageId={currentPageId} />
              <ChoiceRenderer pageId={currentPageId} onExit={onExit} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.gutter} aria-hidden="true" />

        <PlayerRightFrame onExit={onExit} />
      </main>

      <Popover
        isOpen={!!contextualPopover}
        onClose={() => setContextualPopover(null)}
        x={contextualPopover?.x || 0}
        y={contextualPopover?.y || 0}
        width={contextualPopover?.width || 0}
        height={contextualPopover?.height || 0}
        className={styles.popover}
        arrowRef={arrowRef}
      >
        <div className={styles.popoverDecorations} />
        <div ref={arrowRef} className={styles.popoverArrow} />
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
                .replace(/<\/p>\n/g, '</p>')
                .replace(/<br\s*\/?>\n/g, '<br>')
                .replace(/\n/g, '<br />')
            }}
          />
        )}
      </Popover>
    </div>
  );
};

export const Player: React.FC<PlayerProps> = (props) => (
  <EngineProvider>
    <PlayerContent {...props} />
  </EngineProvider>
);
