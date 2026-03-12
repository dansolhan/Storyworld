import React from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import type { StoryIndexItem } from '../hooks/useStories';

interface StoryCardProps {
  story: StoryIndexItem;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onOpen, onDelete }) => (
  <Card padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{story.title}</h3>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        {story.description || 'No description'}
      </p>
    </div>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button variant="secondary" onClick={() => onDelete(story.id)}>Delete</Button>
      <Button variant="primary" onClick={() => onOpen(story.id)}>Open Editor</Button>
    </div>
  </Card>
);
