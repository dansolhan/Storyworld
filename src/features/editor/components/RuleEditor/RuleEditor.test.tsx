// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuleEditor } from './RuleEditor';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import type { Item } from '../../../../domain/Item/Item';

const pristineState = useEditorStore.getState();

const action = (id: string, blueprintId: string, params: Record<string, unknown>): LogicNode => ({
  id,
  type: 'action',
  name: id,
  blueprintId,
  params,
});

const condition = (id: string, then: LogicNode[]): LogicNode => ({
  id,
  type: 'condition',
  name: id,
  blueprintId: 'has_item',
  params: { itemId: 'key' },
  children: [
    { id: `${id}-then`, type: 'branch_then', name: 'Then', children: then },
    { id: `${id}-else`, type: 'branch_else', name: 'Else', children: [] },
  ],
});

const page = (events: Page['events']): Page => ({
  id: 'page-1',
  title: 'The Locked Door',
  paragraphs: [],
  choices: [],
  events,
});

/*
 * Mirrors the Logic tab: the page comes from the store, so an edit the editor
 * dispatches comes back as a new `events` prop — which is what makes the assertions
 * below about the rendered sentence meaningful rather than about local state.
 */
const LiveEditor: React.FC = () => {
  const stored = useEditorStore((state) => state.pages['page-1']);
  return (
    <RuleEditor
      targetType="page"
      pageId="page-1"
      targetId="page-1"
      events={stored.events || []}
    />
  );
};

const KEY: Item = {
  id: 'key',
  name: 'the golden key',
  description: '',
  tags: [],
  multiple: false,
  contextChoices: [],
};

const seed = (events: Page['events']) => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    pages: { 'page-1': page(events) },
    items: { key: KEY },
    variables: { gold: { type: 'number', value: 0 } },
  });
};

const storedTree = (): LogicNode[] =>
  useEditorStore.getState().pages['page-1'].events![0].logicTree;

