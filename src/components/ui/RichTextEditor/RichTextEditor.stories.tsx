import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor } from './RichTextEditor';
import { BoldFeature } from './features/BoldFeature';
import { ItalicFeature } from './features/ItalicFeature';

const meta = {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const RichTextEditorWithState = (args: any) => {
  const [content, setContent] = useState('<p>Start typing here...</p>');

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <RichTextEditor
        {...args}
        content={content}
        onChange={setContent}
      />
      <div style={{ marginTop: '20px', padding: '10px', background: 'var(--surface-color)' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>HTML Output:</h4>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{content}</pre>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <RichTextEditorWithState {...args} />,
  args: {
    features: [new BoldFeature(), new ItalicFeature()],
    content: '<p>Start typing here...</p>',
    onChange: () => { },
  },
};
