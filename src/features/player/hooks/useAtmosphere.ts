import { useEffect, useState, useRef } from 'react';
import type { StoryData } from '../../../domain/Story/StoryData';
import type { Page } from '../../../domain/Page/Page';
import { audioManager } from '../../../lib/audioManager';

export function useAtmosphere(storyData: StoryData, currentPage?: Page) {
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const prevAtmoRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let isActive = true;

    const runTransition = async () => {
      if (!currentPage) return;

      const atmosphereId = currentPage.atmosphereId;
      if (atmosphereId !== prevAtmoRef.current) {
        console.log(`%c[Atmosphere] Activated: ${atmosphereId || 'None'}`, 'color: #a855f7; font-weight: bold');
        prevAtmoRef.current = atmosphereId;
      }

      const atmosphere = atmosphereId ? storyData.atmospheres?.[atmosphereId] : undefined;
      const desiredMusicId = atmosphere?.music || null;

      if (desiredMusicId !== playingMusicId) {
        if (playingMusicId) {
          await audioManager.stop(playingMusicId, { fadeOut: 2000 });
        }

        if (!isActive) return;

        if (desiredMusicId) {
          const audioItem = storyData.audio?.[desiredMusicId];
          if (audioItem) {
            if (!audioManager.hasSound(desiredMusicId)) {
              audioManager.registerSound({
                id: desiredMusicId,
                src: [audioItem.src],
                category: 'bgm',
                loop: true,
              });
            }
            audioManager.play(desiredMusicId, { fadeIn: 1000 });
          }
        }
        setPlayingMusicId(desiredMusicId);
      }
    };

    runTransition();

    return () => {
      isActive = false;
    };
  }, [currentPage, playingMusicId, storyData.audio, storyData.atmospheres]);

  return { playingMusicId };
}
