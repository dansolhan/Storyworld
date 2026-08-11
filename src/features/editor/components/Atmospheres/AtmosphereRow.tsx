import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { AudioWaveform } from '../AudioWaveform/AudioWaveform';
import { ColourChoice } from './ColourChoice';
import { UsedOnChips } from './UsedOnChips';
import { atmosphereSettings, MAX_FADE_IN_MS } from '../../../../domain/Atmosphere/atmosphereSettings';
import type { Atmosphere } from '../../../../domain/Atmosphere/Atmosphere';
import type { AudioItem } from '../../../../domain/Story/Audio';
import type { UsageEntry } from '../../usage/usageReference';
import styles from './AtmosphereRow.module.css';

export interface AtmosphereRowProps {
  atmosphere: Atmosphere;
  tracks: AudioItem[];
  usage: UsageEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  /** Sends the reader to the Audio library to add a track. */
  onOpenAudioLibrary: () => void;
}

const pageSummary = (usage: UsageEntry): string => {
  const pages = usage.references.filter((reference) => reference.pageId).length;
  if (pages === 0) return 'not used on any page';
  return `on ${pages} ${pages === 1 ? 'page' : 'pages'}`;
};

export const AtmosphereRow: React.FC<AtmosphereRowProps> = ({
  atmosphere,
  tracks,
  usage,
  isExpanded,
  onToggle,
  onDelete,
  onOpenAudioLibrary,
}) => {
  const updateAtmosphere = useEditorStore((state) => state.updateAtmosphere);
  const [renaming, setRenaming] = useState<string | null>(null);

  const { fadeIn, volume } = atmosphereSettings(atmosphere);
  const track = atmosphere.music ? tracks.find((item) => item.id === atmosphere.music) : undefined;

  const commitRename = () => {
    const title = renaming?.trim();
    if (title) updateAtmosphere(atmosphere.id, { title });
    setRenaming(null);
  };

  if (!isExpanded) {
    // Collapsed: one line — track, fade, and where it is used.
    const summary = [
      track ? track.title : 'No track chosen',
      track ? `fade ${(fadeIn / 1000).toFixed(1)}s` : null,
      pageSummary(usage),
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <button type="button" className={styles.collapsed} onClick={onToggle}>
        {atmosphere.color && (
          <span className={styles.dot} style={{ backgroundColor: atmosphere.color }} aria-hidden="true" />
        )}
        <span className={styles.collapsedName}>{atmosphere.title}</span>
        <span className={track ? styles.collapsedSummary : styles.collapsedNoTrack}>{summary}</span>
      </button>
    );
  }

  return (
    <section className={styles.expanded} aria-label={atmosphere.title}>
      <header className={styles.header}>
        {atmosphere.color && (
          <span className={styles.dot} style={{ backgroundColor: atmosphere.color }} aria-hidden="true" />
        )}

        {renaming === null ? (
          <button type="button" className={styles.name} onClick={onToggle}>
            {atmosphere.title}
          </button>
        ) : (
          <input
            className={styles.nameInput}
            value={renaming}
            autoFocus
            aria-label="Atmosphere name"
            onChange={(event) => setRenaming(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') setRenaming(null);
            }}
          />
        )}

        <span className={styles.pageCount}>{pageSummary(usage)}</span>

        <button type="button" className={styles.action} onClick={() => setRenaming(atmosphere.title)}>
          Rename
        </button>
        <button type="button" className={styles.actionDanger} onClick={onDelete}>
          Delete
        </button>
      </header>

      {track ? (
        <AudioWaveform src={track.src} label={track.title} />
      ) : (
        <p className={styles.noTrack}>
          No track chosen.{' '}
          <button type="button" className={styles.chooseTrack} onClick={onOpenAudioLibrary}>
            Choose a track
          </button>
        </p>
      )}

      <div className={styles.settings}>
        <label className={styles.setting}>
          <span className={styles.settingLabel}>Track</span>
          <select
            className={styles.select}
            value={atmosphere.music ?? ''}
            onChange={(event) =>
              updateAtmosphere(atmosphere.id, { music: event.target.value || undefined })
            }
          >
            <option value="">None</option>
            {tracks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.setting}>
          <span className={styles.settingLabel}>Fade in</span>
          <span className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={MAX_FADE_IN_MS}
              step={100}
              value={fadeIn}
              onChange={(event) =>
                updateAtmosphere(atmosphere.id, { fadeIn: Number(event.target.value) })
              }
            />
            <span className={styles.settingValue}>{(fadeIn / 1000).toFixed(1)}s</span>
          </span>
        </label>

        <label className={styles.setting}>
          <span className={styles.settingLabel}>Volume</span>
          <span className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={100}
              step={5}
              value={Math.round(volume * 100)}
              onChange={(event) =>
                updateAtmosphere(atmosphere.id, { volume: Number(event.target.value) / 100 })
              }
            />
            <span className={styles.settingValue}>{Math.round(volume * 100)}%</span>
          </span>
        </label>

        <div className={styles.setting}>
          <span className={styles.settingLabel}>Colour</span>
          <ColourChoice
            colour={atmosphere.color}
            onChange={(color) => updateAtmosphere(atmosphere.id, { color })}
          />
        </div>
      </div>

      <div className={styles.setting}>
        <span className={styles.settingLabel}>Used on</span>
        <UsedOnChips references={usage.references} />
      </div>
    </section>
  );
};
