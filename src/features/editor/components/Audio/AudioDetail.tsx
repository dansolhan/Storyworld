import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { AudioWaveform } from '../AudioWaveform/AudioWaveform';
import { WhereItAppears } from '../DataWorkspace/WhereItAppears';
import type { AudioItem } from '../../../../domain/Story/Audio';
import type { UsageEntry } from '../../usage/usageReference';
import styles from '../DataWorkspace/DetailPanel.module.css';

export interface AudioDetailProps {
  track: AudioItem;
  usage: UsageEntry;
  onDelete: () => void;
}

export const AudioDetail: React.FC<AudioDetailProps> = ({ track, usage, onDelete }) => {
  const updateAudio = useEditorStore((state) => state.updateAudio);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>{track.title}</h2>
        <button type="button" className={styles.delete} onClick={onDelete}>
          Delete
        </button>
      </header>

      <AudioWaveform src={track.src} label={track.title} />

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Title</span>
        <input
          className={styles.input}
          value={track.title}
          onChange={(event) => updateAudio(track.id, { title: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Description</span>
        <input
          className={styles.input}
          value={track.description}
          placeholder="What it is for"
          onChange={(event) => updateAudio(track.id, { description: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Type</span>
        <select
          className={styles.input}
          value={track.type}
          onChange={(event) =>
            updateAudio(track.id, { type: event.target.value as AudioItem['type'] })
          }
        >
          <option value="music">Music — loops as background</option>
          <option value="effect">Effect — plays once</option>
        </select>
      </label>

      <WhereItAppears usage={usage} heading="Used by" />
    </div>
  );
};
