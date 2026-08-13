// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useBlueprintUsage } from './useBlueprintUsage';
import { useEditorStore } from '../../store/useEditorStore';
import type { LogicNode } from '../../../../domain/Story/LogicNode';
import type { Item } from '../../../../domain/Item/Item';
import type { StatusData } from '../../../../domain/Story/StatusData';

const pristineState = useEditorStore.getState();

const action = (id: string, blueprintId: string): LogicNode => ({
  id,
  type: 'action',
  name: id,
  blueprintId,
});

const KEY: Item = {
  id: 'key',
  name: 'the golden key',
  description: '',
  tags: [],
  multiple: false,
  contextChoices: [
    {
      id: 'ctx-1',
      text: 'Turn the key',
      actions: [{ id: 'act-1', blueprintId: 'remove_item', params: {} }],
      conditionals: [{ id: 'cond-1', blueprintId: 'has_item', params: {} }],
    },
  ],
};

const STATUS: StatusData = {
  id: 'status-1',
  title: 'Gold',
  value: '{{gold}}',
  condition: [{ id: 'cond-2', type: 'condition', name: 'Has Item', blueprintId: 'has_item' }],
};

const usage = () => renderHook(() => useBlueprintUsage()).result.current;

describe('useBlueprintUsage', () => {
  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
  });

  it('counts nothing in an empty story', () => {
    expect(usage()).toEqual({});
  });

  it('counts a blueprint everywhere it appears on a page', () => {
    useEditorStore.setState({
      pages: {
        'page-1': {
          id: 'page-1',
          title: 'The Locked Door',
          events: [{ id: 'e1', name: 'onEnter', logicTree: [action('a1', 'give_item')] }],
          paragraphs: [
            {
              id: 'para-1',
              text: '',
              events: [
                { id: 'e2', name: 'calculateVisibility', logicTree: [action('a2', 'give_item')] },
              ],
            },
          ],
          choices: [
            {
              id: 'choice-1',
              text: 'Rattle the handle',
              events: [{ id: 'e3', name: 'onSelect', logicTree: [action('a3', 'give_item')] }],
            },
          ],
        },
      },
    });

    expect(usage().give_item).toBe(3);
  });

  it('counts rules nested inside a condition’s branches', () => {
    useEditorStore.setState({
      pages: {
        'page-1': {
          id: 'page-1',
          title: 'The Locked Door',
          paragraphs: [],
          choices: [],
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                {
                  id: 'c1',
                  type: 'condition',
                  name: 'Has Item',
                  blueprintId: 'has_item',
                  children: [
                    {
                      id: 'c1-then',
                      type: 'branch_then',
                      name: 'Then',
                      children: [action('a1', 'give_item')],
                    },
                    {
                      id: 'c1-else',
                      type: 'branch_else',
                      name: 'Else',
                      children: [action('a2', 'give_item')],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(usage()).toEqual({ has_item: 1, give_item: 2 });
  });

  it('does not count the branches themselves, which carry no blueprint', () => {
    useEditorStore.setState({
      pages: {
        'page-1': {
          id: 'page-1',
          title: 'A',
          paragraphs: [],
          choices: [],
          events: [
            {
              id: 'e1',
              name: 'onEnter',
              logicTree: [
                {
                  id: 'c1',
                  type: 'condition',
                  name: 'Has Item',
                  blueprintId: 'has_item',
                  children: [
                    { id: 'c1-then', type: 'branch_then', name: 'Then', children: [] },
                    { id: 'c1-else', type: 'branch_else', name: 'Else', children: [] },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    expect(Object.keys(usage())).toEqual(['has_item']);
  });

  it('counts an item’s context choices and status-data conditions too', () => {
    useEditorStore.setState({
      pages: {},
      items: { key: KEY },
      statusData: [STATUS],
    });

    expect(usage()).toEqual({ remove_item: 1, has_item: 2 });
  });
});
