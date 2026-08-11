import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useUsageIndex, usageFor } from '../../hooks/data/useUsageIndex';
import { AtmosphereRow } from './AtmosphereRow';
import { DeleteEntityDialog } from '../DataWorkspace/DeleteEntityDialog';
import { ATMOSPHERE_COLOURS } from './atmospherePalette';
import type { Atmosphere } from '../../../../domain/Atmosphere/Atmosphere';
import styles from './AtmospheresWorkspace.module.css';

/**
 * Atmospheres as one expanding row each, per the design at 4c — a table would
 * have nowhere to put a waveform.
 *
 * One row is open at a time, which keeps the list scannable and means only one
 * preview can be playing.
 */
export const AtmospheresWorkspace: React.FC = () => {
  const { atmospheres, audio, addAtmosphere, removeAtmosphere, setActiveWorkspace } =
    useEditorStore(
      useShallow((state) => ({
        atmospheres: state.atmospheres,
        audio: state.audio,
        addAtmosphere: state.addAtmosphere,
        removeAtmosphere: state.removeAtmosphere,
        setActiveWorkspace: state.setActiveWorkspace,
      }))
    );

  const usage = useUsageIndex();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Atmosphere | null>(null);

  const entries = useMemo(() => Object.values(atmospheres ?? {}), [atmospheres]);
  const tracks = useMemo(() => Object.values(audio ?? {}), [audio]);

  const handleNew = () => {
    const id = `atmo_${crypto.randomUUID().slice(0, 8)}`;
    addAtmosphere(id, { id, title: 'New atmosphere', color: ATMOSPHERE_COLOURS[0].value });
    setExpandedId(id);
  };

  return (
    <>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h1 className={styles.title}>Atmospheres</h1>
            <p className={styles.explanation}>
              A mood a page can be set to: a track, a fade, a colour on the canvas.
            </p>
          </div>

          <button type="button" className={styles.new} onClick={handleNew}>
            <Plus className={styles.newIcon} aria-hidden="true" />
            New atmosphere
          </button>
        </header>

        <div className={styles.rows}>
          {entries.length === 0 ? (
            <p className={styles.empty}>
              No atmospheres yet. One is a track, a fade and a colour a page can be set to.
            </p>
          ) : (
            entries.map((atmosphere) => (
              <AtmosphereRow
                key={atmosphere.id}
                atmosphere={atmosphere}
                tracks={tracks}
                usage={usageFor(usage, 'atmosphere', atmosphere.id)}
                isExpanded={atmosphere.id === expandedId}
                onToggle={() =>
                  setExpandedId((current) => (current === atmosphere.id ? null : atmosphere.id))
                }
                onDelete={() => setPendingDelete(atmosphere)}
                onOpenAudioLibrary={() => setActiveWorkspace('audio')}
              />
            ))
          )}
        </div>
      </div>

      {pendingDelete && (
        <DeleteEntityDialog
          isOpen
          name={pendingDelete.title}
          kind="atmosphere"
          usage={usageFor(usage, 'atmosphere', pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeAtmosphere(pendingDelete.id);
            if (expandedId === pendingDelete.id) setExpandedId(null);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
};
