import React, { useCallback, useEffect, useState } from 'react';
import { AudioWaveform } from '../AudioWaveform/AudioWaveform';
import { Button } from '../../../../components/ui/Button/Button';
import type { AudioType, AudioItem } from '../../../../domain/Story/Audio';
import styles from './Audio.module.css';

interface AudioUploaderProps {
  initialFile?: File;
  onSave: (audio: AudioItem) => void;
  onCancel: () => void;
}

const titleFromFileName = (file: File): string => file.name.replace(/\.[^/.]+$/, '');

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

export const AudioUploader: React.FC<AudioUploaderProps> = ({ initialFile, onSave, onCancel }) => {
  const [base64Audio, setBase64Audio] = useState<string>('');
  const [title, setTitle] = useState(initialFile ? titleFromFileName(initialFile) : '');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AudioType>('effect');
  // A file handed in as a prop is already being read, so start out loading.
  const [loading, setLoading] = useState(Boolean(initialFile));

  const applyFile = useCallback((file: File, dataUrl: string) => {
    setBase64Audio(dataUrl);
    // Reads the current title through the setter, so this never depends on it.
    setTitle((current) => current || titleFromFileName(file));
  }, []);

  /*
   * Reading the prop file happens entirely asynchronously — nothing sets state
   * in the effect body itself, which would force a second render pass before
   * the first has painted.
   */
  useEffect(() => {
    if (!initialFile) return;
    let active = true;

    readAsDataUrl(initialFile)
      .then((dataUrl) => {
        if (active) applyFile(initialFile, dataUrl);
      })
      .catch((error) => {
        console.error('Failed to read file', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialFile, applyFile]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In an event handler, so setting state up front is fine.
    setLoading(true);
    readAsDataUrl(file)
      .then((dataUrl) => applyFile(file, dataUrl))
      .catch((error) => console.error('Failed to read file', error))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    if (!base64Audio) return;

    onSave({
      id: crypto.randomUUID(),
      title: title || 'Untitled Audio',
      description,
      type,
      src: base64Audio,
    });
  };

  return (
    <div className={styles.uploaderContainer}>
      <h3 className={styles.uploaderTitle}>Upload New Audio</h3>

      {!base64Audio && !loading && (
        <div className={styles.dropZone}>
          <label className={styles.dropZoneLabel}>
            <span>Click to select an audio file</span>
            <input type="file" accept="audio/mpeg, audio/wav, audio/ogg" className={styles.dropZoneInput} onChange={onFileInputChange} />
          </label>
        </div>
      )}

      {loading && <div className={styles.loadingText}>Processing audio file...</div>}

      {base64Audio && (
        <>
          <AudioWaveform src={base64Audio} label={title || "the new track"} />

          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={styles.formInput}
                placeholder="e.g. Explosion Sound"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AudioType)}
                className={styles.formSelect}
              >
                <option value="effect">Sound Effect</option>
                <option value="music">Music</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={styles.formTextarea}
                placeholder="Optional details..."
              />
            </div>

            <div className={styles.actionRow}>
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={!title}>Save to Library</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
