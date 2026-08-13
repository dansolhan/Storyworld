// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { HealthWorkspace } from './HealthWorkspace';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';
import type { EditorNode } from '../../store/editorTypes';

const pristineState = useEditorStore.getState();

const node = (id: string, x = 0): EditorNode => ({
  id,
  type: 'pageNode',
  position: { x, y: 0 },
  data: { type: 'location', title: id, paragraphs: [], choices: [] },
});

const page = (id: string, title: string, over: Partial<Page> = {}): Page => ({
  id,
  title,
  paragraphs: [{ id: `${id}-p`, text: '<p>Words.</p>' }],
  choices: [],
  ...over,
});

const seed = (over: Partial<ReturnType<typeof useEditorStore.getState>> = {}) => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    pages: {
      'page-1': page('page-1', 'The Awakening', {
        choices: [{ id: 'c1', text: 'Open the door', targetPageId: 'page-2' }],
      }),
      'page-2': page('page-2', 'The Locked Door', {
        events: [
          {
            id: 'e1',
            name: 'onEnter',
            logicTree: [{ id: 'n1', type: 'action', name: 'End Story', blueprintId: 'end_story', params: {} }],
          },
        ],
      }),
    },
    nodes: [node('page-1'), node('page-2', 400)],
    startPageId: 'page-1',
    ...over,
  });
};

const renderHealth = () =>
  render(
    <ReactFlowProvider>
      <HealthWorkspace />
    </ReactFlowProvider>
  );

const group = (title: string): HTMLElement =>
  screen.getByRole('heading', { name: title }).closest('section')!;

describe('HealthWorkspace', () => {
  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  describe('a healthy story', () => {
    beforeEach(() => seed());

    it('says nothing is broken, and does not pretend the endings are faults', () => {
      renderHealth();
      expect(screen.getByText('Nothing broken. The rest is drafting.')).toBeTruthy();
    });

    /*
     * Behind an icon rather than under every heading: ten standing explanations
     * crowded out the findings, which are the thing worth reading. Still reachable
     * by keyboard, not by hover alone.
     */
    it('keeps each check’s explanation available without printing it', async () => {
      renderHealth();

      expect(screen.queryByText(/No path from the start page arrives here/)).toBeNull();

      await userEvent.hover(screen.getByRole('button', { name: 'What “Unreachable pages” means' }));

      expect(await screen.findByText(/No path from the start page arrives here/)).toBeTruthy();
    });

    it('gives every check a way to ask what it means', () => {
      renderHealth();

      /* One per group, whatever the checks grow to — the invariant, not a count. */
      const groups = screen.getAllByRole('heading', { level: 2 });
      expect(screen.getAllByRole('button', { name: /^What “.+” means$/ })).toHaveLength(groups.length);
    });

    /*
     * A passing check keeps its group and says what it verified — one that
     * vanished would leave the author unsure whether it had run at all.
     */
    it('keeps every group and reports what each one verified', () => {
      renderHealth();

      expect(within(group('Unreachable pages')).getByText('Every page can be reached.')).toBeTruthy();
      expect(within(group('Endings')).getByText('The Locked Door')).toBeTruthy();
      expect(within(group('Start page')).getByText('Set, and the page exists.')).toBeTruthy();
    });
  });

  describe('a story with problems', () => {
    beforeEach(() => {
      seed({
        pages: {
          'page-1': page('page-1', 'The Awakening', {
            choices: [{ id: 'c1', text: 'Push on the wall', targetPageId: 'deleted-page' }],
          }),
          'page-3': page('page-3', 'The Sunken Hall', { paragraphs: [] }),
        },
        nodes: [node('page-1'), node('page-3', 400)],
        startPageId: 'page-1',
      });
    });

    it('leads with how much has to be fixed', () => {
      renderHealth();
      expect(screen.getByText('2 things to fix before a reader sees this.')).toBeTruthy();
    });

    it('names the unreachable page', () => {
      renderHealth();
      expect(within(group('Unreachable pages')).getByText('The Sunken Hall')).toBeTruthy();
    });

    it('names the choice whose target has gone, and where it is', () => {
      renderHealth();
      const dangling = group('Choices pointing nowhere');

      expect(within(dangling).getByText('Push on the wall')).toBeTruthy();
      expect(within(dangling).getByText(/on The Awakening, points at deleted-page/)).toBeTruthy();
    });

    it('reveals a page on the canvas when its finding is clicked', async () => {
      renderHealth();
      /* The finding itself, not the group's help icon. */
      await userEvent.click(
        within(group('Unreachable pages')).getByRole('button', { name: /The Sunken Hall/ })
      );

      expect(useEditorStore.getState().selectedPageId).toBe('page-3');
      expect(useEditorStore.getState().activeWorkspace).toBe('graph');
    });

    it('lists the unwritten page as something to look at, not something broken', () => {
      renderHealth();

      expect(within(group('Unwritten pages')).getByText('The Sunken Hall')).toBeTruthy();
      // The two breaking findings, and the notes counted apart from them.
      expect(screen.getByText('2 things to fix before a reader sees this.')).toBeTruthy();
    });
  });

  describe('unused data', () => {
    it('names what is never referenced, with no way to click it', () => {
      seed({
        items: {
          spare: { id: 'spare', name: 'a spare lamp', description: '', tags: [], multiple: false, contextChoices: [] },
        },
      });
      renderHealth();

      const unused = group('Unused data');
      expect(within(unused).getByText('a spare lamp')).toBeTruthy();
      expect(within(unused).getByText('item, never given or tested')).toBeTruthy();
      /* Nothing to reveal: an entity is not on the canvas, so its row is inert. */
      expect(within(unused).queryByRole('button', { name: /a spare lamp/ })).toBeNull();
    });
  });

  describe('no start page', () => {
    it('asks for one and does not drown the report in unreachable pages', () => {
      seed({ startPageId: null });
      renderHealth();

      expect(within(group('Start page')).getByText('No start page set')).toBeTruthy();
      expect(
        within(group('Unreachable pages')).getByText(/without a start page there is no path/)
      ).toBeTruthy();
    });
  });
});
