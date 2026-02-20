import { useState } from 'react';
import { GraphEditor } from './features/editor/GraphEditor';
import { Player } from './features/player/Player';
import { mockStory } from './data/mockStory';
import { Button } from './components/ui/Button/Button';

function App() {
  const [mode, setMode] = useState<'editor' | 'player'>('editor');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Floating Toggle Button */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100 }}>
        {mode === 'editor' ? (
          <Button variant="primary" onClick={() => setMode('player')}>
            ▶ Play Story
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setMode('editor')}>
            ■ Stop Playing
          </Button>
        )}
      </div>

      {mode === 'editor' ? (
        <GraphEditor />
      ) : (
        <Player storyData={mockStory} onExit={() => setMode('editor')} />
      )}
    </div>
  );
}

export default App;
