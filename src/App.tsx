import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from './features/editor/GraphEditor';
import { Player } from './features/player/Player';
import { Button } from './components/ui/Button/Button';
import { useEditorStore } from './features/editor/store/useEditorStore';
import { compileGraphToStory } from './lib/storyMapper';
import type { StoryData } from './domain/Story/StoryData';

function App() {
  const [mode, setMode] = useState<'editor' | 'player'>('editor');
  const [playingStory, setPlayingStory] = useState<StoryData | null>(null);

  const handlePlay = () => {
    // We get the state non-reactively so App.tsx doesn't re-render 
    // every single time a node is dragged on the canvas!
    const { nodes, edges, variables, storyTitle, storyDescription, startPageId } = useEditorStore.getState();
    const compiledStory = compileGraphToStory(nodes, edges, variables, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    });
    setPlayingStory(compiledStory);
    setMode('player');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Floating Toggle Button */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100 }}>
        {mode === 'editor' ? (
          <Button variant="primary" onClick={handlePlay}>
            ▶ Play Story
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setMode('editor')}>
            ■ Stop Playing
          </Button>
        )}
      </div>

      {mode === 'editor' ? (
        <ReactFlowProvider>
          <GraphEditor />
        </ReactFlowProvider>
      ) : (
        playingStory && <Player storyData={playingStory} onExit={() => setMode('editor')} />
      )}
    </div>
  );
}

export default App;
