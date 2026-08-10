import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerWithTrigger = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
      <Drawer {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div style={{ padding: '20px' }}>
          <p>This is the content of the drawer.</p>
          <div style={{ marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <DrawerWithTrigger {...args} />,
  args: {
    title: 'Example Drawer',
    isOpen: false,
    onClose: () => { },
    children: <div>Content</div>,
  },
};

export const CustomWidth: Story = {
  render: (args) => <DrawerWithTrigger {...args} />,
  args: {
    title: 'Wide Drawer',
    width: '600px',
    isOpen: false,
    onClose: () => { },
    children: <div>Content</div>,
  },
};
