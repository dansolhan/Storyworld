/**
 * Modal dialogs the editor can raise over whatever workspace is showing.
 *
 * Kept as one nullable value rather than a boolean per dialog — the same
 * mistake `activeWorkspace` replaced. The command palette and shortcut sheet
 * join this union when they are built.
 */
export type EditorDialog = 'newSubplot';
