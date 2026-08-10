import { useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useEditorLayoutActions } from '../core/useEditorLayoutActions';
import { RAIL_SECTIONS } from '../../components/EditorShell/railConfig';
import { paletteAction, type PaletteAction } from '../../search/paletteAction';
import { matchPosition, queryTerms } from '../../search/matchEntries';
import { nextPagePosition } from '../../utils/nextPagePosition';
import type { MenuConfig } from '../../../../config/menuConfig';
import type { RevealPage } from '../view/useRevealPage';

export interface PaletteActionsOptions {
  query: string;
  /** File / Story groups, so their commands are reachable by typing. */
  menus: MenuConfig[];
  revealPage: RevealPage;
}

/**
 * The ACTIONS group.
 *
 * Three sources: creating a page from whatever was typed, jumping to any rail
 * workspace, and the commands behind the wordmark. The create action is always
 * first when the query is non-empty — that is the row `⌘⏎` fires.
 */
export const usePaletteActions = ({ query, menus, revealPage }: PaletteActionsOptions): PaletteAction[] => {
  const { addPage } = useEditorLayoutActions();
  const trimmedQuery = query.trim();

  return useMemo(() => {
    const actions: PaletteAction[] = [];

    for (const section of RAIL_SECTIONS) {
      for (const item of section.items) {
        actions.push(
          paletteAction(`workspace:${item.workspace}`, `Go to ${item.label}`, () =>
            useEditorStore.getState().setActiveWorkspace(item.workspace)
          )
        );
      }
    }

    for (const menu of menus) {
      for (const item of menu.items) {
        if (item.divider || !item.label || !item.onClick) continue;
        const { label, onClick } = item;
        actions.push(paletteAction(`menu:${menu.label}:${label}`, label, onClick));
      }
    }

    const terms = queryTerms(trimmedQuery);
    const matched = actions
      .map((action) => ({ action, position: matchPosition(action.haystack, terms) }))
      .filter(({ position }) => position !== -1)
      .sort((a, b) => a.position - b.position || a.action.label.localeCompare(b.action.label))
      .map(({ action }) => action);

    if (!trimmedQuery) return matched;

    /*
     * Creating a page comes last, not first.
     *
     * `⌘⏎` fires the first action, so putting create at the top would make every
     * other command unreachable by keyboard — typing "export json" would create
     * a page called "export json". Last still means first whenever nothing else
     * matches, which is exactly the case the shortcut is advertised for.
     */
    return [
      ...matched,
      paletteAction(`create:${trimmedQuery}`, `New page “${trimmedQuery}”`, () => {
        const { updatePageTitle, nodes, selectedPageId } = useEditorStore.getState();
        const { x, y } = nextPagePosition(nodes, selectedPageId);
        const pageId = addPage(x, y);
        updatePageTitle(pageId, trimmedQuery);
        revealPage({ pageId }, 'write');
      }),
    ];
  }, [trimmedQuery, menus, addPage, revealPage]);
};
