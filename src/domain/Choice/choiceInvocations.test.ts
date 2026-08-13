import { describe, it, expect } from 'vitest';
import { choiceInvocations, crossingOf } from './choiceInvocations';
import type { Choice } from './Choice';

const crossing = (subplotId: string | null, targetPageId: string) => ({
  id: 'n1',
  type: 'action' as const,
  name: 'Go to Subplot',
  blueprintId: 'go_to_subplot',
  params: { subplotId, targetPageId },
});

describe('choiceInvocations', () => {
  it('finds nothing on a plain choice', () => {
    expect(choiceInvocations({ id: 'c1', text: 'Onward' })).toEqual([]);
  });

  /*
   * The regression this exists for: the 1.0.0 migration moves `actions` into
   * `events` and drops the old field, so reading only `actions` found nothing for
   * every migrated story — which is how the canvas lost its crossings and markers.
   */
  it('reads an action out of an event, which is where migrated stories keep them', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Lift the floorboard',
      events: [{ id: 'e1', name: 'onSelect', logicTree: [crossing('subplot-cellar', 'page-9')] }],
    };

    expect(choiceInvocations(choice)).toEqual([
      { blueprintId: 'go_to_subplot', params: { subplotId: 'subplot-cellar', targetPageId: 'page-9' } },
    ]);
  });

  it('still reads the legacy field, so an unmigrated story keeps working', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Ring the bell',
      actions: [{ id: 'a1', blueprintId: 'post_message', params: { message: 'Clang' } }],
    };

    expect(choiceInvocations(choice).map((i) => i.blueprintId)).toEqual(['post_message']);
  });

  it('reads both when a story carries both', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Both',
      actions: [{ id: 'a1', blueprintId: 'post_message', params: {} }],
      events: [{ id: 'e1', name: 'onSelect', logicTree: [crossing('sub', 'page-9')] }],
    };

    expect(choiceInvocations(choice).map((i) => i.blueprintId)).toEqual([
      'post_message',
      'go_to_subplot',
    ]);
  });

  it('finds an action nested in a condition’s branch', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Maybe',
      events: [
        {
          id: 'e1',
          name: 'onSelect',
          logicTree: [
            {
              id: 'cond',
              type: 'condition',
              name: 'Has Item',
              blueprintId: 'has_item',
              children: [
                { id: 'then', type: 'branch_then', name: 'Then', children: [crossing('sub', 'page-9')] },
              ],
            },
          ],
        },
      ],
    };

    expect(choiceInvocations(choice).map((i) => i.blueprintId)).toEqual(['go_to_subplot']);
  });

  it('does not report a condition as something the choice does', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Guarded',
      events: [
        {
          id: 'e1',
          name: 'onSelect',
          logicTree: [
            { id: 'cond', type: 'condition', name: 'Has Item', blueprintId: 'has_item', children: [] },
          ],
        },
      ],
    };

    expect(choiceInvocations(choice)).toEqual([]);
  });
});

describe('crossingOf', () => {
  it('reads the plot and page a crossing leads to', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Down',
      events: [{ id: 'e1', name: 'onSelect', logicTree: [crossing('subplot-cellar', 'page-9')] }],
    };

    expect(crossingOf(choice)).toEqual({ subplotId: 'subplot-cellar', targetPageId: 'page-9' });
  });

  /* A null subplot is a crossing *back* to the main plot, not a missing one. */
  it('treats a null subplot as the main plot', () => {
    const choice: Choice = {
      id: 'c1',
      text: 'Climb back up',
      events: [{ id: 'e1', name: 'onSelect', logicTree: [crossing(null, 'page-1')] }],
    };

    expect(crossingOf(choice)).toEqual({ subplotId: null, targetPageId: 'page-1' });
  });

  it('is undefined for a choice that crosses nowhere', () => {
    expect(crossingOf({ id: 'c1', text: 'Onward', targetPageId: 'page-2' })).toBeUndefined();
  });
});
