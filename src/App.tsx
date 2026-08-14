import { useState, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphEditor } from './features/editor/GraphEditor';
import { Player } from './features/player/Player';
import { useStoryImport } from './features/editor/hooks/useStoryImport';
import { Dashboard } from './features/dashboard/Dashboard';
import { MainLayout } from './layout/MainLayout';
import { useAppActions, type PlaySession } from './hooks/useAppActions';
import { usePlayerDebugBridge } from './hooks/usePlayerDebugBridge';
import { getMenuConfig } from './config/menuConfig';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'editor' | 'player'>('dashboard');
  const [playSession, setPlaySession] = useState<PlaySession | null>(null);
  const { fileInputRef, handleImportClick, handleFileChange } = useStoryImport();

  const { handlePlay, handleExportJson, handleExportStoryworld } = useAppActions(setMode, setPlaySession);
  /*
   * Every play launched from here is an author previewing their own work, so it
   * gets the console. A story opened as a published bundle would not pass this.
   */
  const debugBridge = usePlayerDebugBridge();

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

      {mode === 'dashboard' ? (
        <Dashboard
          onOpenStory={() => setMode('editor')}
          onPlayStory={() => handlePlay()}
          onImportClick={handleImportClick}
        />
      ) : mode === 'editor' ? (
        <ReactFlowProvider>
          <GraphEditor menus={menus} onPlay={handlePlay} />
        </ReactFlowProvider>
      ) : (
        playSession && (
          <Player
            storyData={playSession.story}
            startPageId={playSession.startPageId}
            onExit={() => setMode('editor')}
            debug={debugBridge}
          />
        )
      )}
    </MainLayout>
  );
}

export default App;
