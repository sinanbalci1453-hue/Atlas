import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Home,
  MessageSquare,
  Wrench,
  Settings,
  AlertCircle,
  CheckCircle,
  Volume2,
} from 'lucide-react';
import { HologramSphere } from './components/HologramSphere';
import { HudHeader } from './components/HudHeader';
import { HudCards } from './components/HudCards';
import { ChatHistoryView } from './components/ChatHistoryView';
import { ToolsConsoleView } from './components/ToolsConsoleView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { DataStreamBackground } from './components/DataStreamBackground';
import { AudioVisualizerRing } from './components/AudioVisualizerRing';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { VoiceAssistantController, playHologramChime, MicErrorInfo } from './services/voiceService';
import { JarvisState, Message, TaskItem, SystemTelemetry, VoiceSettings } from './types';

export default function App() {
  // State Machine
  const [jarvisState, setJarvisState] = useState<JarvisState>('standby');
  
  // Real-time Audio Data for Sphere & Ring Visualizers
  const audioData = useAudioAnalyzer(jarvisState === 'listening' || jarvisState === 'awake');

  const [isPWAModalOpen, setIsPWAModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'chats' | 'tools' | 'profile'>('home');
  const [inputMessage, setInputMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('Sistem hazır: “ATLAS” diyerek veya küreye dokunarak konuşabilirsiniz.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micErrorDetail, setMicErrorDetail] = useState<MicErrorInfo | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('jarvis_voice_settings');
    return saved
      ? JSON.parse(saved)
      : {
          pitch: 0.95,
          rate: 1.05,
          volume: 1.0,
          autoWake: true,
          soundChime: true,
          mode: 'jarvis',
        };
  });

  // Master Voice Toggle
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);

  // Chat Memory
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('jarvis_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'init-1',
        role: 'model',
        text: 'Efendim, tüm holografik ve ses protokolleri devrede. Size nasıl yardımcı olabilirim?',
        timestamp: '10:00',
      },
    ];
  });

  // Active Tasks
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'task-1', title: 'Holografik arayüz sensör kalibrasyonu', completed: true, createdAt: '09:30' },
    { id: 'task-2', title: 'Eller serbest ses tanıma testi', completed: false, createdAt: '10:15' },
    { id: 'task-3', title: 'Yapay zekâ araç motoru senkronizasyonu', completed: false, createdAt: '11:00' },
  ]);

  // Telemetry
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    status: 'online',
    timestamp: Date.now(),
    latency: '18ms',
    cores: navigator.hardwareConcurrency || 8,
    memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '8 GB',
    uptime: '99.9%',
    hasApiKey: true,
    activeTasks: 2,
    model: 'gemini-3.8-flash',
  });

  const voiceControllerRef = useRef<VoiceAssistantController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const latestMessage = messages[messages.length - 1];

  // Save messages to local storage
  useEffect(() => {
    localStorage.setItem('jarvis_chat_history', JSON.stringify(messages.slice(-60)));
  }, [messages]);

  // Save settings to local storage
  useEffect(() => {
    localStorage.setItem('jarvis_voice_settings', JSON.stringify(voiceSettings));
    voiceControllerRef.current?.updateSettings(voiceSettings);
  }, [voiceSettings]);

  // Ping server health & tasks
  useEffect(() => {
    const fetchHealth = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const latencyMs = Math.round(performance.now() - startTime);
        setTelemetry((prev) => ({
          ...prev,
          status: data.status || 'online',
          latency: `${latencyMs}ms`,
          hasApiKey: data.hasApiKey,
          activeTasks: data.activeTasks ?? prev.activeTasks,
          model: data.model || prev.model,
        }));
      } catch {
        setTelemetry((prev) => ({ ...prev, latency: '14ms' }));
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Voice Assistant Controller
  useEffect(() => {
    const controller = new VoiceAssistantController(
      {
        onWakeDetected: (remainingCommand?: string) => {
          setJarvisState('awake');
          setStatusMessage('ATLAS Uyandı! Emrinizi dinliyor...');
          inputRef.current?.focus();
          setTimeout(() => {
            setJarvisState('listening');
            inputRef.current?.focus();
          }, 350);
        },
        onCommandReceived: (command: string) => {
          handleSendMessage(command);
        },
        onStatusChange: (statusText: string) => {
          setStatusMessage(statusText);
        },
        onError: (err: string) => {
          setErrorMessage(err);
          setJarvisState('error');
          setTimeout(() => {
            setJarvisState('standby');
          }, 3500);
        },
        onErrorMessage: (errMsg: string, errorCode?: string, errorInfo?: MicErrorInfo) => {
          setErrorMessage(errMsg);
          if (errorInfo) {
            setMicErrorDetail(errorInfo);
          }
          if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
            setMicPermissionState('denied');
          }
        },
        onPermissionStateChange: (state) => {
          setMicPermissionState(state);
          if (state === 'granted') {
            setMicErrorDetail(null);
            setErrorMessage(null);
          }
        },
      },
      voiceSettings
    );

    voiceControllerRef.current = controller;

    // Check if permission already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((status) => {
          setMicPermissionState(status.state as any);
          if (status.state === 'granted') {
            setMicErrorDetail(null);
            controller.safeStart();
          }
        })
        .catch(() => {});
    }

    return () => {
      controller.stopImmediate();
    };
  }, []);

  // Explicitly prompt user for mic permission
  const handleRequestMicPermission = async (): Promise<boolean> => {
    setErrorMessage(null);
    setMicErrorDetail(null);
    if (!voiceControllerRef.current) return false;
    const granted = await voiceControllerRef.current.requestMicrophonePermission();
    if (granted) {
      setMicPermissionState('granted');
      setIsVoiceEnabled(true);
      setMicErrorDetail(null);
      setStatusMessage('Mikrofon aktif! “ATLAS” diyebilir veya küreye dokunarak konuşabilirsiniz.');
      speakResponse('Mikrofon aktif efendim. Sizi dinliyorum.');
    }
    return granted;
  };

  // Toggle master microphone switch
  const handleToggleVoice = () => {
    if (isVoiceEnabled) {
      voiceControllerRef.current?.disable();
      setIsVoiceEnabled(false);
      setJarvisState('standby');
      setStatusMessage('Sesli asistan durduruldu (Sessizde).');
    } else {
      if (micPermissionState !== 'granted') {
        handleRequestMicPermission();
      } else {
        voiceControllerRef.current?.enable();
        setIsVoiceEnabled(true);
        setJarvisState('standby');
        setStatusMessage('Sistem nöbette: “ATLAS” diyerek seslenebilirsiniz.');
      }
    }
  };

  // Speak response aloud using TTS
  const speakResponse = (text: string) => {
    voiceControllerRef.current?.speak(
      text,
      () => {
        setJarvisState('speaking');
        setStatusMessage('Sesli yanıt iletiliyor...');
      },
      () => {
        setJarvisState('standby');
        setStatusMessage('Sistem nöbette: “ATLAS” diyebilirsiniz.');
      }
    );
  };

  // Core Request Handler (Prevents duplicate requests & closures)
  const handleSendMessage = async (textOverride?: string) => {
    const content = (textOverride || inputMessage).trim();
    if (!content || jarvisState === 'thinking') return;

    setInputMessage('');
    setErrorMessage(null);

    const userTimestamp = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: content,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setJarvisState('thinking');
    setStatusMessage('Düşünülüyor ve araçlar koordine ediliyor...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-8),
          mode: voiceSettings.mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sunucu yanıtı başarısız (${response.status})`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Emrinizi aldım efendim.';

      const modelTimestamp = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const modelMessage: Message = {
        id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        text: replyText,
        timestamp: modelTimestamp,
        toolUsed: data.toolUsed,
        toolResult: data.toolResult,
      };

      setMessages((prev) => [...prev, modelMessage]);

      // If task management tool was triggered, refresh tasks list
      if (data.toolUsed === 'manageTasks' && data.toolResult?.tasks) {
        setTasks(data.toolResult.tasks);
      }

      // Read aloud via TTS
      speakResponse(replyText);
    } catch (err: any) {
      console.error('İşlem Hatası:', err);
      setJarvisState('error');
      setErrorMessage(err.message || 'Sistemle iletişim kurulurken bir aksaklık oluştu.');
      setStatusMessage('İletişim hatası tespit edildi.');
      setTimeout(() => {
        setJarvisState('standby');
        setStatusMessage('Sistem nöbette: “ATLAS” diyebilirsiniz.');
      }, 4000);
    }
  };

  // Task Operations
  const handleAddTask = (title: string) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      completed: false,
      createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearMemory = () => {
    localStorage.removeItem('jarvis_chat_history');
    setMessages([
      {
        id: `clear-${Date.now()}`,
        role: 'model',
        text: 'Sohbet belleği temizlendi efendim. Sistemler taze durumda.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Direct Interaction: Click on sphere to speak or stop speaking
  const handleSphereClick = async () => {
    // If speaking, tap immediately silences speech
    if (jarvisState === 'speaking') {
      voiceControllerRef.current?.stopSpeaking();
      return;
    }

    // If permission not granted, request it first
    if (micPermissionState !== 'granted') {
      const ok = await handleRequestMicPermission();
      if (!ok) return;
    }

    if (!isVoiceEnabled) {
      setIsVoiceEnabled(true);
      voiceControllerRef.current?.enable();
    }

    // Direct command listening without requiring wake word
    setJarvisState('listening');
    setStatusMessage('Sizi dinliyorum, emrinizi söyleyin...');
    inputRef.current?.focus();
    voiceControllerRef.current?.startDirectCommandListening();
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#020712] text-[#d6f4ff] hud-grid-pattern relative overflow-hidden">
      {/* Dynamic Binary / Hex Data Stream Background Effect */}
      <DataStreamBackground />

      {/* Top Bar */}
      <HudHeader
        state={jarvisState}
        isVoiceEnabled={isVoiceEnabled && micPermissionState === 'granted'}
        onToggleVoice={handleToggleVoice}
        mode={voiceSettings.mode}
        hasMicError={Boolean(micErrorDetail || statusMessage.includes('Kullanılamıyor'))}
        micErrorTag={micErrorDetail?.tag}
        onOpenPWA={() => setIsPWAModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-3 sm:p-5 overflow-hidden">
        {/* Permission Request Banner (if mic not granted yet) */}
        {micPermissionState !== 'granted' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 mb-3 bg-[#031c33]/90 border border-[#00f0ff]/40 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <div className="flex items-center gap-2.5 text-xs text-[#aeeeff]">
              <div className="p-2 rounded-lg bg-[#00f0ff]/15 text-[#00f0ff] shrink-0">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-white font-mono-tech">
                  Sesli İletişim & Eller Serbest “ATLAS” Modu
                </div>
                <div className="text-[11px] text-[#71a3b8]">
                  Sesle konuşabilmek ve uyandırma sözcüğünü kullanabilmek için mikrofon iznini etkinleştirin.
                </div>
              </div>
            </div>

            <button
              onClick={handleRequestMicPermission}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#38bdf8] text-[#020712] font-bold text-xs font-mono-tech transition shadow-[0_0_15px_rgba(0,240,255,0.5)] cursor-pointer whitespace-nowrap shrink-0"
            >
              Mikrofon İznini Aç
            </button>
          </div>
        )}

        {/* Dedicated Red Microphone Error Diagnostic Card */}
        {micErrorDetail && (
          <div className="flex flex-col gap-2 p-3.5 mb-3 bg-red-950/90 border-2 border-red-500 rounded-xl text-red-200 text-xs shadow-[0_0_25px_rgba(239,68,68,0.45)] backdrop-blur-md animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-red-500/40">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500/60 text-red-200 font-mono-tech text-[11px] font-black tracking-widest uppercase">
                  🚨 {micErrorDetail.tag}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-red-500/40 text-red-300 font-mono-tech font-bold">
                KOD: {micErrorDetail.code}
              </span>
            </div>

            <div className="space-y-1 mt-1">
              <div className="font-bold text-white text-xs">{micErrorDetail.message}</div>
              <div className="p-2.5 rounded-lg bg-black/50 border border-red-500/30 text-[11px] space-y-1.5">
                <div>
                  <span className="text-red-400 font-bold font-mono-tech mr-1.5">NEDEN:</span>
                  <span className="text-red-200">{micErrorDetail.reason}</span>
                </div>
                <div>
                  <span className="text-[#00f0ff] font-bold font-mono-tech mr-1.5">ÇÖZÜM:</span>
                  <span className="text-amber-200 font-medium">{micErrorDetail.solution}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-red-500/30 flex items-center justify-between gap-2">
              <button
                onClick={handleRequestMicPermission}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono-tech font-bold transition shadow-[0_0_12px_rgba(239,68,68,0.6)] cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Mikrofonu Yeniden Başlat / İzin İste</span>
              </button>
              <button
                onClick={() => setMicErrorDetail(null)}
                className="text-[11px] text-red-300 hover:text-white underline cursor-pointer font-mono-tech px-2 py-1"
              >
                Bildirimi Kapat
              </button>
            </div>
          </div>
        )}

        {/* Generic Error Notification (if no mic error detail is active) */}
        {!micErrorDetail && errorMessage && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs shadow-lg animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1 font-mono-tech">{errorMessage}</span>
            <button
              onClick={handleRequestMicPermission}
              className="text-[#00f0ff] underline text-xs px-2 hover:text-white cursor-pointer font-mono-tech font-bold"
            >
              Yeniden İzin İste
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Real HUD Cards */}
        <HudCards
          tasksCount={tasks.filter((t) => !t.completed).length}
          memoryCount={messages.length}
          telemetry={telemetry}
          onCardClick={(tab) => setActiveTab(tab)}
        />

        {/* Responsive Grid: Single column on mobile, Split Workstation on Desktop (lg:) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2 overflow-hidden">
          {/* LEFT COLUMN: Prominent Hologram & Voice HUD Console (7 cols on Desktop) */}
          <section
            className={`flex flex-col justify-between items-center rounded-2xl bg-[#031122]/60 border border-[#00f0ff]/25 p-4 shadow-[0_0_30px_rgba(0,240,255,0.06)] relative overflow-hidden ${
              activeTab === 'home' ? 'col-span-1 lg:col-span-7 flex' : 'hidden lg:flex lg:col-span-6'
            }`}
          >
            {/* Holographic Watermark / Radar sweep */}
            <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] text-[#4d869e] font-mono-tech tracking-wider pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              <span>HOLOGRAFİK KÜRE %60 ODAK</span>
            </div>

            {/* ENLARGED HOLOGRAPHIC SPHERE (Priority 1: ~55-65% container presence) */}
            <div className="my-auto py-2 flex flex-col items-center justify-center w-full">
              <div className="relative flex items-center justify-center">
                <HologramSphere
                  state={jarvisState}
                  onSphereClick={handleSphereClick}
                  theme={voiceSettings.theme}
                  audioData={audioData}
                  className="hover:scale-105 transition-transform"
                />
                <AudioVisualizerRing
                  audioData={audioData}
                  theme={voiceSettings.theme}
                />
              </div>
              <div className="text-[11px] text-[#55869c] font-mono-tech mt-1 tracking-wider text-center w-full px-2">
                {micErrorDetail ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/90 border border-red-500 text-red-300 font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.45)] animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>[ {micErrorDetail.tag} ]: {micErrorDetail.message}</span>
                  </div>
                ) : statusMessage.includes('Kullanılamıyor') ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <span>{statusMessage}</span>
                  </div>
                ) : jarvisState === 'standby' ? (
                  <>
                    “<span className="text-[#00f0ff] font-bold">ATLAS</span>” deyin veya küreye dokunup konuşun
                  </>
                ) : jarvisState === 'listening' ? (
                  <span className="text-[#00ffff] font-bold animate-pulse">Sizi dinliyorum, konuşun...</span>
                ) : jarvisState === 'thinking' ? (
                  <span className="text-[#ffaa00] font-bold">Veriler ve araçlar işleniyor...</span>
                ) : jarvisState === 'speaking' ? (
                  <span className="text-[#00ffaa] font-bold">Sesli yanıt aktarılıyor... (Durdurmak için dokunun)</span>
                ) : (
                  <span>Hazır</span>
                )}
              </div>
            </div>

            {/* Assistant Status & Latest Message Bubble */}
            <div className="w-full max-w-xl bg-[#041a33]/90 border border-[#00f0ff]/35 rounded-xl p-3 shadow-[0_0_20px_rgba(0,240,255,0.12)] my-2">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-widest font-bold pb-1 border-b border-[#00f0ff]/20">
                <span className={micErrorDetail ? 'text-red-400 flex items-center gap-1 font-bold' : statusMessage.includes('Kullanılamıyor') ? 'text-amber-400 flex items-center gap-1' : 'text-[#00f0ff]'}>
                  {micErrorDetail ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block mr-1" />
                      DURUM: {micErrorDetail.tag}
                    </>
                  ) : statusMessage.includes('Kullanılamıyor') ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block mr-1" />
                      DURUM: MİKROFON UYARISI
                    </>
                  ) : (
                    `DURUM: ${jarvisState.toUpperCase()}`
                  )}
                </span>
                <span
                  className={`truncate ml-2 max-w-[260px] sm:max-w-[340px] ${micErrorDetail ? 'text-red-300 font-bold' : statusMessage.includes('Kullanılamıyor') ? 'text-amber-300 font-bold' : 'text-[#659db4]'}`}
                  title={micErrorDetail ? `${micErrorDetail.tag}: ${micErrorDetail.reason}` : statusMessage}
                >
                  {micErrorDetail ? micErrorDetail.message : statusMessage}
                </span>
              </div>

              {latestMessage && (
                <div className="mt-2 text-xs leading-relaxed text-[#d6f4ff] max-h-24 overflow-y-auto pr-1">
                  <span className="text-[#00f0ff] font-bold mr-1.5 font-mono-tech">
                    {latestMessage.role === 'user' ? 'SİZ:' : 'ATLAS:'}
                  </span>
                  <span>{latestMessage.text}</span>
                </div>
              )}
            </div>

            {/* Direct Input & Mic Trigger Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="w-full max-w-xl flex items-center gap-2 pt-2 border-t border-[#00f0ff]/20"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Bir emir veya soru yazın, efendim..."
                className="flex-1 bg-[#031528] border border-[#00f0ff]/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#457285] focus:outline-none focus:border-[#00f0ff] shadow-inner font-sans"
              />

              {/* Push to talk / Voice trigger button */}
              <button
                type="button"
                onClick={handleSphereClick}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  jarvisState === 'listening'
                    ? 'bg-red-600 border-red-400 text-white animate-pulse'
                    : 'bg-[#00f0ff]/15 hover:bg-[#00f0ff]/30 border-[#00f0ff]/50 text-[#00f0ff]'
                }`}
                title="Konuşmak İçin Dokun"
              >
                {jarvisState === 'listening' ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Submit button */}
              <button
                type="submit"
                disabled={jarvisState === 'thinking'}
                className="p-2.5 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/35 border border-[#00f0ff]/60 rounded-xl text-[#00f0ff] transition cursor-pointer disabled:opacity-40"
                title="Gönder"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>

          {/* RIGHT COLUMN: Active Panel View (Sohbetler, Araçlar, Profil) */}
          <section
            className={`col-span-1 ${
              activeTab === 'home'
                ? 'hidden lg:flex lg:col-span-5'
                : 'col-span-1 lg:col-span-6 flex'
            } flex-col overflow-hidden h-full`}
          >
            {activeTab === 'home' && (
              <div className="flex flex-col h-full space-y-3">
                <ChatHistoryView
                  messages={messages}
                  onClearMessages={handleClearMemory}
                  onSpeakMessage={speakResponse}
                />
              </div>
            )}

            {activeTab === 'chats' && (
              <ChatHistoryView
                messages={messages}
                onClearMessages={handleClearMemory}
                onSpeakMessage={speakResponse}
              />
            )}

            {activeTab === 'tools' && (
              <ToolsConsoleView
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSettingsView
                settings={voiceSettings}
                onUpdateSettings={(newSettings) => setVoiceSettings(newSettings)}
                telemetry={telemetry}
                permissionState={micPermissionState}
                onRequestPermission={handleRequestMicPermission}
                onTestVoice={() =>
                  speakResponse('Merhaba efendim. Türkçe ses sentezleme motoru başarıyla çalışıyor.')
                }
                onClearMemory={handleClearMemory}
                onSimulateCommand={handleSendMessage}
              />
            )}
          </section>
        </div>
      </main>

      {/* FOOTER: Mobile Navigation Bar */}
      <nav className="border-t border-[#00f0ff]/20 bg-[#020b18]/95 backdrop-blur-md sticky bottom-0 z-30">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-14 px-2">
          {[
            { id: 'home', label: 'Ana Sayfa', icon: Home },
            { id: 'chats', label: 'Sohbetler', icon: MessageSquare },
            { id: 'tools', label: 'Araçlar', icon: Wrench },
            { id: 'profile', label: 'Ayarlar', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center gap-1 h-full transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#00f0ff] font-bold border-t-2 border-[#00f0ff] bg-[#00f0ff]/5'
                    : 'text-[#48788e] hover:text-[#7eb4ca]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] tracking-wide font-mono-tech">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* PWA / Mobile Phone App Install Modal & Banner */}
      <PWAInstallModal isOpen={isPWAModalOpen} onClose={() => setIsPWAModalOpen(false)} />
      <PWAInstallBanner />
    </div>
  );
}
