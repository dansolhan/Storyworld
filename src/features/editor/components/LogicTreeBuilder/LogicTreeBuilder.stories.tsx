import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { LogicTree } from './LogicTree';
import { LogicToolbox } from './LogicToolbox';
import type { LogicNode } from './types';

const meta = {
  title: 'Features/Editor/LogicTreeBuilder',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

import { useEditorStore } from '../../store/useEditorStore';
import type { EditorNode } from '../../store/editorTypes';

// A container component to hold state for the story
const LogicTreeBuilderSandbox = () => {
  const [data, setData] = useState<LogicNode[]>([
    {
      id: 'initial_action',
      type: 'action',
      name: 'Post Message',
      blueprintId: 'post_message',
      params: { message: 'Hello World!' }
    }
  ]);

  // Seed standard Zustand store so BlueprintRenderer popovers have mock items to select in Storybook
  useEffect(() => {
    useEditorStore.setState({
      // 'page' was never a registered node type; the cast that used to be here hid it.
      nodes: [
        { id: 'page_1', type: 'pageNode', position: { x: 0, y: 0 }, data: { title: 'Tavern Entrance', paragraphs: [], choices: [] } },
        { id: 'page_2', type: 'pageNode', position: { x: 0, y: 0 }, data: { title: 'Dark Forest', paragraphs: [], choices: [] } },
        { id: 'page_3', type: 'pageNode', position: { x: 0, y: 0 }, data: { title: 'Goblin Cave', paragraphs: [], choices: [] } },
      ] satisfies EditorNode[],
      variables: {
        'player_gold': { type: 'number', value: 50 },
        'has_sword': { type: 'boolean', value: false }
      },
      items: {
        'item_sword': { id: 'item_sword', name: 'Iron Sword', description: 'Sharp', multiple: false, tags: [], contextChoices: [] }
      }
    });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#111115', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <LogicToolbox />
      <div style={{ flexGrow: 1, padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box', minWidth: 0 }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 500, opacity: 0.8 }}>Sequence Builder</h2>
        <LogicTree data={data} onChange={setData} />
      </div>
    </div>
  );
};

// --- Stories ---

export const BuilderDemo: Story = {
  render: () => <LogicTreeBuilderSandbox />,
};

export const ToolboxOnly: Story = {
  render: () => (
    <div style={{ padding: '2rem', height: '100vh', backgroundColor: '#111115' }}>
      <LogicToolbox 
        onDragStart={(_e, item) => console.log('Storybook onDragStart', item)}
      />
    </div>
  ),
};

export const TreeOnly: Story = {
  render: () => {
    const [data, setData] = useState<LogicNode[]>([
      {
        id: '1',
        type: 'condition',
        name: 'Visited page',
        blueprintId: 'visited_page',
        children: [
          {
            id: '2', type: 'branch_then', name: 'Then', children: [
              { id: '3', type: 'action', name: 'Post Message', blueprintId: 'post_message' }
            ]
          },
          { id: '4', type: 'branch_else', name: 'Else', children: [] }
        ]
      }
    ]);
    return (
      <div style={{ padding: '2rem', height: '100vh', width: '100%', backgroundColor: '#111115', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ color: 'white', opacity: 0.5, marginBottom: '1rem' }}>Standalone Tree Component (Internal Reordering Only)</h3>
        <LogicTree data={data} onChange={setData} />
      </div>
    );
  },
};
