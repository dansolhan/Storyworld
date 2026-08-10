import React, { useMemo, memo } from 'react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { Combobox } from '../../../../components/ui/Combobox/Combobox';
import { useEditorLayoutActions } from '../../hooks/core/useEditorLayoutActions';
import { useSubplots } from '../../hooks/story/useSubplots';
import { usePlotActions } from '../../hooks/story/usePlotActions';
import { useEdgeVisibilityState } from '../../hooks/view/useEdgeVisibilityState';
import { useEditorStore } from '../../store/useEditorStore';
import { nextPagePosition } from '../../utils/nextPagePosition';
import styles from './EditorToolbar.module.css';

const MAIN_PLOT = 'MAIN';

/**
 * The canvas's floating toolbar: which plot you are looking at, adding a page,
 * and whether edges are drawn.
 *
 * Creating a subplot moved to the wordmark's Story menu, where it gets a real
 * dialog instead of a browser prompt. The page colour-mode picker is gone —
 * page type is carried by the node's kicker and border, and atmosphere tint is
 * now always on rather than a mode you switch into.
 */
export const EditorToolbar: React.FC = memo(() => {
  const { addPage } = useEditorLayoutActions();
  const subplots = useSubplots();
  const { currentPlotId, setCurrentPlotId } = usePlotActions();
  const { showAllEdges, setShowAllEdges } = useEdgeVisibilityState();

  const handleAddNewPage = () => {
    const { nodes, selectedPageId } = useEditorStore.getState();
    const { x, y } = nextPagePosition(nodes, selectedPageId);
    addPage(x, y);
  };

  const plotOptions = useMemo(
    () => [
      { label: 'Main Plot', value: MAIN_PLOT },
      ...subplots.map((subplot) => ({ label: subplot.name, value: subplot.id })),
    ],
    [subplots]
  );

  return (
    <div className={styles.toolbar}>
      {/* Wrapped for sizing until Combobox is ported to Radix and takes a className. */}
      <div className={styles.plotPicker}>
        <Combobox
          options={plotOptions}
          value={currentPlotId || MAIN_PLOT}
          placeholder="Select Plot..."
          onSelect={(value) => setCurrentPlotId(value === MAIN_PLOT ? null : (value as string))}
        />
      </div>

      <button type="button" className={styles.addPage} onClick={handleAddNewPage}>
        <Plus className={styles.icon} aria-hidden="true" />
        Page
      </button>

      <button
        type="button"
        className={styles.toggle}
        data-active={showAllEdges || undefined}
        onClick={() => setShowAllEdges(!showAllEdges)}
        aria-pressed={showAllEdges}
        title={showAllEdges ? 'Hide edges (show only on hover or selection)' : 'Show all edges'}
      >
        {showAllEdges ? (
          <Eye className={styles.icon} aria-hidden="true" />
        ) : (
          <EyeOff className={styles.icon} aria-hidden="true" />
        )}
        Edges
      </button>
    </div>
  );
});
