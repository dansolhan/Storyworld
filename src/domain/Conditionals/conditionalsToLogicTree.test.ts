import { describe, it, expect } from 'vitest';
import { conditionalsToLogicTree } from './conditionalsToLogicTree';
import { evaluateEventVisibility } from '../../lib/engine/logic/executeLogicTree';
import type { Conditional } from './Conditional';
import type { EvaluationContext } from './Conditional';

const context: EvaluationContext = {
  variables: { gold: { type: 'number', value: 0 } },
  visitedPageIds: [],
  currentPageId: 'page-1',
  inventory: {},
};

describe('conditionalsToLogicTree', () => {
  it('marks every node as a condition', () => {
    const tree = conditionalsToLogicTree([
      { id: 'c1', blueprintId: 'has_item', params: { itemId: 'key' } },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('condition');
    expect(tree[0].blueprintId).toBe('has_item');
    expect(tree[0].params).toEqual({ itemId: 'key' });
  });

  it('puts group operands in a branch_conditions child', () => {
    const group: Conditional = {
      id: 'grp',
      blueprintId: 'and_group',
      params: {},
      children: [
        { id: 'c1', blueprintId: 'has_item', params: { itemId: 'key' } },
        { id: 'c2', blueprintId: 'has_item', params: { itemId: 'lamp' } },
      ],
    };

    const [node] = conditionalsToLogicTree([group]);
    const children = node.children ?? [];

    expect(children).toHaveLength(1);
    expect(children[0].type).toBe('branch_conditions');
    expect(children[0].children?.map((child) => child.blueprintId)).toEqual([
      'has_item',
      'has_item',
    ]);
  });

  it('leaves a childless condition without children', () => {
    const [node] = conditionalsToLogicTree([{ id: 'c1', blueprintId: 'has_item', params: {} }]);
    expect(node.children).toBeUndefined();
  });

  /*
   * The regression this adapter exists for. Passing Conditional[] straight into
   * the evaluator produced nodes with no `type`, which the evaluator skips — so
   * a failing condition read as visible.
   */
  describe('as consumed by the evaluator', () => {
    const hasKey: Conditional = {
      id: 'c1',
      blueprintId: 'has_item',
      params: { itemId: 'key' },
    };

    it('hides when a condition fails', () => {
      expect(evaluateEventVisibility(conditionalsToLogicTree([hasKey]), context)).toBe(false);
    });

    it('shows when the condition passes', () => {
      const withKey = { ...context, inventory: { key: 1 } };
      expect(evaluateEventVisibility(conditionalsToLogicTree([hasKey]), withKey)).toBe(true);
    });

    it('would have passed regardless without the adapter', () => {
      // Demonstrates the old behaviour: no `type`, so the node is ignored.
      const untyped = [{ ...hasKey }] as unknown as Parameters<typeof evaluateEventVisibility>[0];
      expect(evaluateEventVisibility(untyped, context)).toBe(true);
    });
  });
});
