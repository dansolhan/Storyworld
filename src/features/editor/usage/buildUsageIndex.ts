import type { Page } from '../../../domain/Page/Page';
import type { Atmosphere } from '../../../domain/Atmosphere/Atmosphere';
import type { Item } from '../../../domain/Item/Item';
import type { StatusData } from '../../../domain/Story/StatusData';
import type { LogicNode } from '../../../domain/Story/LogicNode';
import type { Action } from '../../../domain/Actions/Action';
import type { Conditional } from '../../../domain/Conditionals/Conditional';
import { variableTokensIn } from './variableTokens';
import {
  emptyUsageIndex,
  type UsageIndex,
  type UsageKind,
  type UsageRelationship,
} from './usageReference';

export interface UsageSources {
  pages: Record<string, Page>;
  items: Record<string, Item>;
  atmospheres: Record<string, Atmosphere>;
  statusData: StatusData[];
}

/**
 * Which blueprint tells us what. Keyed by blueprint id so a param named
 * `itemId` on some future blueprint does not silently become an item reference
 * with the wrong relationship.
 */
const BLUEPRINT_REFERENCES: Record<
  string,
  { kind: UsageKind; param: string; relationship: UsageRelationship }[]
> = {
  give_item: [{ kind: 'item', param: 'itemId', relationship: 'given' }],
  remove_item: [{ kind: 'item', param: 'itemId', relationship: 'taken away' }],
  has_item: [{ kind: 'item', param: 'itemId', relationship: 'condition' }],
  has_item_count: [{ kind: 'item', param: 'itemId', relationship: 'condition' }],
  set_variable: [{ kind: 'variable', param: 'variableKey', relationship: 'set' }],
  variable_equals: [{ kind: 'variable', param: 'variableKey', relationship: 'condition' }],
  play_sound: [{ kind: 'audio', param: 'soundId', relationship: 'plays' }],
  go_to_subplot: [{ kind: 'subplot', param: 'subplotId', relationship: 'crossing' }],
};

/**
 * Every reference from a story to the things it is built out of.
 *
 * One definition of "used", computed in a single pass: the Data workspace's
 * USED ON column, the detail panel's WHERE IT APPEARS list and Story Health's
 * UNUSED group all read this rather than each deciding for themselves.
 *
 * Indirect references count. An item mentioned only inside another item's
 * context choice is still in use, which is what an author means when asking
 * whether something is safe to delete.
 */
export const buildUsageIndex = ({ pages, items, atmospheres, statusData }: UsageSources): UsageIndex => {
  const index = emptyUsageIndex();
  // Distinct pages per entity, so `pageCount` does not double-count a page that
  // references the same thing twice.
  const pagesSeen: Record<UsageKind, Record<string, Set<string>>> = {
    item: {},
    variable: {},
    audio: {},
    atmosphere: {},
    subplot: {},
  };

  const add = (
    kind: UsageKind,
    id: string | undefined | null,
    relationship: UsageRelationship,
    page?: Page
  ): void => {
    if (!id) return;

    const bucket = (index[kind][id] ??= { references: [], pageCount: 0 });
    bucket.references.push({ pageId: page?.id, pageTitle: page?.title, relationship });

    if (!page) return;
    const seen = (pagesSeen[kind][id] ??= new Set());
    if (!seen.has(page.id)) {
      seen.add(page.id);
      bucket.pageCount += 1;
    }
  };

  const addFromParams = (
    blueprintId: string | undefined,
    params: Record<string, unknown> | undefined,
    page?: Page
  ): void => {
    if (!blueprintId) return;
    for (const spec of BLUEPRINT_REFERENCES[blueprintId] ?? []) {
      const value = params?.[spec.param];
      if (typeof value === 'string') add(spec.kind, value, spec.relationship, page);
    }
  };

  /** Logic trees nest arbitrarily deep through their branches. */
  const walkLogicTree = (nodes: LogicNode[] | undefined, page?: Page): void => {
    for (const node of nodes ?? []) {
      addFromParams(node.blueprintId, node.params, page);
      walkLogicTree(node.children, page);
    }
  };

  const walkLegacy = (
    actions: Action[] | undefined,
    conditionals: Conditional[] | undefined,
    page?: Page
  ): void => {
    for (const action of actions ?? []) {
      addFromParams(action.blueprintId, action.params, page);
      walkLegacy(undefined, action.conditionals, page);
    }
    for (const conditional of conditionals ?? []) {
      addFromParams(conditional.blueprintId, conditional.params, page);
      walkLegacy(undefined, conditional.children, page);
    }
  };

  for (const page of Object.values(pages)) {
    add('atmosphere', page.atmosphereId, 'atmosphere', page);
    add('subplot', page.subplotId, 'crossing', page);

    walkLegacy(page.actions, page.conditionals, page);
    for (const event of page.events ?? []) walkLogicTree(event.logicTree, page);

    for (const paragraph of page.paragraphs) {
      for (const name of variableTokensIn(paragraph.text)) {
        add('variable', name, 'printed', page);
      }
      walkLegacy(undefined, paragraph.conditionals, page);
      for (const event of paragraph.events ?? []) walkLogicTree(event.logicTree, page);
    }

    for (const choice of page.choices) {
      for (const name of variableTokensIn(choice.text)) {
        add('variable', name, 'printed', page);
      }
      walkLegacy(choice.actions, choice.conditionals, page);
      for (const event of choice.events ?? []) walkLogicTree(event.logicTree, page);
    }
  }

  // Story-level sites: no page, so they add a reference without a page count.
  for (const atmosphere of Object.values(atmospheres)) {
    add('audio', atmosphere.music, 'plays');
  }

  for (const entry of statusData) {
    for (const name of variableTokensIn(entry.value ?? '')) {
      add('variable', name, 'shown in status');
    }
    walkLegacy(undefined, entry.conditionals);
  }

  // Indirect: an item referenced only from another item's context choice.
  for (const item of Object.values(items)) {
    for (const choice of item.contextChoices ?? []) {
      for (const name of variableTokensIn(choice.text)) {
        add('variable', name, 'context choice');
      }
      walkLegacy(choice.actions, choice.conditionals);
    }
  }

  return index;
};
