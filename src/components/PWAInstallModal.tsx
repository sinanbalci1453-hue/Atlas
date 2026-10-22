import React, { useState } from 'react';
import { Smartphone, QrCode, Download, Share2, Check, X, Shield, Cpu, ExternalLink, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // QR code URL using a reliable open source QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&color=00f0ff&bgcolor=020712`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1329] border border-[#00f0ff]/40 p-6 shadow-[0_0_50px_rgba(0,240,255,0.25)] text-[#d6f4ff]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
            <Smartphone className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-white">JARVIS’i Telefonunuzda Çalıştırın</h2>
            <p className="text-xs text-cyan-300/80">Yerel PWA Uygulaması ve Mobil Erişim Rehberi</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* QR Code Section for Phone Camera */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
              <img src={qrCodeUrl} alt="App QR Code" className="w-36 h-36 rounded-lg object-contain" />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                1 Saniyede Telefonda Açın
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Telefonunuzun kamerasını bu QR koduna tutun. Açılan bağlantıyı telefonunuzun tarayıcısında ziyaret edin.
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4" />}
                {copied ? 'Bağlantı Kopyalandı!' : 'Bağlantıyı Kopyala'}
              </button>
            </div>
          </div>

          {/* Direct Install Button if supported */}
          {isInstallable && !isInstalled ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-[#00f0ff]/40 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Bu Cihazda Uygulama Olarak Yükle</h4>
                <p className="text-xs text-slate-300">Masaüstü veya mobil cihazınızda uygulama ikonu oluşturun.</p>
              </div>
              <button
                onClick={install}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:from-cyan-400 hover:to-blue-500 transition flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                Hemen Yükle
              </button>
            </div>
          ) : !isInstalled && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <h4 className="text-sm font-semibold">Manuel Kurulum Gerekli</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tarayıcı güvenlik politikaları nedeniyle bu pencerede otomatik yükleme butonu aktif olmayabilir. Lütfen aşağıdaki 
                <strong> "Ana Ekrana Ekle"</strong> adımlarını takip edin. Bu yöntem en güvenli ve kararlı yoldur.
              </p>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Harika! JARVIS bu cihazda yüklü bir PWA uygulaması olarak çalışıyor.</span>
            </div>
          )}

          {/* Manual Instructions for iOS & Android */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Android (Chrome / Edge)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Sağ üst köşedeki menüye ( üç nokta ) dokunun.</li>
                <li><strong className="text-cyan-300">"Ana Ekrana Ekle"</strong> veya <strong className="text-cyan-300">"Uygulama Yükle"</strong> seçeneğini seçin.</li>
                <li>Onaylayarak telefonunuza yerleştirin.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                iPhone / iPad (Safari)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Safari alt menüsündeki <strong className="text-purple-300">Paylaş</strong> ikonuna (kare ve yukarı ok) dokunun.</li>
                <li>Listeden <strong className="text-purple-300">"Ana Ekrana Ekle"</strong> seçeneğini bulun.</li>
                <li>Sağ üstteki <strong className="text-purple-300">"Ekle"</strong> butonuna basın.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>JARVIS Hologram PWA Engine v3.8</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
