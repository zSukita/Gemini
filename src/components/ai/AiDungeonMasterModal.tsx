import React, { useState, useEffect, useRef } from 'react';
import type { Character, CampaignNpc } from '../../types/dnd5e';
import type { CampaignHandout } from '../../firebase/campaignSync';
import { 
  type AdventureTone, 
  type AiMessage, 
  type AiOracleAction, 
  type StartingPremise,
  type AiProvider,
  ADVENTURE_TONES, 
  STARTING_PREMISES,
  AI_PROVIDERS
} from '../../types/aiDm';
import { 
  getStoredApiKey, 
  saveStoredApiKey, 
  getStoredGroqApiKey,
  saveStoredGroqApiKey,
  getStoredAiProvider,
  saveStoredAiProvider,
  getStoredAiConfig, 
  saveStoredAiConfig, 
  getStoredChatHistory, 
  saveStoredChatHistory, 
  clearStoredChatHistory,
  sendToAiDungeonMaster, 
  testAiApiKey, 
  generateOracleIdea,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL
} from '../../services/geminiService';
import { rollD20 } from '../../utils/diceRoller';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Key, 
  Scroll, 
  Dices, 
  Swords, 
  Copy, 
  ExternalLink, 
  Shield, 
  Flame, 
  Sliders, 
  Feather, 
  X,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Wifi,
  Map
} from 'lucide-react';
import type { ChatMessageType } from '../../types/chat';
import { AI_ADVENTURE_SCENARIOS, type AiAdventureScenario } from '../../data/aiAdventureScenarios';

interface AiDungeonMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: Character | null;
  onTransmitHandout?: (handout: Omit<CampaignHandout, 'id' | 'createdAt'>) => void;
  onSaveNpcToJournal?: (npc: CampaignNpc) => void;
  onBroadcastToRoom?: (message: {
    id?: string;
    text: string;
    senderName?: string;
    type?: ChatMessageType;
    suggestedActions?: string[];
    requestedRoll?: { skillOrAbility: string; dc?: number; reason: string };
  }) => void;
  onOpenVttWithAdventure?: (history: AiMessage[]) => void;
  onStartSoloAdventureOnMap?: (scenario: AiAdventureScenario, customPrompt?: string) => void;
}

type TabType = 'adventure' | 'oracle' | 'settings';

