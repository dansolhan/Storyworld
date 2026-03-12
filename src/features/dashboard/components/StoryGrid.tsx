import React from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { StoryCard } from './StoryCard';
import type { StoryIndexItem } from '../hooks/useStories';

interface StoryGridProps {
  stories: StoryIndexItem[];
  onCreateNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export const StoryGrid: React.FC<StoryGridProps> = ({ stories, onCreateNew, onOpen, onDelete }) => {
  if (stories.length === 0) {
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>No stories yet</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Create a new story or import an existing save file to get started.
        </p>
        <Button variant="primary" onClick={onCreateNew}>Create New Story</Button>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {stories.map(story => (
        <StoryCard 
          key={story.id} 
          story={story} 
          onOpen={onOpen} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};
