// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorMenuBar } from './EditorMenuBar';
import { useEditorStore } from '../../store/useEditorStore';

const pristineState = useEditorStore.getState();

describe('EditorMenuBar', () => {
  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  it('names the story it is editing', () => {
    useEditorStore.setState({ storyTitle: 'The Awakening' });
    render(<EditorMenuBar menus={[]} onPlay={vi.fn()} />);

    expect(screen.getByText('The Awakening')).toBeTruthy();
  });

  /*
   * Passing the handler straight to onClick sent React's click event through as the
   * start page, and the engine opened the story on "The End" because no page had
   * that id. The prop type is `() => void`, so only a test catches it.
   */
  it('plays from the story’s own start page, passing no arguments', async () => {
    const onPlay = vi.fn();
    render(<EditorMenuBar menus={[]} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith();
  });

  it('opens the palette from the search affordance', async () => {
    render(<EditorMenuBar menus={[]} onPlay={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Search anything/ }));

    expect(useEditorStore.getState().openDialog).toBe('palette');
  });

  it('keeps the menus reachable behind the wordmark', async () => {
    render(
      <EditorMenuBar
        menus={[{ label: 'File', items: [{ label: 'Import…', onClick: vi.fn() }] }]}
        onPlay={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Storyworld menu' }));

    expect(screen.getByText('File')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Import…' })).toBeTruthy();
  });
});
