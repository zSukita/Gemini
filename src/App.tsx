import { useState, useCallback, useEffect, useRef } from 'react';
import { useCharacter } from './hooks/useCharacter';
import { useEncounter } from './hooks/useEncounter';
import { useBattleMap } from './hooks/useBattleMap';
import { useMultiplayer } from './hooks/useMultiplayer';

import type { AdvantageMode, DiceRollResult, Spell, ThemeId, CampaignNpc } from './types/dnd5e';
import type { FogShape } from './types/vtt';
import { rollD20, rollDie, rollFormula } from './utils/diceRoller';
import { broadcastSyncMessage } from './utils/syncChannel';

import { Navbar, type AppMode } from './components/Navbar';
import { Header } from './components/Header';
import { CombatStats } from './components/CombatStats';
import { AbilityScores } from './components/AbilityScores';
import { SkillsList } from './components/SkillsList';
import { AttacksSection } from './components/AttacksSection';
import { Spellbook } from './components/Spellbook';
import { Inventory } from './components/Inventory';
import { FeaturesAndTraits } from './components/FeaturesAndTraits';
import { DmScreen } from './components/dm/DmScreen';
import { TabletopSessionView } from './components/vtt/TabletopSessionView';
import { BestiaryModal } from './components/dm/BestiaryModal';
import { SpellCompendiumModal } from './components/SpellCompendiumModal';
import { DiceRollerBar } from './components/DiceRollerBar';
import { RollHistoryModal } from './components/RollHistoryModal';
import { CharacterManagerModal } from './components/CharacterManagerModal';
import { CharacterWizardModal } from './components/CharacterWizardModal';
import { MultiplayerModal } from './components/multiplayer/MultiplayerModal';
import { DiceRollAnimation } from './components/DiceRollAnimation';
import { PrintSheetModal } from './components/PrintSheetModal';
import { SessionChatModal } from './components/SessionChatModal';
import { LevelUpModal } from './components/LevelUpModal';
import { JournalTab } from './components/JournalTab';
import { ConditionsTracker } from './components/ConditionsTracker';
import { QuickActionBar } from './components/QuickActionBar';
import { MusicPlayerModal } from './components/dm/MusicPlayerModal';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { ShortRestModal } from './components/ShortRestModal';
import { CharacterResources } from './components/CharacterResources';
import { CampaignModal } from './components/CampaignModal';
import { HandoutModal } from './components/dm/HandoutModal';
import { HandoutViewerModal } from './components/HandoutViewerModal';
import { AiDungeonMasterModal } from './components/ai/AiDungeonMasterModal';
import { getStoredApiKey, sendToAiDungeonMaster } from './services/geminiService';
import type { AiMessage } from './types/aiDm';
import type { ChatMessageType } from './types/chat';
import {
  type CampaignHandout,
  type CampaignPartyMember,
  broadcastHandoutToCampaign,
  subscribeToCampaign,
} from './firebase/campaignSync';
import type { Monster } from './types/combat';

import { 
  Shield, 
  Dices, 
  BookOpen, 
  Backpack, 
  Sparkles,
  Scroll
} from 'lucide-react';

type TabType = 'combat' | 'skills' | 'spells' | 'inventory' | 'features' | 'journal';

