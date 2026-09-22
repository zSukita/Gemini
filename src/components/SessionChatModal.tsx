import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMessageType } from '../types/chat';
import { 
  type Character, 
  type DiceRollResult, 
  type AbilityKey, 
  type SkillKey,
  SKILLS, 
  ABILITIES 
} from '../types/dnd5e';
import type { AiMessage } from '../types/aiDm';
import { rollFormula } from '../utils/diceRoller';
import { sendToAiDungeonMaster, getStoredApiKey } from '../services/geminiService';
import { 
  MessageSquare, 
  Send, 
  X, 
  Lock, 
  EyeOff, 
  Crown,
  Sparkles,
  Dices,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface SessionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatLog: ChatMessage[];
  currentUserName: string;
  isHost: boolean;
  character?: Character | null;
  onSendMessage: (msg: {
    id?: string;
    text: string;
    senderName: string;
    type: ChatMessageType;
    recipientName?: string;
    diceRoll?: DiceRollResult;
    suggestedActions?: string[];
    requestedRoll?: {
      skillOrAbility: string;
      dc?: number;
      reason: string;
    };
    aiHandledBySender?: boolean;
  }) => void;
}

export const SessionChatModal: React.FC<SessionChatModalProps> = ({
  isOpen,
  onClose,
  chatLog,
  currentUserName,
  isHost,
  character,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSecretGmMode, setIsSecretGmMode] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen, isAiResponding]);

  if (!isOpen) return null;

  const handleCallAiDm = async (prompt: string) => {
    const key = getStoredApiKey();
    if (!key) {
      onSendMessage({
        text: '⚠️ Chave de API do Google Gemini não encontrada! Por favor, adicione sua chave nas configurações do Mestre IA para narrar na mesa online.',
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
      });
      return;
    }

    setIsAiResponding(true);
    try {
      // Constrói um histórico recente para contextualizar a IA
      const recentTurns: AiMessage[] = chatLog.slice(-8).map((msg) => ({
        id: msg.id,
        role: msg.type === 'AI_DM' ? 'narrator' : 'player',
        content: `${msg.senderName}: ${msg.text}`,
        timestamp: msg.timestamp,
      }));

      const aiReply = await sendToAiDungeonMaster(
        prompt,
        recentTurns,
        character,
        {
          customInstructions:
            'Você está mestrando em uma mesa multiplayer online ao vivo com múltiplos jogadores. Seja imersivo, dinâmico, misterioso e incentive a cooperação entre os personagens.',
        }
      );

      onSendMessage({
        id: aiReply.id,
        text: aiReply.content,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
        suggestedActions: aiReply.suggestedActions,
        requestedRoll: aiReply.requestedRoll,
      });
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      onSendMessage({
        text: `🔮 O Mestre hesitou em meio ao véu arcano: ${errText}`,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    // 1. Detectar comandos de IA (@mestre, /mestre, /ia, @ia, @dm)
    const isAiCommand =
      raw.startsWith('@mestre') ||
      raw.startsWith('/mestre') ||
      raw.startsWith('/ia') ||
      raw.startsWith('@ia') ||
      raw.startsWith('@dm');

    if (isAiCommand) {
      const prompt = raw.replace(/^(@mestre|\/mestre|\/ia|@ia|@dm)\s*/i, '').trim();
      // Publica no chat público para todos na mesa verem a pergunta/ação
      onSendMessage({
        text: raw,
        senderName: currentUserName,
        type: 'PUBLIC',
        aiHandledBySender: true,
      });
      setInputText('');

      handleCallAiDm(prompt || 'O que acontece agora na narrativa?');
      return;
    }

    // 2. /gmroll ou /gr (rolagem secreta do mestre)
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

    // 3. /w ou /whisper [Destinatario] [Mensagem]
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

    // 4. Mensagem Normal Pública
    onSendMessage({
      text: raw,
      senderName: currentUserName,
      type: 'PUBLIC',
    });
    setInputText('');
  };

  // Jogador clica em uma ação sugerida pela IA
  const handleChooseAction = (actionText: string) => {
    onSendMessage({
      text: `@mestre Escolho: ${actionText}`,
      senderName: currentUserName,
      type: 'PUBLIC',
    });
    handleCallAiDm(`Escolho a ação: "${actionText}". Como o ambiente e a história reagem?`);
  };

  // Jogador clica para rolar o teste solicitado pela IA
  const handleRollRequested = (req: { skillOrAbility: string; dc?: number; reason: string }) => {
    let mod = 0;
    if (character) {
      const target = req.skillOrAbility.toLowerCase();
      const profBonus = Math.floor(((character.level || 1) - 1) / 4) + 2;

      // 1. Tentar casar com alguma perícia (ex: Percepção, Atletismo...)
      const skillEntry = Object.entries(SKILLS).find(
        ([k, def]) => target.includes(k) || target.includes(def.name.toLowerCase())
      ) as [SkillKey, { ability: AbilityKey; name: string }] | undefined;

      if (skillEntry) {
        const [skillKey, def] = skillEntry;
        const abilityScore = character.abilities[def.ability]?.score ?? 10;
        const abilityMod = Math.floor((abilityScore - 10) / 2);
        const skillProf = character.skills?.[skillKey]?.proficiency ?? 'none';
        mod = abilityMod + (skillProf === 'expertise' ? profBonus * 2 : skillProf === 'proficient' ? profBonus : 0);
      } else {
        // 2. Tentar casar com algum atributo direto (ex: Força, Destreza...)
        const abilityEntry = Object.entries(ABILITIES).find(
          ([k, def]) =>
            target.includes(k) ||
            target.includes(def.name.toLowerCase()) ||
            target.includes(def.abbr.toLowerCase())
        );
        if (abilityEntry) {
          const abilityKey = abilityEntry[0] as AbilityKey;
          const abilityScore = character.abilities[abilityKey]?.score ?? 10;
          mod = Math.floor((abilityScore - 10) / 2);
        }
      }
    }

    const formula = mod === 0 ? '1d20' : mod > 0 ? `1d20+${mod}` : `1d20${mod}`;
    const rollRes = rollFormula(formula, `Teste de ${req.skillOrAbility}`);

    onSendMessage({
      text: `🎲 Realizou teste de ${req.skillOrAbility} ${req.dc ? `(CD ${req.dc})` : ''}: ${rollRes.breakdown} = ${rollRes.total}`,
      senderName: currentUserName,
      type: 'PUBLIC',
      diceRoll: rollRes,
    });

    handleCallAiDm(
      `${currentUserName} fez o teste de ${req.skillOrAbility} solicitado (CD ${req.dc || 'não especificada'}) e obteve o total de ${rollRes.total} (rolagem: ${rollRes.breakdown}). Narre o resultado dessa tentativa.`
    );
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 flex flex-col w-full sm:w-[420px] sm:max-w-md h-[90vh] sm:h-[560px] bg-slate-900/95 border border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95">
      {/* Cabeçalho */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
              Chat da Mesa & Mestre IA
              {isHost && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded font-sans flex items-center gap-1">
                  <Crown size={10} /> Host
                </span>
              )}
            </h3>
            <span className="text-[10px] text-slate-400">Rolagens, mensagens e narração por IA em tempo real</span>
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {chatLog.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
            <p className="font-medium text-slate-300">Nenhuma mensagem na mesa ainda.</p>
            <p className="text-[10px] mt-1.5 text-slate-400">
              Digite <code>@mestre [ação]</code> para que a IA narre o que acontece, ou use <code>/gmroll</code> e <code>/w</code>.
            </p>
          </div>
        ) : (
          chatLog.map((msg) => {
            const isMe = msg.senderName === currentUserName;
            const isAiDm = msg.type === 'AI_DM' || msg.senderName.includes('IA');
            const isGmRoll = msg.type === 'GM_ROLL';
            const isWhisper = msg.type === 'WHISPER';
            const canSeeGmRoll = isHost || isMe;

            if (isAiDm) {
              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/50 via-slate-950 to-amber-950/30 border border-amber-500/50 shadow-md shadow-amber-950/30 text-amber-100"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-300 mb-1.5 pb-1 border-b border-amber-500/20">
                    <span className="font-serif font-bold flex items-center gap-1.5 text-amber-300">
                      <Sparkles size={12} className="text-amber-400" />
                      <span>MESTRE SUPREMO (IA)</span>
                    </span>
                    <span className="font-mono text-[9px] text-amber-400/60">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Texto Narrativo */}
                  <div className="font-serif text-amber-100 leading-relaxed text-xs whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Solicitação de Rolagem */}
                  {msg.requestedRoll && (
                    <div className="mt-2.5 p-2 bg-slate-950/90 rounded-lg border border-amber-500/40 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-amber-300 block">
                          🎲 Teste Solicitado: {msg.requestedRoll.skillOrAbility}{' '}
                          {msg.requestedRoll.dc ? `(CD ${msg.requestedRoll.dc})` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 italic block">
                          {msg.requestedRoll.reason}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRollRequested(msg.requestedRoll!)}
                        className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold py-1 px-2.5 shrink-0"
                      >
                        <Dices size={12} />
                        <span>Rolar Teste</span>
                      </button>
                    </div>
                  )}

                  {/* Ações Sugeridas */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1">
                      <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
                        Ações Sugeridas:
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleChooseAction(action)}
                            className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-amber-950/80 text-amber-200 border border-amber-500/30 transition flex items-center gap-1.5 hover:border-amber-400"
                          >
                            <ArrowRight size={11} className="text-amber-400 shrink-0" />
                            <span>{action}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

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

        {/* Indicador de Carregamento da IA */}
        {isAiResponding && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-amber-200 text-xs animate-pulse font-serif">
            <Loader2 size={16} className="animate-spin text-amber-400 shrink-0" />
            <span>O Mestre Supremo (IA) está consultando os pergaminhos e forjando o destino...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada */}
      <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 space-y-1.5">
        {/* Chips de Atalhos */}
        <div className="flex items-center gap-1.5 text-[10px] overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setInputText((prev) => (prev.startsWith('@mestre ') ? prev : `@mestre ${prev}`))}
            className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:text-white flex items-center gap-1 font-serif shrink-0"
            title="Invoque o Mestre IA para narrar ou reagir à ação dos jogadores"
          >
            <Sparkles size={10} className="text-amber-400" />
            <span>@mestre (IA)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSecretGmMode(!isSecretGmMode)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition shrink-0 ${
              isSecretGmMode
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Quando ativo, suas rolagens são secretas (apenas você e o mestre veem)"
          >
            <Lock size={10} />
            <span>Rolagem Secreta ({isSecretGmMode ? 'Ativa' : 'Off'})</span>
          </button>

          <button
            type="button"
            onClick={() => setInputText('/gmroll 1d20+')}
            className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            /gmroll
          </button>
          <button
            type="button"
            onClick={() => setInputText('/w ')}
            className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white shrink-0"
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
                : 'Digite uma mensagem ou @mestre [ação/pergunta]...'
            }
            className="rpg-input flex-1 py-1.5 text-xs bg-slate-900 border-slate-700"
          />
          <button
            type="submit"
            disabled={isAiResponding}
            className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 font-bold disabled:opacity-50"
            title="Enviar"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
