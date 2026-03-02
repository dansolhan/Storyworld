import { describe, it, expect, vi } from 'vitest';
import { evaluateVisibility } from './evaluator';

describe('evaluateVisibility', () => {
  const mockContext = {
    variables: { score: 10, name: 'Alice', isHero: true },
    visitedPageIds: ['page_1', 'page_2'],
    currentPageId: 'page_3'
  };

  it('should return true if no conditionals exist', () => {
    expect(evaluateVisibility({ conditionals: [] }, mockContext)).toBe(true);
    expect(evaluateVisibility({}, mockContext)).toBe(true);
  });

  describe('visited pages tracking', () => {
    it('should evaluate visited_page correctly', () => {
      const item = {
        conditionals: [
          { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_1', not: false }, children: [] }
        ]
      };
      expect(evaluateVisibility(item, mockContext)).toBe(true);

      const itemFail = {
        conditionals: [
          { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_99', not: false }, children: [] }
        ]
      };
      expect(evaluateVisibility(itemFail, mockContext)).toBe(false);
    });

    it('should evaluate visited_page (not=true) correctly', () => {
      const item = {
        conditionals: [
          { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_99', not: true }, children: [] }
        ]
      };
      expect(evaluateVisibility(item, mockContext)).toBe(true);

      const itemFail = {
        conditionals: [
          { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_1', not: true }, children: [] }
        ]
      };
      expect(evaluateVisibility(itemFail, mockContext)).toBe(false);
    });
  });

  describe('logic gates (AND / OR)', () => {
    it('should evaluate and_group correctly', () => {
      const item = {
        conditionals: [
          {
            id: 'root',
            blueprintId: 'and_group',
            params: {},
            children: [
              { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_2', not: false }, children: [] },
              { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_1', not: false }, children: [] }
            ]
          }
        ]
      };
      expect(evaluateVisibility(item, mockContext)).toBe(true);

      const itemFail = {
        conditionals: [
          {
            id: 'root',
            blueprintId: 'and_group',
            params: {},
            children: [
              { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_1', not: false }, children: [] },
              { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_99', not: false }, children: [] } // This fails
            ]
          }
        ]
      };
      expect(evaluateVisibility(itemFail, mockContext)).toBe(false);
    });

    it('should evaluate or_group correctly', () => {
      const item = {
        conditionals: [
          {
            id: 'root',
            blueprintId: 'or_group',
            params: {},
            children: [
              { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_99', not: false }, children: [] }, // This fails
              { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_1', not: false }, children: [] } // But this passes
            ]
          }
        ]
      };
      expect(evaluateVisibility(item, mockContext)).toBe(true);

      const itemFail = {
        conditionals: [
          {
            id: 'root',
            blueprintId: 'or_group',
            params: {},
            children: [
              { id: '1', blueprintId: 'visited_page', params: { pageId: 'page_98', not: false }, children: [] },
              { id: '2', blueprintId: 'visited_page', params: { pageId: 'page_99', not: false }, children: [] }
            ]
          }
        ]
      };
      expect(evaluateVisibility(itemFail, mockContext)).toBe(false);
    });
  });

  it('fails gracefully on unknown blueprints', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const item = {
      conditionals: [
        { id: '1', blueprintId: 'unknown_blueprint_xyz', params: {}, children: [] }
      ]
    };
    // Should fail open (return true) to not break the game if a node is corrupt
    expect(evaluateVisibility(item, mockContext)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Unknown conditional blueprint: unknown_blueprint_xyz');
    consoleSpy.mockRestore();
  });
});
