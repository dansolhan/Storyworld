import { useEffect, useCallback } from 'react';
import { audioManager } from '../../../lib/audioManager';

const CLICK_SOUND_ID = 'ui-click';

/**
 * Standardized hook for UI click sounds using the new AudioManager.
 */
export const useChoiceSound = () => {
  useEffect(() => {
    // Register the sound in the manager if it's not already registered.
    // If you add actual sound assets to your public folder (e.g. at /public/sounds/click.mp3),
    // they will be loaded and played. 
    // The manager prevents duplicate registrations.
    audioManager.registerSound({
      id: CLICK_SOUND_ID,
      src: ['/sounds/pageturn.mp3', '/sounds/pageturn.wav'], // Fallback paths
      category: 'ui',
      volume: 0.4,
    });
  }, []);

  const play = useCallback(() => {
    audioManager.play(CLICK_SOUND_ID);
  }, []);

  return { play };
};
