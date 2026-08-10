// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorRail } from './EditorRail';
import { useEditorStore } from '../../store/useEditorStore';

const pristineState = useEditorStore.getState();

describe('EditorRail', () => {
  beforeEach(() => {
    useEditorStore.setState(pristineState, true);
    useEditorStore.setState({
      items: { 'item-1': { id: 'item-1', name: 'Rusty Key' } } as never,
      variables: { gold: { type: 'number', value: 0 } } as never,
      statusData: [{ id: 'hp' }, { id: 'mana' }] as never,
    });
  });

  afterEach(cleanup);

  it('lists only workspaces that exist', () => {
    render(<EditorRail />);

    expect(screen.getByRole('button', { name: /Graph/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Items/ })).toBeTruthy();

    // Drawn in the design but not built yet, so deliberately absent.
    expect(screen.queryByRole('button', { name: /Outline/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Text search/ })).toBeNull();
  });

  it('shows a live count beside each data workspace', () => {
    render(<EditorRail />);

    expect(screen.getByRole('button', { name: 'Items, 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Variables, 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Status data, 2' })).toBeTruthy();
  });

  it('moves the editor to the workspace that was clicked', async () => {
    const user = userEvent.setup();
    render(<EditorRail />);

    await user.click(screen.getByRole('button', { name: /Variables/ }));

    expect(useEditorStore.getState().activeWorkspace).toBe('variables');
  });

  it('marks the active workspace as the current page', async () => {
    const user = userEvent.setup();
    render(<EditorRail />);

    expect(screen.getByRole('button', { name: /Graph/ }).getAttribute('aria-current')).toBe('page');

    await user.click(screen.getByRole('button', { name: /Audio/ }));

    expect(screen.getByRole('button', { name: /Audio/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: /Graph/ }).getAttribute('aria-current')).toBeNull();
  });

  it('says so plainly before the first autosave', () => {
    render(<EditorRail />);
    expect(screen.getByText('Not yet saved')).toBeTruthy();
  });
});
