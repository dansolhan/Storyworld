import React, { useEffect, useRef, useState } from 'react';
import styles from './Audio.module.css';

interface WaveformDisplayProps {
  base64Audio: string;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ base64Audio }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas || !base64Audio) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = async () => {
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Convert base64 back to ArrayBuffer, wait, a dataURL looks like data:audio/wav;base64,....
        // We only want the base64 string
        const base64Data = base64Audio.split(',')[1] || base64Audio;
        if (!base64Data) return;

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
        if (!active) return;

        // Downsample for rendering
        const rawData = audioBuffer.getChannelData(0); // We only draw channel 0
        const samples = 100; // Number of lines to draw
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const multiplier = Math.max(...filteredData);

        /*
         * Canvas takes a resolved colour, not a CSS variable, so the accent is
         * read off the element at draw time. Keeping it a token means the
         * waveform follows the palette instead of pinning a hex here.
         */
        const accent = getComputedStyle(canvas)
          .getPropertyValue('--color-accent-line')
          .trim();
        ctx.fillStyle = accent || '#c28d41';

        filteredData.forEach((point, i) => {
          const x = (canvas.width / samples) * i;
          let y = (point / multiplier) * canvas.height;
          // Constrain height and center vertically
          y = Math.max(1, y); // make at least 1px visible
          ctx.fillRect(x, (canvas.height - y) / 2, canvas.width / samples - 1, y);
        });

      } catch (err) {
        console.error('Failed to draw waveform', err);
        if (active) setError(String(err));
      }
    };

    drawWaveform();

    return () => {
      active = false;
    };
  }, [base64Audio]);

  if (error) {
    return <div className={styles.errorText}>Error visualizing audio.</div>;
  }

  return (
    <div className={styles.waveformContainer}>
      <canvas ref={canvasRef} className={styles.waveformCanvas} width={300} height={60} />
    </div>
  );
};
