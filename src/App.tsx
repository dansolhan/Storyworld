import { useState, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from './features/editor/GraphEditor';
import { Player } from './features/player/Player';
import { Button } from './components/ui/Button/Button';
import { useStoryImport } from './features/editor/hooks/useStoryImport';
import type { StoryData } from './domain/Story/StoryData';
import { Dashboard } from './features/dashboard/Dashboard';
import { MainLayout } from './layout/MainLayout';
import { useAppActions } from './hooks/useAppActions';
import { getMenuConfig } from './config/menuConfig';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'editor' | 'player'>('dashboard');
  const [playingStory, setPlayingStory] = useState<StoryData | null>(null);
  const { fileInputRef, handleImportClick, handleFileChange } = useStoryImport();

  const { handlePlay, handleExportJson, handleExportStoryworld } = useAppActions(setMode, setPlayingStory);

  const menus = useMemo(() =>
    getMenuConfig(setMode, handleImportClick, handleExportJson, handleExportStoryworld),
    [setMode, handleImportClick, handleExportJson, handleExportStoryworld]
  );

  return (
    <MainLayout>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        className={styles.hiddenFileInput}
        onChange={handleFileChange}
      />

      {mode === 'player' && (
        <div className={styles.playerExit}>
          <Button variant="secondary" onClick={() => setMode('editor')}>
            ■ Stop Playing
          </Button>
        </div>
      )}

      {mode === 'dashboard' ? (
        <Dashboard
          onOpenStory={() => setMode('editor')}
          onImportClick={handleImportClick}
        />
      ) : mode === 'editor' ? (
        <ReactFlowProvider>
          <GraphEditor menus={menus} onPlay={handlePlay} />
        </ReactFlowProvider>
      ) : (
        playingStory && <Player storyData={playingStory} onExit={() => setMode('editor')} />
      )}
    </MainLayout>
  );
}

export default App;