export const AiDungeonMasterModal: React.FC<AiDungeonMasterModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  onTransmitHandout,
  onSaveNpcToJournal,
  onBroadcastToRoom,
  onOpenVttWithAdventure,
  onStartSoloAdventureOnMap,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('adventure');
  const [autoBroadcastToRoom, setAutoBroadcastToRoom] = useState(false);
  
  // Configurações
  const [provider, setProvider] = useState<AiProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [tone, setTone] = useState<AdventureTone>('heroic');
  const [customInstructions, setCustomInstructions] = useState('');
  const [includeStats, setIncludeStats] = useState(true);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Aventura Solo
  const [history, setHistory] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customPremiseText, setCustomPremiseText] = useState('');
  const [showPremisePicker, setShowPremisePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Oráculo Co-DM
  const [oracleAction, setOracleAction] = useState<AiOracleAction>('twist');
  const [oracleContext, setOracleContext] = useState('');
  const [oracleResult, setOracleResult] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Carregar dados salvos ao abrir
  useEffect(() => {
    if (isOpen) {
      const config = getStoredAiConfig();
      setProvider(config.provider || getStoredAiProvider());
      setApiKey(config.apiKey || getStoredApiKey());
      setGroqApiKey(config.groqApiKey || getStoredGroqApiKey());
      setTone(config.tone);
      setCustomInstructions(config.customInstructions);
      setIncludeStats(config.includeCharacterStats);

      const savedHistory = getStoredChatHistory();
      setHistory(savedHistory);
      if (savedHistory.length === 0) {
        setShowPremisePicker(true);
      } else {
        setShowPremisePicker(false);
      }
    }
  }, [isOpen]);

  // Scroll suave para o fim da aventura
  useEffect(() => {
    if (activeTab === 'adventure' && !showPremisePicker) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isAiLoading, activeTab, showPremisePicker]);

  if (!isOpen) return null;

  // Salvar configurações
  const handleSaveSettings = () => {
    saveStoredAiProvider(provider);
    saveStoredApiKey(apiKey);
    saveStoredGroqApiKey(groqApiKey);
    saveStoredAiConfig({
      provider,
      apiKey,
      groqApiKey,
      model: provider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_GEMINI_MODEL,
      tone,
      customInstructions,
      includeCharacterStats: includeStats,
    });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Testar chave de API / Conexão
  const handleTestKey = async () => {
    const keyToTest = provider === 'groq' ? groqApiKey : apiKey;
    if (provider !== 'pollinations' && !keyToTest.trim()) {
      setTestStatus({ 
        loading: false, 
        success: false, 
        message: provider === 'groq' 
          ? 'Digite sua chave do Groq primeiro (crie grátis em console.groq.com/keys).' 
          : 'Digite sua chave do Google Gemini primeiro.' 
      });
      return;
    }
    setTestStatus({ loading: true });
    try {
      const res = await testAiApiKey(provider, keyToTest.trim());
      setTestStatus({ loading: false, success: res.success, message: res.message });
      if (res.success) {
        if (provider === 'groq') saveStoredGroqApiKey(keyToTest.trim());
        if (provider === 'gemini') saveStoredApiKey(keyToTest.trim());
        saveStoredAiProvider(provider);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus({ loading: false, success: false, message: msg });
    }
  };

  // Iniciar aventura com premissa escolhida
  const handleStartPremise = async (premise: StartingPremise) => {
    setShowPremisePicker(false);
    setIsAiLoading(true);
    setTone(premise.tone);

    const introMessage: AiMessage = {
      id: `msg_intro_${Date.now()}`,
      role: 'narrator',
      content: premise.initialPrompt,
      timestamp: Date.now(),
      suggestedActions: [
        'Examinar os arredores cautelosamente',
        'Sacar suas armas e assumir postura de combate',
        'Falar ou tentar se comunicar'
      ]
    };

    const initialHistory = [introMessage];
    setHistory(initialHistory);
    saveStoredChatHistory(initialHistory);
    setIsAiLoading(false);

    if (onBroadcastToRoom && autoBroadcastToRoom) {
      onBroadcastToRoom({
        id: introMessage.id,
        text: introMessage.content,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
        suggestedActions: introMessage.suggestedActions,
      });
    }
  };

  // Iniciar com premissa customizada
  const handleStartCustomPremise = () => {
    if (!customPremiseText.trim()) return;
    setShowPremisePicker(false);
    const introMessage: AiMessage = {
      id: `msg_intro_${Date.now()}`,
      role: 'narrator',
      content: customPremiseText.trim(),
      timestamp: Date.now(),
      suggestedActions: [
        'Olhar ao redor e avaliar perigos',
        'Interagir com o ambiente',
        'Avançar cautelosamente'
      ]
    };
    const initialHistory = [introMessage];
    setHistory(initialHistory);
    saveStoredChatHistory(initialHistory);
    setCustomPremiseText('');

    if (onBroadcastToRoom && autoBroadcastToRoom) {
      onBroadcastToRoom({
        id: introMessage.id,
        text: introMessage.content,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
        suggestedActions: introMessage.suggestedActions,
      });
    }
  };

  // Enviar ação do jogador para a IA
  const handleSendAction = async (actionText: string) => {
    const trimmed = actionText.trim();
    if (!trimmed || isAiLoading) return;

    const isConfigured =
      provider === 'pollinations' ||
      (provider === 'groq' && groqApiKey.trim().length > 0) ||
      (provider === 'gemini' && apiKey.trim().length > 0) ||
      groqApiKey.trim().length > 0 ||
      apiKey.trim().length > 0;

    if (!isConfigured) {
      setActiveTab('settings');
      setTestStatus({ 
        loading: false, 
        success: false, 
        message: 'Para começar a jogar com a IA, selecione o Modo Livre (sem chave) ou configure sua chave gratuita do Groq/Gemini nas configurações.' 
      });
      return;
    }

    const playerMessage: AiMessage = {
      id: `player_${Date.now()}`,
      role: 'player',
      content: trimmed,
      timestamp: Date.now(),
    };

    const updatedHistory = [...history, playerMessage];
    setHistory(updatedHistory);
    setInputText('');
    setIsAiLoading(true);

    try {
      const response = await sendToAiDungeonMaster(
        trimmed,
        updatedHistory,
        activeCharacter,
        { provider, apiKey, groqApiKey, tone, customInstructions, includeCharacterStats: includeStats }
      );

      const finalHistory = [...updatedHistory, response];
      setHistory(finalHistory);
      saveStoredChatHistory(finalHistory);

      if (onBroadcastToRoom && autoBroadcastToRoom) {
        onBroadcastToRoom({
          id: response.id,
          text: response.content,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          suggestedActions: response.suggestedActions,
          requestedRoll: response.requestedRoll,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const systemError: AiMessage = {
        id: `err_${Date.now()}`,
        role: 'system',
        content: `⚠️ Erro do Mestre IA: ${errorMsg}`,
        timestamp: Date.now(),
      };
      setHistory([...updatedHistory, systemError]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Rolar teste solicitado pela IA no d20
  const handleRollRequested = (rollReq: { skillOrAbility: string; dc?: number; reason: string }) => {
    // Rolar d20
    const roll = rollD20('normal');
    
    // Tentar encontrar modificador do personagem se aplicável
    let modifier = 0;
    const label = rollReq.skillOrAbility;

    if (activeCharacter) {
      const getMod = (score: number) => Math.floor((score - 10) / 2);
      const lower = rollReq.skillOrAbility.toLowerCase();
      if (lower.includes('forç') || lower.includes('atletismo')) modifier = getMod(activeCharacter.abilities.str.score);
      else if (lower.includes('destr') || lower.includes('acrobacia') || lower.includes('furtiv')) modifier = getMod(activeCharacter.abilities.dex.score);
      else if (lower.includes('const')) modifier = getMod(activeCharacter.abilities.con.score);
      else if (lower.includes('intel') || lower.includes('arcan') || lower.includes('histór') || lower.includes('investig')) modifier = getMod(activeCharacter.abilities.int.score);
      else if (lower.includes('sabi') || lower.includes('percep') || lower.includes('intuiç') || lower.includes('sobreviv')) modifier = getMod(activeCharacter.abilities.wis.score);
      else if (lower.includes('caris') || lower.includes('atuaç') || lower.includes('enganaç') || lower.includes('intimid') || lower.includes('persuas')) modifier = getMod(activeCharacter.abilities.cha.score);
    }

    const total = roll.total + modifier;
    const dcInfo = rollReq.dc ? ` contra CD ${rollReq.dc}` : '';
    const successInfo = rollReq.dc ? (total >= rollReq.dc ? ' (SUCESSO!)' : ' (FALHA)') : '';
    const resultNarrative = `[ROLAGEM DE DADO: ${label}]: Tirei ${roll.total}${modifier !== 0 ? (modifier >= 0 ? `+${modifier}` : modifier) : ''} = TOTAL ${total}${dcInfo}${successInfo}. ${rollReq.reason}`;

    handleSendAction(resultNarrative);
  };

  // Transmitir Handout encontrado como Pergaminho
  const handleTransmitHandoutFromAi = (handout: { title: string; content: string; authorOrOrigin?: string }) => {
    if (onTransmitHandout) {
      onTransmitHandout({
        title: handout.title,
        content: handout.content,
        timestamp: Date.now(),
      });
    }
  };

  // Consultar Oráculo Co-DM
  const handleConsultOracle = async () => {
    const isConfigured =
      provider === 'pollinations' ||
      (provider === 'groq' && groqApiKey.trim().length > 0) ||
      (provider === 'gemini' && apiKey.trim().length > 0) ||
      groqApiKey.trim().length > 0 ||
      apiKey.trim().length > 0;

    if (!isConfigured) {
      setActiveTab('settings');
      return;
    }
    setIsOracleLoading(true);
    try {
      const result = await generateOracleIdea(oracleAction, oracleContext, tone);
      setOracleResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOracleResult(`Erro ao consultar oráculo: ${msg}`);
    } finally {
      setIsOracleLoading(false);
    }
  };

  // Copiar crônica completa
  const handleCopyHistory = () => {
    const fullText = history.map(m => {
      const roleName = m.role === 'narrator' ? '📜 MESTRE' : m.role === 'player' ? `⚔️ ${activeCharacter?.name || 'JOGADOR'}` : '⚠️ SISTEMA';
      return `${roleName}:\n${m.content}\n`;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Limpar histórico
  const handleClearHistory = () => {
    if (window.confirm('Deseja realmente reiniciar a aventura atual? O progresso da história será resetado.')) {
      clearStoredChatHistory();
      setHistory([]);
      setShowPremisePicker(true);
    }
  };

  const getScenarioForPremise = (premiseId: string): AiAdventureScenario => {
    if (premiseId === 'tavern_ambush') return AI_ADVENTURE_SCENARIOS.find((s) => s.id === 'tavern_brawl') || AI_ADVENTURE_SCENARIOS[2];
    if (premiseId === 'abandoned_mine') return AI_ADVENTURE_SCENARIOS.find((s) => s.id === 'crystal_cavern') || AI_ADVENTURE_SCENARIOS[3];
    if (premiseId === 'shadow_manor') return AI_ADVENTURE_SCENARIOS.find((s) => s.id === 'crypt_ancestors') || AI_ADVENTURE_SCENARIOS[0];
    if (premiseId === 'whispering_woods') return AI_ADVENTURE_SCENARIOS.find((s) => s.id === 'forest_ambush') || AI_ADVENTURE_SCENARIOS[1];
    return AI_ADVENTURE_SCENARIOS[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-black tracking-wider text-lg text-amber-200">
                  Arcana AI Dungeon Master
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Mestre Supremo
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  provider === 'groq'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : provider === 'pollinations'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {provider === 'groq' && '⚡ Groq (Llama 3.3)'}
                  {provider === 'pollinations' && '🌸 Modo Livre (Sem Chave)'}
                  {provider === 'gemini' && '✨ Google Gemini'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Inteligência Artificial Narrativa para D&D 5e</span>
                {activeCharacter && (
                  <span className="text-amber-400 font-medium">
                    • 🧙‍♂️ {activeCharacter.name} (Nv. {activeCharacter.level} {activeCharacter.characterClass})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abas */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('adventure')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'adventure'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Swords size={14} />
                <span>Aventura Solo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('oracle')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'oracle'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 size={14} />
                <span>Oráculo (Co-DM)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders size={14} />
                <span>Configuração</span>
              </button>
            </div>

            {onOpenVttWithAdventure && history.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenVttWithAdventure(history)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer"
                title="Continuar esta aventura diretamente no Mapa Tático com miniaturas e dados 3D"
              >
                <Map size={14} />
                <span className="hidden sm:inline">Abrir no</span>
                <span>Mapa Tático (VTT)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Fechar Janela"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notificação de Copiado */}
        {copiedNotification && (
          <div className="absolute top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={14} />
            <span>Crônica copiada para a área de transferência!</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/50">

          {/* ========================================================================= */}
          {/* ABA 1: AVENTURA SOLO                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'adventure' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {showPremisePicker ? (
                /* Seleção de Cenário Inicial */
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <h3 className="font-serif font-black text-2xl text-amber-200 flex items-center justify-center gap-2">
                      <Flame className="text-amber-500" size={24} />
                      Escolha o Início da sua Jornada
                    </h3>
                    <p className="text-sm text-slate-400">
                      O Mestre IA adaptará a história, os desafios e os inimigos especificamente para o seu herói ativo. Escolha um gancho clássico ou crie o seu:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {STARTING_PREMISES.map((premise) => (
                      <div
                        key={premise.id}
                        className="bg-slate-900/90 border border-amber-500/30 hover:border-amber-500 rounded-xl p-4.5 transition cursor-pointer group shadow-lg flex flex-col justify-between hover:bg-slate-850"
                        onClick={() => handleStartPremise(premise)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{premise.icon}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                              {ADVENTURE_TONES.find(t => t.id === premise.tone)?.label}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-amber-300 text-base group-hover:text-amber-200 transition">
                            {premise.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {premise.subtitle}
                          </p>
                        </div>
                        <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 mt-3">
                          <span className="text-xs font-bold text-slate-400 group-hover:text-amber-300 transition flex items-center gap-1">
                            <span>📜 Apenas Texto</span>
                          </span>
                          {onStartSoloAdventureOnMap && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartSoloAdventureOnMap(getScenarioForPremise(premise.id));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              title="Iniciar com Mapa Tático, miniaturas e dados 3D"
                            >
                              <Map size={13} />
                              <span>Jogar no Mapa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cenário Personalizado */}
                  <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-2">
                      <Feather size={16} />
                      Ou comece em qualquer lugar que imaginar:
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customPremiseText}
                        onChange={(e) => setCustomPremiseText(e.target.value)}
                        placeholder="Ex: Acordo acorrentado em uma masmorra escura de Neverwinter ao lado de um ladino goblin..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleStartCustomPremise();
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleStartCustomPremise}
                        disabled={!customPremiseText.trim()}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl transition border border-slate-700"
                        title="Iniciar apenas em texto nesta janela"
                      >
                        Iniciar (Texto)
                      </button>
                      {onStartSoloAdventureOnMap && (
                        <button
                          type="button"
                          onClick={() => onStartSoloAdventureOnMap(AI_ADVENTURE_SCENARIOS[0], customPremiseText)}
                          disabled={!customPremiseText.trim()}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                          title="Iniciar com Mapa Tático e miniaturas"
                        >
                          <Map size={14} />
                          <span>Iniciar no Mapa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat Narrativo com a IA */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Barra de Ações Rápidas do Topo */}
                  <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-bold text-slate-300">Crônica Ativa</span>
                      <span>• {history.length} turnos</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenVttWithAdventure && (
                        <button
                          type="button"
                          onClick={() => onOpenVttWithAdventure(history)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 text-[11px] shadow-sm shadow-amber-500/20 cursor-pointer"
                          title="Continuar esta crônica diretamente no Mapa Tático com miniaturas e dados 3D"
                        >
                          <Map size={12} className="shrink-0" />
                          <span>🗺️ Jogar no Mapa Tático</span>
                        </button>
                      )}

                      {onBroadcastToRoom && (
                        <button
                          type="button"
                          onClick={() => setAutoBroadcastToRoom(!autoBroadcastToRoom)}
                          className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 text-[11px] font-bold ${
                            autoBroadcastToRoom
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Transmite automaticamente as narrações do Mestre IA para a mesa online multiplayer"
                        >
                          <Wifi size={12} className={autoBroadcastToRoom ? 'text-emerald-400' : 'text-slate-400'} />
                          <span>{autoBroadcastToRoom ? 'Mesa Online: Ativa' : 'Mesa Online: Pausada'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyHistory}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-[11px]"
                        title="Copiar toda a crônica da aventura"
                      >
                        <Copy size={12} />
                        <span>Copiar Crônica</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition flex items-center gap-1 text-[11px]"
                        title="Reiniciar e escolher outro cenário"
                      >
                        <RefreshCw size={12} />
                        <span>Reiniciar</span>
                      </button>
                    </div>
                  </div>

                  {/* Área de Mensagens / Rolagem */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {history.map((msg) => {
                      const isNarrator = msg.role === 'narrator';
                      const isPlayer = msg.role === 'player';
                      const isSystem = msg.role === 'system';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{msg.content}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            {isNarrator ? (
                              <>
                                <span className="text-amber-400 font-serif font-bold text-xs flex items-center gap-1">
                                  <Sparkles size={12} /> Mestre Supremo
                                </span>
                                {onBroadcastToRoom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onBroadcastToRoom({
                                        id: msg.id,
                                        text: msg.content,
                                        senderName: '✨ Mestre Supremo (IA)',
                                        type: 'AI_DM',
                                        suggestedActions: msg.suggestedActions,
                                        requestedRoll: msg.requestedRoll,
                                      });
                                      setCopiedNotification(true);
                                      setTimeout(() => setCopiedNotification(false), 2000);
                                    }}
                                    className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition"
                                    title="Transmitir esta narração para a mesa multiplayer online"
                                  >
                                    <Wifi size={10} />
                                    <span>Transmitir</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-indigo-400 font-serif font-bold text-xs flex items-center gap-1">
                                  <Shield size={12} /> {activeCharacter?.name || 'Você'}
                                </span>
                              </>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-lg ${
                              isNarrator
                                ? 'bg-slate-900 border border-amber-500/30 text-slate-200 font-serif whitespace-pre-line'
                                : 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-100 rounded-br-xs whitespace-pre-line'
                            }`}
                          >
                            {msg.content}

                            {/* Card de Teste de Dado Solicitado */}
                            {msg.requestedRoll && (
                              <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                                <div>
                                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                                    <Dices size={15} />
                                    <span>Teste Exigido: {msg.requestedRoll.skillOrAbility}</span>
                                    {msg.requestedRoll.dc && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px] border border-amber-500/30">
                                        CD {msg.requestedRoll.dc}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5">
                                    {msg.requestedRoll.reason}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => msg.requestedRoll && handleRollRequested(msg.requestedRoll)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shrink-0 active:scale-95"
                                >
                                  <Dices size={14} />
                                  <span>Rolar no d20</span>
                                </button>
                              </div>
                            )}

                            {/* Card de Handout / Pergaminho Gerado */}
                            {msg.handoutProposal && (
                              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-amber-900/30 to-slate-900 border-2 border-amber-500/60 font-sans shadow-md">
                                <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 pb-2 mb-2">
                                  <div className="flex items-center gap-1.5 text-amber-300 font-serif font-bold text-xs">
                                    <Scroll size={15} />
                                    <span>{msg.handoutProposal.title}</span>
                                    {msg.handoutProposal.authorOrOrigin && (
                                      <span className="text-[10px] text-slate-400 font-sans">
                                        ({msg.handoutProposal.authorOrOrigin})
                                      </span>
                                    )}
                                  </div>
                                  {onTransmitHandout && (
                                    <button
                                      type="button"
                                      onClick={() => msg.handoutProposal && handleTransmitHandoutFromAi(msg.handoutProposal)}
                                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                      title="Transmitir na tela dos jogadores"
                                    >
                                      <Send size={11} />
                                      <span>Enviar Pergaminho</span>
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-amber-100/90 italic font-serif leading-relaxed whitespace-pre-line bg-black/20 p-2.5 rounded-lg border border-amber-500/20">
                                  "{msg.handoutProposal.content}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Botões de Ações Sugeridas (Apenas no último turno do Narrador) */}
                          {isNarrator && msg.suggestedActions && msg.suggestedActions.length > 0 && msg === history[history.length - 1] && (
                            <div className="mt-3 flex flex-wrap gap-2 max-w-2xl">
                              {msg.suggestedActions.map((act, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleSendAction(act)}
                                  disabled={isAiLoading}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/60 text-xs transition flex items-center gap-1.5 text-left disabled:opacity-50"
                                >
                                  <span className="text-amber-400 font-mono font-bold text-[10px]">{i + 1}.</span>
                                  <span>{act}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Indicador de Carregamento da IA */}
                    {isAiLoading && (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-amber-500/30 max-w-md animate-pulse">
                        <Sparkles size={18} className="text-amber-400 animate-spin" />
                        <span className="text-xs text-amber-200 font-serif italic">
                          O Mestre está tecendo o destino da cena...
                        </span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de Ação do Jogador */}
                  <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAction(inputText);
                      }}
                      className="flex items-center gap-2 max-w-4xl mx-auto"
                    >
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          isAiLoading 
                            ? 'Aguardando o Mestre...' 
                            : 'O que você faz? (ex: "Examino a estátua", "Tento arrombar a fechadura", "Falo em élfico...")'
                        }
                        disabled={isAiLoading}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden transition"
                      />
                      <button
                        type="submit"
                        disabled={isAiLoading || !inputText.trim()}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
                        title="Enviar Ação"
                      >
                        <span>Agir</span>
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: ORÁCULO & ASSISTENTE DO MESTRE (CO-DM)                             */}
          {/* ========================================================================= */}
          {activeTab === 'oracle' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
              <div className="text-center space-y-1">
                <h3 className="font-serif font-black text-xl text-amber-200 flex items-center justify-center gap-2">
                  <Wand2 className="text-amber-400" size={20} />
                  Oráculo & Inspiração Instantânea para o Mestre
                </h3>
                <p className="text-xs text-slate-400">
                  Precisa improvisar durante a sessão? Escolha o que precisa e a IA gerará elementos prontos para uso em segundos.
                </p>
              </div>

              {/* Botões de Ação do Oráculo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'twist', label: 'Reviravolta / Plot Twist', icon: '⚡', desc: 'Mudança drástica na cena' },
                  { id: 'npc', label: 'NPC Instantâneo', icon: '🎭', desc: 'Voz, segredo e motivação' },
                  { id: 'puzzle', label: 'Enigma de Masmorra', icon: '🧩', desc: 'Quebra-cabeça com solução' },
                  { id: 'handout', label: 'Carta / Documento', icon: '📜', desc: 'Pista em pergaminho' },
                  { id: 'tavern_rumor', label: 'Rumores de Taverna', icon: '🍻', desc: '3 boatos (verdadeiro e falso)' },
                  { id: 'trap', label: 'Armadilha Tática', icon: '🏹', desc: 'Gatilho, efeito e desarme' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOracleAction(item.id as AiOracleAction)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      oracleAction === item.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>

              {/* Contexto Adicional Opcional */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Contexto ou Detalhe Específico (Opcional):
                </label>
                <input
                  type="text"
                  value={oracleContext}
                  onChange={(e) => setOracleContext(e.target.value)}
                  placeholder="Ex: Estamos numa tumba élfica submersa; O grupo acabou de derrotar o capitão pirata..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Botão de Disparo */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleConsultOracle}
                  disabled={isOracleLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>{isOracleLoading ? 'Consultando o Oráculo...' : 'Gerar Ideia com a IA'}</span>
                </button>
              </div>

              {/* Resultado do Oráculo */}
              {oracleResult && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Wand2 size={14} /> Resposta do Oráculo
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(oracleResult);
                          setCopiedNotification(true);
                          setTimeout(() => setCopiedNotification(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                        title="Copiar texto"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </button>

                      {oracleAction === 'handout' && onTransmitHandout && (
                        <button
                          type="button"
                          onClick={() => {
                            onTransmitHandout({
                              title: 'Documento Misterioso',
                              content: oracleResult,
                              timestamp: Date.now(),
                            });
                          }}
                          className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1 transition"
                          title="Transmitir na tela dos jogadores como pergaminho"
                        >
                          <Scroll size={13} />
                          <span>Transmitir Pergaminho</span>
                        </button>
                      )}

                      {oracleAction === 'npc' && onSaveNpcToJournal && (
                        <button
                          type="button"
                          onClick={() => {
                            onSaveNpcToJournal({
                              id: `npc_${Date.now()}`,
                              name: 'NPC do Oráculo',
                              role: 'Personagem Gerado por IA',
                              location: 'Campanha Atual',
                              notes: oracleResult,
                              attitude: 'neutro',
                            });
                            setCopiedNotification(true);
                            setTimeout(() => setCopiedNotification(false), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1 transition"
                          title="Salvar este NPC na aba Diário de Missões da ficha"
                        >
                          <CheckCircle2 size={13} />
                          <span>Salvar no Diário</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-serif">
                    {oracleResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: CONFIGURAÇÕES & CHAVE DE API                                       */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-2xl mx-auto w-full">
              <div className="space-y-1">
                <h3 className="font-serif font-black text-xl text-amber-200 flex items-center gap-2">
                  <Sliders className="text-amber-400" size={20} />
                  Configurações do Mestre IA
                </h3>
                <p className="text-xs text-slate-400">
                  Configure a chave da API do Google Gemini e personalize o estilo narrativo das suas aventuras.
                </p>
              </div>

              {/* Seletor de Provedor de IA */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-amber-300 block">
                  Selecione o Motor de IA:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AI_PROVIDERS.map((p) => {
                    const isSelected = provider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProvider(p.id);
                          setTestStatus({ loading: false });
                        }}
                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {p.badge && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md inline-block w-fit mb-1.5 ${
                            p.id === 'groq'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : p.id === 'pollinations'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {p.badge}
                          </span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.model}</p>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-2 leading-tight">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box de Configuração do Provedor Selecionado */}
              {provider === 'groq' && (
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Key size={14} /> Chave da API da Groq (Gratuita)
                    </label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Criar chave gratuita no Groq Console</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="Cole sua chave da Groq aqui (ex: gsk_...)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={testStatus.loading}
                      className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition shrink-0 flex items-center gap-1.5"
                    >
                      {testStatus.loading ? <RefreshCw size={13} className="animate-spin" /> : <Wifi size={13} />}
                      <span>{testStatus.loading ? 'Testando...' : 'Testar Conexão'}</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                          : 'bg-red-950/40 border border-red-500/40 text-red-300'
                      }`}
                    >
                      {testStatus.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-200/90 leading-relaxed bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                    ⚡ <strong>Recomendado:</strong> A Groq processa o modelo Llama 3.3 70B com resposta instantânea (&lt;1s), sem limites de cota chatos e 100% gratuita.
                  </div>
                </div>
              )}

              {provider === 'pollinations' && (
                <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 space-y-3 shadow-lg shadow-purple-950/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      🌸 Modo Livre (Pollinations.ai)
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                      Sem Chave / 100% Livre
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você pode jogar imediatamente sem criar nenhuma conta ou chave de API! Este modo utiliza os servidores comunitários abertos do Pollinations.
                  </p>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={testStatus.loading}
                      className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/40 transition shrink-0 flex items-center gap-1.5"
                    >
                      {testStatus.loading ? <RefreshCw size={13} className="animate-spin" /> : <Wifi size={13} />}
                      <span>{testStatus.loading ? 'Testando...' : 'Testar Modo Livre'}</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-purple-950/40 border border-purple-500/40 text-purple-300'
                          : 'bg-red-950/40 border border-red-500/40 text-red-300'
                      }`}
                    >
                      {testStatus.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>
              )}

              {provider === 'gemini' && (
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Key size={14} /> Chave da API do Google Gemini (gemini-3.5-flash-lite)
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Obter chave no Google AI Studio</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Cole sua chave Gemini aqui (ex: AIzaSy...)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={testStatus.loading}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition shrink-0 flex items-center gap-1.5"
                    >
                      {testStatus.loading ? <RefreshCw size={13} className="animate-spin" /> : <Wifi size={13} />}
                      <span>{testStatus.loading ? 'Testando...' : 'Testar Conexão'}</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                          : 'bg-red-950/40 border border-red-500/40 text-red-300'
                      }`}
                    >
                      {testStatus.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-normal">
                    🔒 <strong>Privacidade Total</strong>: Sua chave é armazenada com segurança apenas no seu navegador local (<code className="text-amber-300">localStorage</code>) e nunca é enviada para nenhum servidor intermediário.
                  </p>
                </div>
              )}

              {/* Seletor de Tom Narrativo */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Tom Narrativo Padrão da Aventura:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADVENTURE_TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                        tone === t.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <p className="text-xs font-bold">{t.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opções Avançadas */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">
                    Incluir atributos, magias e vida da ficha no contexto da IA
                  </span>
                </label>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">
                    Instruções Especiais para o Mestre (Opcional):
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                    placeholder="Ex: Não mate meu personagem no nível 1; Foco em descrições poéticas; Inimigos falam em charadas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Salvar */}
              <div className="flex items-center justify-between pt-2">
                {saveSuccessNotice ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 size={16} /> Preferências salvas com sucesso!
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Salvar Preferências</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
