// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { ItemsWorkspace } from './ItemsWorkspace';
import { VariablesWorkspace } from './VariablesWorkspace';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';
import type { Item } from '../../../../domain/Item/Item';

/* The rich-text description needs a layout engine jsdom has not got. */
vi.mock('../../../../components/ui/RichTextEditor/RichTextEditor', () => ({
  RichTextEditor: ({ content }: { content: string }) => <div data-testid="rich-text">{content}</div>,
}));

const pristineState = useEditorStore.getState();

const item = (id: string, name: string, tags: string[] = []): Item => ({
  id,
  name,
  description: '',
  tags,
  multiple: false,
  contextChoices: [],
});

const PAGES: Record<string, Page> = {
  'page-1': {
    id: 'page-1',
    title: 'Checking Pockets',
    paragraphs: [{ id: 'para-1', text: '<p>You have {{gold}} coins.</p>' }],
    choices: [],
    events: [
      {
        id: 'e1',
        name: 'onEnter',
        logicTree: [
          { id: 'n1', type: 'action', name: 'Give', blueprintId: 'give_item', params: { itemId: 'key' } },
        ],
      },
    ],
  },
};

const renderItems = () =>
  render(
    <ReactFlowProvider>
      <ItemsWorkspace />
    </ReactFlowProvider>
  );

const renderVariables = () =>
  render(
    <ReactFlowProvider>
      <VariablesWorkspace />
    </ReactFlowProvider>
  );

const rows = () => screen.getAllByRole('row').filter((row) => row.hasAttribute('aria-selected'));

describe('ItemsWorkspace', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    useEditorStore.setState({
      pages: PAGES,
      items: {
        key: item('key', 'Rusty Key', ['quest']),
        lamp: item('lamp', 'Brass Lamp', ['light']),
      },
    });
  });

  afterEach(cleanup);

  it("lists items with the design's columns", () => {
    renderItems();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Name',
      'ID',
      'Tags',
      'Used on',
    ]);
    expect(rows()).toHaveLength(2);
  });

  it('counts the pages that reference an item, and says when nothing does', () => {
    renderItems();

    expect(within(rows()[0]).getByText('1 page')).toBeTruthy();
    // Nothing points at the lamp.
    expect(within(rows()[1]).getByText('unused')).toBeTruthy();
  });

  it('filters on name, id and tag', async () => {
    const user = userEvent.setup();
    renderItems();
    const filter = screen.getByLabelText('Filter by name, id or tag…');

    await user.type(filter, 'brass');
    expect(rows()).toHaveLength(1);

    await user.clear(filter);
    await user.type(filter, 'quest');
    expect(rows()[0].textContent).toContain('Rusty Key');

    await user.clear(filter);
    await user.type(filter, 'zzz');
    expect(screen.getByText('Nothing matches that filter.')).toBeTruthy();
  });

  it('fills the detail panel when a row is selected', async () => {
    const user = userEvent.setup();
    renderItems();

    expect(screen.queryByRole('heading', { name: 'Rusty Key' })).toBeNull();
    await user.click(rows()[0]);

    expect(screen.getByRole('heading', { name: 'Rusty Key' })).toBeTruthy();
    expect(screen.getByDisplayValue('key')).toHaveProperty('readOnly', true);
    expect(screen.getByDisplayValue('Rusty Key')).toBeTruthy();
  });

  it('writes an edited display name back to the store', async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(rows()[0]);

    const nameField = screen.getByDisplayValue('Rusty Key');
    await user.clear(nameField);
    await user.type(nameField, 'Iron Key');

    expect(useEditorStore.getState().items.key.name).toBe('Iron Key');
  });

  it('names each reference and what it does', async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(rows()[0]);

    expect(screen.getByRole('heading', { name: /Where it appears/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Checking Pockets' })).toBeTruthy();
    expect(screen.getByText('given')).toBeTruthy();
  });

  it('reveals the page a reference points at', async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(rows()[0]);
    await user.click(screen.getByRole('button', { name: 'Checking Pockets' }));

    const state = useEditorStore.getState();
    expect(state.activeWorkspace).toBe('graph');
    expect(state.selectedPageId).toBe('page-1');
  });

  it('warns what depends on an item before deleting it', async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(rows()[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText(/It is used on 1 page/)).toBeTruthy();
    // Scoped to the dialog: the detail panel has a Delete button too.
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(useEditorStore.getState().items.key).toBeUndefined();
  });

  it('leaves the item alone when the delete is cancelled', async () => {
    const user = userEvent.setup();
    renderItems();
    await user.click(rows()[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useEditorStore.getState().items.key).toBeDefined();
  });

  it('creates a new item and selects it', async () => {
    const user = userEvent.setup();
    renderItems();

    await user.click(screen.getByRole('button', { name: /New item/ }));

    expect(rows()).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'New item' })).toBeTruthy();
  });
});

describe('VariablesWorkspace', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    useEditorStore.setState({
      pages: PAGES,
      variables: {
        gold: { type: 'number', value: 15, tags: ['economy'] },
        unusedFlag: { type: 'boolean', value: false, tags: [] },
      },
    });
  });

  afterEach(cleanup);

  it("uses 5b's columns", () => {
    renderVariables();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Name',
      'Type',
      'Starts as',
      'Tags',
      'Read by',
    ]);
  });

  it('calls out a variable nothing reads', () => {
    renderVariables();
    expect(within(rows()[0]).getByText('1')).toBeTruthy();
    expect(within(rows()[1]).getByText('never read')).toBeTruthy();
  });

  it('shows the name as unchangeable, and the token that prints it', async () => {
    const user = userEvent.setup();
    renderVariables();
    await user.click(rows()[0]);

    expect(screen.getByDisplayValue('gold')).toHaveProperty('readOnly', true);
    expect(screen.getByText('{{gold}}')).toBeTruthy();
    expect(screen.getByText(/cannot be changed/)).toBeTruthy();
  });

  it('recasts the starting value when the type changes', async () => {
    const user = userEvent.setup();
    renderVariables();
    await user.click(rows()[0]);

    await user.selectOptions(screen.getByDisplayValue('Number'), 'boolean');

    const variable = useEditorStore.getState().variables.gold;
    expect(variable.type).toBe('boolean');
    expect(variable.value).toBe(false);
  });

  it('asks for a name before creating, since the name is the key', async () => {
    const user = userEvent.setup();
    renderVariables();

    await user.click(screen.getByRole('button', { name: /New variable/ }));
    expect(screen.getByRole('dialog', { name: 'New variable' })).toBeTruthy();

    await user.type(screen.getByLabelText('Name'), 'metGil');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(useEditorStore.getState().variables.metGil).toEqual({
      type: 'string',
      value: '',
      tags: [],
    });
  });

  it('refuses a name that is taken or malformed', async () => {
    const user = userEvent.setup();
    renderVariables();
    await user.click(screen.getByRole('button', { name: /New variable/ }));

    const field = screen.getByLabelText('Name');

    await user.type(field, 'gold');
    expect(screen.getByText('A variable with that name already exists.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true);

    await user.clear(field);
    await user.type(field, '2bad name');
    expect(screen.getByText(/Letters, numbers and underscores only/)).toBeTruthy();
  });
});
