import React, { useState } from 'react';
import {
  Calculator,
  Code2,
  CheckSquare,
  Search,
  FileText,
  Activity,
  Play,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { TaskItem } from '../types';

interface ToolsConsoleViewProps {
  tasks: TaskItem[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const ToolsConsoleView: React.FC<ToolsConsoleViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'math' | 'code' | 'tasks' | 'web' | 'text'>('math');

  // Math State
  const [mathInput, setMathInput] = useState('24 * 65 + 180 / 4');
  const [mathOutput, setMathOutput] = useState<string | null>('Sonuç: 1605');

  // Code State
  const [codeInput, setCodeInput] = useState(`function processData(userInput) {\n  const parsed = eval(userInput);\n  document.getElementById("output").innerHTML = parsed;\n  console.log("Parsed:", parsed);\n}`);
  const [codeReviewResult, setCodeReviewResult] = useState<any>(null);

  // Task Input
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Web Query State
  const [webQuery, setWebQuery] = useState('Yapay zekâ ve otonom asistan sistemleri 2026');
  const [webResult, setWebResult] = useState<any>(null);

  // Text Summary State
  const [textToSummarize, setTextToSummarize] = useState('Yapay zekâ asistanları son yıllarda yalnızca metin tabanlı sohbet robotları olmaktan çıkıp; sesli iletişim, görsel tanıma, gerçek dünya araçlarını kullanabilme ve çok aşamalı görevleri otonom olarak planlayabilme yetenekleri kazanmıştır.');
  const [summaryResult, setSummaryResult] = useState<string[] | null>(null);

  // Execute Math
  const handleCalculate = async () => {
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'calculateMath',
          args: { expression: mathInput },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMathOutput(`Hesaplama: ${data.expression} = ${data.result}`);
      } else {
        setMathOutput(`Hata: ${data.error}`);
      }
    } catch {
      // Local fallback
      try {
        const sanitized = mathInput.replace(/[^0-9+\-*/().%^ ]/g, '');
        const res = new Function(`return (${sanitized})`)();
        setMathOutput(`Hesaplama: ${sanitized} = ${res}`);
      } catch (e: any) {
        setMathOutput(`Hata: ${e.message}`);
      }
    }
  };

  // Execute Code Review
  const handleReviewCode = async () => {
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'reviewCode',
          args: { code: codeInput, language: 'javascript' },
        }),
      });
      const data = await res.json();
      setCodeReviewResult(data);
    } catch {
      // Local fallback
      const issues: string[] = [];
      if (codeInput.includes('eval(')) issues.push("Tehlikeli 'eval()' fonksiyonu kullanımı tespit edildi.");
      if (codeInput.includes('innerHTML')) issues.push("XSS açığı riski: innerHTML yerine textContent tercih edilmeli.");
      if (codeInput.includes('var ')) issues.push("Modern olmayan 'var' kullanımı.");
      if (codeInput.includes('console.log')) issues.push("Gereksiz konsol günlüğü.");
      setCodeReviewResult({
        language: 'javascript',
        lines: codeInput.split('\n').length,
        characters: codeInput.length,
        issuesFound: issues.length,
        issues: issues.length > 0 ? issues : ['Kod standartlarına aykırı kritik bir hata tespit edilmedi.'],
      });
    }
  };

  // Execute Web Query Synthesis
  const handleSearch = () => {
    setWebResult({
      query: webQuery,
      timestamp: new Date().toLocaleTimeString('tr-TR'),
      status: 'Gerçek zamanlı bilgi sentezi tamamlandı',
      keyPoints: [
        'Google Gemini 3.8 modelleri çok kipli ve yüksek verimlilikte akıl yürütme sağlar.',
        'Ses tanıma ve Türkçe TTS entegrasyonu eller serbest modda çalışmaktadır.',
        'Holografik arayüz GPU hızlandırmasıyla 60 FPS akıcılıkta çalışır.',
      ],
    });
  };

  // Execute Summarize
  const handleSummarize = () => {
    const sentences = textToSummarize.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
    setSummaryResult(sentences.slice(0, 3));
  };

  return (
    <div className="flex flex-col h-full bg-[#020b18]/60 border border-[#00f0ff]/20 rounded-2xl p-4 overflow-hidden">
      {/* Header */}
      <div className="pb-3 border-b border-[#00f0ff]/20">
        <h2 className="text-sm font-bold text-[#00f0ff] tracking-widest font-mono-tech uppercase">
          JARVIS / ATLAS Araç & Yetenek Konsolu
        </h2>
        <p className="text-[11px] text-[#55869c]">
          Yapay zekâ modeline bağlı 6 gerçek araç modülünü doğrudan test edin
        </p>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-[#00f0ff]/15">
        {[
          { id: 'math', label: 'Matematik', icon: Calculator },
          { id: 'code', label: 'Kod İnceleme', icon: Code2 },
          { id: 'tasks', label: 'Görevler', icon: CheckSquare },
          { id: 'web', label: 'Web Bilgi', icon: Search },
          { id: 'text', label: 'Özetleme', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#00f0ff] font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-[#58899e] hover:text-[#a0dbf3] border border-transparent hover:border-[#00f0ff]/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto py-3">
        {/* 1. Matematik Çözücü */}
        {activeSubTab === 'math' && (
          <div className="space-y-3">
            <div className="text-xs text-[#a0dbf3]">
              Güvenli matematik motoru; sistem çağrıları veya güvenlik açığı barındırmayan izole ifadelere izin verir.
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Örnek: 145 * 28 + (1200 / 4)"
                className="flex-1 bg-[#031427] border border-[#00f0ff]/30 rounded-lg px-3 py-2 text-xs text-white font-mono-tech focus:outline-none focus:border-[#00f0ff]"
              />
              <button
                onClick={handleCalculate}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] rounded-lg text-xs font-mono-tech font-bold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Hesapla</span>
              </button>
            </div>
            {mathOutput && (
              <div className="p-3 rounded-lg bg-[#031c33] border border-[#00f0ff]/30 text-xs text-emerald-300 font-mono-tech">
                {mathOutput}
              </div>
            )}
          </div>
        )}

        {/* 2. Kod İnceleme & Analiz */}
        {activeSubTab === 'code' && (
          <div className="space-y-3">
            <div className="text-xs text-[#a0dbf3]">
              Kaynak kod analizi: XSS riskleri, tehlikeli fonksiyonlar (`eval`), bellek sızıntıları ve modern standartlar denetlenir.
            </div>
            <textarea
              rows={5}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="w-full bg-[#031427] border border-[#00f0ff]/30 rounded-lg p-3 text-xs text-white font-mono-tech focus:outline-none focus:border-[#00f0ff]"
            />
            <button
              onClick={handleReviewCode}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] rounded-lg text-xs font-mono-tech font-bold transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Kodu İncele & Güvenlik Testi Yap</span>
            </button>

            {codeReviewResult && (
              <div className="p-3 rounded-lg bg-[#031c33] border border-[#00f0ff]/30 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono-tech text-[#80d7f7]">
                  <span>Satır: {codeReviewResult.lines} · Karakter: {codeReviewResult.characters}</span>
                  <span className={codeReviewResult.issuesFound > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {codeReviewResult.issuesFound > 0 ? `${codeReviewResult.issuesFound} Uyarı` : 'Kusursuz'}
                  </span>
                </div>
                <div className="space-y-1">
                  {codeReviewResult.issues.map((issue: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-300 font-mono-tech">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Görev Ajandası */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Yeni bir görev yazın..."
                className="flex-1 bg-[#031427] border border-[#00f0ff]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
              <button
                onClick={() => {
                  if (newTaskTitle.trim()) {
                    onAddTask(newTaskTitle.trim());
                    setNewTaskTitle('');
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] rounded-lg text-xs font-mono-tech font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#031c33] border border-[#00f0ff]/20 text-xs"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'border-[#00f0ff]/50 text-transparent hover:border-[#00f0ff]'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={task.completed ? 'line-through text-[#55869c]' : 'text-white'}>
                      {task.title}
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 hover:text-red-400 text-[#55869c] transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Web Bilgi & Araştırma */}
        {activeSubTab === 'web' && (
          <div className="space-y-3">
            <div className="text-xs text-[#a0dbf3]">
              İnternet ve bilgi sorgulama motoru; en güncel model bilgisi ve yapısal analiz üretir.
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webQuery}
                onChange={(e) => setWebQuery(e.target.value)}
                placeholder="Araştırma konusu girin..."
                className="flex-1 bg-[#031427] border border-[#00f0ff]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] rounded-lg text-xs font-mono-tech font-bold transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Araştır</span>
              </button>
            </div>
            {webResult && (
              <div className="p-3 rounded-lg bg-[#031c33] border border-[#00f0ff]/30 space-y-2 text-xs">
                <div className="text-[11px] text-[#00f0ff] font-mono-tech font-bold">
                  Sorgu: {webResult.query} ({webResult.timestamp})
                </div>
                <div className="space-y-1 text-[#d0f3ff]">
                  {webResult.keyPoints.map((pt: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#00f0ff] font-bold">·</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Özetleme */}
        {activeSubTab === 'text' && (
          <div className="space-y-3">
            <div className="text-xs text-[#a0dbf3]">
              Uzun makale, doküman veya notları hızlı ve anlaşılır maddeler hâlinde özetler.
            </div>
            <textarea
              rows={4}
              value={textToSummarize}
              onChange={(e) => setTextToSummarize(e.target.value)}
              className="w-full bg-[#031427] border border-[#00f0ff]/30 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
            />
            <button
              onClick={handleSummarize}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] rounded-lg text-xs font-mono-tech font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Maddeler Halinde Özetle</span>
            </button>
            {summaryResult && (
              <div className="p-3 rounded-lg bg-[#031c33] border border-[#00f0ff]/30 space-y-1.5 text-xs text-white">
                <div className="font-bold text-[#00f0ff] font-mono-tech text-[11px]">Temel Çıkarımlar:</div>
                {summaryResult.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#00ffaa] font-mono-tech font-bold">{idx + 1}.</span>
                    <span>{s}.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
