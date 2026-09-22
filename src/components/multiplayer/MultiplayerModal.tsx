import React, { useState, useEffect, useRef } from 'react';
import type { PeerUser } from '../../types/vtt';
import type { ChatMessage } from '../../types/chat';
import { 
  type Character, 
  type AbilityKey, 
  type SkillKey, 
  SKILLS, 
  ABILITIES 
} from '../../types/dnd5e';
import { rollFormula } from '../../utils/diceRoller';
import { 
  Wifi, 
  WifiOff, 
  X, 
  Copy, 
  Check, 
  Users, 
  MessageSquare, 
  Send, 
  Crown, 
  User, 
  LogIn,
  Sparkles,
  Dices,
  ArrowRight,
  Loader2,
  Play,
  MapPin,
  Scroll,
  Shield
} from 'lucide-react';
import { AI_ADVENTURE_SCENARIOS, type AiAdventureScenario } from '../../data/aiAdventureScenarios';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  isHost: boolean;
  roomCode: string;
  connectedPeers: PeerUser[];
  chatLog: ChatMessage[];
  currentUserName: string;
  character?: Character | null;
  isAiResponding?: boolean;
  onCreateRoom: (name: string, customCode?: string) => Promise<string>;
  onCreateAiRoom?: (scenario: AiAdventureScenario, customTitle?: string, customPrompt?: string) => Promise<string>;
  onJoinRoom: (code: string, name: string) => Promise<boolean>;
  onDisconnect: () => void;
  onSendMessage: (text: string, name: string) => void;
  onOpenTabletop?: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isConnecting,
  isHost,
  roomCode,
  connectedPeers,
  chatLog,
  currentUserName,
  character,
  isAiResponding,
  onCreateRoom,
  onCreateAiRoom,
  onJoinRoom,
  onDisconnect,
  onSendMessage,
  onOpenTabletop,
}) => {
  const [nameInput, setNameInput] = useState(currentUserName || 'Aventureiro');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [creationTab, setCreationTab] = useState<'ai_dm' | 'human_dm' | 'join'>('ai_dm');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(AI_ADVENTURE_SCENARIOS[0].id);
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState<string>('');
  const [isCreatingAi, setIsCreatingAi] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sincroniza o nome do usuário/personagem se mudar ou se estiver no padrão
  useEffect(() => {
    if (currentUserName && (!nameInput || nameInput === 'Aventureiro')) {
      setNameInput(currentUserName);
    }
  }, [currentUserName]);

  // Scroll automático do chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isAiResponding, isOpen]);

  const handleRollRequested = (req: { skillOrAbility: string; dc?: number; reason: string }) => {
    let mod = 0;
    if (character) {
      const target = req.skillOrAbility.toLowerCase();
      const profBonus = Math.floor(((character.level || 1) - 1) / 4) + 2;

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
    onSendMessage(
      `@mestre Realizei o teste de ${req.skillOrAbility}: ${rollRes.breakdown} = ${rollRes.total}. Como o destino responde?`,
      nameInput
    );
  };

  if (!isOpen) return null;

  const handleCreate = async () => {
    setErrorMsg(null);
    try {
      await onCreateRoom(nameInput.trim() || 'Mestre');
    } catch (e) {
      setErrorMsg('Falha ao criar sala. Verifique sua conexão.');
    }
  };

  const handleCreateAi = async () => {
    setErrorMsg(null);
    setIsCreatingAi(true);
    try {
      if (selectedScenarioId === 'custom') {
        const customScenario: AiAdventureScenario = {
          id: 'custom_adventure',
          title: 'Aventura Personalizada',
          subtitle: customScenarioPrompt.slice(0, 60) || 'Aventura criada pelo Mestre de IA.',
          icon: '✨',
          tone: 'heroic',
          mapPresetId: 'map-dungeon',
          ambientLight: 'night',
          initialPrompt:
            customScenarioPrompt ||
            'Vocês se reúnem à beira de um caminho misterioso. O destino de vocês está prestes a se desenrolar.',
          suggestedActions: [
            'Examinar os arredores cautelosamente',
            'Avançar com armas em punho',
            'Procurar por rastros ou pistas mágicas',
          ],
          requestedRoll: {
            skillOrAbility: 'Percepção (Sabedoria)',
            dc: 12,
            reason: 'Para avaliar os perigos ao redor',
          },
          monsters: [{ monsterId: 'srd-goblin', count: 2 }],
        };
        if (onCreateAiRoom) {
          await onCreateAiRoom(customScenario, 'Aventura Personalizada', customScenarioPrompt);
        } else {
          await onCreateRoom(nameInput.trim() || 'Jogador');
        }
      } else {
        const scenario =
          AI_ADVENTURE_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
          AI_ADVENTURE_SCENARIOS[0];
        if (onCreateAiRoom) {
          await onCreateAiRoom(scenario);
        } else {
          await onCreateRoom(nameInput.trim() || 'Jogador');
        }
      }
    } catch (e) {
      setErrorMsg('Falha ao iniciar mesa com Mestre IA. Verifique sua conexão.');
    } finally {
      setIsCreatingAi(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setErrorMsg(null);
    try {
      const ok = await onJoinRoom(roomCodeInput.trim(), nameInput.trim() || 'Jogador');
      if (!ok) {
        setErrorMsg('Sala não encontrada ou código incorreto.');
      }
    } catch {
      setErrorMsg('Não foi possível conectar à sala.');
    }
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim(), nameInput);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-xl rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wifi size={20} className={isConnected ? 'text-emerald-400' : 'text-slate-400'} />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Mesa Online Multiplayer (P2P WebRTC)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
          {/* Se NÃO estiver conectado */}
          {!isConnected ? (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-slate-400 text-xs block mb-1 font-medium">Seu Nome ou Apelido</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rpg-input w-full text-xs py-1.5"
                  placeholder="Ex: Gandalf, Valeros, etc."
                />
              </div>

              {/* Seletor de Modo de Criação (Abas) */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setCreationTab('ai_dm')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    creationTab === 'ai_dm'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles size={13} className={creationTab === 'ai_dm' ? 'text-slate-950' : 'text-amber-400'} />
                  <span>✨ Mestre IA (Coop)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationTab('human_dm')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    creationTab === 'human_dm'
                      ? 'bg-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crown size={13} className={creationTab === 'human_dm' ? 'text-slate-950' : 'text-amber-400'} />
                  <span>👑 Mestre Humano</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationTab('join')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    creationTab === 'join'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn size={13} />
                  <span>➡️ Entrar em Sala</span>
                </button>
              </div>

              {/* ABA 1: MESTRE IA COOPERATIVO (COM MAPA E HISTÓRIA) */}
              {creationTab === 'ai_dm' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-amber-950/40 rounded-xl border border-amber-500/30 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-serif font-bold text-xs">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Modo Cooperativo com Mestre IA</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Você e seus amigos jogam juntos como aventureiros! A IA assume o papel de Mestre,
                      carrega o mapa tático, posiciona as criaturas e conduz o prólogo com escolhas e testes.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs block mb-1.5 font-bold flex items-center gap-1.5">
                      <Scroll size={13} className="text-amber-400" />
                      <span>Escolha o Cenário Inicial da Aventura</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {AI_ADVENTURE_SCENARIOS.map((scen) => {
                        const isSelected = selectedScenarioId === scen.id;
                        return (
                          <button
                            key={scen.id}
                            type="button"
                            onClick={() => setSelectedScenarioId(scen.id)}
                            className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-amber-950/50 border-amber-500 shadow-md shadow-amber-500/10'
                                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base">{scen.icon}</span>
                                <span className={`text-xs font-serif font-bold line-clamp-1 ${
                                  isSelected ? 'text-amber-300' : 'text-slate-200'
                                }`}>
                                  {scen.title}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                                {scen.subtitle}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/80">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-300/90 border border-slate-800 flex items-center gap-1">
                                <MapPin size={9} />
                                <span>{scen.mapPresetId.replace('map-', '')}</span>
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/80 text-rose-300/90 border border-slate-800 flex items-center gap-1">
                                <Shield size={9} />
                                <span>{scen.monsters.map((m) => `${m.count}x`).join(', ')} monstros</span>
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {/* Opção Personalizada */}
                      <button
                        type="button"
                        onClick={() => setSelectedScenarioId('custom')}
                        className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                          selectedScenarioId === 'custom'
                            ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/10'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">✨</span>
                            <span className={`text-xs font-serif font-bold ${
                              selectedScenarioId === 'custom' ? 'text-purple-300' : 'text-slate-200'
                            }`}>
                              História Personalizada
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Defina seu tema livre e deixe a IA improvisar a história e o mapa.
                          </p>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/80 text-purple-300 border border-slate-800">
                            Tema Livre
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Campo de Texto se Customizado */}
                  {selectedScenarioId === 'custom' && (
                    <div className="flex flex-col gap-1 animate-in fade-in">
                      <label className="text-slate-400 text-xs font-medium">
                        Premissa ou Gancho da Aventura:
                      </label>
                      <textarea
                        rows={2}
                        value={customScenarioPrompt}
                        onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                        placeholder="Ex: Uma caravana no deserto atacada por bandidos nômades..."
                        className="rpg-input w-full text-xs p-2 resize-none"
                      />
                    </div>
                  )}

                  {/* Botão de Iniciar com IA */}
                  <button
                    type="button"
                    onClick={handleCreateAi}
                    disabled={isConnecting || isCreatingAi}
                    className="rpg-button bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs py-2.5 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                  >
                    {isConnecting || isCreatingAi ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-slate-950" />
                        <span>Invocando o Mestre IA & Carregando Mapa...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-slate-950" />
                        <span>Iniciar Mesa Cooperativa com Mestre IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ABA 2: MESTRE HUMANO */}
              {creationTab === 'human_dm' && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-500/30 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    <span className="text-xs font-serif font-bold text-amber-200">Criar Nova Mesa (Mestre Humano)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Inicie uma sala para mestrar tradicionalmente. Você terá controle total sobre tokens,
                    névoa de guerra, monstros e combates manuais, e receberá um código de convite para seus jogadores.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isConnecting}
                    className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 mt-1"
                  >
                    <Wifi size={14} />
                    <span>{isConnecting ? 'Criando Sala...' : 'Criar Mesa como Mestre Humano'}</span>
                  </button>
                </div>
              )}

              {/* ABA 3: ENTRAR EM SALA */}
              {creationTab === 'join' && (
                <form onSubmit={handleJoin} className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <LogIn size={16} className="text-cyan-400" />
                    <span className="text-xs font-serif font-bold text-slate-200">Entrar em uma Mesa Existente</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cole o código fornecido pelo Mestre (ex: MESA-9482) ou acesse o link compartilhado para entrar diretamente.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Código da Sala (ex: MESA-1234)"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="rpg-input flex-1 text-xs py-2 font-mono uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting || !roomCodeInput.trim()}
                      className="rpg-button bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-4 disabled:opacity-40"
                    >
                      Conectar
                    </button>
                  </div>
                </form>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-600 rounded-lg text-rose-200 text-xs">
                  {errorMsg}
                </div>
              )}
            </div>
          ) : (
            /* Se ESTIVER conectado */
            <div className="flex flex-col gap-3.5">
              {/* Card de Informações da Sala */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300">
                      Conectado como {isHost ? 'Mestre (Anfitrião)' : 'Jogador'}
                    </span>
                  </div>

                  <button
                    onClick={onDisconnect}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <WifiOff size={12} /> Desconectar
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Código da Sala</span>
                    <span className="font-mono font-black text-amber-300 text-base">{roomCode}</span>
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1 px-2.5"
                    title="Copiar link de convite da sala"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copiado!' : 'Copiar Convite'}</span>
                  </button>
                </div>

                {onOpenTabletop && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTabletop();
                      onClose();
                    }}
                    className="rpg-button bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs py-2 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-1"
                  >
                    <Play size={14} className="fill-slate-950" />
                    <span>Entrar no Tabuleiro Tático (Jogar Agora)</span>
                  </button>
                )}
              </div>

              {/* Lista de Usuários Conectados */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-slate-300 mb-2">
                  <Users size={14} className="text-amber-400" />
                  <span>Participantes na Mesa ({Math.max(connectedPeers.length, 1)})</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {connectedPeers.length > 0 ? (
                    connectedPeers.map((peer, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                          peer.role === 'dm'
                            ? 'bg-amber-950/40 text-amber-200 border-amber-500/40'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        {peer.role === 'dm' ? <Crown size={12} className="text-amber-400" /> : <User size={12} className="text-cyan-400" />}
                        <span className="font-semibold">{peer.name}</span>
                        {peer.role === 'dm' && <span className="text-[9px] text-amber-400 uppercase font-bold">(Mestre)</span>}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5">
                      {isHost ? <Crown size={12} className="text-amber-400" /> : <User size={12} className="text-cyan-400" />}
                      <span className="font-semibold">{nameInput || currentUserName || 'Você'}</span>
                      <span className="text-[9px] text-slate-400 font-mono">(Você)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Chat da Mesa em Tempo Real */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-cyan-400" />
                    <span>Chat da Mesa</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-sans font-normal">Use @mestre para invocar a IA</span>
                </div>

                <div className="h-44 overflow-y-auto bg-slate-950/80 rounded-lg p-2.5 flex flex-col gap-2 text-xs font-mono">
                  {chatLog.length === 0 ? (
                    <span className="text-slate-600 text-[11px] italic my-auto text-center font-sans">
                      Nenhuma mensagem enviada ainda. Digite @mestre para falar com o Mestre IA.
                    </span>
                  ) : (
                    chatLog.map((c) => {
                      const isAi = c.type === 'AI_DM' || c.senderName.includes('IA');
                      const timeStr = new Date(c.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={c.id}
                          className={`text-[11px] leading-tight p-2 rounded-lg transition ${
                            isAi
                              ? 'bg-amber-950/40 text-amber-200 border border-amber-500/40 font-serif'
                              : 'bg-slate-950/60 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              {isAi && <Sparkles size={11} className="text-amber-400" />}
                              <strong className={isAi ? 'text-amber-400 font-bold' : 'text-amber-300'}>
                                {c.senderName}:
                              </strong>
                            </div>
                            <span className="text-slate-500 text-[9px] font-mono">[{timeStr}]</span>
                          </div>

                          <div className={isAi ? 'text-amber-100 whitespace-pre-wrap leading-relaxed' : 'text-slate-200'}>
                            {c.text}
                          </div>

                          {/* Teste de Dado Solicitado pelo Mestre IA */}
                          {c.requestedRoll && (
                            <div className="mt-2 p-1.5 bg-slate-950/90 rounded border border-amber-500/40 flex items-center justify-between gap-2 font-sans">
                              <span className="text-[10px] text-amber-300 font-bold">
                                🎲 Teste: {c.requestedRoll.skillOrAbility} {c.requestedRoll.dc ? `(CD ${c.requestedRoll.dc})` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRollRequested(c.requestedRoll!)}
                                className="text-[10px] px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shrink-0"
                              >
                                <Dices size={10} /> Rolar
                              </button>
                            </div>
                          )}

                          {/* Ações Sugeridas */}
                          {c.suggestedActions && c.suggestedActions.length > 0 && (
                            <div className="mt-2 flex flex-col gap-1 font-sans">
                              <span className="text-[9px] text-amber-400/80 font-bold uppercase">Escolha sua ação:</span>
                              <div className="flex flex-col gap-1">
                                {c.suggestedActions.map((act, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => onSendMessage(`@mestre Escolho: ${act}`, nameInput)}
                                    className="text-left text-[10px] px-2 py-1 rounded bg-slate-900/90 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30 transition flex items-center gap-1.5"
                                  >
                                    <ArrowRight size={10} className="text-amber-400 shrink-0" />
                                    <span>{act}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Indicador de Carregamento da IA */}
                  {isAiResponding && (
                    <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-pulse font-serif">
                      <Loader2 size={13} className="animate-spin text-amber-400 shrink-0" />
                      <span>O Mestre Supremo (IA) está consultando os pergaminhos...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input de Mensagem */}
                <form onSubmit={handleSendChat} className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Digitar mensagem ou @mestre [ação]..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="rpg-input flex-1 text-xs py-1"
                    />
                    <button
                      type="submit"
                      className="p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setChatInput((prev) => prev.startsWith('@mestre ') ? prev : `@mestre ${prev}`)}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition flex items-center gap-1"
                    >
                      <span>✨ @mestre (Consultar IA)</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {isConnected && onOpenTabletop ? (
            <button
              type="button"
              onClick={() => {
                onOpenTabletop();
                onClose();
              }}
              className="rpg-button bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Play size={13} className="fill-slate-950" />
              <span>Abrir Tabuleiro Tático</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
