// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusDataWorkspace } from './StatusDataWorkspace';
import { useEditorStore } from '../../store/useEditorStore';
import type { StatusData } from '../../../../domain/Story/StatusData';

const pristineState = useEditorStore.getState();

const poisonCondition = [
  {
    id: 'cond-poison',
    type: 'condition' as const,
    name: 'Check Variable Value',
    blueprintId: 'variable_equals',
    params: { variableKey: 'isPoisoned', comparison: 'equal', value: 'true' },
  },
];

const ENTRIES: StatusData[] = [
  { id: 'sd-hp', title: 'HP', value: '{{hp}} / {{maxHp}}', priority: 20 },
  { id: 'sd-gold', title: 'Gold', value: '{{gold}}', priority: 10, color: '#c28d41' },
  { id: 'sd-poison', title: 'Poisoned', value: '☠', priority: 5, condition: poisonCondition },
];

const seed = (statusData: StatusData[] = ENTRIES) => {
  useEditorStore.setState(pristineState, true);
  useEditorStore.setState({
    statusData,
    variables: {
      hp: { type: 'number', value: 30 },
      maxHp: { type: 'number', value: 30 },
      gold: { type: 'number', value: 15 },
      isPoisoned: { type: 'boolean', value: false },
    },
  });
};

const stored = (): StatusData[] => useEditorStore.getState().statusData;
const rowTitles = (): (string | null)[] =>
  screen.getAllByRole('row').map((row) => row.querySelector('span')!.textContent);

describe('StatusDataWorkspace', () => {
  beforeEach(() => seed());

  afterEach(() => {
    cleanup();
    useEditorStore.setState(pristineState, true);
  });

  describe('the table', () => {
    it('lists entries in the order the reader sees them', () => {
      render(<StatusDataWorkspace />);
      expect(rowTitles()).toEqual(['HP', 'Gold', 'Poisoned']);
    });

    it('says "Always" rather than leaving the condition blank', () => {
      render(<StatusDataWorkspace />);
      const hp = screen.getAllByRole('row')[0];

      expect(within(hp).getByText('Always')).toBeTruthy();
    });

    it('shows a condition as a sentence', () => {
      render(<StatusDataWorkspace />);
      const poison = screen.getAllByRole('row')[2];

      expect(within(poison).getByText('isPoisoned equal true')).toBeTruthy();
    });

    it('reorders by swapping priorities, since priority is what the player reads', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getByRole('button', { name: 'Move Gold up' }));

      expect(rowTitles()).toEqual(['Gold', 'HP', 'Poisoned']);
      const gold = stored().find((entry) => entry.id === 'sd-gold')!;
      const hp = stored().find((entry) => entry.id === 'sd-hp')!;
      expect(gold.priority).toBeGreaterThan(hp.priority!);
    });

    it('cannot move the first entry up or the last one down', () => {
      render(<StatusDataWorkspace />);

      expect(screen.getByRole('button', { name: 'Move HP up' })).toHaveProperty('disabled', true);
      expect(screen.getByRole('button', { name: 'Move Poisoned down' })).toHaveProperty('disabled', true);
    });

    it('says so when there is nothing to track', () => {
      seed([]);
      render(<StatusDataWorkspace />);

      expect(screen.getByText(/No entries yet/)).toBeTruthy();
    });
  });

  describe('the ledger preview', () => {
    it('shows what the reader would see, with the starting values filled in', () => {
      render(<StatusDataWorkspace />);
      const preview = screen.getByRole('complementary', { name: 'Ledger preview' });

      expect(within(preview).getByText('30 / 30')).toBeTruthy();
      expect(within(preview).getByText('15')).toBeTruthy();
    });

    /*
     * Hidden entries stay visible in the editor and say why. The player omits them,
     * which the footnote states so the preview cannot be mistaken for the real thing.
     */
    it('greys a hidden entry and names the condition it needs', () => {
      render(<StatusDataWorkspace />);
      const preview = screen.getByRole('complementary', { name: 'Ledger preview' });

      expect(within(preview).getByText('hidden — needs: isPoisoned equal true')).toBeTruthy();
      expect(within(preview).getByText(/The reader sees nothing in their place/)).toBeTruthy();
    });

    it('drops the footnote when nothing is hidden', () => {
      seed(ENTRIES.slice(0, 2));
      render(<StatusDataWorkspace />);
      const preview = screen.getByRole('complementary', { name: 'Ledger preview' });

      expect(within(preview).queryByText(/sees nothing in their place/)).toBeNull();
    });

    it('follows an edit', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[0]);

      const title = screen.getByRole('textbox', { name: 'Title' });
      await userEvent.clear(title);
      await userEvent.type(title, 'Health');

      const preview = screen.getByRole('complementary', { name: 'Ledger preview' });
      expect(within(preview).getByText(/Health/)).toBeTruthy();
    });
  });

  describe('the entry editor', () => {
    it('appears only once a row is chosen', async () => {
      render(<StatusDataWorkspace />);
      expect(screen.queryByLabelText(/^Editing/)).toBeNull();

      await userEvent.click(screen.getAllByRole('row')[0]);
      expect(screen.getByLabelText('Editing HP')).toBeTruthy();
    });

    it('appends a variable token rather than replacing the value', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[1]);

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Insert variable' }), 'hp');

      expect(stored().find((entry) => entry.id === 'sd-gold')!.value).toBe('{{gold}}{{hp}}');
    });

    it('sets and clears a colour', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[0]);

      await userEvent.click(screen.getByRole('button', { name: 'Gold' }));
      expect(stored().find((entry) => entry.id === 'sd-hp')!.color).toBe('#c28d41');

      await userEvent.click(screen.getByRole('button', { name: 'No colour' }));
      expect(stored().find((entry) => entry.id === 'sd-hp')!.color).toBeUndefined();
    });

    it('says an entry with no condition is always shown', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[0]);

      expect(screen.getByText('Always shown.')).toBeTruthy();
    });

    it('adds a condition through the same picker the rules use', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[0]);
      await userEvent.click(screen.getByRole('button', { name: 'Add a condition' }));

      // Conditions only — an action here would never be run.
      const options = screen.getAllByRole('option').map((option) => option.textContent);
      expect(options.every((text) => text?.startsWith('If'))).toBe(true);

      await userEvent.click(screen.getByRole('option', { name: /the reader carries the item/ }));

      expect(stored().find((entry) => entry.id === 'sd-hp')!.condition).toHaveLength(1);
    });
  });

  describe('creating and deleting', () => {
    it('adds a new entry at the foot of the ledger and selects it', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getByRole('button', { name: 'New entry' }));

      expect(rowTitles()).toEqual(['HP', 'Gold', 'Poisoned', 'New entry']);
      expect(screen.getByLabelText('Editing New entry')).toBeTruthy();
    });

    it('confirms before deleting', async () => {
      render(<StatusDataWorkspace />);
      await userEvent.click(screen.getAllByRole('row')[0]);
      await userEvent.click(screen.getByRole('button', { name: 'Delete this entry' }));

      expect(screen.getByText(/Delete “HP”/)).toBeTruthy();
      expect(stored()).toHaveLength(3);

      // Scoped to the dialog: the row's own "Delete this entry" matches too.
      const dialog = screen.getByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
      expect(stored().map((entry) => entry.id)).toEqual(['sd-gold', 'sd-poison']);
    });
  });
});
