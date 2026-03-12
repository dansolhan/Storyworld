import type { Meta, StoryObj } from '@storybook/react';
import { Player } from './Player';

const meta: Meta<typeof Player> = {
  title: 'Features/Player',
  component: Player,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
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
        hp: { type: 'number', value: 85 },
        maxHp: { type: 'number', value: 100 },
        gold: { type: 'number', value: 42 },
      },
      statusData: [
        { id: 'poisoned', title: 'Poisoned' },
        { id: 'sd-hp', title: 'HP', value: '{{hp}} / {{maxHp}}', priority: 100 },
        { id: 'sd-gold', title: 'Gold', value: '{{gold}}', priority: 90, color: '#c9a84c' },
      ],
      pages: [
        {
          id: 'start',
          title: 'The Ancient Ruins',
          paragraphs: [
            { id: 'p1', text: 'Welcome, {{playerName}}. You stand before the creeping vines of the ancient ruins.' },
            { id: 'p2', text: 'The ancient stone structures, overgrown with millennia of vibrant green vegetation, emanate an almost tangible aura of forgotten power. Enormous blocky obelisks cast long, deep shadows against the damp earth, drawing your eyes up to the ruined archway that serves as the main entrance.' },
            { id: 'p3', text: 'The air here is unnaturally still, smelling slightly of ozone and crushed wet leaves. You can hear nothing but the faint sound of your own heartbeat hammering in your ears as you evaluate the massive doorway before you.' },
            { id: 'p4', text: 'To your right, a crumbling statue of an unknown deity stares blankly into the distance. Its stone eyes seem to track your every subtle movement, though you know that is merely a trick of the dappled light filtering through the dense canopy above.' },
            { id: 'p5', text: 'The wind whispers secrets of a time long forgotten, daring you to take the first step.' }
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
            { id: 'p6', text: 'Dust motes dance in the shafts of light piercing the broken ceiling, illuminating the sprawling interior.' },
            { id: 'p7', text: 'This central chamber is vastly larger than the exterior suggested. Towering obsidian pillars reach up toward a vaulted ceiling that is largely lost to the gloom. The stone floor beneath your boots is surprisingly smooth, though fractured in places by the relentless upward push of ancient roots.' },
            { id: 'p8', text: 'In the center of the hall rests a massive circular dais. Strange circular grooves and unidentifiable runes are carved deeply into the stone. They appear to form some sort of complex locking mechanism or calendar system, their purpose obscured by the heavy layers of dust and time.' },
            { id: 'p9', text: 'A sudden chill sweeps through the hall, and for a fleeting moment, you swear you hear the faint, echoing sound of a choir chanting in a language you cannot comprehend.' },
            { id: 'p10', text: 'A giant stone door blocks your path forward, covered in the same intricate carvings as the dais.' }
          ],
          choices: [
            { id: 'c3', text: 'Flee back outside', targetPageId: 'start' }
          ]
        },
        {
          id: 'escape',
          title: 'A Safe Retreat',
          paragraphs: [
            { id: 'p11', text: 'You decided the ruins were too dangerous. The oppressive atmosphere of the old stones was simply too much to bear.' },
            { id: 'p12', text: 'You turn your back on the crumbling structures and begin the long, arduous trek backward through the dense jungle undergrowth.' },
            { id: 'p13', text: 'As the ruins finally vanish completely from your sight behind the thick canopy, a profound wave of relief washes over you. You know in your heart that leaving was the correct choice, even if the mysteries of the ancients must remain unsolved.' },
            { id: 'p14', text: 'By the time you finally see the familiar smoke rising from the chimneys of your home village, the sun has already begun its descent beyond the horizon. You head back to the village, safe but forever changed by what little you saw.' }
          ],
          choices: []
        }
      ]
    }
  },
};
