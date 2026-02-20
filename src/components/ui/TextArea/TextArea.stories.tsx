import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Write your story here...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Paragraph Text',
    placeholder: 'Enter the text for this paragraph...',
  },
};

export const WithError: Story = {
  args: {
    label: 'Paragraph Text',
    defaultValue: 'This is some text...',
    error: 'Text must be at least 10 characters long.',
  },
};
