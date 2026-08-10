import { useEditorStore } from '../features/editor/store/useEditorStore';

export interface MenuItems {
  label?: string;
  onClick?: () => void;
  divider?: boolean;
}

export interface MenuConfig {
  label: string;
  items: MenuItems[];
}

/**
 * The groups behind the wordmark. The design's menu bar carries no menu row,
 * so these live under the STORYWORLD mark rather than disappearing.
 *
 * There is no View group: Play is a button in the same bar, Back to Dashboard
 * is under File, and "Editor Mode" was a no-op everywhere it appeared.
 */
export const getMenuConfig = (
  setMode: (mode: 'dashboard' | 'editor' | 'player') => void,
  handleImportClick: () => void,
  handleExportJson: () => void,
  handleExportStoryworld: () => void
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
      { label: 'Settings', onClick: () => useEditorStore.getState().setActiveWorkspace('settings') },
      { label: 'New Subplot...', onClick: () => useEditorStore.getState().setOpenDialog('newSubplot') },
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
];
