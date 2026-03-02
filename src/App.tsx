import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from './features/editor/GraphEditor';
import { Player } from './features/player/Player';
import { Button } from './components/ui/Button/Button';
import { useEditorStore } from './features/editor/store/useEditorStore';
import { compileGraphToStory } from './lib/storyMapper';
import { exportToJson, exportToStoryworld } from './utils/exportUtils';
import { useStoryImport } from './features/editor/hooks/useStoryImport';
import type { StoryData } from './domain/Story/StoryData';
import { MenuBar, type MenuConfig } from './components/ui/MenuBar/MenuBar';

import { Dashboard } from './features/dashboard/Dashboard';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'editor' | 'player'>('dashboard');
  const [playingStory, setPlayingStory] = useState<StoryData | null>(null);
  const { fileInputRef, handleImportClick, handleFileChange } = useStoryImport();

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

  const handleExportJson = () => {
    const { nodes, edges, variables, storyTitle, storyDescription, startPageId } = useEditorStore.getState();
    const storyData = compileGraphToStory(nodes, edges, variables, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    });
    exportToJson(storyData);
  };

  const handleExportStoryworld = () => {
    const { nodes, edges, variables, storyTitle, storyDescription, startPageId } = useEditorStore.getState();
    const storyData = compileGraphToStory(nodes, edges, variables, {
      title: storyTitle,
      description: storyDescription,
      startPageId
    });
    exportToStoryworld(storyData);
  };

  const menus: MenuConfig[] = [
    {
      label: 'File',
      items: [
        { label: '< Back to Dashboard', onClick: () => setMode('dashboard') },
        { divider: true },
        { label: 'Open File...', onClick: handleImportClick },
        { divider: true },
        { label: 'Save / Export to JSON', onClick: handleExportJson },
        { label: 'Export as .storyworld', onClick: handleExportStoryworld },
      ]
    },
    {
      label: 'Story',
      items: [
        { label: 'Settings', onClick: () => useEditorStore.getState().setIsStorySettingsOpen(true) }
      ]
    },
    {
      label: 'Data',
      items: [
        { label: 'Variables', onClick: () => useEditorStore.getState().setIsVariableManagerOpen(true) }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Editor Mode', onClick: () => setMode('editor') },
        { label: 'Play Mode', onClick: () => mode === 'editor' ? handlePlay() : undefined }
      ]
    }
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {mode !== 'dashboard' && <MenuBar menus={menus} />}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Floating Toggle Button */}
        {mode !== 'dashboard' && (
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
        )}

        {mode === 'dashboard' ? (
          <Dashboard
            onOpenStory={() => setMode('editor')}
            onImportClick={handleImportClick}
          />
        ) : mode === 'editor' ? (
          <ReactFlowProvider>
            <GraphEditor />
          </ReactFlowProvider>
        ) : (
          playingStory && <Player storyData={playingStory} onExit={() => setMode('editor')} />
        )}
      </div>
    </div>
  );
}

export default App;
