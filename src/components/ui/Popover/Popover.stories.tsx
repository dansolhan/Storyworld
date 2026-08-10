import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from './Popover';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '400px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const PopoverWithTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Position slightly below the button
    setPosition({ x: rect.left, y: rect.bottom + 8 });
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Button onClick={handleClick}>Toggle Popover</Button>
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        x={position.x}
        y={position.y}
      >
        <div style={{ padding: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Popover Content</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You can place any content here.</p>
        </div>
      </Popover>
    </>
  );
};

export const Default: Story = {
  render: () => <PopoverWithTrigger />,
  args: {
    isOpen: false,
    x: 0,
    y: 0,
    children: <div>Content</div>,
  },
};
