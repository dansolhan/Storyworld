import type { Meta, StoryObj } from '@storybook/react';
import { Player } from './Player';

const meta: Meta<typeof Player> = {
  title: 'Features/Player',
  component: Player,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Player>;

export const Default: Story = {
  args: {
    onExit: () => alert('Left the player!'),
    storyData: {
      version: 6,
      variables: {
        playerName: { type: 'string', value: 'Wanderer' },
      },
      pages: [
        {
          id: 'start',
          title: 'The Ancient Ruins',
          paragraphs: [
            { id: 'p1', text: 'Welcome, {{playerName}}. You stand before the creeping vines of the ancient ruins.' },
            { id: 'p2', text: 'The wind whispers secrets of a time long forgotten.' }
          ],
          choices: [
            { id: 'c1', text: 'Step into the shadows', targetPageId: 'inside' },
            { id: 'c2', text: 'Turn back safely', targetPageId: 'escape' }
          ]
        },
        {
          id: 'inside',
          title: 'The Great Hall',
          paragraphs: [
            { id: 'p3', text: 'Dust motes dance in the shafts of light piercing the broken ceiling.' },
            { id: 'p4', text: 'A giant stone door blocks your path forward.' }
          ],
          choices: [
            { id: 'c3', text: 'Flee back outside', targetPageId: 'start' }
          ]
        },
        {
          id: 'escape',
          title: 'A Safe Retreat',
          paragraphs: [
            { id: 'p5', text: 'You decided the ruins were too dangerous. You head back to the village.' }
          ],
          choices: []
        }
      ]
    }
  },
};
