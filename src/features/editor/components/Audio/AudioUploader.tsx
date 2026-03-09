import React, { useState } from 'react';
import { WaveformDisplay } from './WaveformDisplay';
import { Button } from '../../../../components/ui/Button/Button';
import type { AudioType, AudioItem } from '../../../../domain/Story/Audio';
import styles from './Audio.module.css';

interface AudioUploaderProps {
  initialFile?: File;
  onSave: (audio: AudioItem) => void;
  onCancel: () => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ initialFile, onSave, onCancel }) => {
  const [base64Audio, setBase64Audio] = useState<string>('');
  const [title, setTitle] = useState(initialFile ? initialFile.name.replace(/\.[^/.]+$/, "") : '');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AudioType>('effect');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
    }
  }, [initialFile]);

  const handleFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBase64Audio(result);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setLoading(false);
    };
    reader.onerror = () => {
      console.error('Failed to read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
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
          <WaveformDisplay base64Audio={base64Audio} />

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