describe('RuleEditor', () => {
  beforeEach(() => {
    seed([
      {
        id: 'event-1',
        name: 'onEnter',
        logicTree: [
          action('a1', 'set_variable', { variableKey: 'gold', value: '5' }),
          action('a2', 'hide_paragraph', {}),
        ],
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  it('titles each set of rules by the moment it runs at', () => {
    render(<LiveEditor />);
    expect(screen.getByRole('heading', { name: 'When the reader arrives' })).toBeTruthy();
  });

  it('renders an action as a sentence with its values filled in', () => {
    render(<LiveEditor />);
    expect(screen.getByText(/set/).textContent).toContain('set');
    expect(screen.getByText('gold')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('says so plainly when nothing happens here', () => {
    seed([]);
    render(<LiveEditor />);
    expect(screen.getByText('Nothing happens here yet.')).toBeTruthy();
  });

  it('offers only the moments a page has not got yet', async () => {
    render(<LiveEditor />);
    const chips = screen.getByText('Add a moment').parentElement!;

    expect(within(chips).getByRole('button', { name: 'When the reader leaves' })).toBeTruthy();
    expect(within(chips).queryByRole('button', { name: 'When the reader arrives' })).toBeNull();

    await userEvent.click(within(chips).getByRole('button', { name: 'When the reader leaves' }));

    expect(screen.getByRole('heading', { name: 'When the reader leaves' })).toBeTruthy();
    expect(useEditorStore.getState().pages['page-1'].events).toHaveLength(2);
  });

  it('reorders actions, because they run in the order they are listed', async () => {
    render(<LiveEditor />);
    expect(storedTree().map((node) => node.blueprintId)).toEqual([
      'set_variable',
      'hide_paragraph',
    ]);

    // The second row's "up" — the first row's is disabled.
    const up = screen.getAllByRole('button', { name: 'Move up' });
    await userEvent.click(up[1]);

    expect(storedTree().map((node) => node.blueprintId)).toEqual([
      'hide_paragraph',
      'set_variable',
    ]);
  });

  it('cannot move the first rule up or the last one down', () => {
    render(<LiveEditor />);
    expect(screen.getAllByRole('button', { name: 'Move up' })[0]).toHaveProperty('disabled', true);
    expect(screen.getAllByRole('button', { name: 'Move down' })[1]).toHaveProperty('disabled', true);
  });

  it('removes a rule', async () => {
    render(<LiveEditor />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove rule' })[0]);

    expect(storedTree().map((node) => node.blueprintId)).toEqual(['hide_paragraph']);
  });

  it('removes a whole moment', async () => {
    render(<LiveEditor />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(useEditorStore.getState().pages['page-1'].events).toEqual([]);
  });

  describe('a condition', () => {
    beforeEach(() => {
      seed([
        {
          id: 'event-1',
          name: 'onEnter',
          logicTree: [condition('c1', [action('a1', 'hide_paragraph', {})])],
        },
      ]);
    });

    it('reads as "If …" with its branches under it', () => {
      render(<LiveEditor />);

      expect(screen.getByText('If')).toBeTruthy();
      expect(screen.getByText('the golden key')).toBeTruthy();
      expect(screen.getByText('Then')).toBeTruthy();
      expect(screen.getByText('Else')).toBeTruthy();
    });

    it('says an empty branch does nothing, rather than showing nothing', () => {
      render(<LiveEditor />);
      expect(screen.getAllByText('do nothing')).toHaveLength(1);
    });

    it('inserts a picked rule into the branch that was asked for', async () => {
      render(<LiveEditor />);
      await userEvent.click(screen.getByRole('button', { name: /else…/ }));

      await userEvent.click(screen.getByRole('option', { name: /hide this choice/ }));

      const elseBranch = storedTree()[0].children!.find((node) => node.type === 'branch_else');
      expect(elseBranch!.children!.map((node) => node.blueprintId)).toEqual(['hide_choice']);
    });

    it('gives a newly inserted condition the branches the evaluator looks for', async () => {
      render(<LiveEditor />);
      await userEvent.click(screen.getByRole('button', { name: /then…/ }));
      await userEvent.click(screen.getByRole('option', { name: /the reader carries the item/ }));

      const thenBranch = storedTree()[0].children!.find((node) => node.type === 'branch_then');
      const inserted = thenBranch!.children!.find((node) => node.blueprintId === 'has_item')!;

      expect(inserted.children!.map((node) => node.type)).toEqual(['branch_then', 'branch_else']);
      expect(inserted.params).toEqual({ itemId: null });
    });

    it('joins a group into one clause instead of nesting it', async () => {
      seed([
        {
          id: 'event-1',
          name: 'onEnter',
          logicTree: [
            {
              id: 'g1',
              type: 'condition',
              name: 'AND Group',
              blueprintId: 'and_group',
              params: {},
              children: [
                {
                  id: 'g1-conds',
                  type: 'branch_conditions',
                  name: 'Conditions',
                  children: [
                    {
                      id: 'x',
                      type: 'condition',
                      name: 'Has Item',
                      blueprintId: 'has_item',
                      params: { itemId: 'key' },
                    },
                    {
                      id: 'y',
                      type: 'condition',
                      name: 'First visit',
                      blueprintId: 'first_visit',
                      params: { not: false },
                    },
                  ],
                },
                { id: 'g1-then', type: 'branch_then', name: 'Then', children: [] },
                { id: 'g1-else', type: 'branch_else', name: 'Else', children: [] },
              ],
            },
          ],
        },
      ]);
      render(<LiveEditor />);

      const sentence = screen.getByText('If').parentElement!;
      expect(sentence.textContent).toContain('the golden key');
      expect(sentence.textContent).toContain('and');
      expect(sentence.textContent).toContain('first visit to this page');
    });
  });
});

describe('RulePicker', () => {
  beforeEach(() => {
    seed([{ id: 'event-1', name: 'onEnter', logicTree: [] }]);
  });

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  const open = async () => {
    render(<LiveEditor />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
  };

  it('lists every rule, grouped by category, with the sentence it would become', async () => {
    await open();

    expect(screen.getByRole('option', { name: /If the reader carries the item/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /give the reader an item/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeTruthy();
  });

  it('says where the chosen rule will land', async () => {
    await open();
    expect(screen.getByText(/insert into this rule/)).toBeTruthy();
  });

  it('narrows as the author types, and keeps the total in view', async () => {
    await open();
    const total = screen.getAllByRole('option').length;

    await userEvent.type(screen.getByRole('textbox', { name: 'Search rules' }), 'carries');

    expect(screen.getAllByRole('option').length).toBeLessThan(total);
    expect(screen.getByText(`2 of ${total} shown`)).toBeTruthy();
  });

  it('admits when nothing matches', async () => {
    await open();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search rules' }), 'teleport');

    expect(screen.getByText('No rule matches that.')).toBeTruthy();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('filters to one category from the rail', async () => {
    await open();
    await userEvent.click(screen.getByRole('button', { name: /^Inventory/ }));

    for (const option of screen.getAllByRole('option')) {
      expect(option.textContent).toMatch(/item/i);
    }
  });

  it('shows how often the story already leans on a rule', async () => {
    seed([
      {
        id: 'event-1',
        name: 'onEnter',
        logicTree: [
          action('a1', 'hide_paragraph', {}),
          action('a2', 'hide_paragraph', {}),
          action('a3', 'give_item', { itemId: 'key', count: 1 }),
        ],
      },
    ]);
    render(<LiveEditor />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(screen.getByText(/Hide Paragraph · used 2 times in this story/)).toBeTruthy();
    expect(screen.getByText(/Give Item · used 1 time in this story/)).toBeTruthy();
    // A rule this story does not use says nothing rather than "used 0 times".
    expect(screen.getByText('Remove Item')).toBeTruthy();
  });

  it('inserts the highlighted rule on Enter', async () => {
    await open();
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(storedTree()).toHaveLength(1);
  });

  it('walks the category rail with Tab', async () => {
    await open();
    await userEvent.keyboard('{Tab}');

    expect(screen.getByRole('button', { name: /^Conditions/ }).dataset.active).toBe('true');
  });

  it('closes on Escape without inserting anything', async () => {
    await open();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(storedTree()).toEqual([]);
  });
});
