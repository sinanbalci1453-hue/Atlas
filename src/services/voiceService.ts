import { VoiceSettings } from '../types';

// Web Audio API Holographic Chime (Harmonic sci-fi wake-up sound)
export function playHologramChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.28);
    osc2.stop(ctx.currentTime + 0.28);
  } catch (err) {
    console.warn('Audio chime unsupported:', err);
  }
}

export interface MicErrorInfo {
  code: string;
  tag: string; // e.g. "MİKROFON İZNİ ENGELLENDİ", "SES YAKALAMA DONANIM HATASI", "SES AĞI BAĞLANTI ARIZASI", etc.
  message: string;
  reason: string; // Explains clearly WHY the mic is not working
  solution: string; // Actionable step to fix it
  level: 'fatal' | 'warning' | 'network';
  isMicBlocked: boolean;
}

export interface SpeechErrorDetails {
  code: string;
  statusMessage: string;
  errorMessage: string;
  isFatal: boolean;
  retryDelayMs: number;
  info: MicErrorInfo;
}

export function getGranularSpeechError(errorCode: string): SpeechErrorDetails {
  switch (errorCode) {
    case 'not-allowed':
      return {
        code: 'not-allowed',
        statusMessage: 'Mikrofon Kullanılamıyor (İzin Engellendi): Lütfen tarayıcı izinlerinden mikrofonu açın.',
        errorMessage: 'Mikrofon izni reddedildi (not-allowed). Lütfen tarayıcının adres çubuğundaki kilit simgesine dokunarak mikrofona izin verin.',
        isFatal: true,
        retryDelayMs: 0,
        info: {
          code: 'not-allowed',
          tag: 'MİKROFON İZNİ ENGELLENDİ',
          message: 'Tarayıcı mikrofon erişim iznini engelledi.',
          reason: 'Tarayıcıda veya işletim sisteminde bu web sitesi için mikrofon izni verilmediği veya reddedildiği için ses yakalanamıyor.',
          solution: 'Adres çubuğundaki kilit (veya site ayarları) simgesine tıklayın, Mikrofonu "İzin Ver" olarak değiştirin ve ardından "Mikrofonu Yeniden Başlat" butonuna dokunun.',
          level: 'fatal',
          isMicBlocked: true,
        },
      };

    case 'service-not-allowed':
      return {
        code: 'service-not-allowed',
        statusMessage: 'Mikrofon Kullanılamıyor (Servis Kısıtlandı): Konuşma tanıma servisine bu ortamda izin verilmiyor.',
        errorMessage: 'Konuşma tanıma servisi kısıtlandı (service-not-allowed). Tarayıcı veya iFrame güvenlik ayarlarını kontrol edin.',
        isFatal: true,
        retryDelayMs: 0,
        info: {
          code: 'service-not-allowed',
          tag: 'SERVİS / GÜVENLİK KISITLAMASI',
          message: 'Konuşma tanıma servisi bu pencere veya güvenlik ilkesinde kısıtlandı.',
          reason: 'Gömülü iFrame güvenlik kısıtlaması (Permissions-Policy) veya kurumsal ağ ilkeleri konuşma tanıma bulut servisine erişimi engelledi.',
          solution: 'Sayfayı yeni bir tarayıcı sekmesinde doğrudan açmayı deneyin veya iFrame izinlerini kontrol edin.',
          level: 'fatal',
          isMicBlocked: true,
        },
      };

    case 'audio-capture':
      return {
        code: 'audio-capture',
        statusMessage: 'Mikrofon Kullanılamıyor (Donanım Hatası): Mikrofon aygıtı algılanamadı veya kilitli.',
        errorMessage: 'Ses yakalama başarısız oldu (audio-capture). Mikrofonunuzun takılı olduğundan ve başka bir uygulama tarafından kullanılmadığından emin olun.',
        isFatal: false,
        retryDelayMs: 1400,
        info: {
          code: 'audio-capture',
          tag: 'SES YAKALAMA DONANIM HATASI',
          message: 'Mikrofon donanımından ses akışı alınamıyor.',
          reason: 'Sisteme bağlı mikrofon bulunamadı ya da donanım başka bir uygulama (Zoom, Teams, Discord vb.) tarafından kilitlenmiş durumda.',
          solution: 'Mikrofon bağlantısını kontrol edin ve mikrofonu meşgul eden diğer programları kapatın.',
          level: 'warning',
          isMicBlocked: true,
        },
      };

    case 'network':
      return {
        code: 'network',
        statusMessage: 'Mikrofon Kullanılamıyor (Ağ Arızası): Ses tanıma sunucusuna ulaşılamıyor. Yeniden bağlanılıyor...',
        errorMessage: 'Ses tanıma ağına bağlanılamadı (network). İnternet bağlantınızı kontrol edin; sistem otomatik yeniden bağlanmayı deneyecek.',
        isFatal: false,
        retryDelayMs: 1800,
        info: {
          code: 'network',
          tag: 'SES AĞI BAĞLANTI ARIZASI',
          message: 'Ses tanıma bulut sunucusu ile iletişim sağlanamadı.',
          reason: 'İnternet bağlantınızdaki anlık kesinti veya Web Speech API bulut sunucusunun geçici yanıt vermemesi nedeniyle ses çözülemedi.',
          solution: 'İnternet bağlantınızı kontrol edin. Sistem arka planda otomatik olarak yeniden bağlanmayı deneyecektir.',
          level: 'network',
          isMicBlocked: false,
        },
      };

    case 'speech-api-unsupported':
      return {
        code: 'speech-api-unsupported',
        statusMessage: 'Mikrofon Kullanılamıyor (API Desteksiz): Tarayıcınız Web Speech API teknolojisini desteklemiyor. Lütfen Chrome veya Edge kullanın.',
        errorMessage: 'Tarayıcınız Web Speech API ses tanıma teknolojisini desteklemiyor.',
        isFatal: true,
        retryDelayMs: 0,
        info: {
          code: 'speech-api-unsupported',
          tag: 'TARAYICI SES MOTORU DESTEKSİZ',
          message: 'Mevcut tarayıcınız konuşma tanıma (SpeechRecognition) standardını desteklemiyor.',
          reason: 'Kullandığınız tarayıcı veya web görünümü HTML5 Web Speech API arayüzünü barındırmıyor.',
          solution: 'Tam ses deneyimi için Google Chrome, Microsoft Edge veya Brave tarayıcısına geçiş yapın.',
          level: 'fatal',
          isMicBlocked: true,
        },
      };

    case 'language-not-supported':
      return {
        code: 'language-not-supported',
        statusMessage: 'Mikrofon Kullanılamıyor (Dil Desteksiz): Türkçe (tr-TR) ses tanıma bu tarayıcıda desteklenmiyor.',
        errorMessage: 'Belirtilen dil paketi (tr-TR) bu tarayıcıda desteklenmiyor (language-not-supported).',
        isFatal: true,
        retryDelayMs: 0,
        info: {
          code: 'language-not-supported',
          tag: 'DİL PAKETİ DESTEKLENMİYOR',
          message: 'Türkçe (tr-TR) ses tanıma paketi mevcut ortamda desteklenmiyor.',
          reason: 'Tarayıcının konuşma tanıma motorunda Türkçe dil modeli yüklü değil.',
          solution: 'Google Chrome veya Microsoft Edge tarayıcısını kullanarak tekrar deneyin.',
          level: 'fatal',
          isMicBlocked: true,
        },
      };

    case 'bad-grammar':
      return {
        code: 'bad-grammar',
        statusMessage: 'Mikrofon Kullanılamıyor (Gramer Hatası): Konuşma kuralları ayrıştırılamadı, yeniden başlatılıyor...',
        errorMessage: 'Gramer yapılandırma hatası (bad-grammar).',
        isFatal: false,
        retryDelayMs: 800,
        info: {
          code: 'bad-grammar',
          tag: 'SES AYRIŞTIRMA KURAL HATASI',
          message: 'Ses çözümleme kurallarında yapısal bir ayrıştırma hatası oluştu.',
          reason: 'Konuşma grameri modeli çözümlenirken sözdizimsel bir istisna meydana geldi.',
          solution: 'Sistem motoru otomatik olarak yenileniyor.',
          level: 'warning',
          isMicBlocked: false,
        },
      };

    case 'no-speech':
      return {
        code: 'no-speech',
        statusMessage: 'Ses algılanamadı, dinlemeye devam ediliyor...',
        errorMessage: 'Konuşma algılanamadı (no-speech).',
        isFatal: false,
        retryDelayMs: 300,
        info: {
          code: 'no-speech',
          tag: 'SES ALGILANAMADI',
          message: 'Belirli bir süre içinde herhangi bir ses algılanamadı.',
          reason: 'Mikrofona konuşulmadı ya da ortam gürültüsü/ses seviyesi eşiğin altında kaldı.',
          solution: 'Daha yüksek sesle veya mikrofona biraz daha yaklaşarak konuşun.',
          level: 'warning',
          isMicBlocked: false,
        },
      };

    default:
      return {
        code: errorCode || 'unknown',
        statusMessage: `Mikrofon Kullanılamıyor (${errorCode || 'Teknik Arıza'}): Donanımsal bağlantıyı kontrol edin, yeniden deneniyor...`,
        errorMessage: `Beklenmeyen mikrofon hatası oluştu (${errorCode || 'unknown'}).`,
        isFatal: false,
        retryDelayMs: 700,
        info: {
          code: errorCode || 'unknown',
          tag: 'MİKROFON TEKNİK ARIZA',
          message: `Mikrofon servisinde beklenmeyen bir teknik hata oluştu (${errorCode || 'unknown'}).`,
          reason: 'Tarayıcı ses yakalama katmanında veya donanım sürücüsünde anlık bir aksaklık meydana geldi.',
          solution: 'Mikrofon anahtarını kapatıp açın veya sayfayı yenileyin.',
          level: 'warning',
          isMicBlocked: true,
        },
      };
  }
}

