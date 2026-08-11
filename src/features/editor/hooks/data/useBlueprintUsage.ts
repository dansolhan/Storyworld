import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import type { Page } from '../../../../domain/Page/Page';

/**
 * How many times each blueprint is used in this story, keyed by blueprint id.
 *
 * The rule picker shows it — "used 14 times in this story" — so the rules a
 * story already leans on surface first. Separate from the entity usage index:
 * that answers "what points at this item", this answers "what does this story
 * build its logic out of".
 */
export const useBlueprintUsage = (): Record<string, number> => {
  const { pages, items, statusData } = useEditorStore(
    useShallow((state) => ({
      pages: state.pages,
      items: state.items,
      statusData: state.statusData,
    }))
  );

  return useMemo(() => {
    const counts: Record<string, number> = {};

    const count = (blueprintId: string | undefined) => {
      if (blueprintId) counts[blueprintId] = (counts[blueprintId] ?? 0) + 1;
    };

    const walkTree = (nodes: LogicNode[] | undefined): void => {
      for (const node of nodes ?? []) {
        // Branch nodes carry no blueprint; only actions and conditions do.
        if (node.type === 'action' || node.type === 'condition') count(node.blueprintId);
        walkTree(node.children);
      }
    };

    const walkEvents = (owner: { events?: { logicTree: LogicNode[] }[] } | undefined): void => {
      for (const event of owner?.events ?? []) walkTree(event.logicTree);
    };

    for (const page of Object.values((pages ?? {}) as Record<string, Page>)) {
      walkEvents(page);
      page.paragraphs.forEach(walkEvents);
      page.choices.forEach(walkEvents);
    }

    for (const item of Object.values(items ?? {})) {
      for (const choice of item.contextChoices ?? []) {
        for (const action of choice.actions ?? []) count(action.blueprintId);
        for (const conditional of choice.conditionals ?? []) count(conditional.blueprintId);
      }
    }

    for (const entry of statusData ?? []) {
      for (const conditional of entry.conditionals ?? []) count(conditional.blueprintId);
    }

    return counts;
  }, [pages, items, statusData]);
};
