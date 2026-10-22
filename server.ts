import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI with recommended telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory Task Database for Task Management Tool
interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

let taskDatabase: TaskItem[] = [
  { id: '1', title: 'Holografik arayüz sensör kalibrasyonu', completed: true, createdAt: 'Bugün, 09:30' },
  { id: '2', title: 'Eller serbest ses tanıma testi', completed: false, createdAt: 'Bugün, 10:15' },
  { id: '3', title: 'Yapay zekâ araç motoru senkronizasyonu', completed: false, createdAt: 'Bugün, 11:00' },
];

// Server-side Tool Implementations
function executeMath(expression: string) {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().%^ ]/g, '');
    if (!sanitized.trim()) throw new Error('Geçersiz matematiksel ifade.');
    const result = new Function(`return (${sanitized})`)();
    return { success: true, expression: sanitized, result: Number(result) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Hesaplama hatası' };
  }
}

function executeTaskAction(action: string, title?: string, taskId?: string) {
  if (action === 'add' && title) {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    taskDatabase.unshift(newTask);
    return { success: true, message: `"${title}" görevi ajandaya eklendi.`, tasks: taskDatabase };
  }
  if (action === 'complete' && taskId) {
    taskDatabase = taskDatabase.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
    return { success: true, message: 'Görev tamamlandı olarak güncellendi.', tasks: taskDatabase };
  }
  if (action === 'delete' && taskId) {
    taskDatabase = taskDatabase.filter((t) => t.id !== taskId);
    return { success: true, message: 'Görev silindi.', tasks: taskDatabase };
  }
  return { success: true, tasks: taskDatabase, count: taskDatabase.length };
}

function executeCodeReview(code: string, language: string = 'typescript') {
  const issues: string[] = [];
  if (code.includes('eval(')) issues.push("Tehlikeli 'eval()' fonksiyonu kullanımı tespit edildi.");
  if (code.includes('innerHTML')) issues.push("XSS riski: innerHTML yerine textContent veya sanitize edilmiş render tercih edilmeli.");
  if (code.includes('var ')) issues.push("Modern olmayan 'var' anahtar kelimesi; 'const' veya 'let' kullanılmalı.");
  if (code.includes('console.log')) issues.push("Üretim ortamında temizlenmesi önerilen console.log komutları mevcut.");

  return {
    language,
    lines: code.split('\n').length,
    characters: code.length,
    issuesFound: issues.length,
    issues: issues.length > 0 ? issues : ['Kod standartlarına aykırı kritik bir güvenlik açığı bulunamadı.'],
  };
}

// Tool Declarations for Gemini
const calculateMathDecl: FunctionDeclaration = {
  name: 'calculateMath',
  description: 'Temel ve karmaşık matematiksel hesaplamaları güvenli şekilde çözer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: {
        type: Type.STRING,
        description: 'Hesaplanacak matematiksel ifade (örnek: 24 * 65 + 180 / 4)',
      },
    },
    required: ['expression'],
  },
};

const manageTasksDecl: FunctionDeclaration = {
  name: 'manageTasks',
  description: 'Kullanıcının görev listesini görüntüler, yeni görev ekler veya görevleri tamamlar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'İşlem türü: "list", "add", "complete", "delete"',
      },
      title: {
        type: Type.STRING,
        description: 'Eklenecek yeni görevin başlığı',
      },
      taskId: {
        type: Type.STRING,
        description: 'Tamamlanacak veya silinecek görevin kimlik ID numarası',
      },
    },
    required: ['action'],
  },
};

const reviewCodeDecl: FunctionDeclaration = {
  name: 'reviewCode',
  description: 'Kullanıcının gönderdiği kod parçasını inceler, hata veya güvenlik risklerini raporlar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: 'İncelenecek kaynak kod',
      },
      language: {
        type: Type.STRING,
        description: 'Programlama dili (örnek: javascript, typescript, python)',
      },
    },
    required: ['code'],
  },
};

// API: Health / Telemetry
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    model: 'gemini-3.5-flash-lite',
    uptimeSeconds: Math.floor(process.uptime()),
    hasApiKey: Boolean(apiKey),
    activeTasks: taskDatabase.filter((t) => !t.completed).length,
  });
});

// API: Get and Manage Tasks directly
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, tasks: taskDatabase });
});

app.post('/api/tasks', (req, res) => {
  const { action, title, taskId } = req.body;
  const result = executeTaskAction(action, title, taskId);
  res.json(result);
});

