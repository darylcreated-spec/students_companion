import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  audioLevel?: number; // 0 to 1 (live microphone or synthesis amplitude)
  barCount?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  progress,
  audioLevel = 0,
  barCount = 38,
  height = 70,
  activeColor = '#22D3EE',
  inactiveColor = 'rgba(255, 255, 255, 0.12)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Generate static deterministic heights
  const baseHeights = useRef<number[]>(
    Array.from({ length: barCount }, (_, i) => {
      const sinVal = Math.sin(i * 0.25) * 0.4 + Math.sin(i * 0.7) * 0.3 + 0.5;
      return Math.max(0.15, Math.min(0.95, sinVal));
    })
  ).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width;
      const ch = canvas.height;
      const barWidth = Math.max(2, (width / barCount) - 3);
      const gap = 3;

      const activeBarIndex = Math.floor(progress * barCount);

      for (let i = 0; i < barCount; i++) {
        let hRatio = baseHeights[i];

        if (isPlaying) {
          // Dynamic wave ripple effect
          const dynamicMod = Math.sin(phase + i * 0.3) * 0.25 + (audioLevel * 0.5);
          hRatio = Math.max(0.1, Math.min(1.0, hRatio + dynamicMod));
        }

        const barHeight = Math.max(4, hRatio * (ch - 10));
        const x = i * (barWidth + gap);
        const y = (ch - barHeight) / 2;

        const isPassed = i <= activeBarIndex;

        ctx.fillStyle = isPassed ? activeColor : inactiveColor;

        if (isPassed && isPlaying) {
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw rounded bar
        ctx.beginPath();
        const r = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, [r, r, r, r]);
        ctx.fill();
      }

      phase += 0.08;
      if (isPlaying) {
        animRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isPlaying, progress, audioLevel, barCount, height, activeColor, inactiveColor]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden py-1">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full max-w-[360px] h-[70px] cursor-pointer"
      />
    </div>
  );
};
