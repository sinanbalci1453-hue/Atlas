import React from 'react';
import { Mic, MicOff, Volume2, Shield, Smartphone } from 'lucide-react';
import { JarvisState } from '../types';

interface HudHeaderProps {
  state: JarvisState;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  mode: 'jarvis' | 'atlas';
  hasMicError?: boolean;
  micErrorTag?: string;
  onOpenPWA: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  state,
  isVoiceEnabled,
  onToggleVoice,
  mode,
  hasMicError,
  micErrorTag,
  onOpenPWA,
}) => {
  const getStatusColor = () => {
    if (hasMicError) {
      return 'text-red-400 border-red-500/80 bg-red-950/80 shadow-[0_0_15px_rgba(239,68,68,0.45)] animate-pulse';
    }
    switch (state) {
      case 'awake':
      case 'listening':
        return 'text-[#00f0ff] border-[#00f0ff]/50 bg-[#00f0ff]/10';
      case 'thinking':
        return 'text-[#ffaa00] border-[#ffaa00]/50 bg-[#ffaa00]/10';
      case 'speaking':
        return 'text-[#00ffaa] border-[#00ffaa]/50 bg-[#00ffaa]/10';
      case 'error':
        return 'text-[#ff3344] border-[#ff3344]/50 bg-[#ff3344]/10';
      case 'standby':
      default:
        return 'text-[#62a2be] border-[#00f0ff]/20 bg-[#031528]/60';
    }
  };

  const getStateLabel = () => {
    if (hasMicError) {
      return micErrorTag || 'MİKROFON HATASI';
    }
    switch (state) {
      case 'awake':
        return 'UYANDI';
      case 'listening':
        return 'DİNLİYOR...';
      case 'thinking':
        return 'DÜŞÜNÜLÜYOR...';
      case 'speaking':
        return 'SESLENDİRİLİYOR';
      case 'error':
        return 'HATA';
      case 'standby':
      default:
        return 'NÖBETTE';
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#00f0ff]/20 bg-[#020b18]/85 backdrop-blur-md sticky top-0 z-30">
      {/* Brand Title Zone */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.4)]">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="absolute w-2 h-2 rounded-full bg-[#00f0ff]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-extrabold tracking-[0.2em] text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.6)] font-mono-tech">
              {mode === 'atlas' ? 'ATLAS CORE' : 'JARVIS AI'}
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#00f0ff]/30 text-[#8ed8f8] bg-[#00f0ff]/5 font-mono-tech">
              V4.5
            </span>
          </div>
          <p className="text-[10px] text-[#55869c] tracking-wider hidden xs:block">
            “Efendim, emirlerinizi bekliyorum”
          </p>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono-tech font-semibold tracking-wider transition-all duration-300 ${getStatusColor()}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>{getStateLabel()}</span>
        </div>
      </div>

      {/* Controls: Phone/PWA + Voice Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Phone App / QR Button */}
        <button
          onClick={onOpenPWA}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/25 text-xs font-semibold tracking-wide transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer"
          title="Telefonunuzda uygulama olarak açın veya QR kodu taratın"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono-tech">TELEFONDA AÇ</span>
        </button>

        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-sm ${
            isVoiceEnabled
              ? 'bg-[#00f0ff]/15 border-[#00f0ff]/60 text-[#00f0ff] hover:bg-[#00f0ff]/25 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'bg-red-950/40 border-red-500/50 text-red-300 hover:bg-red-950/60'
          }`}
          title={
            isVoiceEnabled
              ? 'Sesli Asistan Devrede - Sessize almak için dokunun'
              : 'Sesli Asistan Durduruldu - Etkinleştirmek için dokunun'
          }
        >
          {isVoiceEnabled ? (
            <>
              <Mic className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="hidden sm:inline font-mono-tech">SES AÇIK</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline font-mono-tech">SESSİZDE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

