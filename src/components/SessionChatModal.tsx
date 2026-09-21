import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMessageType } from '../types/chat';
import type { DiceRollResult } from '../types/dnd5e';
import { rollFormula } from '../utils/diceRoller';
import { 
  MessageSquare, 
  Send, 
  X, 
  Lock, 
  EyeOff, 
  Crown 
} from 'lucide-react';

interface SessionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatLog: ChatMessage[];
  currentUserName: string;
  isHost: boolean;
  onSendMessage: (msg: {
    text: string;
    senderName: string;
    type: ChatMessageType;
    recipientName?: string;
    diceRoll?: DiceRollResult;
  }) => void;
}

export const SessionChatModal: React.FC<SessionChatModalProps> = ({
  isOpen,
  onClose,
  chatLog,
  currentUserName,
  isHost,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSecretGmMode, setIsSecretGmMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    // Detectar comandos
    // 1. /gmroll ou /gr (rolagem secreta do mestre)
    if (raw.startsWith('/gmroll') || raw.startsWith('/gr ') || isSecretGmMode) {
      const formula = raw.replace(/^\/(gmroll|gr)\s*/, '') || '1d20';
      try {
        const rollRes = rollFormula(formula, 'Rolagem Secreta do Mestre');
        onSendMessage({
          text: `Rolou em segredo: ${formula}`,
          senderName: currentUserName,
          type: 'GM_ROLL',
          diceRoll: rollRes,
        });
      } catch {
        onSendMessage({
          text: raw,
          senderName: currentUserName,
          type: 'GM_ROLL',
        });
      }
      setInputText('');
      return;
    }

    // 2. /w ou /whisper [Destinatario] [Mensagem]
    if (raw.startsWith('/w ') || raw.startsWith('/whisper ')) {
      const parts = raw.replace(/^\/(w|whisper)\s+/, '').split(' ');
      const recipient = parts[0];
      const messageText = parts.slice(1).join(' ');
      onSendMessage({
        text: messageText || '(sussurro)',
        senderName: currentUserName,
        type: 'WHISPER',
        recipientName: recipient,
      });
      setInputText('');
      return;
    }

    // Mensagem Normal Pública
    onSendMessage({
      text: raw,
      senderName: currentUserName,
      type: 'PUBLIC',
    });
    setInputText('');
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 flex flex-col w-full sm:w-96 sm:max-w-md h-[90vh] sm:h-[520px] bg-slate-900/95 border border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95">
      {/* Cabeçalho */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
              Chat Tático da Mesa
              {isHost && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded font-sans flex items-center gap-1">
                  <Crown size={10} /> Mestre
                </span>
              )}
            </h3>
            <span className="text-[10px] text-slate-400">Mensagens e rolagens em tempo real</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {chatLog.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
            <p>Nenhuma mensagem no chat ainda.</p>
            <p className="text-[10px] mt-1 text-slate-400">
              Dica: digite <code>/gmroll 1d20+5</code> para rolar em segredo ou <code>/w [nome]</code> para sussurrar.
            </p>
          </div>
        ) : (
          chatLog.map((msg) => {
            const isMe = msg.senderName === currentUserName;
            const isGmRoll = msg.type === 'GM_ROLL';
            const isWhisper = msg.type === 'WHISPER';
            const canSeeGmRoll = isHost || isMe;

            return (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl transition-all ${
                  isGmRoll
                    ? 'bg-amber-950/30 border border-amber-900/40 text-amber-200'
                    : isWhisper
                    ? 'bg-purple-950/30 border border-purple-900/40 text-purple-200'
                    : isMe
                    ? 'bg-slate-800/80 border border-slate-700/60 ml-4'
                    : 'bg-slate-950/80 border border-slate-800 mr-4'
                }`}
              >
                {/* Linha de Autor e Tipo */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-bold flex items-center gap-1 text-slate-300">
                    {msg.senderName}
                    {isGmRoll && (
                      <span className="text-amber-400 flex items-center gap-0.5 font-mono">
                        <Lock size={10} /> [ROLAGEM DO MESTRE]
                      </span>
                    )}
                    {isWhisper && (
                      <span className="text-purple-300 flex items-center gap-0.5">
                        <EyeOff size={10} /> [Sussurro para {msg.recipientName || 'Alguém'}]
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="text-slate-200 break-words leading-relaxed">
                  {isGmRoll && !canSeeGmRoll ? (
                    <span className="italic text-slate-400 font-mono">
                      🎲 O Mestre fez uma rolagem secreta atrás do escudo...
                    </span>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Se houver resultado de dado anexado */}
                {msg.diceRoll && canSeeGmRoll && (
                  <div className="mt-1.5 p-1.5 bg-slate-950/90 rounded border border-amber-500/30 font-mono text-[11px] text-amber-300 flex items-center justify-between">
                    <span>{msg.diceRoll.breakdown}</span>
                    <span className="text-sm font-black text-amber-400 font-sans">
                      = {msg.diceRoll.total}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada */}
      <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 space-y-1.5">
        {/* Chips de Atalhos */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => setIsSecretGmMode(!isSecretGmMode)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              isSecretGmMode
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Quando ativo, suas rolagens são secretas (apenas você e o mestre veem)"
          >
            <Lock size={10} />
            <span>Rolagem Secreta ({isSecretGmMode ? 'Ativa' : 'Desligada'})</span>
          </button>

          <button
            type="button"
            onClick={() => setInputText('/gmroll 1d20+')}
            className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            /gmroll
          </button>
          <button
            type="button"
            onClick={() => setInputText('/w ')}
            className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            /w
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isSecretGmMode
                ? 'Digite a rolagem secreta (ex: 1d20+7)...'
                : 'Mensagem, /gmroll 1d20+5 ou /w [nome]...'
            }
            className="rpg-input flex-1 py-1.5 text-xs bg-slate-900 border-slate-700"
          />
          <button
            type="submit"
            className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 font-bold"
            title="Enviar"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
