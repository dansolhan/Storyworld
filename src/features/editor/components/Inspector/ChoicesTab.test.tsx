// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { ChoicesTab } from './ChoicesTab';
import { useEditorStore } from '../../store/useEditorStore';
import { useToastStore } from '../../../../components/ui/Toast/useToastStore';
import type { Page } from '../../../../domain/Page/Page';
import type { EditorNode } from '../../store/editorTypes';

const pristineState = useEditorStore.getState();

const node = (id: string, x = 0): EditorNode => ({
  id,
  type: 'pageNode',
  position: { x, y: 0 },
  data: { type: 'location', title: id, paragraphs: [], choices: [] },
});

const SOURCE: Page = {
  id: 'page-1',
  title: 'The Locked Door',
  paragraphs: [],
  choices: [
    { id: 'choice-1', text: 'Rattle the handle' },
    { id: 'choice-2', text: 'Walk away', targetPageId: 'page-2' },
  ],
};

const TARGET: Page = { id: 'page-2', title: 'The Hidden Lock', paragraphs: [], choices: [] };

const seed = () => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    pages: { 'page-1': SOURCE, 'page-2': TARGET },
    nodes: [node('page-1'), node('page-2', 400)],
  });
  useToastStore.setState({ toast: null });
};

const renderTab = () => {
  const page = useEditorStore.getState().pages['page-1'];
  render(
    <ReactFlowProvider>
      <ChoicesTab page={page} />
    </ReactFlowProvider>
  );
};

const pageIds = (): string[] => Object.keys(useEditorStore.getState().pages);
const targetOf = (choiceId: string): string | undefined =>
  useEditorStore.getState().pages['page-1'].choices.find((c) => c.id === choiceId)?.targetPageId;

describe('ChoicesTab', () => {
  beforeEach(seed);

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
    useToastStore.setState({ toast: null });
  });

  it('lists each choice with its target', () => {
    renderTab();

    expect(screen.getByDisplayValue('Rattle the handle')).toBeTruthy();
    expect(screen.getByText('No target page')).toBeTruthy();
    expect(screen.getByRole('button', { name: /The Hidden Lock/ })).toBeTruthy();
  });

  it('branches to a new page on ⌘⏎ while writing a choice', async () => {
    renderTab();

    await userEvent.click(screen.getByDisplayValue('Rattle the handle'));
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');

    const created = pageIds().find((id) => !['page-1', 'page-2'].includes(id));
    expect(created).toBeTruthy();
    expect(targetOf('choice-1')).toBe(created);
  });

  it('accepts Ctrl+⏎ too, so an external keyboard still works', async () => {
    renderTab();

    await userEvent.click(screen.getByDisplayValue('Rattle the handle'));
    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    expect(pageIds()).toHaveLength(3);
  });

  it('leaves plain Enter alone, so a stray keystroke cannot create a page', async () => {
    renderTab();

    await userEvent.click(screen.getByDisplayValue('Rattle the handle'));
    await userEvent.keyboard('{Enter}');

    expect(pageIds()).toHaveLength(2);
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('repoints a choice that already had a target, and offers to undo it', async () => {
    renderTab();

    await userEvent.click(screen.getByDisplayValue('Walk away'));
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');

    const created = pageIds().find((id) => !['page-1', 'page-2'].includes(id));
    expect(targetOf('choice-2')).toBe(created);

    const toast = useToastStore.getState().toast!;
    expect(toast.message).toContain('repointed');

    toast.action!.onClick();
    expect(targetOf('choice-2')).toBe('page-2');
    expect(pageIds()).toHaveLength(2);
  });

  it('branches from the button as well as the shortcut', async () => {
    renderTab();

    await userEvent.click(screen.getAllByRole('button', { name: 'To new page' })[0]);

    expect(pageIds()).toHaveLength(3);
    expect(useToastStore.getState().toast).not.toBeNull();
  });

  it('says what to do on a page with nowhere to go', () => {
    useEditorStore.setState({ pages: { 'page-1': { ...SOURCE, choices: [] } } });
    renderTab();

    expect(screen.getByText(/End of the line/)).toBeTruthy();
  });
});
