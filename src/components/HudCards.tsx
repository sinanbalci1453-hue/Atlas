import React from 'react';
import { Activity, Database, Wrench, Cpu } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface HudCardsProps {
  tasksCount: number;
  memoryCount: number;
  telemetry: SystemTelemetry;
  onCardClick?: (tab: 'home' | 'chats' | 'tools' | 'profile') => void;
}

export const HudCards: React.FC<HudCardsProps> = ({
  tasksCount,
  memoryCount,
  telemetry,
  onCardClick,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full my-2">
      {/* 1. Görevler Card */}
      <button
        onClick={() => onCardClick?.('tools')}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#031528]/80 hover:bg-[#031d38] border border-[#00f0ff]/25 hover:border-[#00f0ff]/50 transition-all duration-200 text-left shadow-[inset_0_0_15px_rgba(0,240,255,0.04)] cursor-pointer group"
      >
        <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] group-hover:scale-105 transition-transform">
          <Activity className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-[#6aa8c2] tracking-wider font-mono-tech uppercase truncate">
            Görevler
          </div>
          <div className="text-xs font-bold text-white font-mono-tech truncate">
            {tasksCount} Aktif İşlem
          </div>
        </div>
      </button>

      {/* 2. Bellek Card */}
      <button
        onClick={() => onCardClick?.('chats')}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#031528]/80 hover:bg-[#031d38] border border-[#00f0ff]/25 hover:border-[#00f0ff]/50 transition-all duration-200 text-left shadow-[inset_0_0_15px_rgba(0,240,255,0.04)] cursor-pointer group"
      >
        <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] group-hover:scale-105 transition-transform">
          <Database className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-[#6aa8c2] tracking-wider font-mono-tech uppercase truncate">
            Bellek
          </div>
          <div className="text-xs font-bold text-white font-mono-tech truncate">
            {memoryCount} Kayıt
          </div>
        </div>
      </button>

      {/* 3. Araçlar Card */}
      <button
        onClick={() => onCardClick?.('tools')}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#031528]/80 hover:bg-[#031d38] border border-[#00f0ff]/25 hover:border-[#00f0ff]/50 transition-all duration-200 text-left shadow-[inset_0_0_15px_rgba(0,240,255,0.04)] cursor-pointer group"
      >
        <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00ffaa] group-hover:scale-105 transition-transform">
          <Wrench className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-[#6aa8c2] tracking-wider font-mono-tech uppercase truncate">
            Araçlar
          </div>
          <div className="text-xs font-bold text-[#00ffaa] font-mono-tech truncate">
            6 Modül Aktif
          </div>
        </div>
      </button>

      {/* 4. Sistem Telemetrisi Card */}
      <button
        onClick={() => onCardClick?.('profile')}
        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#031528]/80 hover:bg-[#031d38] border border-[#00f0ff]/25 hover:border-[#00f0ff]/50 transition-all duration-200 text-left shadow-[inset_0_0_15px_rgba(0,240,255,0.04)] cursor-pointer group"
      >
        <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] group-hover:scale-105 transition-transform">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-[#6aa8c2] tracking-wider font-mono-tech uppercase truncate">
            Sistem
          </div>
          <div className="text-xs font-bold text-white font-mono-tech truncate">
            {telemetry.latency} · {telemetry.cores} Çekirdek
          </div>
        </div>
      </button>
    </div>
  );
};