export function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    isAuthenticated,
    isFirebaseReady,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    clearError,
  } = useAuth();

  const hasAutoOpenedWizardRef = useRef(false);

  const {
    character,
    charactersList,
    activeId,
    setActiveId,
    updateCharacter,
    updateAbility,
    cycleSkillProficiency,
    applyDamage,
    applyHealing,
    setTempHp,
    toggleDeathSaveSuccess,
    toggleDeathSaveFailure,
    spendHitDie,
    performLongRest,
    completeShortRest,
    addResource,
    updateResource,
    deleteResource,
    useResourceCharge,
    addAttack,
    deleteAttack,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    toggleSpellSlotUsed,
    updateSpellSlotMax,
    addSpell,
    updateSpell,
    deleteSpell,
    addFeature,
    deleteFeature,
    createNewCharacter,
    addCreatedCharacter,
    deleteActiveCharacter,
    importCharacter,
    exportActiveCharacter,
  } = useCharacter(user?.uid);

  const {
    encounter,
    addMonsterCombatant,
    importPlayerCharacters,
    addCustomCombatant,
    removeCombatant,
    rollAllMonstersInitiative,
    sortCombatantsByInitiative,
    nextTurn,
    previousTurn,
    startEncounter,
    resetEncounter,
    applyCombatantHpDelta,
    toggleCombatantCondition,
    updateCombatantInitiative,
  } = useEncounter();

  // Estados de interface
  const [currentMode, setCurrentMode] = useState<AppMode>('player');
  const [activeTab, setActiveTab] = useState<TabType>('combat');
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [diceRolls, setDiceRolls] = useState<DiceRollResult[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const [activeRollAnimation, setActiveRollAnimation] = useState<DiceRollResult | null>(null);
  const [isDiceAnimationEnabled, setIsDiceAnimationEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arcanasheet_dice_animation_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isHandoutModalOpen, setIsHandoutModalOpen] = useState(false);
  const [activeHandout, setActiveHandout] = useState<CampaignHandout | null>(null);
  const [isHandoutViewerOpen, setIsHandoutViewerOpen] = useState(false);
  const [isSecretRoll, setIsSecretRoll] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('arcanasheet_active_campaign_id') || null;
    } catch {
      return null;
    }
  });
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isAiDmOpen, setIsAiDmOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isSpellCompendiumOpen, setIsSpellCompendiumOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem('arcanasheet_theme') as ThemeId) || 'default';
    } catch {
      return 'default';
    }
  });
  const [notification, setNotification] = useState<string | null>(null);

  const handleSetActiveCampaignId = (id: string | null) => {
    setActiveCampaignId(id);
    try {
      if (id) {
        localStorage.setItem('arcanasheet_active_campaign_id', id);
      } else {
        localStorage.removeItem('arcanasheet_active_campaign_id');
      }
    } catch {
      // ignore
    }
  };

  // Escuta a campanha ativa na nuvem para exibir novos Handouts aos jogadores automaticamente
  useEffect(() => {
    if (!activeCampaignId) return;

    const unsubscribe = subscribeToCampaign(activeCampaignId, (camp) => {
      if (camp?.activeHandout) {
        setActiveHandout(camp.activeHandout);
        setIsHandoutViewerOpen(true);
      }
    });

    return () => unsubscribe();
  }, [activeCampaignId]);

  useEffect(() => {
    try {
      localStorage.setItem('arcanasheet_theme', currentTheme);
      document.body.className = currentTheme === 'default' ? '' : `theme-${currentTheme}`;
      document.documentElement.className = currentTheme === 'default' ? '' : `theme-${currentTheme}`;
    } catch {
      // ignore
    }
  }, [currentTheme]);

  // Abre automaticamente o Assistente de Criação de Personagem se o jogador logou e a ficha está em branco
  useEffect(() => {
    if (isAuthenticated && character && !character.name && !hasAutoOpenedWizardRef.current) {
      hasAutoOpenedWizardRef.current = true;
      setIsWizardOpen(true);
    }
  }, [isAuthenticated, character]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  const toggleDiceAnimation = useCallback(() => {
    setIsDiceAnimationEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arcanasheet_dice_animation_enabled', String(next));
      } catch {
        // ignore
      }
      showNotification(`Animação 3D de dados: ${next ? 'Ligada' : 'Desligada'}`);
      return next;
    });
  }, [showNotification]);

  const addRollResult = useCallback(
    (res: DiceRollResult) => {
      setDiceRolls((prev) => [res, ...prev.slice(0, 99)]);
      setLastRoll(res);
      if (isDiceAnimationEnabled) {
        setActiveRollAnimation(res);
      }
    },
    [isDiceAnimationEnabled]
  );

  // Hook do Tabuleiro Tático / VTT
  const {
    mapConfig,
    setMapConfig,
    updateMapConfig,
    tokens,
    setTokens,
    selectedTokenId,
    setSelectedTokenId,
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    setActiveTool,
    moveToken,
    addToken,
    removeToken,
    updateToken,
    selectMapPreset,
    uploadCustomMap,
    addFogShape,
    resetFog,
    revealAllFog,
  } = useBattleMap(encounter);

  const [isAiResponding, setIsAiResponding] = useState(false);
  const triggerAiDmRef = useRef<((promptText: string) => Promise<void>) | undefined>(undefined);

  // Hook Multiplayer P2P WebRTC
  const {
    isConnected,
    isConnecting,
    isHost,
    roomCode,
    connectedPeers,
    chatLog,
    createRoom,
    joinRoom,
    disconnect,
    broadcastDiceRoll,
    broadcastTokenMove,
    broadcastFogUpdate,
    sendChatMessage,
  } = useMultiplayer({
    onRemoteDiceRoll: (roll) => {
      addRollResult(roll);
      showNotification(`Rolagem remota: ${roll.label} = ${roll.total}`);
    },
    onRemoteTokenMove: (remoteTokens) => {
      setTokens(remoteTokens);
    },
    onRemoteFogUpdate: (shapes) => {
      setMapConfig((prev) => ({ ...prev, revealedShapes: shapes }));
    },
    onRemoteChatMessage: (remoteMsg, rawPayload) => {
      // Se for o Host da sala e o remetente não tiver processado a IA localmente
      if (isHost && remoteMsg.type === 'PUBLIC' && rawPayload?.aiHandledBySender !== true) {
        const trimmed = remoteMsg.text.trim();
        const isAiCommand =
          trimmed.startsWith('@mestre') ||
          trimmed.startsWith('/mestre') ||
          trimmed.startsWith('/ia') ||
          trimmed.startsWith('@ia') ||
          trimmed.startsWith('@dm');
        if (isAiCommand) {
          const cleanPrompt =
            trimmed.replace(/^(@mestre|\/mestre|\/ia|@ia|@dm)\s*/i, '').trim() ||
            'Os aventureiros olham ao redor aguardando suas palavras. O que acontece agora? Descreva o ambiente e sugira opções de ação.';
          triggerAiDmRef.current?.(cleanPrompt);
        }
      }
    },
  });

  const triggerAiDm = useCallback(
    async (promptText: string) => {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        sendChatMessage({
          text: '⚠️ Chave de API do Google Gemini não configurada! Por favor, abra o menu do Mestre IA e adicione sua chave.',
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
        });
        return;
      }

      setIsAiResponding(true);
      try {
        const recentTurns: AiMessage[] = chatLog.slice(-8).map((msg) => ({
          id: msg.id,
          role: msg.type === 'AI_DM' ? 'narrator' : 'player',
          content: `${msg.senderName}: ${msg.text}`,
          timestamp: msg.timestamp,
        }));

        const aiReply = await sendToAiDungeonMaster(
          promptText,
          recentTurns,
          character,
          {
            customInstructions:
              'Você é o Mestre Supremo em uma mesa multiplayer online ao vivo de D&D 5e. Narre em português do Brasil com grande riqueza sensorial e desafie o grupo.',
          }
        );

        sendChatMessage({
          id: aiReply.id,
          text: aiReply.content,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          suggestedActions: aiReply.suggestedActions,
          requestedRoll: aiReply.requestedRoll,
        });
      } catch (err: unknown) {
        const errText = err instanceof Error ? err.message : String(err);
        sendChatMessage({
          text: `🔮 O Mestre hesitou em meio ao véu arcano: ${errText}`,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
        });
      } finally {
        setIsAiResponding(false);
      }
    },
    [chatLog, character, sendChatMessage]
  );

  triggerAiDmRef.current = triggerAiDm;

  const handleUserChatMessage = useCallback(
    (
      textOrPayload:
        | string
        | {
            id?: string;
            text: string;
            senderName?: string;
            type?: ChatMessageType;
            recipientName?: string;
            diceRoll?: DiceRollResult;
            suggestedActions?: string[];
            requestedRoll?: { skillOrAbility: string; dc?: number; reason: string };
            aiHandledBySender?: boolean;
          },
      senderFallback?: string
    ) => {
      const isObj = typeof textOrPayload === 'object' && textOrPayload !== null;
      const text = isObj ? textOrPayload.text : textOrPayload;
      const senderName = isObj && textOrPayload.senderName ? textOrPayload.senderName : (senderFallback || character.name || 'Aventureiro');
      const trimmed = text.trim();
      if (!trimmed) return;

      const isAiCommand =
        trimmed.startsWith('@mestre') ||
        trimmed.startsWith('/mestre') ||
        trimmed.startsWith('/ia') ||
        trimmed.startsWith('@ia') ||
        trimmed.startsWith('@dm');

      const apiKey = getStoredApiKey();
      const willHandleAi = isAiCommand && Boolean(apiKey);

      if (isObj) {
        sendChatMessage(
          {
            ...textOrPayload,
            aiHandledBySender: textOrPayload.aiHandledBySender ?? willHandleAi,
          },
          senderName
        );
      } else {
        sendChatMessage(
          {
            text: trimmed,
            senderName,
            type: 'PUBLIC',
            aiHandledBySender: willHandleAi,
          },
          senderName
        );
      }

      if (isAiCommand) {
        const cleanPrompt =
          trimmed.replace(/^(@mestre|\/mestre|\/ia|@ia|@dm)\s*/i, '').trim() ||
          'Os aventureiros olham ao redor aguardando suas palavras. O que acontece agora? Descreva o ambiente e sugira opções de ação.';
        triggerAiDm(cleanPrompt);
      }
    },
    [sendChatMessage, character.name, triggerAiDm]
  );

  // Mover Token local e transmitir para a rede P2P
  const handleMoveToken = useCallback(
    (id: string, x: number, y: number) => {
      moveToken(id, x, y);
      if (isConnected) {
        // Envia tokens atualizados
        const updated = tokens.map((t) => (t.id === id ? { ...t, x, y } : t));
        broadcastTokenMove(updated, character.name);
      }
    },
    [moveToken, isConnected, tokens, broadcastTokenMove, character.name]
  );

  // Revelar Névoa e transmitir para a rede
  const handleAddFogShape = useCallback(
    (shape: Omit<FogShape, 'id'>) => {
      addFogShape(shape);
      if (isConnected && isHost) {
        broadcastFogUpdate([...mapConfig.revealedShapes, { ...shape, id: `fog-${Date.now()}` }]);
      }
    },
    [addFogShape, isConnected, isHost, broadcastFogUpdate, mapConfig.revealedShapes]
  );

  // Rolagens com d20 (Testes, Salvaguardas, Perícias, Ataques)
  const handleRollD20 = (label: string, modifier: number) => {
    const res = rollD20(label, modifier, advantageMode);
    if (isSecretRoll) {
      res.isSecret = true;
    }
    addRollResult(res);

    // Se estiver conectado em sala multiplayer, transmite para todos na mesa (ou oculta se for secreto)
    if (isConnected) {
      if (isSecretRoll) {
        sendChatMessage({
          text: 'Rolou um d20 em segredo...',
          senderName: character.name,
          type: 'GM_ROLL',
          diceRoll: res,
        });
      } else {
        broadcastDiceRoll(res, character.name);
      }
    }

    // Se for iniciativa do jogador, sincroniza com o DM Screen local
    if (label === 'Iniciativa' && character) {
      broadcastSyncMessage({
        type: 'PLAYER_INITIATIVE_ROLLED',
        payload: {
          playerId: character.id,
          initiative: res.total,
        },
      });
      showNotification(`Iniciativa (${res.total}) enviada para o combate do Mestre!`);
    }

    // Reset para modo normal após rolar com vantagem/desvantagem
    if (advantageMode !== 'normal') {
      setAdvantageMode('normal');
    }
  };

  // Alternar Condição Ativa na Ficha
  const handleToggleCondition = useCallback(
    (conditionKey: string) => {
      const current = character.activeConditions || [];
      const exists = current.includes(conditionKey);
      const updated = exists
        ? current.filter((c) => c !== conditionKey)
        : [...current, conditionKey];
      updateCharacter({ activeConditions: updated });
    },
    [character.activeConditions, updateCharacter]
  );

  const handleClearConditions = useCallback(() => {
    updateCharacter({ activeConditions: [] });
  }, [updateCharacter]);

  // Enviar Monstro do Bestiário para o Mapa Tático
  const handleAddTokenFromMonster = useCallback(
    (monster: Monster) => {
      const size = monster.size === 'Grande' ? 2 : monster.size === 'Enorme' ? 3 : 1;
      addToken({
        name: monster.name,
        x: 250 + Math.floor(Math.random() * 60),
        y: 200 + Math.floor(Math.random() * 60),
        size,
        color: '#f43f5e',
        currentHp: monster.hitPoints,
        maxHp: monster.hitPoints,
        type: 'monster',
        conditions: [],
      });
      showNotification(`Monstro "${monster.name}" enviado para o Mapa Tático!`);
    },
    [addToken, showNotification]
  );

  // Rolar qualquer dado rápido (d4, d6, d8, etc.)
  const handleRollDie = (sides: number) => {
    if (sides === 20) {
      handleRollD20('d20 Puro', 0);
      return;
    }
    const val = rollDie(sides);
    const res: DiceRollResult = {
      id: `roll-${Date.now()}`,
      label: `d${sides}`,
      dieType: `d${sides}`,
      rolls: [val],
      selectedRoll: val,
      modifier: 0,
      total: val,
      advantageMode: 'normal',
      breakdown: `d${sides} (${val})`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      isSecret: isSecretRoll,
    };
    addRollResult(res);

    if (isConnected) {
      if (isSecretRoll) {
        sendChatMessage({
          text: `Rolou d${sides} em segredo...`,
          senderName: character.name,
          type: 'GM_ROLL',
          diceRoll: res,
        });
      } else {
        broadcastDiceRoll(res, character.name);
      }
    }
  };

  // Rolar fórmula personalizada ou dano
  const handleRollFormula = (formula: string, label: string, isCrit = false) => {
    const res = rollFormula(formula, label, isCrit);
    if (isSecretRoll) {
      res.isSecret = true;
    }
    addRollResult(res);

    if (isConnected) {
      if (isSecretRoll) {
        sendChatMessage({
          text: `Rolou ${formula} em segredo...`,
          senderName: character.name,
          type: 'GM_ROLL',
          diceRoll: res,
        });
      } else {
        broadcastDiceRoll(res, character.name);
      }
    }
  };

  // Rolar novamente a última rolagem ativa (Re-roll na animação 3D)
  const handleReroll = useCallback(() => {
    if (!activeRollAnimation) return;
    if (activeRollAnimation.dieType === 'd20') {
      handleRollD20(activeRollAnimation.label, activeRollAnimation.modifier);
    } else if (activeRollAnimation.dieType.startsWith('d')) {
      const sides = parseInt(activeRollAnimation.dieType.replace('d', ''), 10);
      if (!isNaN(sides)) {
        handleRollDie(sides);
      }
    } else {
      handleRollFormula(activeRollAnimation.dieType, activeRollAnimation.label);
    }
  }, [activeRollAnimation, handleRollD20, handleRollDie, handleRollFormula]);

  // Descanso Curto (Abre modal interativo para gastar dados de vida e recarregar recursos)
  const handleShortRest = () => {
    setIsShortRestOpen(true);
  };

  // Descanso Longo
  const handleLongRest = () => {
    performLongRest();
    showNotification(
      'Descanso Longo Concluído! Todos os Pontos de Vida, metade dos Dados de Vida e todos os Espaços de Magia foram restaurados.'
    );
  };

  // Importar grupo da campanha na nuvem para o Combate / Iniciativa
  const handleImportPartyToCombat = (members: CampaignPartyMember[]) => {
    if (!members || members.length === 0) {
      showNotification('Nenhum membro no grupo da campanha.');
      return;
    }

    let addedCount = 0;
    members.forEach((m) => {
      addCustomCombatant({
        name: m.name,
        type: 'player',
        initiative: 10 + Math.floor(Math.random() * 8),
        armorClass: m.armorClass || 10,
        maxHp: m.maxHp || 10,
        currentHp: m.currentHp || 10,
        tempHp: 0,
        conditions: [],
        playerId: m.characterId,
      });
      addedCount++;
    });

    setIsCampaignModalOpen(false);
    setCurrentMode('dm');
    showNotification(`${addedCount} aventureiros da campanha importados para o combate!`);
  };

  // Transmitir Pista / Documento (Handout)
  const handleBroadcastHandout = async (data: { title: string; content: string; imageUrl?: string }) => {
    if (activeCampaignId) {
      await broadcastHandoutToCampaign(activeCampaignId, data);
    }
    const handout: CampaignHandout = {
      id: `handout_${Date.now()}`,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      timestamp: Date.now(),
    };
    setActiveHandout(handout);
    setIsHandoutViewerOpen(true);
    sendChatMessage({
      text: `📜 Pista revelada: "${data.title}"`,
      senderName: character.name,
      type: 'PUBLIC',
    });
    showNotification(`Pista "${data.title}" transmitida!`);
  };

  // Guardar Pista no Diário de Campanha do Personagem
  const handleSaveHandoutToJournal = (title: string, content: string) => {
    updateCharacter((prev) => {
      const currentNotes = prev.journal?.loreNotes || '';
      const newEntry = `\n\n### 📜 ${title}\n${content}`;
      return {
        ...prev,
        journal: {
          quests: prev.journal?.quests || [],
          npcs: prev.journal?.npcs || [],
          sharedLoot: prev.journal?.sharedLoot || [],
          loreNotes: (currentNotes + newEntry).trim(),
        },
      };
    });
    showNotification(`Pista salva no Diário de Campanha!`);
  };

  // Conjurar Magia
  const handleCastSpell = (spell: Spell) => {
    if (spell.level > 0) {
      const slot = character.spellcasting.slots.find((s) => s.level === spell.level);
      if (slot && slot.used < slot.max) {
        toggleSpellSlotUsed(spell.level, slot.used);
        showNotification(`Magia "${spell.name}" conjurada gastando 1 espaço de ${spell.level}º Círculo!`);
      } else {
        showNotification(`Aviso: Nenhum espaço de ${spell.level}º Círculo disponível para "${spell.name}"!`);
      }
    }

    const match = spell.description.match(/(\d+d\d+(\s*[+-]\s*\d+)?)/i);
    if (match) {
      handleRollFormula(match[1], `${spell.name} (Efeito/Dano)`);
    } else {
      showNotification(`Magia "${spell.name}" ativada!`);
    }
  };

  const handleThemeChange = useCallback((theme: ThemeId) => {
    setCurrentTheme(theme);
    const themeNames: Record<ThemeId, string> = {
      default: 'Ouro & Ardósia',
      parchment: 'Pergaminho Antigo',
      crimson: 'Carmesim & Gótico',
      arcane: 'Místico Arcano',
    };
    showNotification(`Tema alterado para: ${themeNames[theme]}`);
  }, [showNotification]);

  const handleAddCoinsToCharacter = useCallback(
    (coins: { cp: number; sp: number; ep: number; gp: number; pp: number }) => {
      updateCharacter({
        currency: {
          cp: (character.currency?.cp || 0) + coins.cp,
          sp: (character.currency?.sp || 0) + coins.sp,
          ep: (character.currency?.ep || 0) + coins.ep,
          gp: (character.currency?.gp || 0) + coins.gp,
          pp: (character.currency?.pp || 0) + coins.pp,
        },
      });
      showNotification(`Moedas adicionadas com sucesso à ficha de ${character.name}!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleAddToSharedLoot = useCallback(
    (item: { name: string; quantity: number; valueGp: number }) => {
      const existingLoot = character.journal?.sharedLoot || [];
      const newEntry = {
        id: `loot-${Date.now()}`,
        name: item.name,
        quantity: item.quantity,
        value: `${item.valueGp} PO`,
      };
      updateCharacter({
        journal: {
          ...(character.journal || { quests: [], npcs: [], loreNotes: '', sharedLoot: [] }),
          sharedLoot: [...existingLoot, newEntry],
        },
      });
      showNotification(`"${item.name}" adicionado ao Cofre do Grupo no Diário!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleSaveNpcToJournal = useCallback(
    (npc: CampaignNpc) => {
      const existingNpcs = character.journal?.npcs || [];
      updateCharacter({
        journal: {
          ...(character.journal || { quests: [], npcs: [], loreNotes: '', sharedLoot: [] }),
          npcs: [...existingNpcs, npc],
        },
      });
      showNotification(`NPC "${npc.name}" salvo no Diário de Campanha!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleRollActionFromHotbar = useCallback(
    (name: string, bonus: number, formula?: string) => {
      handleRollD20(name, bonus);
      if (formula) {
        setTimeout(() => {
          handleRollFormula(formula, `${name} (Dano/Efeito)`);
        }, 300);
      }
    },
    [handleRollD20, handleRollFormula]
  );

  const handleLogout = useCallback(() => {
    logout();
    hasAutoOpenedWizardRef.current = false;
    showNotification('Você saiu da conta.');
  }, [logout, showNotification]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <Scroll className="w-10 h-10 animate-bounce text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" />
          <p className="font-serif text-sm tracking-wider">Invocando ArcanaSheet...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={login}
        onSignup={signup}
        onGoogleLogin={loginWithGoogle}
        onResetPassword={resetPassword}
        isFirebaseConfigured={isFirebaseReady}
        error={authError}
        loading={authLoading}
        clearError={clearError}
      />
    );
  }

  return (
    <div className={`min-h-screen pb-28 pt-3 px-3 sm:px-6 max-w-6xl mx-auto flex flex-col font-sans theme-${currentTheme}`}>
      {/* Notificação Flutuante (Toast) */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 border border-amber-300 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Navegação Superior */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        encounter={encounter}
        isMultiplayerConnected={isConnected}
        roomCode={roomCode}
        peersCount={connectedPeers.length}
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
        onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        onOpenCampaigns={() => setIsCampaignModalOpen(true)}
        onOpenAiDm={() => setIsAiDmOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}
        userName={user?.displayName || user?.email || null}
        onLogout={handleLogout}
      />

      {/* MODO 1: FICHA DE PERSONAGEM (JOGADOR) */}
      {currentMode === 'player' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <Header
            character={character}
            updateCharacter={updateCharacter}
            onOpenCharacterManager={() => setIsManagerOpen(true)}
            onOpenLevelUp={() => setIsLevelUpOpen(true)}
            onOpenWizard={() => setIsWizardOpen(true)}
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
          />

          {/* Rastreador de Condições & Status Ativos na Ficha */}
          <div className="mb-3">
            <ConditionsTracker
              activeConditions={character.activeConditions || []}
              onToggleCondition={handleToggleCondition}
              onClearConditions={handleClearConditions}
            />
          </div>

          {/* Navegação por Abas da Ficha */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setActiveTab('combat')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'combat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Shield size={14} className={activeTab === 'combat' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Visão Geral & Combate</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Dices size={14} className={activeTab === 'skills' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Perícias (18)</span>
            </button>

            <button
              onClick={() => setActiveTab('spells')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'spells'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'spells' ? 'text-indigo-400' : 'text-slate-500'} />
              <span>Grimório & Magias</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Backpack size={14} className={activeTab === 'inventory' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Inventário & Carga</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'features'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'features' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Talentos & Roleplay</span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'journal'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Scroll size={14} className={activeTab === 'journal' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Diário & Missões</span>
            </button>
          </nav>

          {/* Conteúdo da Aba */}
          <main className="flex-1">
            {activeTab === 'combat' && (
              <div>
                <CombatStats
                  character={character}
                  updateCharacter={updateCharacter}
                  applyDamage={applyDamage}
                  applyHealing={applyHealing}
                  setTempHp={setTempHp}
                  toggleDeathSaveSuccess={toggleDeathSaveSuccess}
                  toggleDeathSaveFailure={toggleDeathSaveFailure}
                  onSpendHitDie={handleShortRest}
                  onRollInitiative={(mod) => handleRollD20('Iniciativa', mod)}
                />

                <div className="mb-4">
                  <CharacterResources
                    resources={character.resources || []}
                    onAddResource={addResource}
                    onUpdateResource={updateResource}
                    onDeleteResource={deleteResource}
                    onUseCharge={useResourceCharge}
                  />
                </div>

                <AttacksSection
                  attacks={character.attacks}
                  onRollAttack={(name, bonus) => handleRollD20(`Ataque: ${name}`, bonus)}
                  onRollDamage={(name, formula) => handleRollFormula(formula, name)}
                  onAddAttack={addAttack}
                  onDeleteAttack={deleteAttack}
                />

                <AbilityScores
                  character={character}
                  updateAbility={updateAbility}
                  onRollCheck={(name, mod) => handleRollD20(name, mod)}
                  onRollSave={(name, mod) => handleRollD20(name, mod)}
                />
              </div>
            )}

            {activeTab === 'skills' && (
              <SkillsList
                character={character}
                onCycleProficiency={cycleSkillProficiency}
                onRollSkill={(name, mod) => handleRollD20(`Perícia: ${name}`, mod)}
              />
            )}

            {activeTab === 'spells' && (
              <Spellbook
                character={character}
                updateCharacter={updateCharacter}
                onToggleSpellSlot={toggleSpellSlotUsed}
                onUpdateSpellSlotMax={updateSpellSlotMax}
                onAddSpell={addSpell}
                onUpdateSpell={updateSpell}
                onDeleteSpell={deleteSpell}
                onCastSpell={handleCastSpell}
              />
            )}

            {activeTab === 'inventory' && (
              <Inventory
                character={character}
                updateCharacter={updateCharacter}
                onAddItem={addInventoryItem}
                onUpdateItem={updateInventoryItem}
                onDeleteItem={deleteInventoryItem}
              />
            )}

            {activeTab === 'features' && (
              <FeaturesAndTraits
                character={character}
                updateCharacter={updateCharacter}
                onAddFeature={addFeature}
                onDeleteFeature={deleteFeature}
              />
            )}

            {activeTab === 'journal' && (
              <JournalTab
                character={character}
                updateCharacter={updateCharacter}
              />
            )}
          </main>
        </div>
      )}

      {/* MODO 2: PAINEL DO MESTRE (DM SCREEN) */}
      {currentMode === 'dm' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <DmScreen
            encounter={encounter}
            charactersList={charactersList}
            onStartEncounter={startEncounter}
            onNextTurn={nextTurn}
            onPreviousTurn={previousTurn}
            onRollAllMonsters={rollAllMonstersInitiative}
            onSortInitiative={sortCombatantsByInitiative}
            onImportPlayers={importPlayerCharacters}
            onResetEncounter={resetEncounter}
            onHpDelta={applyCombatantHpDelta}
            onToggleCondition={toggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={removeCombatant}
            onAddMonster={addMonsterCombatant}
            onAddCustomCombatant={addCustomCombatant}
            onRollMonsterAttack={(monName, actName, bonus) =>
              handleRollD20(`${monName}: ${actName}`, bonus)
            }
            onRollMonsterDamage={(monName, actName, formula) =>
              handleRollFormula(formula, `${monName}: ${actName}`)
            }
            onAddTokenToMap={handleAddTokenFromMonster}
            onAddCoinsToCharacter={handleAddCoinsToCharacter}
            onAddToSharedLoot={handleAddToSharedLoot}
            onSaveNpcToJournal={handleSaveNpcToJournal}
            onOpenAiDm={() => setIsAiDmOpen(true)}
          />
        </div>
      )}

      {/* MODO 3: MESA VIRTUAL ONLINE COMPLETA (MODELO FANTASY GROUNDS) */}
      {currentMode === 'vtt' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <TabletopSessionView
            character={character}
            charactersList={charactersList}
            encounter={encounter}
            mapConfig={mapConfig}
            tokens={tokens}
            selectedTokenId={selectedTokenId}
            zoom={zoom}
            pan={pan}
            activeTool={activeTool}
            chatLog={chatLog}
            currentUserName={character.name}
            isHost={isHost}
            isConnected={isConnected}
            connectedPeers={connectedPeers}
            isAiResponding={isAiResponding}
            onSelectToken={setSelectedTokenId}
            onMoveToken={handleMoveToken}
            onSetZoom={setZoom}
            onSetPan={setPan}
            onSetActiveTool={setActiveTool}
            onUpdateMapConfig={updateMapConfig}
            onSelectMapPreset={selectMapPreset}
            onUploadMap={uploadCustomMap}
            onAddFogShape={handleAddFogShape}
            onResetFog={resetFog}
            onRevealAllFog={revealAllFog}
            onUpdateToken={updateToken}
            onRemoveToken={removeToken}
            onAddToken={addToken}
            onApplyCharacterAvatar={(dataUrl) => updateCharacter({ avatarUrl: dataUrl } as any)}
            onSendMessage={handleUserChatMessage}
            onRollDie={handleRollDie}
            onRollFormula={(formula, label) => handleRollFormula(formula, label)}
            onRollD20={handleRollD20}
            onStartEncounter={startEncounter}
            onNextTurn={nextTurn}
            onPreviousTurn={previousTurn}
            onSortInitiative={sortCombatantsByInitiative}
            onResetEncounter={resetEncounter}
            onHpDelta={applyCombatantHpDelta}
            onToggleCondition={toggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={removeCombatant}
            onRollMonsterAttack={(monName, actName, bonus) =>
              handleRollD20(`${monName}: ${actName}`, bonus)
            }
            onRollMonsterDamage={(monName, actName, formula) =>
              handleRollFormula(formula, `${monName}: ${actName}`)
            }
            onOpenMultiplayerModal={() => setIsMultiplayerOpen(true)}
            onOpenAiDmModal={() => setIsAiDmOpen(true)}
            onOpenCompendium={() => setIsSpellCompendiumOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onOpenCharacterSheet={() => setCurrentMode('player')}
            onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}
          />
        </div>
      )}

      {/* Barra de Rolagem de Dados Fixa no Rodapé (oculta no VTT pois possui sua própria doca) */}
      {currentMode !== 'vtt' && (
        <DiceRollerBar
        advantageMode={advantageMode}
        setAdvantageMode={setAdvantageMode}
        lastRoll={lastRoll}
        onRollDie={handleRollDie}
        onRollFormula={(formula, label) => handleRollFormula(formula, label)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        rollCount={diceRolls.length}
        isDiceAnimationEnabled={isDiceAnimationEnabled}
        onToggleDiceAnimation={toggleDiceAnimation}
        onReplayAnimation={(roll) => setActiveRollAnimation(roll)}
        isSecretRoll={isSecretRoll}
        onToggleSecretRoll={() => {
          setIsSecretRoll((prev) => {
            const next = !prev;
            showNotification(next ? '🤫 Rolagem Oculta ATIVA: seus dados não serão vistos pelos jogadores!' : 'Rolagem Normal ATIVA: visível para todos');
            return next;
          });
        }}
      />
      )}

      {/* Modal de Histórico de Rolagens */}
      <RollHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        rolls={diceRolls}
        onClearRolls={() => {
          setDiceRolls([]);
          setLastRoll(null);
        }}
      />

      {/* Modal de Gerenciamento de Personagens */}
      <CharacterManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        characters={charactersList}
        activeId={activeId}
        onSelectCharacter={(id) => {
          setActiveId(id);
          setIsManagerOpen(false);
          showNotification('Ficha alternada com sucesso!');
        }}
        onCreateCharacter={(name) => {
          createNewCharacter(name);
          setIsManagerOpen(false);
          showNotification('Nova ficha criada!');
        }}
        onOpenWizard={() => setIsWizardOpen(true)}
        onDeleteCharacter={() => {
          deleteActiveCharacter();
          showNotification('Ficha removida.');
        }}
        onImportCharacter={(json) => {
          const ok = importCharacter(json);
          if (ok) {
            setIsManagerOpen(false);
            showNotification('Ficha importada com sucesso!');
          }
          return ok;
        }}
        onExportCharacter={exportActiveCharacter}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Assistente Oficial de Criação de Personagens (Wizard) */}
      <CharacterWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCharacterCreated={(newChar) => {
          addCreatedCharacter(newChar);
          showNotification(
            `Herói "${newChar.name}" (${newChar.race} ${newChar.characterClass}) criado com sucesso!`
          );
        }}
      />

      {/* Modal Multiplayer Online P2P */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isHost={isHost}
        roomCode={roomCode}
        connectedPeers={connectedPeers}
        chatLog={chatLog}
        currentUserName={character.name}
        character={character}
        isAiResponding={isAiResponding}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onDisconnect={disconnect}
        onSendMessage={handleUserChatMessage}
      />

      {/* Animação 3D de Rolagem de Dados Poliédricos */}
      {activeRollAnimation && (
        <DiceRollAnimation
          roll={activeRollAnimation}
          onClose={() => setActiveRollAnimation(null)}
          onReroll={handleReroll}
        />
      )}

      {/* Modal de Impressão e Salvamento em PDF */}
      <PrintSheetModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        character={character}
      />

      {/* Chat Tático e Registro de Sessão com Rolagens Secretas e Mestre IA */}
      <SessionChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatLog={chatLog}
        currentUserName={character.name}
        isHost={isHost}
        character={character}
        onSendMessage={(msg) => {
          sendChatMessage(msg, character.name);
        }}
      />

      {/* Assistente Oficial de Subir de Nível (Level Up Wizard) */}
      <LevelUpModal
        isOpen={isLevelUpOpen}
        onClose={() => setIsLevelUpOpen(false)}
        character={character}
        onApplyLevelUp={(updates) => {
          updateCharacter(updates);
          showNotification(
            `Parabéns! ${character.name} evoluiu para o Nível ${updates.level ?? (character.level + 1)}!`
          );
        }}
      />

      {/* Modal Interativo de Descanso Curto */}
      <ShortRestModal
        isOpen={isShortRestOpen}
        onClose={() => setIsShortRestOpen(false)}
        character={character}
        onSpendHitDie={spendHitDie}
        onCompleteShortRest={completeShortRest}
        showNotification={showNotification}
      />

      {/* Modal de Campanhas na Nuvem (Firebase) */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        userId={user?.uid || 'guest'}
        userName={user?.displayName || user?.email || character.name}
        activeCharacter={character}
        onImportPartyToCombat={handleImportPartyToCombat}
        onOpenHandoutModal={() => setIsHandoutModalOpen(true)}
        showNotification={showNotification}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={handleSetActiveCampaignId}
      />

      {/* Modal de Envio de Pistas/Documentos pelo Mestre (Handouts) */}
      <HandoutModal
        isOpen={isHandoutModalOpen}
        onClose={() => setIsHandoutModalOpen(false)}
        onBroadcastHandout={handleBroadcastHandout}
        showNotification={showNotification}
      />

      {/* Modal de Visualização de Pistas/Documentos em Pergaminho Imersivo */}
      <HandoutViewerModal
        isOpen={isHandoutViewerOpen}
        onClose={() => setIsHandoutViewerOpen(false)}
        handout={activeHandout}
        onSaveToJournal={handleSaveHandoutToJournal}
        showNotification={showNotification}
      />

      {/* Barra de Ações Rápidas (Macro Hotbar - 1 a 6) */}
      {currentMode === 'player' && (
        <QuickActionBar
          character={character}
          onRollAction={handleRollActionFromHotbar}
          updateCharacter={updateCharacter}
        />
      )}

      {/* Modal Independente de Trilha Sonora do Mestre */}
      <MusicPlayerModal
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
      />

      {/* Modal do Mestre IA / Oráculo (Arcana AI Dungeon Master) */}
      <AiDungeonMasterModal
        isOpen={isAiDmOpen}
        onClose={() => setIsAiDmOpen(false)}
        activeCharacter={character}
        onTransmitHandout={(handout) => {
          handleBroadcastHandout(handout);
        }}
        onSaveNpcToJournal={(npc) => {
          handleSaveNpcToJournal(npc);
        }}
        onBroadcastToRoom={(msg) => {
          sendChatMessage(msg, '✨ Mestre Supremo (IA)');
          showNotification('Narração do Mestre IA transmitida para a mesa online!');
        }}
      />

      {/* Modal do Bestiário de Monstros */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
        onAddMonster={addMonsterCombatant}
        onRollMonsterAttack={(monName, actName, bonus) =>
          handleRollD20(`${monName}: ${actName}`, bonus)
        }
        onRollMonsterDamage={(monName, actName, formula) =>
          handleRollFormula(formula, `${monName}: ${actName}`)
        }
        onAddTokenToMap={handleAddTokenFromMonster}
      />

      {/* Modal do Compêndio de Magias SRD */}
      <SpellCompendiumModal
        isOpen={isSpellCompendiumOpen}
        onClose={() => setIsSpellCompendiumOpen(false)}
        onAddSpell={(spell) => {
          updateCharacter((prev) => ({
            ...prev,
            spellcasting: {
              ...prev.spellcasting,
              spells: [...(prev.spellcasting?.spells || []), { ...spell, id: `spell-${Date.now()}` }],
            },
          }));
          showNotification(`Magia "${spell.name}" adicionada ao Grimório!`);
        }}
        characterSpells={character.spellcasting?.spells || []}
        characterClass={character.characterClass}
      />
    </div>
  );
}

export default App;
