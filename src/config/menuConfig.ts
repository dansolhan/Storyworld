import { useEditorStore } from '../features/editor/store/useEditorStore';
import type { MenuConfig } from '../components/ui/MenuBar/MenuBar';

export const getMenuConfig = (
  setMode: (mode: 'dashboard' | 'editor' | 'player') => void,
  handleImportClick: () => void,
  handleExportJson: () => void,
  handleExportStoryworld: () => void,
  handlePlay: () => void,
  currentMode: 'dashboard' | 'editor' | 'player'
): MenuConfig[] => [
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
      { label: 'Settings', onClick: () => useEditorStore.getState().setActiveWorkspace('settings') }
    ]
  },
  {
    label: 'Data',
    items: [
      { label: 'Items', onClick: () => useEditorStore.getState().setActiveWorkspace('items') },
      { label: 'Variables', onClick: () => useEditorStore.getState().setActiveWorkspace('variables') },
      { label: 'Audio', onClick: () => useEditorStore.getState().setActiveWorkspace('audio') },
      { label: 'Atmosphere', onClick: () => useEditorStore.getState().setActiveWorkspace('atmospheres') },
      { label: 'Status Data', onClick: () => useEditorStore.getState().setActiveWorkspace('statusData') },
      { label: 'Context', onClick: () => useEditorStore.getState().setActiveWorkspace('context') }
    ]
  },
  {
    label: 'View',
    items: [
      { label: 'Editor Mode', onClick: () => setMode('editor') },
      { label: 'Play Mode', onClick: () => currentMode === 'editor' ? handlePlay() : undefined }
    ]
  }
];
