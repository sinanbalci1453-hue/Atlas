import React, { useEffect, useRef } from 'react';
import { JarvisState } from '../types';

interface HologramSphereProps {
  state: JarvisState;
  onSphereClick?: () => void;
  className?: string;
  theme?: 'cyan' | 'crimson' | 'matrix' | 'violet';
  audioData?: Uint8Array;
}

export const HologramSphere: React.FC<HologramSphereProps> = ({
  state,
  onSphereClick,
  className = '',
  theme = 'cyan',
  audioData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let wakeFlash = state === 'awake' ? 1.0 : 0.0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Energy ripples array and timer
    const ripples: { radius: number; maxRadius: number; opacity: number; speed: number }[] = [];
    let rippleTimer = 0;

    // Particle nodes for 3D sphere illusion
    const numParticles = 44;
    const particles = Array.from({ length: numParticles }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      return {
        theta,
        phi,
        radiusOffset: (Math.random() - 0.5) * 16,
        size: Math.random() * 1.8 + 1.0,
        speed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
      };
    });

    const getThemeHex = (themeName = 'cyan') => {
      switch (themeName) {
        case 'crimson':
          return { primary: '#ef4444', secondary: '#f97316', glow: 'rgba(239, 68, 68, 0.45)', core: ['#fca5a5', '#ef4444', '#7f1d1d', 'transparent'], bg: 'bg-red-500' };
        case 'matrix':
          return { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.45)', core: ['#a7f3d0', '#10b981', '#064e3b', 'transparent'], bg: 'bg-emerald-500' };
        case 'violet':
          return { primary: '#a855f7', secondary: '#ec4899', glow: 'rgba(168, 85, 247, 0.45)', core: ['#e9d5ff', '#a855f7', '#581c87', 'transparent'], bg: 'bg-purple-500' };
        case 'cyan':
        default:
          return { primary: '#00d0ff', secondary: '#0284c7', glow: 'rgba(0, 200, 255, 0.35)', core: ['#c8f6ff', '#00b4d8', '#004c75', 'transparent'], bg: 'bg-[#0099cc]' };
      }
    };

    const getTheme = () => {
      switch (state) {
        case 'awake':
          return {
            primary: '#ffffff',
            secondary: '#00f0ff',
            coreGradient: ['#ffffff', '#80f7ff', '#00d0ff', 'transparent'],
            glow: 'rgba(0, 240, 255, 0.7)',
            speed: 0.06,
            ringSpeed: 0.05,
            corePulseAmp: 12,
            pulseFreq: 3.5,
          };
        case 'listening':
          return {
            primary: '#00ffff',
            secondary: '#38bdf8',
            coreGradient: ['#ffffff', '#00f0ff', '#0077aa', 'transparent'],
            glow: 'rgba(0, 255, 255, 0.65)',
            speed: 0.045,
            ringSpeed: 0.04,
            corePulseAmp: 9,
            pulseFreq: 2.8,
          };
        case 'thinking':
          return {
            primary: '#ffcc00', // Brighter Gold
            secondary: '#ff9900',
            coreGradient: ['#ffffff', '#ffcc00', '#cc7700', 'transparent'],
            glow: 'rgba(255, 204, 0, 0.85)', // Stronger aura
            speed: 0.015, // Significantly slower "processing" speed
            ringSpeed: 0.012,
            corePulseAmp: 4, // Subtle pulse
            pulseFreq: 1.2,
          };
        case 'speaking':
          return {
            primary: '#00ffaa',
            secondary: '#10b981',
            coreGradient: ['#ffffff', '#00ffaa', '#046a48', 'transparent'],
            glow: 'rgba(0, 255, 170, 0.7)',
            speed: 0.055,
            ringSpeed: 0.045,
            corePulseAmp: 14,
            pulseFreq: 3.2,
          };
        case 'error':
          return {
            primary: '#ff3344',
            secondary: '#dc2626',
            coreGradient: ['#ffffff', '#ff3344', '#770510', 'transparent'],
            glow: 'rgba(255, 51, 68, 0.6)',
            speed: 0.02,
            ringSpeed: 0.02,
            corePulseAmp: 5,
            pulseFreq: 1.5,
          };
        case 'standby':
        default:
          const th = getThemeHex(theme);
          return {
            primary: th.primary,
            secondary: th.secondary,
            coreGradient: th.core,
            glow: th.glow,
            speed: 0.02,
            ringSpeed: 0.018,
            corePulseAmp: 5,
            pulseFreq: 1.6,
          };
      }
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const themeObj = getTheme();
      if (!prefersReducedMotion) {
        angle += themeObj.speed;
        if (state === 'awake') {
          wakeFlash = Math.max(0, wakeFlash - 0.02);
        }
      }

      // Audio Data Peak Calculation
      let audioPeak = 0;
      if (audioData && audioData.length > 0) {
        audioPeak = Array.from(audioData).reduce((a, b) => a + b, 0) / audioData.length / 255;
      }

      // 1. Dynamic Size Metric: fills prominent 55-65% container
      const sphereRadius = Math.min(w, h) * 0.28;
      const pulse = Math.sin(angle * themeObj.pulseFreq) * themeObj.corePulseAmp;
      const currentRadius = Math.max(15, sphereRadius + pulse + (wakeFlash * 15) + (audioPeak * 25));

      // 2. Multi-tier Holographic Core Glow
      const coreGrad = ctx.createRadialGradient(
        cx, cy, currentRadius * 0.08,
        cx, cy, currentRadius * 1.35
      );
      coreGrad.addColorStop(0, themeObj.coreGradient[0]);
      coreGrad.addColorStop(0.28, themeObj.coreGradient[1]);
      coreGrad.addColorStop(0.72, themeObj.coreGradient[2]);
      coreGrad.addColorStop(1, themeObj.coreGradient[3]);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = themeObj.glow;
      ctx.shadowBlur = 32 + (wakeFlash * 35) + (audioPeak * 50);
      ctx.fill();
      ctx.restore();

      // Dynamic Expanding Energy Ripples when listening, thinking, or speaking
      if ((state === 'listening' || state === 'speaking' || state === 'thinking') && !prefersReducedMotion) {
        rippleTimer++;
        if (rippleTimer % (state === 'thinking' ? 35 : 22) === 0) {
          ripples.push({
            radius: currentRadius * 0.85,
            maxRadius: Math.min(w, h) * 0.48,
            opacity: 0.7,
            speed: state === 'thinking' ? 1.2 : 2.4, // Slower ripples for thinking
          });
        }
      }

      ctx.save();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.opacity = Math.max(0, 0.7 * (1 - rip.radius / rip.maxRadius));

        ctx.beginPath();
        ctx.arc(cx, cy, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = themeObj.primary;
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = rip.opacity;
        ctx.shadowColor = themeObj.glow;
        ctx.shadowBlur = 14;
        ctx.stroke();

        if (rip.radius >= rip.maxRadius || rip.opacity <= 0.01) {
          ripples.splice(i, 1);
        }
      }
      ctx.restore();

      // 3. Floating 3D Orbital Energy Nodes & Interconnecting Arcs
      const sphereBaseR = currentRadius * 1.05;
      const projectedNodes: { x: number; y: number; z: number; size: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.theta += p.speed;
        }

        // Spherical coordinate to 3D Cartesian
        const r = sphereBaseR + p.radiusOffset + (audioPeak * 12 * Math.sin(i + angle * 5));
        const x3d = r * Math.sin(p.phi) * Math.cos(p.theta + angle * 0.4);
        const y3d = r * Math.cos(p.phi);
        const z3d = r * Math.sin(p.phi) * Math.sin(p.theta + angle * 0.4);

        // Perspective projection
        const focalLength = 320;
        const scale = focalLength / (focalLength + z3d);
        const px = cx + x3d * scale;
        const py = cy + y3d * scale;
        const alpha = Math.max(0.15, Math.min(1, (z3d + r) / (2 * r)));

        projectedNodes.push({ x: px, y: py, z: z3d, size: p.size * scale });

        // Draw particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, p.size * scale), 0, Math.PI * 2);
        ctx.fillStyle = themeObj.primary;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = themeObj.primary;
        ctx.shadowBlur = 8 + (audioPeak * 15);
        ctx.fill();
        ctx.restore();
      }

      // Connect adjacent nodes with faint quantum laser lines
      ctx.save();
      ctx.strokeStyle = themeObj.primary;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projectedNodes.length; i += 3) {
        const n1 = projectedNodes[i];
        const nextIdx = (i + 1) % projectedNodes.length;
        const n2 = projectedNodes[nextIdx];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist < 65 && n1.z > -20 && n2.z > -20) {
          ctx.globalAlpha = Math.max(0, 0.35 - dist / 200);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Real-time Internal Voice Wave Visualizer
      if (audioData && audioData.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = themeObj.primary;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([2, 2]);
        
        const waveRadius = currentRadius * 0.7;
        const segments = audioData.length;
        for (let i = 0; i < segments; i++) {
          const val = audioData[i] / 255;
          const a = (i / segments) * Math.PI * 2;
          const r = waveRadius + (val * 35);
          const wx = cx + Math.cos(a) * r;
          const wy = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Triple Nested Segmented Neon Orbital Rings
      const drawTiltedRing = (
        radius: number,
        rotZ: number,
        tiltX: number,
        dash: number[],
        lineWidth: number,
        ringColor: string
      ) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotZ);
        ctx.scale(1, tiltX); // Elliptical 3D tilt

        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = ringColor;
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 14;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };

      // Ring 1: Equatorial Outer Radar Ring
      drawTiltedRing(
        currentRadius * 1.38,
        angle * themeObj.ringSpeed * 1.2,
        0.75,
        [28, 16, 48, 16],
        2.2,
        themeObj.primary
      );

      // Ring 2: Polar Incline Gyroscopic Ring
      drawTiltedRing(
        currentRadius * 1.55,
        -angle * themeObj.ringSpeed * 0.9,
        0.58,
        [42, 28, 14, 28],
        1.6,
        themeObj.secondary
      );

      // Ring 3: Deep Precision Perimeter Ring with Tick Markers
      drawTiltedRing(
        currentRadius * 1.78,
        angle * themeObj.ringSpeed * 0.5,
        0.92,
        [10, 24, 6, 24],
        1.1,
        themeObj.primary
      );

      // 5. Radar Perimeter Ticks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      const tickRadius = currentRadius * 1.85;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (tickRadius - 5), Math.sin(a) * (tickRadius - 5));
        ctx.lineTo(Math.cos(a) * (tickRadius + 4), Math.sin(a) * (tickRadius + 4));
        ctx.stroke();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [state, theme, audioData]);

  return (
    <div
      onClick={onSphereClick}
      role="button"
      tabIndex={0}
      title="JARVIS / ATLAS Holografik Çekirdek (Konuşmak için dokunabilirsiniz)"
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95 group ${className}`}
      style={{
        width: 'min(360px, 80vw)',
        height: 'min(360px, 80vw)',
        maxWidth: '440px',
        maxHeight: '440px',
      }}
    >
      {/* Outer ambient glow backlight */}
      <div
        className={`absolute inset-4 rounded-full transition-all duration-1000 ease-in-out pointer-events-none blur-3xl opacity-35 ${
          state === 'awake' || state === 'listening'
            ? 'bg-[#00f0ff]'
            : state === 'thinking'
            ? 'bg-[#ffcc00] opacity-50 scale-110 shadow-[0_0_60px_rgba(255,204,0,0.4)]'
            : state === 'speaking'
            ? 'bg-[#00ffaa]'
            : state === 'error'
            ? 'bg-[#ff3344]'
            : theme === 'crimson'
            ? 'bg-red-500'
            : theme === 'matrix'
            ? 'bg-emerald-500'
            : theme === 'violet'
            ? 'bg-purple-500'
            : 'bg-[#0099cc]'
        }`}
      />

      {/* 60 FPS Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none z-10"
      />

      {/* Retro-Futuristic CRT Scanline & Glitch Layer */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none z-20 overflow-hidden mix-blend-overlay opacity-60"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0px, rgba(0, 0, 0, 0.25) 1px, transparent 1px, transparent 3px)',
          animation: 'scanline-scroll 8s linear infinite',
          boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.8)'
        }}
      />

      {/* Chromatic Aberration Simulation (Glitchy ghost layer) */}
      <div 
        className={`absolute inset-0 rounded-full pointer-events-none z-[15] opacity-20 blur-[2px] transition-all duration-700 ${
          state === 'thinking' ? 'scale-105 translate-x-1' : 'scale-100'
        }`}
        style={{
          border: `2px solid ${state === 'thinking' ? '#ffcc00' : '#00f0ff'}`,
          filter: 'drop-shadow(-3px 0 2px #ff0000) drop-shadow(3px 0 2px #0000ff)',
        }}
      />

      {/* Hologram touch indicator hint (subtle hover ring) */}
      <div className="absolute inset-2 rounded-full border border-dashed border-[#00f0ff]/20 pointer-events-none transition-opacity duration-300 opacity-40 group-hover:opacity-90 animate-spin-slow z-30" />
    </div>
  );
};
