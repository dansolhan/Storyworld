import type { DebugSnapshot } from './DebugSnapshot';
import type { StoryData } from './StoryData';
import { assignVariableValue, type StoryVariable } from './Variable';

/** What a snapshot still refers to, and what the story has since dropped. */
export interface ReconciledSnapshot {
  variables: Record<string, StoryVariable>;
  inventory: Record<string, number>;
  visitedPageIds: string[];
  /** Keys the snapshot carried that the story no longer defines. */
  dropped: {
    variables: string[];
    items: string[];
    pages: string[];
  };
}

/**
 * Fits a saved snapshot to the story as it stands now.
 *
 * Snapshots go stale by nature: they are taken while the story is being written,
 * and the next hour's work renames a variable or deletes a page. Throwing on a
 * dead key would make every snapshot a one-session thing, so this applies what
 * still exists and reports the rest for the console to show.
 *
 * Variables start from the story's own declarations rather than from the
 * snapshot, so a variable *added* after the snapshot was taken arrives at its
 * authored default instead of missing entirely — an undefined variable reads as
 * nothing in every condition, which would silently gate content the author had
 * just written.
 */
export const reconcileSnapshot = (
  snapshot: DebugSnapshot,
  story: StoryData
): ReconciledSnapshot => {
  const declared = story.variables ?? {};
  const variables: Record<string, StoryVariable> = {};
  for (const [key, variable] of Object.entries(declared)) {
    variables[key] = { ...variable };
  }

  const droppedVariables: string[] = [];
  for (const [key, saved] of Object.entries(snapshot.variables ?? {})) {
    if (!(key in declared)) {
      droppedVariables.push(key);
      continue;
    }
    // The declaration owns the type and tags; the snapshot only supplies a value.
    variables[key] = assignVariableValue(declared[key], saved.value);
  }

  const knownItems = story.items ?? {};
  const inventory: Record<string, number> = {};
  const droppedItems: string[] = [];
  for (const [itemId, count] of Object.entries(snapshot.inventory ?? {})) {
    if (!(itemId in knownItems)) {
      droppedItems.push(itemId);
      continue;
    }
    if (count > 0) inventory[itemId] = count;
  }

  const knownPages = new Set((story.pages ?? []).map((page) => page.id));
  const visitedPageIds: string[] = [];
  const droppedPages: string[] = [];
  for (const pageId of snapshot.visitedPageIds ?? []) {
    if (knownPages.has(pageId)) visitedPageIds.push(pageId);
    else droppedPages.push(pageId);
  }

  return {
    variables,
    inventory,
    visitedPageIds,
    dropped: {
      variables: droppedVariables,
      items: droppedItems,
      pages: droppedPages,
    },
  };
};

/** Freezes the live runtime state under a name. Position is deliberately absent. */
export const captureSnapshot = (
  name: string,
  state: {
    variables: Record<string, StoryVariable>;
    inventory: Record<string, number>;
    visitedPageIds: string[];
  }
): DebugSnapshot => ({
  id: crypto.randomUUID(),
  name,
  createdAt: Date.now(),
  variables: structuredClone(state.variables),
  inventory: { ...state.inventory },
  visitedPageIds: [...state.visitedPageIds],
});
