import React from 'react';
import { Button } from '../../components/ui/Button/Button';
import { useStories } from './hooks/useStories';
import { StoryGrid } from './components/StoryGrid';

interface DashboardProps {
  onOpenStory: () => void;
  onImportClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenStory, onImportClick }) => {
  const { 
    stories, 
    handleCreateNew, 
    handleLoadDemo, 
    handleOpenExisting, 
    handleDelete 
  } = useStories();

  return (
    <div style={{ padding: '2rem var(--space-8)', width: '100%', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Storyworld AI</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => handleLoadDemo(onOpenStory)}>Load Demo</Button>
          <Button variant="secondary" onClick={onImportClick}>Import Save File</Button>
          <Button variant="primary" onClick={() => handleCreateNew(onOpenStory)}>+ Create New Story</Button>
        </div>
      </header>

      <StoryGrid 
        stories={stories}
        onCreateNew={() => handleCreateNew(onOpenStory)}
        onOpen={(id) => handleOpenExisting(id, onOpenStory)}
        onDelete={handleDelete}
      />
    </div>
  );
};
