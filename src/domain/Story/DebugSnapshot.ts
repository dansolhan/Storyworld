import type { StoryVariable } from './Variable';

/**
 * A named freeze of everything the reader has accumulated, so an author can drop
 * back into "chapter three, poor and hated" without replaying to it.
 *
 * It deliberately holds no `currentPageId`. Where you stand is chosen in the
 * editor — "Play from here" — and baking it in would make every snapshot a
 * position as well as a state, which is the opposite of what makes them useful:
 * one saved state, tried against many pages.
 *
 * `visitedPageIds` is *not* an exception to that. Where you have been is a
 * condition source, read by `evaluateVisibility` on every paragraph and choice.
 * Leaving it out would restore a late-game state onto a reader the story thinks
 * has never been anywhere, and half the prose would vanish.
 */
export interface DebugSnapshot {
  id: string;
  name: string;
  /** Epoch ms, so the list can be ordered newest-first without a sort key. */
  createdAt: number;
  variables: Record<string, StoryVariable>;
  inventory: Record<string, number>;
  visitedPageIds: string[];
}
