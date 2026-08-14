import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useDeletePages } from '../../hooks/page/useDeletePages';
import { subplotColour } from '../../../../domain/Story/subplotColour';
import styles from './CanvasContextMenu.module.css';

/** Where the menu was opened, and on what. */
export type CanvasMenuTarget =
  | { kind: 'node'; pageId: string }
  /** The empty canvas, with the click in flow coordinates so a page lands under it. */
  | { kind: 'pane'; flowPosition: { x: number; y: number } };

export interface CanvasContextMenuProps {
  x: number;
  y: number;
  target: CanvasMenuTarget;
  onClose: () => void;
  onPlayFromPage: (pageId: string) => void;
}

/**
 * The canvas's right-click menu.
 *
 * One controlled menu driven by React Flow's own `onNodeContextMenu` and
 * `onPaneContextMenu`, rather than a Radix trigger wrapped round each node: nesting a
 * pane trigger and a node trigger would leave which one opens up to event order. The
 * cursor is the anchor, so the trigger is a zero-size element placed at the click.
 *
 * Built on the dropdown primitive already in the app, which brings keyboard
 * navigation, Escape, submenus and focus return with it.
 */
export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  target,
  onClose,
  onPlayFromPage,
}) => {
  const { pages, subplots, addPage, duplicatePage, updatePageSubplot, setStartPageId, startPageId } =
    useEditorStore(
      useShallow((state) => ({
        pages: state.pages,
        subplots: state.subplots,
        addPage: state.addPage,
        duplicatePage: state.duplicatePage,
        updatePageSubplot: state.updatePageSubplot,
        setStartPageId: state.setStartPageId,
        startPageId: state.startPageId,
      }))
    );
  const { deletePages } = useDeletePages();

  const page = target.kind === 'node' ? pages[target.pageId] : undefined;
  const isStartPage = page !== undefined && startPageId === page.id;

  const plots = [
    { id: undefined as string | undefined, name: 'Main Plot' },
    ...(subplots ?? []).map((subplot) => ({ id: subplot.id, name: subplot.name })),
  ];

  return (
    <DropdownMenu.Root open onOpenChange={(open) => (open ? undefined : onClose())}>
      {/* The click point, as the thing the menu hangs from. */}
      <DropdownMenu.Trigger asChild>
        <span className={styles.anchor} style={{ left: x, top: y }} aria-hidden="true" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.menu} align="start" side="bottom" sideOffset={2}>
          {target.kind === 'pane' && (
            <DropdownMenu.Item
              className={styles.item}
              onSelect={() => addPage(target.flowPosition.x, target.flowPosition.y)}
            >
              Add a page here
            </DropdownMenu.Item>
          )}

          {page && (
            <>
              <DropdownMenu.Item className={styles.item} onSelect={() => onPlayFromPage(page.id)}>
                Play from here
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className={styles.item}
                onSelect={() => setStartPageId(isStartPage ? null : page.id)}
              >
                {isStartPage ? 'No longer the start' : 'Start the story here'}
              </DropdownMenu.Item>

              <DropdownMenu.Separator className={styles.separator} />

              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className={styles.item}>
                  Move to plot
                  <span className={styles.more}>›</span>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className={styles.menu} sideOffset={2}>
                    {plots.map((plot) => (
                      <DropdownMenu.Item
                        key={plot.id ?? 'main'}
                        className={styles.item}
                        disabled={(page.subplotId ?? undefined) === plot.id}
                        onSelect={() => updatePageSubplot(page.id, plot.id)}
                      >
                        <span
                          className={styles.dot}
                          style={{ backgroundColor: subplotColour(subplots ?? [], plot.id ?? null) }}
                          aria-hidden="true"
                        />
                        {plot.name}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>

              <DropdownMenu.Item className={styles.item} onSelect={() => duplicatePage(page.id)}>
                Duplicate this page
              </DropdownMenu.Item>

              <DropdownMenu.Separator className={styles.separator} />

              <DropdownMenu.Item
                className={styles.item}
                data-danger="true"
                onSelect={() => deletePages([page.id])}
              >
                Delete this page
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
