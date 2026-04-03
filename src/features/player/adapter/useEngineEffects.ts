import { useEffect, useRef } from 'react';
import { useEngine, useEngineStore } from './EngineContext';
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
  const lastEffect = useEngineStore((s) => s.lastEffect);
  const lastProcessedEffectId = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!lastEffect || lastEffect === lastProcessedEffectId.current) return;
    
    // Identity check: only process this specific effect object once
    const effect = lastEffect;
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
          // Check if this specific sound is already playing to avoid echoes/restarts.
          const isTransitioning = audioManager.isCategoryPlaying('bgm');
          audioManager.play(soundId, { 
            fadeIn: 1000, 
            delay: isTransitioning ? 300 : 0, 
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

    // Mark this specific object as processed
    lastProcessedEffectId.current = effect;
  }, [lastEffect, engine]);
};
