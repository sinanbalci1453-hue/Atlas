import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Star } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, install, isInstallable } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    
    // Show after 3 seconds if not installed and not dismissed
    if (!isInstalled && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-slideUp">
      <div className="relative overflow-hidden rounded-2xl bg-[#031c33]/95 border border-[#00f0ff]/40 p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-md">
        {/* Animated background pulse */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00f0ff]/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden sm:flex p-3 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
            <Smartphone className="w-6 h-6 animate-bounce" />
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              Remix ATLAS’ı Ana Ekrana Ekleyin
            </h4>
            <p className="text-[11px] text-[#71a3b8] mt-0.5 leading-relaxed">
              Daha hızlı erişim ve tam ekran deneyimi için uygulamayı telefonunuza yükleyin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={install}
                className="px-4 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#38bdf8] text-[#020712] text-xs font-bold font-mono-tech transition shadow-[0_0_15px_rgba(0,240,255,0.4)] whitespace-nowrap flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>YÜKLE</span>
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#55869c] hover:text-white transition"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
