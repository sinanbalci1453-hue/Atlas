import React, { useEffect, useRef } from 'react';

export const DataStreamBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Characters for futuristic data stream (binary & hex)
    const chars = '0101010101ABCDEF0987654321XF';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -height);
    }

    const draw = () => {
      // Semi-transparent background fade for trailing effect
      ctx.fillStyle = 'rgba(2, 7, 18, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Random bright flash for lead character
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(168, 85, 247, 0.35)';
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
    />
  );
};
