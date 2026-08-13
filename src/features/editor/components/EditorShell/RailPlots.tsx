import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { subplotColour } from '../../../../domain/Story/subplotColour';
import styles from './EditorRail.module.css';

/**
 * The plots, as places you can go.
 *
 * A subplot is a room you enter — the canvas shows one plot at a time, which is the
 * whole point of having them. So the rail lists them the way it lists workspaces,
 * with the plot's colour and how many pages are inside, and the page count is the
 * thing a crossing card is standing in for out on the canvas.
 */
export const RailPlots: React.FC = React.memo(() => {
  const { subplots, currentPlotId, setCurrentPlotId, pages, setOpenDialog } = useEditorStore(
    useShallow((state) => ({
      subplots: state.subplots,
      currentPlotId: state.currentPlotId,
      setCurrentPlotId: state.setCurrentPlotId,
      pages: state.pages,
      setOpenDialog: state.setOpenDialog,
    }))
  );

  const countIn = (subplotId: string | null): number =>
    Object.values(pages ?? {}).filter((page) =>
      subplotId ? page.subplotId === subplotId : !page.subplotId
    ).length;

  const plots = [
    { id: null as string | null, name: 'Main Plot' },
    ...(subplots ?? []).map((subplot) => ({ id: subplot.id, name: subplot.name })),
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Plots</h2>
      <ul className={styles.list}>
        {plots.map((plot) => {
          const isActive = currentPlotId === plot.id;
          const count = countIn(plot.id);

          return (
            <li key={plot.id ?? 'main'}>
              <button
                type="button"
                className={styles.item}
                data-active={isActive || undefined}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${plot.name}, ${count}`}
                onClick={() => setCurrentPlotId(plot.id)}
              >
                <span
                  className={styles.plotDot}
                  style={{ backgroundColor: subplotColour(subplots ?? [], plot.id) }}
                  aria-hidden="true"
                />
                <span className={styles.label}>{plot.name}</span>
                <span className={styles.count}>{count}</span>
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            className={styles.newPlot}
            onClick={() => setOpenDialog('newSubplot')}
          >
            + New subplot
          </button>
        </li>
      </ul>
    </section>
  );
});
