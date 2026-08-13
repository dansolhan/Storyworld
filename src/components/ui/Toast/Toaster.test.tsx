// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from './Toaster';
import { useToastStore } from './useToastStore';

describe('Toaster', () => {
  beforeEach(() => {
    useToastStore.setState({ toast: null });
  });

  afterEach(() => {
    cleanup();
    useToastStore.setState({ toast: null });
  });

  it('shows nothing until there is something to say', () => {
    render(<Toaster />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says what happened', () => {
    render(<Toaster />);
    act(() => useToastStore.getState().showToast('New page created.'));

    expect(screen.getByText('New page created.')).toBeTruthy();
  });

  it('runs the action and closes on the same click', async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => useToastStore.getState().showToast('New page created.', { label: 'Undo', onClick }));

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('can be dismissed without running the action', async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => useToastStore.getState().showToast('New page created.', { label: 'Undo', onClick }));

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('shows no action button when there is nothing to undo', () => {
    render(<Toaster />);
    act(() => useToastStore.getState().showToast('Saved.'));

    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  /*
   * Holding one toast is a decision, not a limitation: two Undos stacked up
   * leave the author guessing which belongs to which action.
   */
  it('replaces the previous message rather than stacking', () => {
    render(<Toaster />);
    act(() => useToastStore.getState().showToast('First.'));
    act(() => useToastStore.getState().showToast('Second.'));

    expect(screen.queryByText('First.')).toBeNull();
    expect(screen.getByText('Second.')).toBeTruthy();
  });

  it('gives each showing a fresh id, so the timer restarts', () => {
    useToastStore.getState().showToast('First.');
    const first = useToastStore.getState().toast!.id;
    useToastStore.getState().showToast('First.');

    expect(useToastStore.getState().toast!.id).not.toBe(first);
  });
});
