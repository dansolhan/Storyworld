import { useEffect } from 'react';
import { useEngine } from './EngineContext';
import { audioManager } from '../../../lib/audioManager';

export const useSoundAdapter = () => {
    const engine = useEngine();

    useEffect(() => {
        return engine.onEffect((effect) => {
            const state = engine.store.getState();
            if (!state.storyData) return;

            if (effect.type === 'PLAY_SOUND') {
                const { soundId, category } = effect.payload;
                const audioItem = state.storyData.audio?.[soundId];

                if (audioItem) {
                    if (!audioManager.hasSound(soundId)) {
                        audioManager.registerSound({
                            id: soundId,
                            src: [audioItem.src],
                            category: category || 'bgm',
                            loop: category === 'bgm',
                        });
                    }
                    audioManager.play(soundId, { fadeIn: category === 'bgm' ? 1000 : 0 });
                }
            }

            if (effect.type === 'STOP_ALL_SOUNDS') {
                audioManager.stopAll();
            }
        });
    }, [engine]);
};
