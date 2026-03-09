import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './AtmosphereManager.module.css';

interface AtmosphereRowProps {
  atmosphereId: string;
  atmosphere: import('../../../../domain/Atmosphere/Atmosphere').Atmosphere;
  updateAtmosphere: (id: string, updates: Partial<import('../../../../domain/Atmosphere/Atmosphere').Atmosphere>) => void;
  removeAtmosphere: (id: string) => void;
  audioItems: Record<string, import('../../../../domain/Story/Audio').AudioItem>;
}

const AtmosphereRow: React.FC<AtmosphereRowProps> = ({ atmosphereId, atmosphere, updateAtmosphere, removeAtmosphere, audioItems }) => {
  return (
    <div className={styles.row}>
      <input
        type="text"
        className={styles.input}
        value={atmosphere.title}
        onChange={(e) => updateAtmosphere(atmosphereId, { title: e.target.value })}
        placeholder="Atmosphere Name"
        style={{ flex: 1 }}
      />

      <select
        className={styles.input}
        value={atmosphere.music || ''}
        onChange={(e) => updateAtmosphere(atmosphereId, { music: e.target.value || undefined })}
        style={{ flex: 1 }}
      >
        <option value="">No Music</option>
        {Object.entries(audioItems).map(([id, item]) => (
          <option key={id} value={id}>
            {item.title}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: '4px' }}>
        <Button variant="ghost-danger" size="icon" onClick={() => removeAtmosphere(atmosphereId)} aria-label="Delete">
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

interface AtmosphereManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AtmosphereManager: React.FC<AtmosphereManagerProps> = ({ isOpen, onClose }) => {
  const { atmospheres, addAtmosphere, updateAtmosphere, removeAtmosphere, audio } = useEditorStore();

  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (newTitle) {
      const newId = `atmosphere-${crypto.randomUUID()}`;
      addAtmosphere(newId, { id: newId, title: newTitle });
      setNewTitle('');
    }
  };

  const atmosphereEntries = Object.entries(atmospheres);

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Atmospheres"
      defaultHeight="400px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Atmospheres are global settings that can be applied to nodes. They control characteristics like ongoing background music.
        </p>

        {/* Add Form */}
        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="New Atmosphere Name..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleAdd} size="sm" disabled={!newTitle}>Add Atmosphere</Button>
        </div>

        <div className={styles.list}>
          {atmosphereEntries.length === 0 ? (
            <p className={styles.empty}>No atmospheres created yet.</p>
          ) : (
            atmosphereEntries.map(([id, atmosphere]) => (
              <AtmosphereRow
                key={id}
                atmosphereId={id}
                atmosphere={atmosphere}
                updateAtmosphere={updateAtmosphere}
                removeAtmosphere={removeAtmosphere}
                audioItems={audio}
              />
            ))
          )}
        </div>
      </div>
    </ExpandableBottomPanel>
  );
};
