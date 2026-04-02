import { useEffect, useRef } from 'react';
import { useEngine } from './EngineContext';
import { audioManager } from '../../../lib/audioManager';

interface EngineEffectsOptions {
  onStoryEnd?: (data: Record<string, unknown>) => void;
}

/**
 * A hook that listens to effects emitted by the StoryEngine and 
 * maps them to concrete React-side actions (like playing sound or triggering callbacks).
 */
export const useEngineEffects = (options: EngineEffectsOptions = {}) => {
  const engine = useEngine();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Cleanup all sounds ONLY when this component unmounts
  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, []);

  useEffect(() => {
    const unsub = engine.onEffect((effect) => {
      const state = engine.store.getState();
      if (!state.storyData) return;

      const { onStoryEnd } = optionsRef.current;
      
      if (effect.type === 'PLAY_SOUND') {
        const { soundId, category } = effect.payload;
        const currentCategory = category || 'bgm';
        const audioItem = state.storyData.audio?.[soundId];

        if (audioItem) {
          if (!audioManager.hasSound(soundId)) {
            audioManager.registerSound({
              id: soundId,
              src: [audioItem.src],
              category: currentCategory,
              loop: currentCategory === 'bgm',
            });
          }

          if (currentCategory === 'bgm') {
            audioManager.play(soundId, { 
              fadeIn: 1000, 
              delay: 300, 
              stopOtherInCategory: true 
            });
          } else {
            audioManager.play(soundId, { fadeIn: 0 });
          }
        }
      }

      if (effect.type === 'STOP_ALL_SOUNDS') {
        audioManager.stopAll();
      }

      if (effect.type === 'ON_STORY_END') {
        if (onStoryEnd) {
          onStoryEnd(effect.payload.data);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [engine]);
};
