import React, { useEffect, useRef } from 'react';

interface AudioVisualizerRingProps {
  audioData: Uint8Array;
  theme?: 'cyan' | 'crimson' | 'matrix' | 'violet';
}

export const AudioVisualizerRing: React.FC<AudioVisualizerRingProps> = ({ audioData, theme = 'cyan' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getThemeColor = (t: string) => {
    switch (t) {
      case 'crimson':
        return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' };
      case 'matrix':
        return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.8)' };
      case 'violet':
        return { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.8)' };
      case 'cyan':
      default:
        return { stroke: '#00f0ff', glow: 'rgba(0, 240, 255, 0.8)' };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || audioData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / (2 * (window.devicePixelRatio || 1));
    const cy = height / (2 * (window.devicePixelRatio || 1));

    ctx.clearRect(0, 0, width, height);

    const radius = Math.min(cx, cy) * 0.72;
    const bars = audioData.length;
    const angleStep = (Math.PI * 2) / bars;
    const themeColors = getThemeColor(theme);

    ctx.save();
    ctx.strokeStyle = themeColors.stroke;
    ctx.shadowColor = themeColors.glow;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2.5;

    for (let i = 0; i < bars; i++) {
      const value = audioData[i];
      const percent = value / 255;
      const barLength = percent * 45;

      const angle = i * angleStep;
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * (radius + barLength);
      const y2 = cy + Math.sin(angle) * (radius + barLength);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const avg = audioData.reduce((acc, val) => acc + val, 0) / bars;
    const pulseRadius = radius + (avg / 255) * 18;

    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = themeColors.stroke;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.restore();
  }, [audioData, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  if (audioData.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};
