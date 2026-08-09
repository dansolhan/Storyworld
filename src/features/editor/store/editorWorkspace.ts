/**
 * The editor shows exactly one workspace at a time — the graph, or one of the
 * data surfaces reached from the left rail. Modelling that as a single value
 * rather than a set of booleans is what makes the rail's "one place at a time"
 * behaviour structural instead of something every setter has to remember to
 * enforce.
 *
 * This union grows as the redesign lands: `outline`, `search`, `health`,
 * `contextualText`, `derivedText` and `history` are all future members.
 */
export type EditorWorkspace =
  | 'graph'
  | 'settings'
  | 'items'
  | 'variables'
  | 'audio'
  | 'atmospheres'
  | 'statusData'
  | 'context';

export const DEFAULT_WORKSPACE: EditorWorkspace = 'graph';

/**
 * Whether a workspace occupies the whole editor surface. The graph keeps the
 * canvas, its toolbar and the inspector; everything else replaces them.
 */
export const isFullSurfaceWorkspace = (workspace: EditorWorkspace): boolean =>
  workspace !== 'graph';
