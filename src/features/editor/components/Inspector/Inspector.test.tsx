// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { Inspector } from './Inspector';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';

/*
 * The Write tab mounts TipTap, which needs a layout engine jsdom does not
 * provide. These tests are about the shell — which tabs exist, which body they
 * show, what the footer does — so the editor itself is stubbed out.
 */
vi.mock('../../../../components/ui/RichTextEditor/RichTextEditor', () => ({
  RichTextEditor: ({ content }: { content: string }) => <div data-testid="rich-text">{content}</div>,
}));

const pristineState = useEditorStore.getState();

const PAGE: Page = {
  id: 'page-1',
  title: 'The Locked Door',
  type: 'location',
  paragraphs: [{ id: 'para-1', text: 'The door is solid oak.' }],
  choices: [
    { id: 'choice-1', text: 'Rattle the handle', targetPageId: 'page-2' },
    { id: 'choice-2', text: 'Walk away' },
  ],
  events: [],
};

const OTHER_PAGE: Page = {
  id: 'page-2',
  title: 'The Hidden Lock',
  paragraphs: [],
  choices: [],
  events: [],
};

const renderInspector = (onPlayFromPage = vi.fn()) => {
  render(
    <ReactFlowProvider>
      <Inspector onPlayFromPage={onPlayFromPage} />
    </ReactFlowProvider>
  );
  return onPlayFromPage;
};

describe('Inspector', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    useEditorStore.setState({
      pages: { 'page-1': PAGE, 'page-2': OTHER_PAGE },
      storyTitle: 'The Awakening',
      storyDescription: 'A short descent.',
      startPageId: 'page-1',
    });
  });

  afterEach(cleanup);

  describe('with nothing selected', () => {
    it('keeps the column and describes the story instead', () => {
      renderInspector();

      expect(screen.getByText('The Awakening')).toBeTruthy();
      expect(screen.getByText('A short descent.')).toBeTruthy();
      expect(screen.getByText('Select a page to edit it.')).toBeTruthy();
    });

    it('counts only what it can derive from the graph', () => {
      renderInspector();

      expect(screen.getByText('2 pages')).toBeTruthy();
      expect(screen.getByText('2 choices')).toBeTruthy();
      // page-2 has no choices.
      expect(screen.getByText('1 without choices')).toBeTruthy();
      expect(screen.getByText('Begins at The Locked Door')).toBeTruthy();
    });
  });

  describe('with a page selected', () => {
    beforeEach(() => {
      useEditorStore.getState().setSelectedPage('page-1');
    });

    it('names the page and shows the four tabs', () => {
      renderInspector();

      expect(screen.getByRole('heading', { name: 'The Locked Door' })).toBeTruthy();
      expect(screen.getByText('page-1')).toBeTruthy();

      for (const tab of ['Write', 'Choices', 'Logic', 'Settings']) {
        expect(screen.getByRole('tab', { name: new RegExp(tab) })).toBeTruthy();
      }
    });

    it('starts on Write', () => {
      renderInspector();
      expect(screen.getByRole('tab', { name: /Write/ }).getAttribute('data-state')).toBe('active');
    });

    it('swaps the body when another tab is chosen', async () => {
      const user = userEvent.setup();
      renderInspector();

      await user.click(screen.getByRole('tab', { name: /Choices/ }));

      expect(useEditorStore.getState().inspectorTab).toBe('choices');
      expect(screen.getByDisplayValue('Rattle the handle')).toBeTruthy();
      // Names the target page rather than its id.
      expect(screen.getByRole('button', { name: /The Hidden Lock/ })).toBeTruthy();
      expect(screen.getByText('No target page')).toBeTruthy();
    });

    it('shows the page settings on the Settings tab', async () => {
      const user = userEvent.setup();
      renderInspector();

      await user.click(screen.getByRole('tab', { name: 'Settings' }));

      /* The title is not here: it moved to Write, where the prose is. */
      expect(screen.getByRole('combobox', { name: 'Type' })).toBeTruthy();
      expect(screen.getByText('The story starts here')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Delete this page' })).toBeTruthy();
    });

    it('plays from the selected page', async () => {
      const user = userEvent.setup();
      const onPlayFromPage = renderInspector();

      await user.click(screen.getByRole('button', { name: /Play from here/ }));

      expect(onPlayFromPage).toHaveBeenCalledWith('page-1');
    });
  });

});
