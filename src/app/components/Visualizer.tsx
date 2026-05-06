import React, { useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface VisualizerProps {
  width?: number;
  height?: number;
  barCount?: number;
  className?: string;
  mode?: 'bars' | 'wave';
}

export function Visualizer({ width = 80, height = 24, barCount = 14, className = '', mode = 'bars' }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const { analyserNode, isPlaying, accentColor } = usePlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    if (!analyserNode || !isPlaying) {
      ctx.clearRect(0, 0, width, height);
      // Draw idle bars at minimum height
      if (mode === 'bars') {
        const bw = (width / barCount) - 1.5;
        for (let i = 0; i < barCount; i++) {
          const x = i * (bw + 1.5);
          ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, height - 2, bw, 2, 1);
          } else {
            ctx.rect(x, height - 2, bw, 2);
          }
          ctx.fill();
        }
      }
      animRef.current && cancelAnimationFrame(animRef.current);
      return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      if (mode === 'bars') {
        const bw = (width / barCount) - 1.5;
        for (let i = 0; i < barCount; i++) {
          // Map bar index to frequency bin (focus on lower frequencies)
          const binIndex = Math.floor((i / barCount) * (bufferLength * 0.6));
          const value = dataArray[binIndex] / 255;
          const bh = Math.max(2, value * height);
          const x = i * (bw + 1.5);
          const y = height - bh;

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, accentColor + 'CC');
          gradient.addColorStop(1, '#A78BFA' + '99');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, bw, bh, 1.5);
          } else {
            ctx.rect(x, y, bw, bh);
          }
          ctx.fill();
        }
      } else {
        // Wave mode
        const waveData = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(waveData);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();
    return () => { animRef.current && cancelAnimationFrame(animRef.current); };
  }, [analyserNode, isPlaying, width, height, barCount, accentColor, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`opacity-90 ${className}`}
      style={{ width, height }}
    />
  );
}