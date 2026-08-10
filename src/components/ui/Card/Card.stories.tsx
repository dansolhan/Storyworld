import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3>Card Title</h3>
        <p>This is some content inside the card.</p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <div>
        <h3>Interactive Card</h3>
        <p>Hover me to see the effect.</p>
      </div>
    ),
  },
};
