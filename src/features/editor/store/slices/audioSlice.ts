import type { StateCreator } from 'zustand';
import type { EditorState } from '../editorTypes';
import type { AudioItem } from '../../../../domain/Story/Audio';

export const createAudioSlice: StateCreator<
  EditorState,
  [],
  [],
  Pick<EditorState, 'audio' | 'addAudio' | 'updateAudio' | 'deleteAudio'>
> = (set) => ({
  audio: {},

  addAudio: (audioItem: AudioItem) => {
    set((state) => ({
      ...state,
      audio: {
        ...state.audio,
        [audioItem.id]: audioItem,
      },
    }));
  },

  updateAudio: (id: string, updates: Partial<AudioItem>) => {
    set((state) => {
      if (!state.audio[id]) return state;
      return {
        ...state,
        audio: {
          ...state.audio,
          [id]: {
            ...state.audio[id],
            ...updates,
          },
        },
      };
    });
  },

  deleteAudio: (id: string) => {
    set((state) => {
      const newAudio = { ...state.audio };
      delete newAudio[id];
      return {
        ...state,
        audio: newAudio,
      };
    });
  },
});
