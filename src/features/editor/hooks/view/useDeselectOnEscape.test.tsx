// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDeselectOnEscape } from './useDeselectOnEscape';
import { useEditorStore } from '../../store/useEditorStore';

const pristineState = useEditorStore.getState();

/** Escape is a document listener, so it needs something mounted to register it. */
const Harness = ({ withInput = false }: { withInput?: boolean }) => {
  useDeselectOnEscape();
  return withInput ? <input aria-label="page title" /> : null;
};

describe('useDeselectOnEscape', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
  });

  afterEach(cleanup);

  it('clears the selected page', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().setSelectedPage('page-1');
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().selectedPageId).toBeNull();
  });

  it('cancels a pending choice connection first, keeping the selection', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().setSelectedPage('page-1');
    useEditorStore.getState().setConnectingChoice({ sourcePageId: 'page-1', choiceId: 'choice-1' });
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().connectingChoice).toBeNull();
    expect(useEditorStore.getState().selectedPageId).toBe('page-1');
  });

  it('leaves the selection alone while focus is in a field', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().setSelectedPage('page-1');
    const { getByLabelText } = render(<Harness withInput />);

    await user.click(getByLabelText('page title'));
    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().selectedPageId).toBe('page-1');
  });

  it('does nothing when there is nothing to clear', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().selectedPageId).toBeNull();
  });

  it('leaves a data workspace before touching anything else', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().setActiveWorkspace('audio');
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().activeWorkspace).toBe('graph');
  });

  it('stays out of the way while a dialog owns Escape', async () => {
    const user = userEvent.setup();
    useEditorStore.getState().setActiveWorkspace('items');
    useEditorStore.getState().setOpenDialog('newSubplot');
    render(<Harness />);

    await user.keyboard('{Escape}');

    expect(useEditorStore.getState().activeWorkspace).toBe('items');
  });
});
