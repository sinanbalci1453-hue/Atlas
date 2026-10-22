import React, { useState } from 'react';
import { Volume2, Shield, Cpu, Check, Mic, MicOff, AlertCircle, CheckCircle, MoreVertical, Share, Smartphone } from 'lucide-react';
import { VoiceSettings, SystemTelemetry } from '../types';

interface ProfileSettingsViewProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: VoiceSettings) => void;
  telemetry: SystemTelemetry;
  permissionState: 'prompt' | 'granted' | 'denied';
  onRequestPermission: () => Promise<boolean>;
  onTestVoice: () => void;
  onClearMemory: () => void;
  onSimulateCommand?: (cmd: string) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  telemetry,
  permissionState,
  onRequestPermission,
  onTestVoice,
  onClearMemory,
  onSimulateCommand,
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const isSpeechSupported = Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const handleTestMic = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const granted = await onRequestPermission();
      if (granted) {
        setTestResult('Mikrofon erişimi başarıyla doğrulandı ve ses girişi aktif.');
      } else {
        setTestResult('Mikrofon erişimi sağlanamadı. Lütfen tarayıcı izinlerini kontrol edin.');
      }
    } catch (err: any) {
      setTestResult(`Hata: ${err.message || 'Mikrofon test edilemedi'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020b18]/60 border border-[#00f0ff]/20 rounded-2xl p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-[#00f0ff]/20">
        <h2 className="text-sm font-bold text-[#00f0ff] tracking-widest font-mono-tech uppercase">
          Sistem & Ses Yapılandırması
        </h2>
        <p className="text-[11px] text-[#55869c]">
          Mikrofon tanılama, asistan kimliği ve ses motoru parametreleri
        </p>
      </div>

      {/* 1. Microphone Diagnostics Card */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-3">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>MİKROFON & SES TANILAMA</span>
          </span>
          <span
            className={`text-[10px] font-mono-tech px-2 py-0.5 rounded border ${
              permissionState === 'granted'
                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
                : permissionState === 'denied'
                ? 'bg-red-500/10 border-red-400 text-red-300'
                : 'bg-amber-500/10 border-amber-400 text-amber-300'
            }`}
          >
            {permissionState === 'granted'
              ? 'İZİN VERİLDİ'
              : permissionState === 'denied'
              ? 'ENGELLEDİ'
              : 'İZİN BEKLENİYOR'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech text-[#72afc7]">
          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>Web Speech API:</div>
            <div className={`font-bold mt-0.5 ${isSpeechSupported ? 'text-emerald-400' : 'text-red-400'}`}>
              {isSpeechSupported ? 'Destekleniyor' : 'Desteklenmiyor'}
            </div>
          </div>

          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>Eller Serbest “ATLAS”:</div>
            <div className="text-[#00f0ff] font-bold mt-0.5">Aktif Nöbet Modu</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleTestMic}
          disabled={isTesting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-mono-tech font-bold transition cursor-pointer disabled:opacity-50"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{isTesting ? 'Mikrofon Test Ediliyor...' : 'Mikrofonu Şimdi Test Et & İzin İste'}</span>
        </button>

        {testResult && (
          <div
            className={`flex items-start gap-2 p-2.5 rounded-lg text-xs font-mono-tech ${
              testResult.includes('başarıyla')
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                : 'bg-red-950/40 border border-red-500/30 text-red-200'
            }`}
          >
            {testResult.includes('başarıyla') ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Quick Voice Command Simulation Test Panel */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-2.5">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center justify-between">
          <span>SESLİ KOMUT TEST MERKEZİ</span>
          <span className="text-[10px] text-[#00ffaa] px-2 py-0.5 rounded bg-[#00ffaa]/10 font-bold">ANINDA TEST</span>
        </div>
        <p className="text-[11px] text-[#71afc7]">
          Tarayıcı mikrofon engelleri veya cihaz kısıtları nedeniyle ses algılanmıyorsa, aşağıdaki hızlı komutları simüle ederek yapay zekâ ses ve yanıt motorunu test edebilirsiniz:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {[
            'Sistem durumu nedir?',
            '24 * 75 hesapla',
            'Ajandamdaki görevleri listele',
            'Holografik sistemleri optimize et',
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => onSimulateCommand?.(cmd)}
              className="p-2 rounded-lg bg-[#020e1c] hover:bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-cyan-200 text-xs font-mono-tech transition text-left flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">🗣️ "{cmd}"</span>
              <span className="text-[10px] text-[#00f0ff] shrink-0 ml-1">Çalıştır</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Installation Instructions */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-3">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>MOBİL UYGULAMA KURULUMU</span>
        </div>
        
        <div className="space-y-4">
          {/* Android Steps */}
          <div>
            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
              <MoreVertical className="w-3.5 h-3.5" /> ANDROID (CHROME)
            </div>
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold mt-0.5">1</span>
                <p className="text-[10px] text-[#83b4c9]">Tarayıcınızda sağ üst köşedeki üç noktaya (⋮) dokunun.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold mt-0.5">2</span>
                <p className="text-[10px] text-[#83b4c9]"><strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</p>
              </div>
            </div>
          </div>

          {/* iOS Steps */}
          <div>
            <div className="text-[10px] font-bold text-sky-400 flex items-center gap-1.5 mb-2">
              <Share className="w-3.5 h-3.5" /> IPHONE / IPAD (SAFARI)
            </div>
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold mt-0.5">1</span>
                <p className="text-[10px] text-[#83b4c9]">Alt menüdeki <strong>Paylaş (⬆️)</strong> butonuna dokunun.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold mt-0.5">2</span>
                <p className="text-[10px] text-[#83b4c9]">Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine basın.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personality / Mode Switcher */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-2.5">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center justify-between">
          <span>ASİSTAN KİMLİĞİ</span>
          <span className="text-[10px] text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/10">
            {settings.mode === 'atlas' ? 'BİLİMSEL ANALİTİK' : 'STARK TEKNOLOJİSİ'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onUpdateSettings({ ...settings, mode: 'jarvis' })}
            className={`p-2.5 rounded-lg border text-xs font-mono-tech transition cursor-pointer text-left ${
              settings.mode === 'jarvis'
                ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'bg-[#020e1c] border-[#00f0ff]/20 text-[#6eaec7] hover:border-[#00f0ff]/40'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between">
              <span>JARVIS</span>
              {settings.mode === 'jarvis' && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
            </div>
            <div className="text-[10px] mt-1 text-[#83b4c9]">
              Tony Stark tarzı kibar, kendinden emin, hızlı ve keskin kişisel yapay zekâ.
            </div>
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, mode: 'atlas' })}
            className={`p-2.5 rounded-lg border text-xs font-mono-tech transition cursor-pointer text-left ${
              settings.mode === 'atlas'
                ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'bg-[#020e1c] border-[#00f0ff]/20 text-[#6eaec7] hover:border-[#00f0ff]/40'
            }`}
          >
            <div className="font-bold text-white flex items-center justify-between">
              <span>ATLAS</span>
              {settings.mode === 'atlas' && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
            </div>
            <div className="text-[10px] mt-1 text-[#83b4c9]">
              Bilimsel, analitik, nesnel ve holografik araştırma asistanı.
            </div>
          </button>
        </div>
      </div>

      {/* Holo-Theme & Accent Color Selector */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-3">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center justify-between">
          <span>HOLO-TEMA & VURGU RENGİ</span>
          <span className="text-[10px] text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/10 uppercase">
            {settings.theme || 'cyan'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'cyan', label: 'Cyan Arc', color: 'bg-cyan-400' },
            { id: 'crimson', label: 'Crimson Alert', color: 'bg-red-500' },
            { id: 'matrix', label: 'Matrix Green', color: 'bg-emerald-500' },
            { id: 'violet', label: 'Electric Violet', color: 'bg-purple-500' },
          ].map((t) => {
            const isSelected = (settings.theme || 'cyan') === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ ...settings, theme: t.id as any })}
                className={`p-2.5 rounded-lg border text-xs font-mono-tech transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-[#020e1c] border-white/10 text-[#71afc7] hover:border-white/30'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${t.color} shadow-[0_0_8px_currentColor]`} />
                <span className="font-bold text-[11px]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Voice Parameters */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-3">
        <div className="text-xs font-bold text-white font-mono-tech flex items-center justify-between">
          <span>TÜRKÇE SES PARAMETRELERİ (TTS)</span>
          <button
            onClick={onTestVoice}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/40 transition cursor-pointer"
          >
            <Volume2 className="w-3 h-3" />
            <span>Sesi Test Et</span>
          </button>
        </div>

        {/* Speed / Rate */}
        <div>
          <div className="flex justify-between text-xs text-[#80d7f7] font-mono-tech mb-1">
            <span>Konuşma Hızı:</span>
            <span>{settings.rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.4"
            step="0.05"
            value={settings.rate}
            onChange={(e) =>
              onUpdateSettings({ ...settings, rate: parseFloat(e.target.value) })
            }
            className="w-full accent-[#00f0ff] bg-[#020e1c] rounded-lg cursor-pointer"
          />
        </div>

        {/* Pitch */}
        <div>
          <div className="flex justify-between text-xs text-[#80d7f7] font-mono-tech mb-1">
            <span>Ses Tonu (Pitch):</span>
            <span>{settings.pitch.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={settings.pitch}
            onChange={(e) =>
              onUpdateSettings({ ...settings, pitch: parseFloat(e.target.value) })
            }
            className="w-full accent-[#00f0ff] bg-[#020e1c] rounded-lg cursor-pointer"
          />
        </div>

        {/* Chime Sound Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[#a0dbf3]">Holografik Uyandırma Sesi (880Hz Bip):</span>
          <input
            type="checkbox"
            checked={settings.soundChime}
            onChange={(e) =>
              onUpdateSettings({ ...settings, soundChime: e.target.checked })
            }
            className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Hardware & Server Diagnostics */}
      <div className="p-3.5 rounded-xl bg-[#031528] border border-[#00f0ff]/25 space-y-2 text-xs">
        <div className="font-bold text-white font-mono-tech flex items-center gap-1.5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>SİSTEM TELEMETRİSİ & DONANIM</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech text-[#72afc7]">
          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>İstemci Gecikmesi:</div>
            <div className="text-white font-bold mt-0.5">{telemetry.latency}</div>
          </div>
          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>İşlemci Çekirdekleri:</div>
            <div className="text-white font-bold mt-0.5">{telemetry.cores} Donanımsal İş Parçacığı</div>
          </div>
          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>Yapay Zekâ Motoru:</div>
            <div className="text-[#00ffaa] font-bold mt-0.5">{telemetry.model || 'gemini-3.8-flash'}</div>
          </div>
          <div className="p-2 rounded bg-[#020e1c] border border-white/5">
            <div>Sunucu Durumu:</div>
            <div className="text-[#00ffaa] font-bold mt-0.5">Çevrimiçi & Güvenli</div>
          </div>
        </div>
      </div>

      {/* 5. Privacy & Memory Reset */}
      <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-red-300 font-mono-tech">
          <Shield className="w-4 h-4 text-red-400" />
          <span>GİZLİLİK VE VERİ TEMİZLEME</span>
        </div>
        <p className="text-[11px] text-[#8aa9b8]">
          Görüşme kayıtları ve görev geçmişi yerel cihazınızda saklanır. Tek dokunuşla tüm verileri kalıcı olarak sıfırlayabilirsiniz.
        </p>
        <button
          onClick={onClearMemory}
          className="w-full py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-200 text-xs font-mono-tech rounded-lg transition cursor-pointer"
        >
          Tüm Bellek ve Sohbet Geçmişini Sıfırla
        </button>
      </div>
    </div>
  );
};
