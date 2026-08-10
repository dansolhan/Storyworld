import { KIND_HEADINGS, KIND_ORDER, type SearchEntryKind } from './searchEntry';
import type { SearchMatch } from './matchEntries';
import type { PaletteAction } from './paletteAction';

/** Rows shown per group before the footer starts saying "n of N shown". */
export const GROUP_CAP = 8;

export type PaletteRow =
  | { type: 'entry'; id: string; match: SearchMatch }
  | { type: 'action'; id: string; action: PaletteAction };

export interface PaletteGroup {
  heading: string;
  rows: PaletteRow[];
  /** Count before capping, so the footer can report what was left out. */
  total: number;
}

/**
 * Groups matches and actions into the order the design draws — pages, the
 * choices that wire them, prose, then actions.
 *
 * The order is the same whether or not a query has been typed. An empty palette
 * is mostly a page switcher, so the first row wants to be a page: `⏎` then goes
 * somewhere useful, while `⌘⏎` still reaches the actions.
 */
export const buildPaletteGroups = (
  matches: SearchMatch[],
  actions: PaletteAction[]
): PaletteGroup[] => {
  const groups: PaletteGroup[] = [];

  const byKind = new Map<SearchEntryKind, SearchMatch[]>();
  for (const match of matches) {
    const bucket = byKind.get(match.entry.kind);
    if (bucket) bucket.push(match);
    else byKind.set(match.entry.kind, [match]);
  }

  for (const kind of KIND_ORDER) {
    const found = byKind.get(kind);
    if (!found?.length) continue;
    groups.push({
      heading: KIND_HEADINGS[kind],
      total: found.length,
      rows: found.slice(0, GROUP_CAP).map((match) => ({
        type: 'entry' as const,
        id: match.entry.id,
        match,
      })),
    });
  }

  if (actions.length) {
    groups.push({
      heading: 'Actions',
      total: actions.length,
      rows: actions.slice(0, GROUP_CAP).map((action) => ({
        type: 'action' as const,
        id: action.id,
        action,
      })),
    });
  }

  return groups;
};

export const flattenRows = (groups: PaletteGroup[]): PaletteRow[] =>
  groups.flatMap((group) => group.rows);

/** The row `⌘⏎` fires: the first action, whatever is highlighted. */
export const firstAction = (actions: PaletteAction[]): PaletteAction | undefined => actions[0];
