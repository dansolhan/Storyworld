import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useUsageIndex, usageFor } from '../../hooks/data/useUsageIndex';
import { useFilteredEntries } from '../../hooks/data/useFilteredEntries';
import { DataWorkspace } from '../DataWorkspace/DataWorkspace';
import { DataRow } from '../DataWorkspace/DataRow';
import { DeleteEntityDialog } from '../DataWorkspace/DeleteEntityDialog';
import { AudioDetail } from './AudioDetail';
import { AudioUploadDialog } from './AudioUploadDialog';
import type { AudioItem } from '../../../../domain/Story/Audio';
import rowStyles from '../DataWorkspace/DataRow.module.css';

const COLUMNS = 'minmax(0, 1.6fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 0.8fr)';

const TYPE_LABELS: Record<AudioItem['type'], string> = {
  music: 'Music',
  effect: 'Effect',
};

/**
 * The audio library.
 *
 * The design never draws it — 4c only says a track should be audible and
 * assignable from the atmospheres screen — so it reuses 3a's table shell, which
 * suits an id-keyed record with metadata. USED ON already knows which
 * atmospheres play a track.
 */
export const AudioWorkspace: React.FC = () => {
  const { audio, addAudio, deleteAudio } = useEditorStore(
    useShallow((state) => ({
      audio: state.audio,
      addAudio: state.addAudio,
      deleteAudio: state.deleteAudio,
    }))
  );

  const usage = useUsageIndex();
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AudioItem | null>(null);

  const entries = useMemo(
    () =>
      Object.values(audio ?? {}).map((track) => ({
        track,
        haystack: [track.title, track.type, track.description].join(' ').toLowerCase(),
      })),
    [audio]
  );
  const visible = useFilteredEntries(entries, filter);

  const selected = selectedId ? audio?.[selectedId] : undefined;

  return (
    <>
      <DataWorkspace
        title="Audio"
        explanation="Tracks and effects an atmosphere or an action can play."
        filter={filter}
        onFilterChange={setFilter}
        filterPlaceholder="Filter by title or type…"
        newLabel="Upload audio"
        onNew={() => setIsUploading(true)}
        columns={['Title', 'Type', 'Description', 'Used by']}
        columnTemplate={COLUMNS}
        isEmpty={visible.length === 0}
        emptyMessage={
          entries.length === 0
            ? 'No audio yet. Upload a track to give an atmosphere something to play.'
            : 'Nothing matches that filter.'
        }
        detail={
          selected && (
            <AudioDetail
              track={selected}
              usage={usageFor(usage, 'audio', selected.id)}
              onDelete={() => setPendingDelete(selected)}
            />
          )
        }
      >
        {visible.map(({ track }) => {
          const usedBy = usageFor(usage, 'audio', track.id).references.length;
          return (
            <DataRow
              key={track.id}
              label={track.title}
              isSelected={track.id === selectedId}
              onSelect={() => setSelectedId(track.id)}
              columnTemplate={COLUMNS}
            >
              <span className={rowStyles.name}>{track.title}</span>
              <span className={rowStyles.name}>{TYPE_LABELS[track.type]}</span>
              <span className={rowStyles.name}>{track.description}</span>
              <span className={usedBy === 0 ? rowStyles.unused : rowStyles.usage}>
                {usedBy === 0
                  ? 'unused'
                  : `${usedBy} ${usedBy === 1 ? 'atmosphere' : 'atmospheres'}`}
              </span>
            </DataRow>
          );
        })}
      </DataWorkspace>

      {isUploading && (
        <AudioUploadDialog
          onCancel={() => setIsUploading(false)}
          onSave={(track) => {
            addAudio(track);
            setSelectedId(track.id);
            setIsUploading(false);
          }}
        />
      )}

      {pendingDelete && (
        <DeleteEntityDialog
          isOpen
          name={pendingDelete.title}
          kind="track"
          usage={usageFor(usage, 'audio', pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteAudio(pendingDelete.id);
            if (selectedId === pendingDelete.id) setSelectedId(null);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
};
