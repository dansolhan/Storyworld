// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { AtmospheresWorkspace } from './AtmospheresWorkspace';
import { useEditorStore } from '../../store/useEditorStore';
import type { Page } from '../../../../domain/Page/Page';

/* Decoding audio and playing it need APIs jsdom has not got. */
vi.mock('../AudioWaveform/AudioWaveform', () => ({
  AudioWaveform: ({ label }: { label: string }) => <div data-testid="waveform">{label}</div>,
}));

const pristineState = useEditorStore.getState();

const page = (id: string, title: string, atmosphereId?: string): Page => ({
  id,
  title,
  paragraphs: [],
  choices: [],
  atmosphereId,
});

const seed = () => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    pages: {
      p1: page('p1', 'The Awakening', 'atmo-main'),
      p2: page('p2', 'Checking Pockets', 'atmo-main'),
      p3: page('p3', 'The Locked Door', 'atmo-main'),
      p4: page('p4', 'Deep into the Woods', 'atmo-main'),
    },
    atmospheres: {
      'atmo-main': { id: 'atmo-main', title: 'Main Room Vibes', music: 'track-1', color: '#c28d41' },
      'atmo-quiet': { id: 'atmo-quiet', title: 'Riverside' },
    },
    audio: {
      'track-1': {
        id: 'track-1',
        title: 'Mystery',
        description: '',
        type: 'music',
        src: 'data:audio/wav;base64,AA',
      },
    },
  });
};

const renderWorkspace = () =>
  render(
    <ReactFlowProvider>
      <AtmospheresWorkspace />
    </ReactFlowProvider>
  );

const expand = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: new RegExp(name) }));
};

describe('AtmospheresWorkspace', () => {
  beforeEach(seed);
  afterEach(cleanup);

  it('collapses each atmosphere to its track, fade and page count', () => {
    renderWorkspace();
    expect(screen.getByRole('button', { name: /Main Room Vibes/ }).textContent).toContain(
      'Mystery · fade 1.0s · on 4 pages'
    );
  });

  it('calls out an atmosphere with no track and no pages', () => {
    renderWorkspace();
    expect(screen.getByRole('button', { name: /Riverside/ }).textContent).toContain(
      'No track chosen · not used on any page'
    );
  });

  it('opens one row at a time', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await expand(user, 'Main Room Vibes');
    expect(screen.getByRole('region', { name: 'Main Room Vibes' })).toBeTruthy();

    await expand(user, 'Riverside');
    expect(screen.getByRole('region', { name: 'Riverside' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Main Room Vibes' })).toBeNull();
  });

  it('shows the settings line with the defaults resolved', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    // Nothing is stored, so the player's own default shows.
    expect(screen.getByText('1.0s')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByDisplayValue('Mystery')).toBeTruthy();
  });

  it('assigns a track in place', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Riverside');

    await user.selectOptions(screen.getByDisplayValue('None'), 'track-1');
    expect(useEditorStore.getState().atmospheres['atmo-quiet'].music).toBe('track-1');
  });

  it('sends you to the audio library when there is no track', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Riverside');

    await user.click(screen.getByRole('button', { name: 'Choose a track' }));
    expect(useEditorStore.getState().activeWorkspace).toBe('audio');
  });

  it('renames in place, and abandons the edit on Escape', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const field = screen.getByLabelText('Atmosphere name');
    await user.clear(field);
    await user.type(field, 'Front Room{Enter}');
    expect(useEditorStore.getState().atmospheres['atmo-main'].title).toBe('Front Room');

    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByLabelText('Atmosphere name'), ' and hall{Escape}');
    expect(useEditorStore.getState().atmospheres['atmo-main'].title).toBe('Front Room');
  });

  it('picks a colour from the palette', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    await user.click(screen.getByRole('button', { name: 'Ash' }));
    expect(useEditorStore.getState().atmospheres['atmo-main'].color).toBe('#736c63');
  });

  it('keeps a colour that is not in the palette as its own swatch', async () => {
    const user = userEvent.setup();
    useEditorStore.setState({
      atmospheres: {
        'atmo-main': { id: 'atmo-main', title: 'Main Room Vibes', color: '#3b82f6' },
      },
    });
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    expect(screen.getByTitle('#3b82f6 — already set on this atmosphere')).toBeTruthy();
  });

  it('lists the pages it is used on, collapsing the rest', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    expect(screen.getByRole('button', { name: 'The Awakening' })).toBeTruthy();
    // Three chips shown, then a count for the fourth.
    await user.click(screen.getByRole('button', { name: '+ 1 more' }));
    expect(screen.getByRole('button', { name: 'Deep into the Woods' })).toBeTruthy();
  });

  it('reveals a page from its chip', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    await user.click(screen.getByRole('button', { name: 'The Awakening' }));
    const state = useEditorStore.getState();
    expect(state.activeWorkspace).toBe('graph');
    expect(state.selectedPageId).toBe('p1');
  });

  it('warns how many pages depend on an atmosphere before deleting', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await expand(user, 'Main Room Vibes');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText(/It is used on 4 pages/)).toBeTruthy();

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(useEditorStore.getState().atmospheres['atmo-main']).toBeUndefined();
  });

  it('creates a new atmosphere, expanded and on-palette', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: /New atmosphere/ }));

    const created = Object.values(useEditorStore.getState().atmospheres).find(
      (atmosphere) => atmosphere.title === 'New atmosphere'
    );
    expect(created?.color).toBe('#c28d41');
    expect(screen.getByRole('region', { name: 'New atmosphere' })).toBeTruthy();
  });
});
