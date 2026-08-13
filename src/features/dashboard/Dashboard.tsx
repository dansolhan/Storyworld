import React, { useState } from 'react';
import { useStories } from './hooks/useStories';
import { StoryRow } from './components/StoryRow';
import { EmptyShelf } from './components/EmptyShelf';
import { DeleteStoryDialog } from './components/DeleteStoryDialog';
import type { StorySummary } from './storySummary';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  /** Hands the loaded story to the editor. */
  onOpenStory: () => void;
  /** Hands the loaded story straight to the player, from its own start page. */
  onPlayStory: () => void;
  onImportClick: () => void;
}

/**
 * The shelf: every story in this browser, most recently edited first.
 *
 * Rows, not cards — the counts are what you choose between two drafts on, and a
 * card grid pushes them into a corner. Everything shown is derived from each
 * story's saved snapshot, including "things to fix", which comes from the same
 * report the Story health screen reads.
 */
export const Dashboard: React.FC<DashboardProps> = ({ onOpenStory, onPlayStory, onImportClick }) => {
  const { stories, handleCreateNew, handleLoadDemo, handleOpenExisting, handleDelete } = useStories();
  const [pendingDelete, setPendingDelete] = useState<StorySummary | null>(null);

  const createNew = () => handleCreateNew(onOpenStory);
  const loadDemo = () => handleLoadDemo(onOpenStory);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.wordmark}>Storyworld</h1>

        {stories.length > 0 && (
          <div className={styles.actions}>
            <button type="button" className={styles.link} onClick={loadDemo}>
              Load the demo
            </button>
            <button type="button" className={styles.link} onClick={onImportClick}>
              Import a file
            </button>
            <button type="button" className={styles.primary} onClick={createNew}>
              + New story
            </button>
          </div>
        )}
      </header>

      {stories.length === 0 ? (
        <EmptyShelf onCreateNew={createNew} onLoadDemo={loadDemo} onImport={onImportClick} />
      ) : (
        <div className={styles.shelf}>
          {stories.map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              onOpen={(id) => handleOpenExisting(id, onOpenStory)}
              /*
               * Loading is the same path as opening; only what happens afterwards
               * differs, so the player arrives with the story already in the store
               * and leaving it lands you in that story's editor.
               */
              onPlay={(id) => handleOpenExisting(id, onPlayStory)}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <DeleteStoryDialog
        story={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(id) => {
          setPendingDelete(null);
          void handleDelete(id);
        }}
      />
    </div>
  );
};
