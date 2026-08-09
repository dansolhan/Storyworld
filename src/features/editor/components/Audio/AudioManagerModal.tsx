import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Button } from '../../../../components/ui/Button/Button';
import { AudioUploader } from './AudioUploader';
import { Play, Square, Trash2, X, Music, Radio } from 'lucide-react';
import { Howl } from 'howler';
import styles from './Audio.module.css';

export const AudioManagerModal: React.FC = () => {
  const isOpen = useEditorStore(state => state.activeWorkspace === 'audio');
  const close = () => useEditorStore.getState().setActiveWorkspace('graph');

  const audio = useEditorStore(state => state.audio);
  const addAudio = useEditorStore(state => state.addAudio);
  const deleteAudio = useEditorStore(state => state.deleteAudio);

  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const activeHowl = useRef<Howl | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3'))) {
      setUploadingFile(file);
      setIsUploading(true);
    }
  };

  const stopPreview = () => {
    if (activeHowl.current) {
      activeHowl.current.stop();
      activeHowl.current.unload();
      activeHowl.current = null;
    }
    setPlayingId(null);
  };

  const playPreview = (id: string, src: string) => {
    stopPreview();
    setPlayingId(id);
    const sound = new Howl({
      src: [src],
      html5: true, // Use streaming for larger files
      onend: () => setPlayingId(null),
      onloaderror: () => {
        console.error('Failed to load audio preview');
        setPlayingId(null);
      }
    });
    activeHowl.current = sound;
    sound.play();
  };

  const audioList = Object.values(audio || {});

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${dragOver ? styles.modalDragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Radio className={styles.icon} />
            Audio Library
          </h2>
          <button
            onClick={() => {
              stopPreview();
              close();
            }}
            className={styles.closeButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.content}>
          {dragOver && (
            <div className={styles.dragOverlay}>
              <span className={styles.dragOverlayText}>Drop audio file here</span>
            </div>
          )}

          {!isUploading && (
            <div className={styles.libraryInfoRow}>
              <div className={styles.libraryCount}>
                {audioList.length} items in library.
              </div>
              <Button variant="primary" onClick={() => setIsUploading(true)}>
                Upload Audio
              </Button>
            </div>
          )}

          {isUploading ? (
            <AudioUploader
              initialFile={uploadingFile || undefined}
              onSave={(newItem) => {
                addAudio(newItem);
                setIsUploading(false);
                setUploadingFile(null);
              }}
              onCancel={() => {
                setIsUploading(false);
                setUploadingFile(null);
              }}
            />
          ) : (
            <div className={styles.audioList}>
              {audioList.length === 0 ? (
                <div className={styles.emptyState}>
                  No audio tracks found. Drag and drop to upload.
                </div>
              ) : (
                audioList.map(item => (
                  <div key={item.id} className={styles.audioItem}>
                    <button
                      onClick={() => playingId === item.id ? stopPreview() : playPreview(item.id, item.src)}
                      className={styles.playButton}
                    >
                      {playingId === item.id ? <Square className={styles.playIcon} /> : <Play className={`${styles.playIcon} ${styles.playIconPlay}`} />}
                    </button>

                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={`${styles.badge} ${item.type === 'music' ? styles.badgeMusic : styles.badgeEffect}`}>
                          {item.type === 'music' ? <Music className={styles.badgeIcon} /> : null}
                          {item.type}
                        </span>
                      </div>
                      {item.description && (
                        <span className={styles.itemDescription}>{item.description}</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (playingId === item.id) stopPreview();
                        deleteAudio(item.id);
                      }}
                      className={styles.deleteButton}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
