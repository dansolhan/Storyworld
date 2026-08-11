import { describe, it, expect } from 'vitest';
import {
  branchOf,
  editChildren,
  insertNode,
  moveNode,
  removeNode,
  updateNodeParams,
} from './ruleTree';
import type { LogicNode } from '../../../../domain/Story/LogicNode';

const action = (id: string, blueprintId = 'set_variable'): LogicNode => ({
  id,
  type: 'action',
  name: id,
  blueprintId,
  params: { variableKey: 'gold' },
});

/** A condition with the branches `newRuleNode` gives it. */
const condition = (id: string, then: LogicNode[] = [], otherwise: LogicNode[] = []): LogicNode => ({
  id,
  type: 'condition',
  name: id,
  blueprintId: 'has_item',
  params: { itemId: null },
  children: [
    { id: `${id}-then`, type: 'branch_then', name: 'Then', children: then },
    { id: `${id}-else`, type: 'branch_else', name: 'Else', children: otherwise },
  ],
});

describe('ruleTree', () => {
  it('inserts at the root when no parent is given', () => {
    const tree = insertNode([action('a')], null, action('b'));
    expect(tree.map((node) => node.id)).toEqual(['a', 'b']);
  });

  it('inserts into a named branch, leaving its siblings alone', () => {
    const tree = insertNode([condition('c1')], 'c1-then', action('a'));

    expect(branchOf(tree[0], 'branch_then')?.children?.map((node) => node.id)).toEqual(['a']);
    expect(branchOf(tree[0], 'branch_else')?.children).toEqual([]);
  });

  it('leaves the input untouched, so a rejected edit cannot half-apply', () => {
    const original = [condition('c1', [action('a')])];
    const snapshot = JSON.stringify(original);

    insertNode(original, 'c1-then', action('b'));
    removeNode(original, 'a');
    updateNodeParams(original, 'a', { variableKey: 'silver' });
    moveNode(original, 'c1', 1);

    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('removes a node from inside a branch', () => {
    const tree = removeNode([condition('c1', [action('a'), action('b')])], 'a');
    expect(branchOf(tree[0], 'branch_then')?.children?.map((node) => node.id)).toEqual(['b']);
  });

  it('removes a condition together with everything under it', () => {
    expect(removeNode([condition('c1', [action('a')]), action('b')], 'c1')).toEqual([action('b')]);
  });

  it('swaps a node with its neighbour, because actions run in order', () => {
    const tree = moveNode([action('a'), action('b'), action('c')], 'c', -1);
    expect(tree.map((node) => node.id)).toEqual(['a', 'c', 'b']);
  });

  it('reorders within a branch rather than across the whole tree', () => {
    const tree = moveNode([action('root'), condition('c1', [action('a'), action('b')])], 'b', -1);

    expect(branchOf(tree[1], 'branch_then')?.children?.map((node) => node.id)).toEqual(['b', 'a']);
    expect(tree[0].id).toBe('root');
  });

  it('refuses to move past either end of its list', () => {
    const nodes = [action('a'), action('b')];
    expect(moveNode(nodes, 'a', -1).map((node) => node.id)).toEqual(['a', 'b']);
    expect(moveNode(nodes, 'b', 1).map((node) => node.id)).toEqual(['a', 'b']);
  });

  it('merges params instead of replacing them', () => {
    const tree = updateNodeParams([action('a')], 'a', { value: '5' });
    expect(tree[0].params).toEqual({ variableKey: 'gold', value: '5' });
  });

  it('updates params on a node nested in a branch', () => {
    const tree = updateNodeParams([condition('c1', [action('a')])], 'a', { value: '5' });
    expect(branchOf(tree[0], 'branch_then')?.children?.[0].params).toEqual({
      variableKey: 'gold',
      value: '5',
    });
  });

  it('finds nothing for a branch a node has not got', () => {
    expect(branchOf(condition('c1'), 'branch_conditions')).toBeUndefined();
  });

  it('edits the child list of a branch directly', () => {
    const tree = editChildren([condition('c1', [action('a'), action('b')])], 'c1-then', (children) =>
      children.slice(0, 1)
    );
    expect(branchOf(tree[0], 'branch_then')?.children?.map((node) => node.id)).toEqual(['a']);
  });
});
