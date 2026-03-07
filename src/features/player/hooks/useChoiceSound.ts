/**
 * Generates a subtle page-turn / click sound using the Web Audio API.
 * No external audio files required.
 */
export const useChoiceSound = () => {
  const play = () => {
    try {
      const ctx = new AudioContext();

      // A short, soft noise burst that mimics a page turn or soft click
      const bufferSize = ctx.sampleRate * 0.04; // 40ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Band-pass filter to give it a papery, muffled quality
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;

      // Gentle gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      source.onended = () => ctx.close();
    } catch {
      // Silently fail if AudioContext is unavailable
    }
  };

  return { play };
};
