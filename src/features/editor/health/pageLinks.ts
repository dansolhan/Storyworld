import type { Page } from '../../../domain/Page/Page';
import type { Item } from '../../../domain/Item/Item';
import type { Action } from '../../../domain/Actions/Action';
import type { LogicNode } from '../../../domain/Story/LogicNode';

/** The only action that moves the reader of its own accord. */
const NAVIGATE_BLUEPRINT = 'go_to_subplot';
const END_BLUEPRINT = 'end_story';

const stringParam = (params: Record<string, unknown> | undefined, key: string): string | undefined => {
  const value = params?.[key];
  return typeof value === 'string' ? value : undefined;
};

/**
 * Every blueprint invocation attached to a page, however it is attached.
 *
 * Logic trees nest through their branches, and actions can carry legacy nested
 * conditionals, so both are walked to the bottom. Missing one is how a check
 * ends up reporting a page as unreachable when a rule three branches deep goes
 * straight to it.
 */
const walkInvocations = (
  visit: (blueprintId: string | undefined, params: Record<string, unknown> | undefined) => void,
  logicTrees: (LogicNode[] | undefined)[],
  actions: (Action[] | undefined)[]
): void => {
  const walkTree = (nodes: LogicNode[] | undefined): void => {
    for (const node of nodes ?? []) {
      visit(node.blueprintId, node.params);
      walkTree(node.children);
    }
  };
  const walkActions = (list: Action[] | undefined): void => {
    for (const action of list ?? []) {
      visit(action.blueprintId, action.params);
      for (const conditional of action.conditionals ?? []) visit(conditional.blueprintId, conditional.params);
    }
  };

  for (const tree of logicTrees) walkTree(tree);
  for (const list of actions) walkActions(list);
};

/** Every logic tree and action list a page carries, at any depth of ownership. */
const invocationsOf = (page: Page, visit: Parameters<typeof walkInvocations>[0]): void => {
  walkInvocations(
    visit,
    [
      ...(page.events ?? []).map((event) => event.logicTree),
      ...page.paragraphs.flatMap((paragraph) => (paragraph.events ?? []).map((event) => event.logicTree)),
      ...page.choices.flatMap((choice) => (choice.events ?? []).map((event) => event.logicTree)),
    ],
    [page.actions, ...page.choices.map((choice) => choice.actions)]
  );
};

export interface PageGraph {
  /** Page ids each page can send the reader to. */
  outgoing: Record<string, Set<string>>;
  /** Pages reachable from anywhere, because an item carrying the jump can be too. */
  floatingTargets: Set<string>;
  /** Pages carrying an `end_story` rule, which records data on the way out. */
  recordsOnEnd: Set<string>;
  /** Targets named by a choice that no page answers to. */
  danglingTargets: { pageId: string; choiceId: string; choiceText: string; targetPageId: string }[];
}

/**
 * The story's shape, as the engine would walk it.
 *
 * Two things move a reader: a choice's `targetPageId`, and the `go_to_subplot`
 * action. Anything else — posting a message, setting a variable — leaves them
 * where they are, so it contributes no edge.
 */
export const buildPageGraph = (pages: Record<string, Page>, items: Record<string, Item>): PageGraph => {
  const graph: PageGraph = {
    outgoing: {},
    floatingTargets: new Set(),
    recordsOnEnd: new Set(),
    danglingTargets: [],
  };

  for (const page of Object.values(pages)) {
    const out = (graph.outgoing[page.id] ??= new Set());

    for (const choice of page.choices) {
      if (!choice.targetPageId) continue;
      if (pages[choice.targetPageId]) {
        out.add(choice.targetPageId);
      } else {
        graph.danglingTargets.push({
          pageId: page.id,
          choiceId: choice.id,
          choiceText: choice.text,
          targetPageId: choice.targetPageId,
        });
      }
    }

    invocationsOf(page, (blueprintId, params) => {
      if (blueprintId === END_BLUEPRINT) graph.recordsOnEnd.add(page.id);
      if (blueprintId !== NAVIGATE_BLUEPRINT) return;
      const target = stringParam(params, 'targetPageId');
      if (target && pages[target]) out.add(target);
    });
  }

  /*
   * A context choice on an item travels with the item, so a jump inside one can
   * fire from wherever the reader is carrying it. Treating those targets as
   * reachable from anywhere is the conservative reading, and being conservative
   * is the right bias: a false "unreachable" costs an author's trust in the
   * whole screen, while a missed one costs nothing.
   */
  for (const item of Object.values(items ?? {})) {
    for (const choice of item.contextChoices ?? []) {
      walkInvocations(
        (blueprintId, params) => {
          if (blueprintId !== NAVIGATE_BLUEPRINT) return;
          const target = stringParam(params, 'targetPageId');
          if (target && pages[target]) graph.floatingTargets.add(target);
        },
        [],
        [choice.actions]
      );
    }
  }

  return graph;
};

/** Pages a reader can actually arrive at, walked forward from the start. */
export const reachableFrom = (startPageId: string, graph: PageGraph): Set<string> => {
  const seen = new Set<string>();
  const queue = [startPageId, ...graph.floatingTargets];

  while (queue.length > 0) {
    const pageId = queue.pop()!;
    if (seen.has(pageId)) continue;
    seen.add(pageId);
    for (const next of graph.outgoing[pageId] ?? []) queue.push(next);
  }

  return seen;
};
