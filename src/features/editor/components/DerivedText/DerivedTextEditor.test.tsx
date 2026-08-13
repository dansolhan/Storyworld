// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DerivedTextEditor } from './DerivedTextEditor';
import { useEditorStore } from '../../store/useEditorStore';
import type { DerivedText } from '../../../../domain/DerivedText/DerivedText';
import type { LogicNode } from '../../../../domain/Story/LogicNode';

const pristineState = useEditorStore.getState();

const varIs = (variableKey: string, value: string): LogicNode[] => [
  {
    id: `c-${variableKey}`,
    type: 'condition',
    name: 'Check Variable Value',
    blueprintId: 'variable_equals',
    params: { variableKey, comparison: 'equal', value },
  },
];

const DERIVED: DerivedText = {
  id: 'dt-1',
  outcomes: [
    { id: 'o1', text: 'Old Gil', condition: varIs('metGil', 'true') },
    { id: 'o2', text: 'a stranger', condition: [] },
  ],
};

const seed = (derived: DerivedText = DERIVED, metGil = false) => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    derivedTexts: { [derived.id]: derived },
    variables: { metGil: { type: 'boolean', value: metGil } },
  });
};

const stored = (): DerivedText => useEditorStore.getState().derivedTexts['dt-1'];

/*
 * Mirrors `DerivedTextChip`, which subscribes to the store: the editor is handed a
 * fresh `derived` after every edit. Rendering with a static prop would make each
 * keystroke apply to a stale value.
 */
const LiveEditor: React.FC = () => {
  const derived = useEditorStore((state) => state.derivedTexts['dt-1']);
  return <DerivedTextEditor derived={derived} onClose={vi.fn()} />;
};

const renderEditor = () => {
  render(<LiveEditor />);
};

const sectionOf = (element: HTMLElement): HTMLElement => element.closest('section')!;

describe('DerivedTextEditor', () => {
  beforeEach(() => seed());

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  it('lists the outcomes in the order they are evaluated', () => {
    renderEditor();
    expect(screen.getByDisplayValue('Old Gil')).toBeTruthy();
    expect(screen.getByDisplayValue('a stranger')).toBeTruthy();
  });

  /*
   * The badge is the whole reason for a preview: which line wins under the starting
   * values, evaluated by the same function the player uses.
   */
  it('badges the outcome that resolves under the starting values', () => {
    renderEditor();
    const badge = screen.getByText('resolves now');

    expect(sectionOf(badge).contains(screen.getByDisplayValue('a stranger'))).toBe(true);
  });

  it('moves the badge when the starting values change which line wins', () => {
    seed(DERIVED, true);
    renderEditor();

    expect(
      sectionOf(screen.getByText('resolves now')).contains(screen.getByDisplayValue('Old Gil'))
    ).toBe(true);
  });

  it('says an unconditional outcome is the fallback', () => {
    renderEditor();
    expect(screen.getByText('otherwise — the fallback')).toBeTruthy();
  });

  it('shows a condition as a sentence', () => {
    renderEditor();
    expect(screen.getByText('metGil')).toBeTruthy();
  });

  it('edits an outcome’s text', async () => {
    renderEditor();
    const input = screen.getByDisplayValue('Old Gil');

    await userEvent.clear(input);
    await userEvent.type(input, 'Gil');

    expect(stored().outcomes[0].text).toBe('Gil');
  });

  it('reorders outcomes, because the first match wins', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Move outcome 2 up' }));

    expect(stored().outcomes.map((outcome) => outcome.text)).toEqual(['a stranger', 'Old Gil']);
  });

  it('cannot move the first outcome up or the last one down', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: 'Move outcome 1 up' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Move outcome 2 down' })).toHaveProperty('disabled', true);
  });

  it('removes an outcome', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Remove outcome 1' }));

    expect(stored().outcomes.map((outcome) => outcome.id)).toEqual(['o2']);
  });

  it('adds an outcome, unconditional until given a condition', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Add an outcome' }));

    expect(stored().outcomes).toHaveLength(3);
    expect(stored().outcomes[2].condition).toEqual([]);
  });

  it('reminds you that order decides it', () => {
    renderEditor();
    expect(screen.getByText(/The first match wins/)).toBeTruthy();
  });

  /* Without an unconditional outcome the sentence can come out with a hole in it. */
  it('warns when nothing is guaranteed to catch', () => {
    seed({ id: 'dt-1', outcomes: [DERIVED.outcomes[0]] });
    renderEditor();

    expect(screen.getByText(/can resolve to nothing/)).toBeTruthy();
    expect(screen.queryByText('resolves now')).toBeNull();
  });

  it('says so when there is nothing written yet', () => {
    seed({ id: 'dt-1', outcomes: [] });
    renderEditor();

    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
  });
});
