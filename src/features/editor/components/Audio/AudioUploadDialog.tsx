import React from 'react';
import { Dialog, DialogContent } from '../../../../components/ui/Dialog/Dialog';
import { AudioUploader } from './AudioUploader';
import type { AudioItem } from '../../../../domain/Story/Audio';

export interface AudioUploadDialogProps {
  onCancel: () => void;
  onSave: (track: AudioItem) => void;
}

/**
 * Uploading a track.
 *
 * The existing `AudioUploader` already handles reading the file, previewing its
 * waveform and naming it, so this only gives it a home now that the audio
 * manager's modal is gone.
 */
export const AudioUploadDialog: React.FC<AudioUploadDialogProps> = ({ onCancel, onSave }) => (
  <Dialog open onOpenChange={(open) => (open ? undefined : onCancel())}>
    <DialogContent title="Upload audio" width={520}>
      <AudioUploader onSave={onSave} onCancel={onCancel} />
    </DialogContent>
  </Dialog>
);
