import React from 'react';
import { relativeTime } from '../../../utils/relativeTime';
import { storyMetaLine } from '../storyMetaLine';
import { upgradedFrom } from '../upgradedFrom';
import type { StorySummary } from '../storySummary';
import styles from './StoryRow.module.css';

export interface StoryRowProps {
  story: StorySummary;
  onOpen: (id: string) => void;
  onPlay: (id: string) => void;
  onDelete: (story: StorySummary) => void;
  /** Offered only when a schema upgrade left a pre-upgrade copy. */
  onRevert: (story: StorySummary) => void;
}

/**
 * One story on the shelf.
 *
 * A row rather than a card, per the design: the counts are the reason to choose
 * between two stories, and a grid of cards pushes them into a corner. Play and
 * Open sit together on the right — the two things you actually came to do.
 */
export const StoryRow: React.FC<StoryRowProps> = ({ story, onOpen, onPlay, onDelete, onRevert }) => (
  <article className={styles.row}>
    <div className={styles.detail}>
      <h2 className={styles.title}>{story.title}</h2>

      {story.description ? (
        <p className={styles.description}>{story.description}</p>
      ) : (
        <p className={styles.noDescription}>No description yet.</p>
      )}

      <p className={styles.meta}>
        {storyMetaLine(story).map((part) => (
          <span
            key={part}
            className={styles.metaPart}
            /* The one figure worth the accent is the one asking to be dealt with. */
            data-problem={story.problemCount > 0 && part.endsWith('to fix') ? 'true' : undefined}
          >
            {part}
          </span>
        ))}
      </p>
    </div>

    {/*
      Only after an upgrade, and stated plainly: an upgrade is the one edit an author
      never asked for, so the way back belongs where they can see it before opening the
      story rather than buried inside it.
    */}
    {story.backup && (
      <button type="button" className={styles.revert} onClick={() => onRevert(story)}>
        Upgraded from {upgradedFrom(story.backup.fromVersion)}{' '}
        {relativeTime(story.backup.takenAt)} · Revert
      </button>
    )}

    <div className={styles.actions}>
      <button type="button" className={styles.delete} onClick={() => onDelete(story)}>
        Delete
      </button>
      <button type="button" className={styles.play} onClick={() => onPlay(story.id)}>
        Play
      </button>
      <button type="button" className={styles.open} onClick={() => onOpen(story.id)}>
        Open
      </button>
    </div>
  </article>
);