export function createCustomMicErrorInfo(
  code: string,
  message: string,
  reason?: string,
  solution?: string,
  tag?: string
): MicErrorInfo {
  return {
    code,
    tag: tag || 'MİKROFON ARIZASI',
    message,
    reason: reason || 'Mikrofon servisi başlatılırken beklenmeyen bir hata oluştu.',
    solution: solution || 'Mikrofon iznini yenileyin veya sayfayı tazeleyin.',
    level: 'fatal',
    isMicBlocked: true,
  };
}

export function mapMediaErrorToDetails(err: any): SpeechErrorDetails {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return getGranularSpeechError('not-allowed');
  }
  if (err.name === 'SecurityError') {
    return getGranularSpeechError('service-not-allowed');
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return {
      code: 'audio-capture',
      statusMessage: 'Mikrofon Kullanılamıyor (Aygıt Yok): Sisteme bağlı çalışan bir mikrofon donanımı bulunamadı.',
      errorMessage: 'Kullanılabilir mikrofon donanımı algılanamadı (NotFoundError).',
      isFatal: true,
      retryDelayMs: 0,
      info: {
        code: 'audio-capture',
        tag: 'MİKROFON AYGITI BULUNAMADI',
        message: 'Sisteme bağlı çalışan bir mikrofon donanımı algılanamadı.',
        reason: 'Cihazınıza takılı bir mikrofon yok veya işletim sistemi mikrofonu devre dışı bırakmış.',
        solution: 'Mikrofon veya kulaklık bağlantısını kontrol edin ve işletim sistemi ses ayarlarından mikrofonu etkinleştirin.',
        level: 'fatal',
        isMicBlocked: true,
      },
    };
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return {
      code: 'audio-capture',
      statusMessage: 'Mikrofon Kullanılamıyor (Aygıt Meşgul): Mikrofon donanımı başka bir uygulama tarafından kilitlenmiş.',
      errorMessage: 'Mikrofon donanımı başka bir uygulama tarafından kilitlenmiş (NotReadableError).',
      isFatal: false,
      retryDelayMs: 1400,
      info: {
        code: 'audio-capture',
        tag: 'MİKROFON DONANIMI KİLİTLİ',
        message: 'Mikrofon başka bir program tarafından rezerve edilmiş durumda.',
        reason: 'Mikrofon donanımınız Zoom, Teams, Skype veya başka bir tarayıcı sekmesi tarafından kilitlenmiş.',
        solution: 'Mikrofonu kullanan diğer sekmeleri veya ses/video uygulamalarını kapatıp tekrar deneyin.',
        level: 'warning',
        isMicBlocked: true,
      },
    };
  }
  if (err.name === 'OverconstrainedError') {
    return {
      code: 'audio-capture',
      statusMessage: 'Mikrofon Kullanılamıyor (Donanım Kısıtı): İstenen ses özellikleri aygıt tarafından desteklenmiyor.',
      errorMessage: 'Aygıt ses parametrelerini karşılayamadı (OverconstrainedError).',
      isFatal: false,
      retryDelayMs: 1400,
      info: {
        code: 'audio-capture',
        tag: 'DONANIM PARAMETRE KISITI',
        message: 'İstenen ses donanım özellikleri karşılanamıyor.',
        reason: 'Mevcut mikrofon sürücüsü istenen ses kanallarını veya örnekleme hızını desteklemiyor.',
        solution: 'Varsayılan mikrofon aygıtınızı sistem ayarlarından doğrulayın.',
        level: 'warning',
        isMicBlocked: true,
      },
    };
  }
  return {
    code: err.name || 'unknown',
    statusMessage: `Mikrofon Kullanılamıyor (${err.name || 'Hata'}): ${err.message || 'Donanım veya izin hatası'}`,
    errorMessage: `Mikrofon erişim hatası: ${err.message || err.name}`,
    isFatal: false,
    retryDelayMs: 1000,
    info: {
      code: err.name || 'unknown',
      tag: 'MİKROFON ERİŞİM HATASI',
      message: `Mikrofona erişilirken hata oluştu: ${err.message || err.name}`,
      reason: 'Donanımsal veya sürücü kaynaklı bir erişim engeli meydana geldi.',
      solution: 'Mikrofon bağlantınızı ve tarayıcı izinlerini kontrol edip sayfayı yenileyin.',
      level: 'warning',
      isMicBlocked: true,
    },
  };
}

