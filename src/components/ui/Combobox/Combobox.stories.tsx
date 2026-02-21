import type { Meta, StoryObj } from '@storybook/react';
import { Combobox } from './Combobox';

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOptions = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

export const Default: Story = {
  args: {
    options: mockOptions,
    placeholder: 'Search for a fruit...',
    onSelect: (value) => console.log('Selected:', value),
  },
};

export const AutoFocus: Story = {
  args: {
    options: mockOptions,
    autoFocus: true,
    placeholder: 'Focused automatically...',
    onSelect: (value) => console.log('Selected:', value),
  },
};