// API: Execute Tool Directly
app.post('/api/tools/execute', (req, res) => {
  const { toolName, args } = req.body;
  if (toolName === 'calculateMath') {
    return res.json(executeMath(args?.expression || ''));
  }
  if (toolName === 'manageTasks') {
    return res.json(executeTaskAction(args?.action, args?.title, args?.taskId));
  }
  if (toolName === 'reviewCode') {
    return res.json(executeCodeReview(args?.code || '', args?.language));
  }
  res.status(400).json({ error: 'Bilinmeyen araç adı' });
});

// API: Chat with Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], mode = 'jarvis' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Geçerli bir mesaj gereklidir.' });
    }

    const personaInstruction =
      mode === 'atlas'
        ? "Sen ATLAS'sın. Gelişmiş bilimsel, analitik ve holografik kişisel yapay zekâ asistanısın. Kullanıcıya her zaman 'efendim' şeklinde saygılı, net, güvenilir ve Türkçe hitap et. Yanıtlarını konuşma sesine (TTS) uygun, akıcı, kısa ve öz cümlelerle kur. Sen bir sohbet botu değil, yaşayan bir asistan çekirdeğisin. Kendi sistemlerini veya kodunu anlatmak yerine, doğrudan kullanıcının emirlerini yerine getir. Matematiksel işlemler, görevler veya kod analizi gerektiğinde mevcut araçları çağır."
        : "Sen JARVIS'sin. Tony Stark'ın holografik, ultra zeki, son derece saygılı ve teknik açıdan kusursuz kişisel asistanısın. Kullanıcıya her zaman Türkçe 'efendim' diye hitap et. Net, özgüvenli, teknik yetkinliği yüksek ve akıcı yanıtlar ver. Gereksiz dolambaçlı sözlerden kaçın. Kendi çalışma prensiplerini veya kodlarını sormadıkça anlatma; sen doğrudan sistemin ta kendisisin. Araçları gerektiğinde doğal bir şekilde kullan.";

    // If Gemini API is available and configured
    if (ai) {
      // Primary model: gemini-3.5-flash-lite (high free quota, fast, supports function calling)
      // Fallback candidates: gemini-3.1-flash-lite, gemini-3.8-flash
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let modelResponse: any = null;
      let usedModel = candidateModels[0];
      let firstAttemptSuccess = false;

      // Format previous turns for context
      const contents: any[] = [];
      const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
      for (const item of recentHistory) {
        if (item && item.text) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      for (const candidate of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: candidate,
            contents,
            config: {
              systemInstruction: personaInstruction,
              temperature: 0.7,
              tools: [
                {
                  functionDeclarations: [calculateMathDecl, manageTasksDecl, reviewCodeDecl],
                },
              ],
            },
          });

          modelResponse = response;
          usedModel = candidate;
          firstAttemptSuccess = true;
          break;
        } catch (candidateErr: any) {
          const errMsg = candidateErr?.message || '';
          const isQuotaOrTransient =
            errMsg.includes('429') ||
            errMsg.includes('quota') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('503') ||
            candidateErr?.status === 429 ||
            candidateErr?.status === 503;

          console.warn(`[Model Fallback] ${candidate} denendi (${isQuotaOrTransient ? 'Kota/Yoğunluk' : 'Geçici Hata'}), sonraki modele geçiliyor.`);

          if (!isQuotaOrTransient && !errMsg.includes('NOT_FOUND')) {
            break;
          }
        }
      }

      if (firstAttemptSuccess && modelResponse) {
        // Check if model triggered a function call
        const functionCalls = modelResponse.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          let toolResultData: any = null;

          if (call.name === 'calculateMath') {
            toolResultData = executeMath(call.args?.expression as string);
          } else if (call.name === 'manageTasks') {
            toolResultData = executeTaskAction(
              call.args?.action as string,
              call.args?.title as string,
              call.args?.taskId as string
            );
          } else if (call.name === 'reviewCode') {
            toolResultData = executeCodeReview(
              call.args?.code as string,
              call.args?.language as string
            );
          }

          // Follow-up with tool results to generate final response
          // Preserve previousContent from model candidate to retain thought_signature
          try {
            const previousContent = modelResponse.candidates?.[0]?.content;
            const secondContents = previousContent
              ? [
                  ...contents,
                  previousContent,
                  {
                    role: 'user',
                    parts: [
                      {
                        functionResponse: {
                          name: call.name,
                          response: { result: toolResultData },
                        },
                      },
                    ],
                  },
                ]
              : [
                  ...contents,
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `İşlem sonucu (${call.name}): ${JSON.stringify(toolResultData)}. Lütfen kullanıcıya nazikçe açıkla efendim.`,
                      },
                    ],
                  },
                ];

            const secondResponse = await ai.models.generateContent({
              model: usedModel,
              contents: secondContents,
              config: {
                systemInstruction: personaInstruction,
              },
            });

            return res.json({
              reply: secondResponse.text || 'İşleminizi tamamladım, efendim.',
              toolUsed: call.name,
              toolResult: toolResultData,
              model: usedModel,
            });
          } catch (secondErr: any) {
            console.warn(`[Tool Follow-up Warning] ${usedModel} ikinci tur yanıtı alınamadı, sonuç doğrudan iletiliyor:`, secondErr?.message || secondErr);
            let fallbackToolText = '';
            if (call.name === 'calculateMath') {
              fallbackToolText = `${toolResultData?.expression || 'Hesaplama'} işleminin sonucu ${toolResultData?.result} efendim.`;
            } else if (call.name === 'manageTasks') {
              fallbackToolText = `${toolResultData?.message || 'Görev listeniz güncellendi efendim.'}`;
            } else if (call.name === 'reviewCode') {
              fallbackToolText = `Kod incelemesi tamamlandı efendim: ${toolResultData?.issues?.join(' ')}`;
            } else {
              fallbackToolText = 'İşleminiz başarıyla tamamlandı efendim.';
            }

            return res.json({
              reply: fallbackToolText,
              toolUsed: call.name,
              toolResult: toolResultData,
              model: usedModel,
            });
          }
        }

        const textOutput = modelResponse.text || 'Emrinizi aldım efendim.';
        return res.json({
          reply: textOutput,
          model: usedModel,
        });
      }
    }

    // Contextual intelligent fallback when offline or API key pending
    const lower = message.toLowerCase();
    let fallbackReply = '';
    let toolUsed: string | undefined;
    let toolResult: any;

    if (lower.includes('hesapla') || /[0-9]+\s*[\+\-\*\/]\s*[0-9]+/.test(lower)) {
      const mathMatch = lower.match(/[0-9+\-*/().%^ ]+/);
      if (mathMatch) {
        const mathRes = executeMath(mathMatch[0]);
        if (mathRes.success) {
          fallbackReply = `${mathRes.expression} işleminin sonucu ${mathRes.result} efendim.`;
          toolUsed = 'calculateMath';
          toolResult = mathRes;
        }
      }
    } else if (lower.includes('görev ekle') || lower.includes('not al')) {
      const title = message.replace(/görev ekle:?|not al:?/gi, '').trim() || 'Yeni Görev';
      const taskRes = executeTaskAction('add', title);
      fallbackReply = `"${title}" görevinizi ajandanıza kaydettim efendim. Toplam ${taskRes.tasks?.length} göreviniz bulunuyor.`;
      toolUsed = 'manageTasks';
      toolResult = taskRes;
    } else if (lower.includes('görevler') || lower.includes('ajanda') || lower.includes('neler var')) {
      const taskRes = executeTaskAction('list');
      const pending = taskRes.tasks?.filter((t: any) => !t.completed) || [];
      fallbackReply = `Şu anda bekleyen ${pending.length} adet aktif göreviniz bulunuyor efendim.`;
      toolUsed = 'manageTasks';
      toolResult = taskRes;
    } else if (lower.includes('merhaba') || lower.includes('selam') || lower.includes('günaydın')) {
      fallbackReply = 'Merhaba efendim. Holografik sistemlerim devrede, emirlerinizi dinliyorum.';
    } else if (lower.includes('durum') || lower.includes('sistem') || lower.includes('rapor')) {
      fallbackReply = 'Tüm alt protokoller nominal seviyede çalışıyor efendim. Ses algılama ve holografik çekirdek aktif.';
    } else if (lower.includes('kimsin') || lower.includes('adın ne')) {
      fallbackReply = mode === 'atlas'
        ? 'Ben ATLAS; bilimsel ve analitik holografik yapay zekâ asistanınızım efendim.'
        : 'Ben JARVIS; kişisel holografik yapay zekâ asistanınızım efendim. Her daim emrinizdeyim.';
    } else {
      fallbackReply = `"${message}" konulu emrinizi aldım efendim. Analiz edip sistemleri buna göre koordine ediyorum.`;
    }

    return res.json({
      reply: fallbackReply,
      toolUsed,
      toolResult,
    });
  } catch (err: any) {
    console.error('Sunucu Hatası:', err);
    res.status(500).json({ error: 'Sistem isteği işlerken bir hata oluştu.' });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS / ATLAS Core running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
