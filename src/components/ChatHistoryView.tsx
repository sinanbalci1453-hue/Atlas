import React, { useState } from 'react';
import { Trash2, Copy, Volume2, Search, Check, Bot, User, Cpu } from 'lucide-react';
import { Message } from '../types';

interface ChatHistoryViewProps {
  messages: Message[];
  onClearMessages: () => void;
  onSpeakMessage: (text: string) => void;
}

export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({
  messages,
  onClearMessages,
  onSpeakMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = messages.filter((m) =>
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#020b18]/60 border border-[#00f0ff]/20 rounded-2xl p-4 overflow-hidden">
      {/* Header and Controls */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#00f0ff]/20">
        <div>
          <h2 className="text-sm font-bold text-[#00f0ff] tracking-widest font-mono-tech uppercase">
            Görüşme Kayıtları & Bellek
          </h2>
          <p className="text-[11px] text-[#55869c]">
            Toplam {messages.length} mesaj yerel hafızada kayıtlı
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs transition cursor-pointer"
            title="Sohbet geçmişini sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-mono-tech">Belleği Sıfırla</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {messages.length > 3 && (
        <div className="relative my-3">
          <Search className="w-4 h-4 text-[#55869c] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Geçmiş kayıtlarda ara..."
            className="w-full bg-[#031427] border border-[#00f0ff]/25 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#457082] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#55869c] text-xs text-center space-y-2">
            <Bot className="w-8 h-8 text-[#00f0ff]/30" />
            <p>Kayıtlı mesaj bulunmuyor, efendim.</p>
            <p className="text-[10px]">“ATLAS” diyerek veya metin kutusundan bir soru sorarak başlayabilirsiniz.</p>
          </div>
        ) : (
          filtered.map((msg, idx) => (
            <div
              key={`${msg.id}-${idx}`}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-xl p-3 text-xs leading-relaxed transition-all shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-white rounded-tr-none'
                    : 'bg-[#041a33] border border-[#00e1ff]/25 text-[#ccefff] rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 opacity-70 text-[10px] font-mono-tech">
                  <span className="flex items-center gap-1 font-semibold text-[#8adcf8]">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3 h-3" /> Siz
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-[#00f0ff]" /> JARVIS / ATLAS
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Tool used badge */}
                {msg.toolUsed && (
                  <div className="mt-2 pt-2 border-t border-[#00f0ff]/15 flex items-center gap-1.5 text-[10px] text-[#00ffaa] font-mono-tech">
                    <Cpu className="w-3 h-3" />
                    <span>Araç Çalıştırıldı: {msg.toolUsed}</span>
                  </div>
                )}

                {/* Actions: Speak & Copy */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/5 opacity-80 hover:opacity-100">
                  <button
                    onClick={() => onSpeakMessage(msg.text)}
                    className="p-1 hover:text-[#00f0ff] transition cursor-pointer"
                    title="Seslendir"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1 hover:text-[#00f0ff] transition cursor-pointer"
                    title="Kopyala"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-[#00ffaa]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