export interface VoiceCallbacks {
  onWakeDetected: (remainingCommand?: string) => void;
  onCommandReceived: (command: string) => void;
  onStatusChange: (statusText: string) => void;
  onError: (errorMessage: string) => void;
  onErrorMessage?: (errorMessage: string, errorCode?: string, errorInfo?: MicErrorInfo) => void;
  onPermissionStateChange?: (state: 'prompt' | 'granted' | 'denied') => void;
}

export class VoiceAssistantController {
  private recognition: any = null;
  private isEnabled: boolean = true;
  private isSpeaking: boolean = false;
  private isListeningActive: boolean = false;
  private mode: 'WAITING_WAKEWORD' | 'LISTENING_COMMAND' = 'WAITING_WAKEWORD';
  private wakeTimeoutTimer: any = null;
  private restartTimer: any = null;
  private speakingWatchdogTimer: any = null;
  private lastStartTime: number = 0;
  private hasActiveError: boolean = false;
  private consecutiveErrors: number = 0;
  private callbacks: VoiceCallbacks;
  private settings: VoiceSettings;

  constructor(callbacks: VoiceCallbacks, settings: VoiceSettings) {
    this.callbacks = callbacks;
    this.settings = settings;
    this.initRecognition();
    this.checkInitialPermission();
    
    // Ensure voices are loaded for TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
        };
      }
    }
  }

  public updateSettings(settings: VoiceSettings) {
    this.settings = settings;
  }

  public isSpeechSupported(): boolean {
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  private async checkInitialPermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        this.callbacks.onPermissionStateChange?.(status.state as any);
        status.onchange = () => {
          this.callbacks.onPermissionStateChange?.(status.state as any);
        };
      }
    } catch {
      // Permission query not supported in all browsers; normal
    }
  }

  // Explicitly prompt user for mic permission via getUserMedia
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Mikrofon Kullanılamıyor (Ortam Hatası): Tarayıcınız güvenli ses aygıtı (getUserMedia) erişimini desteklemiyor.';
        this.hasActiveError = true;
        const errInfo = createCustomMicErrorInfo(
          'not-supported',
          'Tarayıcınız güvenli ses aygıtı (getUserMedia) erişimini desteklemiyor.',
          'WebRTC / getUserMedia API bulunamadı veya güvenli olmayan (HTTP) bir bağlantı kullanılıyor.',
          'HTTPS protokolü veya modern bir tarayıcı (Chrome, Edge) kullanın.',
          'SES AYGITI DESTEKSİZ'
        );
        this.callbacks.onStatusChange(msg);
        this.callbacks.onError(msg);
        this.callbacks.onErrorMessage?.(msg, 'not-supported', errInfo);
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.callbacks.onPermissionStateChange?.('granted');
      this.consecutiveErrors = 0;
      this.hasActiveError = false;
      this.safeStart();
      return true;
    } catch (err: any) {
      console.warn('getUserMedia mic request failed:', err);
      this.hasActiveError = true;
      const details = mapMediaErrorToDetails(err);

      if (details.code === 'not-allowed' || details.code === 'service-not-allowed') {
        this.callbacks.onPermissionStateChange?.('denied');
      }

      this.callbacks.onStatusChange(details.statusMessage);
      this.callbacks.onError(details.errorMessage);
      this.callbacks.onErrorMessage?.(details.errorMessage, details.code, details.info);
      return false;
    }
  }

  private initRecognition() {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      this.hasActiveError = true;
      const details = getGranularSpeechError('speech-api-unsupported');
      this.callbacks.onStatusChange(details.statusMessage);
      this.callbacks.onError(details.errorMessage);
      this.callbacks.onErrorMessage?.(details.errorMessage, details.code, details.info);
      return;
    }

    try {
      this.recognition = new SpeechAPI();
      this.recognition.lang = 'tr-TR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.consecutiveErrors = 0;
        this.lastStartTime = Date.now();
        if (this.hasActiveError) {
          this.hasActiveError = false;
          if (this.mode === 'WAITING_WAKEWORD') {
            this.callbacks.onStatusChange('Sistem dinlemede: “ATLAS” diyebilir veya küreye dokunabilirsiniz.');
          }
        }
      };

      this.recognition.onresult = (event: any) => {
        if (this.isSpeaking) return; 

        let fullTranscript = '';
        let currentInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            fullTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }
        
        const text = (fullTranscript + currentInterim).trim().toLowerCase();
        if (!text) return;

        // More inclusive wake word regex
        const wakeRegex = /\b(atlas|jarvis|aytas|atlast|ayaz|adlas|anlas)\b/i;

        if (this.mode === 'WAITING_WAKEWORD') {
          if (wakeRegex.test(text)) {
            // Check if wake word was just found
            console.log('Wake word detected in:', text);
            
            if (this.settings.soundChime) {
              playHologramChime();
            }

            // Extract command if spoken in same result
            const words = text.split(/\s+/);
            const wakeIdx = words.findIndex(w => wakeRegex.test(w));
            const commandPart = words.slice(wakeIdx + 1).join(' ').trim();

            if (commandPart.length > 2) {
              this.callbacks.onWakeDetected(commandPart);
              this.callbacks.onCommandReceived(commandPart);
              // Restart recognition to clear buffer for next turn
              this.stopImmediate();
              return;
            }

            this.mode = 'LISTENING_COMMAND';
            this.callbacks.onWakeDetected();

            clearTimeout(this.wakeTimeoutTimer);
            this.wakeTimeoutTimer = setTimeout(() => {
              if (this.mode === 'LISTENING_COMMAND' && !this.isSpeaking) {
                this.resetToStandby();
              }
            }, 8000);
          }
        } else if (this.mode === 'LISTENING_COMMAND') {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal && lastResult[0].transcript.trim().length > 0) {
            const finalCommand = lastResult[0].transcript.trim();
            clearTimeout(this.wakeTimeoutTimer);
            this.callbacks.onCommandReceived(finalCommand);
            // Restart to clear internal buffer
            this.stopImmediate();
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;

        if (event.error === 'aborted') return;

        const errorInfo = getGranularSpeechError(event.error);

        if (event.error === 'no-speech') {
          if (this.mode === 'LISTENING_COMMAND') {
            this.callbacks.onStatusChange(errorInfo.statusMessage);
          }
          this.scheduleRestart(errorInfo.retryDelayMs);
          return;
        }

        this.hasActiveError = true;

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.callbacks.onPermissionStateChange?.('denied');
        }

        this.callbacks.onStatusChange(errorInfo.statusMessage);
        this.callbacks.onError(errorInfo.errorMessage);
        this.callbacks.onErrorMessage?.(errorInfo.errorMessage, event.error, errorInfo.info);

        if (errorInfo.isFatal) {
          this.disable();
          return;
        }

        this.scheduleRestart(errorInfo.retryDelayMs);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        if (this.hasActiveError || !this.isEnabled || this.isSpeaking) {
          return;
        }
        this.scheduleRestart(300);
      };
    } catch (err: any) {
      console.warn('Speech recognition init failed:', err);
      this.hasActiveError = true;
      const initDetails = createCustomMicErrorInfo(
        err?.name || 'init-failed',
        `Konuşma tanıma motoru başlatılamadı.`,
        'Sistem hatası.',
        'Sayfayı yenileyin.',
        'SES MOTORU ARIZASI'
      );
      this.callbacks.onErrorMessage?.('Motor hatası', 'init-failed', initDetails);
    }
  }

  private scheduleRestart(delayMs: number = 300) {
    clearTimeout(this.restartTimer);
    if (!this.isEnabled || this.isSpeaking) return;

    const elapsed = Date.now() - this.lastStartTime;
    const effectiveDelay = elapsed < 500 ? Math.max(delayMs, 1000) : delayMs;

    this.restartTimer = setTimeout(() => {
      this.safeStart();
    }, effectiveDelay);
  }

  public safeStart() {
    if (!this.isEnabled || this.isSpeaking || !this.recognition || this.isListeningActive) return;
    try {
      this.recognition.start();
    } catch (err: any) {
      if (err.name === 'InvalidStateError') return;
      this.hasActiveError = true;
      const details = mapMediaErrorToDetails(err);
      this.callbacks.onStatusChange(details.statusMessage);
    }
  }

  public stopImmediate() {
    this.isListeningActive = false;
    clearTimeout(this.restartTimer);
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch { }
    }
  }

  public startDirectCommandListening() {
    if (!this.isSpeechSupported()) return;
    this.mode = 'LISTENING_COMMAND';
    if (this.settings.soundChime) playHologramChime();
    
    clearTimeout(this.wakeTimeoutTimer);
    this.wakeTimeoutTimer = setTimeout(() => {
      if (this.mode === 'LISTENING_COMMAND' && !this.isSpeaking) {
        this.resetToStandby();
      }
    }, 8000);

    this.stopImmediate(); // Abort current to clear buffer and start fresh
    setTimeout(() => this.safeStart(), 100);
  }

  public enable() {
    this.isEnabled = true;
    this.resetToStandby();
    this.safeStart();
  }

  public disable() {
    this.isEnabled = false;
    this.mode = 'WAITING_WAKEWORD';
    clearTimeout(this.wakeTimeoutTimer);
    clearTimeout(this.restartTimer);
    this.stopImmediate();
  }

  public resetToStandby() {
    this.mode = 'WAITING_WAKEWORD';
    clearTimeout(this.wakeTimeoutTimer);
    if (this.isEnabled && !this.isSpeaking) {
      this.safeStart();
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    clearTimeout(this.speakingWatchdogTimer);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = this.settings.rate || 1.05;
    utterance.pitch = this.settings.pitch || 0.95;
    utterance.volume = this.settings.volume || 1.0;

    (window as any).__jarvis_active_utterance = utterance;

    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find((v) => v.lang.includes('tr') || v.lang.includes('TR'));
    if (trVoice) utterance.voice = trVoice;

    const finishSpeaking = () => {
      clearTimeout(this.speakingWatchdogTimer);
      (window as any).__jarvis_active_utterance = null;
      this.isSpeaking = false;
      onEnd?.();
      setTimeout(() => this.resetToStandby(), 500);
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.stopImmediate();
      onStart?.();
      const approxDurationMs = Math.max(3000, (text.length / 10) * 1000 + 5000);
      this.speakingWatchdogTimer = setTimeout(() => {
        if (this.isSpeaking) finishSpeaking();
      }, approxDurationMs);
    };

    utterance.onend = () => finishSpeaking();
    utterance.onerror = () => finishSpeaking();

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    clearTimeout(this.speakingWatchdogTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    (window as any).__jarvis_active_utterance = null;
    this.isSpeaking = false;
    this.resetToStandby();
  }
}

