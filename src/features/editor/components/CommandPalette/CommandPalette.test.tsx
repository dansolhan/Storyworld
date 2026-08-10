// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { CommandPalette } from './CommandPalette';
import { useEditorStore } from '../../store/useEditorStore';
import type { MenuConfig } from '../../../../config/menuConfig';
import type { Page } from '../../../../domain/Page/Page';

const pristineState = useEditorStore.getState();

const PAGES: Record<string, Page> = {
  'page-1': {
    id: 'page-1',
    title: 'The Forgotten Shrine',
    paragraphs: [
      { id: 'para-1', text: '<p>The <strong>shrine</strong> is older than the forest around it.</p>' },
    ],
    choices: [{ id: 'choice-1', text: 'Examine the shrine' }],
  },
  'page-2': { id: 'page-2', title: 'Deep into the Woods', paragraphs: [], choices: [] },
};

const exportJson = vi.fn();
const MENUS: MenuConfig[] = [
  { label: 'File', items: [{ label: 'Save / Export to JSON', onClick: exportJson }, { divider: true }] },
];

const openPalette = () => {
  render(
    <ReactFlowProvider>
      <CommandPalette menus={MENUS} />
    </ReactFlowProvider>
  );
};

const rowsIn = (heading: string) => {
  const group = screen.getByRole('heading', { name: new RegExp(heading, 'i') }).closest('section');
  return within(group as HTMLElement).getAllByRole('option');
};

describe('CommandPalette', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    useEditorStore.setState({ pages: PAGES, storyTitle: 'The Awakening' });
    useEditorStore.getState().setOpenDialog('palette');
    exportJson.mockClear();
  });

  afterEach(cleanup);

  it('renders nothing while closed', () => {
    useEditorStore.getState().setOpenDialog(null);
    openPalette();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('opens as a page switcher, with actions available', () => {
    openPalette();

    expect(rowsIn('Pages')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /Actions/i })).toBeTruthy();
    // No query yet, so there is nothing to create.
    expect(screen.queryByText(/New page/)).toBeNull();
  });

  it('lists pages alphabetically and highlights the first', () => {
    openPalette();
    const rows = rowsIn('Pages');

    expect(rows.map((row) => row.textContent)).toEqual([
      'Deep into the Woodsjump to page',
      'The Forgotten Shrinejump to page',
    ]);
    expect(rows[0].getAttribute('aria-selected')).toBe('true');
  });

  it('does not list prose or choices until something is typed', () => {
    openPalette();
    expect(screen.queryByRole('heading', { name: /In text/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /Choices/i })).toBeNull();
  });

  it('filters into pages, choices and prose', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'shrine');

    expect(rowsIn('Pages')).toHaveLength(1);
    expect(rowsIn('Choices')[0].textContent).toContain('Examine the shrine');
    expect(rowsIn('In text')[0].textContent).toContain('older than the forest');
  });

  it('says where a prose hit lives', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'older than');

    expect(screen.getByText('The Forgotten Shrine · paragraph 1')).toBeTruthy();
  });

  it('offers to create a page from a query that matches nothing', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'Cellar Door');

    expect(screen.getByText('New page “Cellar Door”')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /^Pages$/i })).toBeNull();
  });

  it('puts creating a page after any command that matched', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'export json');

    // Create last, so ⌘⏎ can still reach a real command.
    expect(rowsIn('Actions').map((row) => row.textContent)).toEqual([
      'Save / Export to JSONCtrl ⏎',
      'New page “export json”',
    ]);
  });

  it('moves the highlight with the arrow keys, wrapping at the ends', async () => {
    const user = userEvent.setup();
    openPalette();
    const input = screen.getByRole('combobox');

    await user.type(input, '{ArrowDown}');
    expect(rowsIn('Pages')[1].getAttribute('aria-selected')).toBe('true');

    await user.type(input, '{ArrowUp}');
    expect(rowsIn('Pages')[0].getAttribute('aria-selected')).toBe('true');

    await user.type(input, '{ArrowUp}');
    // Wrapped to the last row, which is an action.
    expect(rowsIn('Pages')[0].getAttribute('aria-selected')).toBe('false');
  });

  it('resets the highlight when the query changes', async () => {
    const user = userEvent.setup();
    openPalette();
    const input = screen.getByRole('combobox');

    await user.type(input, '{ArrowDown}');
    await user.type(input, 'woods');

    expect(rowsIn('Pages')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('Enter opens the highlighted row and closes', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'woods{Enter}');

    expect(useEditorStore.getState().selectedPageId).toBe('page-2');
    expect(useEditorStore.getState().openDialog).toBeNull();
  });

  it('Enter on a prose row opens the Write tab and asks for that paragraph', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'older than{Enter}');

    const state = useEditorStore.getState();
    expect(state.selectedPageId).toBe('page-1');
    expect(state.inspectorTab).toBe('write');
    expect(state.revealRequest).toEqual({
      pageId: 'page-1',
      paragraphId: 'para-1',
      choiceId: undefined,
    });
  });

  it('Enter on a choice row opens the Choices tab and asks for that choice', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'examine{Enter}');

    const state = useEditorStore.getState();
    expect(state.inspectorTab).toBe('choices');
    expect(state.revealRequest?.choiceId).toBe('choice-1');
  });

  it('Ctrl+Enter runs the first action even while a page is highlighted', async () => {
    const user = userEvent.setup();
    openPalette();
    const input = screen.getByRole('combobox');

    await user.type(input, 'Cellar Door');
    expect(screen.queryByRole('heading', { name: /^Pages$/i })).toBeNull();

    await user.keyboard('{Control>}{Enter}{/Control}');

    const state = useEditorStore.getState();
    const created = Object.values(state.pages).find((page) => page.title === 'Cellar Door');
    expect(created).toBeDefined();
    expect(state.openDialog).toBeNull();
  });

  it('finds a wordmark command by name and runs it', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'export json');
    const [row] = rowsIn('Actions');
    expect(row.textContent).toContain('Save / Export to JSON');

    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(exportJson).toHaveBeenCalledTimes(1);
  });

  it('offers rail navigation as an action', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'go to variables');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(useEditorStore.getState().activeWorkspace).toBe('variables');
  });

  it('says so plainly when a query matches nothing but the create action', async () => {
    const user = userEvent.setup();
    openPalette();

    await user.type(screen.getByRole('combobox'), 'zzzz');

    expect(screen.queryByRole('heading', { name: /^Pages$/i })).toBeNull();
    expect(screen.getByText('New page “zzzz”')).toBeTruthy();
  });
});
