import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMessageType } from '../../types/chat';
import type { Character, DiceRollResult, SkillKey, AbilityKey, AdvantageMode } from '../../types/dnd5e';
import type { Encounter } from '../../types/combat';
import type { MapToken } from '../../types/vtt';
import type { AiLootReward } from '../../types/aiDm';
import { SKILLS, ABILITIES } from '../../types/dnd5e';
import { rollFormula, rollD20 } from '../../utils/diceRoller';
import { 
  Sparkles, 
  Dices, 
  ArrowRight, 
  Send, 
  Lock, 
  ScrollText, 
  Loader2,
  ShieldAlert,
  RotateCcw,
  Swords,
  Skull,
  Coins,
  PackagePlus,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { AI_ADVENTURE_SCENARIOS, type AiAdventureScenario } from '../../data/aiAdventureScenarios';
import {
  getStoredCampaignSummary,
  saveStoredCampaignSummary,
  generateCampaignSummaryUpdate,
} from '../../services/geminiService';

interface TabletopParchmentChatProps {
  chatLog: ChatMessage[];
  currentUserName: string;
  character?: Character | null;
  isAiResponding?: boolean;
  encounter?: Encounter;
  tokens?: MapToken[];
  onMoveToken?: (id: string, x: number, y: number) => void;
  onHpDelta?: (combatantId: string, delta: number) => void;
  onOpenEndSessionModal?: () => void;
  onStartScenario?: (scenario: AiAdventureScenario) => void;
  onCollectLoot?: (reward: AiLootReward, messageId?: string) => void;
  onUpdateCharacter?: (updates: Partial<Character>) => void;
  onNextTurn?: () => void;
  onSendMessage: (
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
  ) => void;
}

export const TabletopParchmentChat: React.FC<TabletopParchmentChatProps> = ({
  chatLog,
  currentUserName,
  character,
  isAiResponding,
  encounter,
  tokens,
  onMoveToken,
  onHpDelta,
  onOpenEndSessionModal,
  onStartScenario,
  onCollectLoot,
  onUpdateCharacter,
  onSendMessage,
  onNextTurn,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [collectedLootIds, setCollectedLootIds] = useState<Set<string>>(new Set());
  const [isCampaignMemoryOpen, setIsCampaignMemoryOpen] = useState(false);
  const [campaignSummaryText, setCampaignSummaryText] = useState(() => getStoredCampaignSummary());
  const [isSynthesizingMemory, setIsSynthesizingMemory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados e Regras de Turno D&D 5e
  const isCombatActive = Boolean(encounter?.isRunning && encounter.combatants.length > 0);
  const activeCombatant = isCombatActive && encounter
    ? encounter.combatants[encounter.activeCombatantIndex]
    : null;
  const isPlayerTurn = activeCombatant?.type === 'player';
  const isMyTurn = !isCombatActive || Boolean(isPlayerTurn && activeCombatant?.name.toLowerCase() === currentUserName.toLowerCase());
  const isOtherPlayerTurn = Boolean(isCombatActive && isPlayerTurn && !isMyTurn);
  const isMonsterTurn = Boolean(isCombatActive && activeCombatant?.type === 'monster');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isAiResponding]);

  const handleSynthesizeMemory = async () => {
    setIsSynthesizingMemory(true);
    try {
      const recentAiMessages = chatLog.map((m) => ({
        id: m.id,
        role: (m.type === 'AI_DM' ? 'narrator' : 'player') as 'narrator' | 'player',
        content: `${m.senderName}: ${m.text}`,
        timestamp: m.timestamp,
      }));
      const updated = await generateCampaignSummaryUpdate(recentAiMessages, campaignSummaryText);
      setCampaignSummaryText(updated);
    } finally {
      setIsSynthesizingMemory(false);
    }
  };

  const handleRollDeathSave = () => {
    if (!character) return;
    const roll = rollD20('Salvaguarda contra a Morte', 0, advantageMode);
    const natural = roll.rolls?.[0] ?? roll.selectedRoll;
    const currentSuccesses = character.deathSaves?.successes || 0;
    const currentFailures = character.deathSaves?.failures || 0;

    let newSuccesses = currentSuccesses;
    let newFailures = currentFailures;
    let announcement = '';
    let promptText = '';

    if (natural === 20) {
      newSuccesses = 0;
      newFailures = 0;
      if (onHpDelta) {
        onHpDelta(character.id, 1);
      }
      onUpdateCharacter?.({
        currentHp: 1,
        deathSaves: { successes: 0, failures: 0 },
      });
      announcement = `✨ **20 NATURAL NA SALVAGUARDA CONTRA A MORTE!** [${roll.breakdown}]\n` +
        `Um milagre de pura resiliência desperta **${character.name}**! Ele recupera **1 PV** e se ergue consciente!`;
      promptText = `@mestre [SALVAGUARDA CONTRA A MORTE]: ${character.name} tirou um 20 NATURAL! O herói recuperou 1 PV e despertou da beira da morte! Descreva este momento heroico e dramático!`;
    } else if (natural === 1) {
      newFailures = Math.min(3, currentFailures + 2);
      onUpdateCharacter?.({
        deathSaves: { successes: newSuccesses, failures: newFailures },
      });
      const isDead = newFailures >= 3;
      announcement = `💀 **FALHA CRÍTICA (1 NATURAL) NA SALVAGUARDA!** [${roll.breakdown}]\n` +
        `O herói sofre **2 FALHAS** simultâneas (${newFailures}/3 falhas)! ${isDead ? '💀 **O PERSONAGEM FALECEU!**' : ''}`;
      promptText = `@mestre [SALVAGUARDA CONTRA A MORTE]: ${character.name} rolou 1 NATURAL sofrendo 2 falhas (${newFailures}/3). ${isDead ? 'O herói sucumbiu à morte!' : 'Ele está a um passo da morte.'} Narre o agravamento crítico dos ferimentos!`;
    } else if (roll.total >= 10) {
      newSuccesses = Math.min(3, currentSuccesses + 1);
      onUpdateCharacter?.({
        deathSaves: { successes: newSuccesses, failures: newFailures },
      });
      const isStable = newSuccesses >= 3;
      announcement = `🛡️ **SUCESSO NA SALVAGUARDA!** [${roll.breakdown}] = ${roll.total} (vs CD 10)\n` +
        `Sucesso registrado (${newSuccesses}/3 sucessos)! ${isStable ? '✨ **O PERSONAGEM ESTABILIZOU!**' : ''}`;
      promptText = `@mestre [SALVAGUARDA CONTRA A MORTE]: ${character.name} obteve sucesso (${roll.total} vs CD 10), acumulando ${newSuccesses}/3 sucessos. ${isStable ? 'O herói estabilizou seu estado vital!' : ''} Narre sua respiração voltando ao ritmo constante.`;
    } else {
      newFailures = Math.min(3, currentFailures + 1);
      onUpdateCharacter?.({
        deathSaves: { successes: newSuccesses, failures: newFailures },
      });
      const isDead = newFailures >= 3;
      announcement = `🩸 **FALHA NA SALVAGUARDA!** [${roll.breakdown}] = ${roll.total} (vs CD 10)\n` +
        `Falha registrada (${newFailures}/3 falhas)! ${isDead ? '💀 **O PERSONAGEM FALECEU!**' : ''}`;
      promptText = `@mestre [SALVAGUARDA CONTRA A MORTE]: ${character.name} falhou (${roll.total} vs CD 10), acumulando ${newFailures}/3 falhas. ${isDead ? 'O herói sucumbiu à morte!' : ''} Narre a escuridão que avança sobre ele.`;
    }

    onSendMessage(
      {
        text: `${promptText}\n\n${announcement}`,
        senderName: character.name || currentUserName,
        type: 'PUBLIC',
        diceRoll: roll,
      },
      currentUserName
    );
  };

  const handleRollRequested = (req: { skillOrAbility: string; dc?: number; reason: string }) => {
    let mod = 0;
    const target = req.skillOrAbility.toLowerCase();
    const formulaMatch = req.skillOrAbility.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
    let formula = '';
    let label = `Teste de ${req.skillOrAbility}`;
    let isAttack = false;
    let isDamage = false;

    if (formulaMatch && (target.includes('dano') || target.includes('damage') || target.includes('rolagem'))) {
      // Pedido de dano com fórmula explícita (ex: 1d12+3, 2d6, 1d8)
      formula = formulaMatch[1].replace(/\s+/g, '');
      label = `Dano: ${req.skillOrAbility}`;
      isDamage = true;
    } else if (target.includes('ataque') || target.includes('attack') || target.includes('golpe')) {
      isAttack = true;
      const matchingAttack = character?.attacks?.find((a) => target.includes(a.name.toLowerCase()));
      if (matchingAttack) {
        mod = matchingAttack.attackBonus;
      } else {
        const isDex = target.includes('destreza') || target.includes('dex') || target.includes('arco') || target.includes('adaga') || target.includes('rapieira');
        const abilityScore = isDex ? (character?.abilities.dex?.score ?? 10) : (character?.abilities.str?.score ?? 10);
        const abilityMod = Math.floor((abilityScore - 10) / 2);
        const profBonus = Math.floor(((character?.level || 1) - 1) / 4) + 2;
        mod = abilityMod + profBonus;
      }
      formula = mod === 0 ? '1d20' : mod > 0 ? `1d20+${mod}` : `1d20${mod}`;
      label = `Ataque: ${req.skillOrAbility}`;
    } else {
      // Teste padrão de perícia ou atributo D&D 5e
      if (character) {
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
          ) as [AbilityKey, { name: string; abbr: string }] | undefined;
          if (abilityEntry) {
            const abilityKey = abilityEntry[0];
            const abilityScore = character.abilities[abilityKey]?.score ?? 10;
            mod = Math.floor((abilityScore - 10) / 2);
          }
        }
      }
      formula = mod === 0 ? '1d20' : mod > 0 ? `1d20+${mod}` : `1d20${mod}`;
    }

    const rollRes = isDamage
      ? rollFormula(formula, label)
      : rollD20(label, mod, advantageMode);
    const dcInfo = req.dc ? ` (vs ${isAttack ? 'CA' : 'CD'} ${req.dc})` : '';

    // Resolução Completa de Ataque D&D 5e com Acerto/Erro, Dano, Aproximação e Redução de PV
    if (isAttack && req.dc) {
      const natural = rollRes.rolls?.[0] ?? rollRes.selectedRoll;
      const isCritHit = Boolean(rollRes.isCriticalSuccess || rollRes.selectedRoll === 20 || natural === 20);
      const isCritMiss = Boolean(rollRes.isCriticalFailure || (advantageMode === 'normal' && natural === 1));
      const isHit = isCritHit || (!isCritMiss && rollRes.total >= req.dc);

      // Localiza o monstro alvo nos combatentes ativos vivos
      const monsterCandidates = encounter?.combatants.filter((c) => (c.type === 'monster' || c.type === 'npc') && c.currentHp > 0) || [];
      const reasonLower = req.reason.toLowerCase();
      const skillLower = req.skillOrAbility.toLowerCase();

      // Coleta o texto das mensagens recentes do chat (escolha do jogador e narrativa do mestre)
      const recentChatText = chatLog.slice(-5).map((m) => m.text).join(' ').toLowerCase();
      const fullContextText = `${reasonLower} ${skillLower} ${recentChatText}`;

      // Helper para normalizar nome (remove "(Ghoul)", sufixos e números)
      const cleanMonName = (name: string) =>
        name.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();

      // 1. Prioridade máxima: monstro com correspondência exata do nome completo com número (ex: "Carniçal 2" ou "Carniçal 1")
      let targetMonster = monsterCandidates.find((m) => {
        const exactName = cleanMonName(m.name);
        return fullContextText.includes(exactName);
      });

      // 2. Segunda prioridade: monstro com correspondência do nome base (ex: "Carniçal")
      if (!targetMonster) {
        targetMonster = monsterCandidates.find((m) => {
          const baseName = cleanMonName(m.name).replace(/\s*\d+$/, '').trim();
          return baseName.length >= 3 && fullContextText.includes(baseName);
        });
      }

      // 3. Terceira prioridade: se houver combatente com menos vida (ferido em combate anterior)
      if (!targetMonster && monsterCandidates.length > 0) {
        const wounded = monsterCandidates.find((m) => m.currentHp < m.maxHp);
        targetMonster = wounded || monsterCandidates[0];
      }

      const targetDisplayName = targetMonster?.name || 'o Inimigo';

      // ─── APROXIMAÇÃO AUTOMÁTICA DO HERÓI ATÉ O MONSTRO NO MAPA ───
      if (tokens && onMoveToken) {
        const playerToken = tokens.find(
          (t) =>
            (character?.id && t.id === character.id) ||
            t.name.toLowerCase() === (character?.name || '').toLowerCase() ||
            t.name.toLowerCase() === currentUserName.toLowerCase() ||
            t.type === 'player'
        );

        const targetToken = targetMonster
          ? tokens.find(
              (t) =>
                t.combatantId === targetMonster.id ||
                t.name.toLowerCase() === targetMonster.name.toLowerCase() ||
                t.name.toLowerCase().startsWith(targetMonster.name.toLowerCase().replace(/\s*\d+$/, '')) ||
                t.type === 'monster'
            )
          : tokens.find((t) => t.type === 'monster');

        if (playerToken && targetToken && playerToken.id !== targetToken.id) {
          const dx = targetToken.x - playerToken.x;
          const dy = targetToken.y - playerToken.y;
          const dist = Math.hypot(dx, dy);

          // Se estiver a mais de 1 casa (55px) de distância, posiciona adjacente ao monstro
          if (dist > 55) {
            let targetX = targetToken.x;
            let targetY = targetToken.y;

            if (Math.abs(dx) >= Math.abs(dy)) {
              targetX += dx > 0 ? -50 : 50;
            } else {
              targetY += dy > 0 ? -50 : 50;
            }

            onMoveToken(playerToken.id, Math.max(0, targetX), Math.max(0, targetY));
          }
        }
      }

      if (isHit) {
        // Encontra a arma utilizada ou deduz fórmula de dano da classe
        const matchingAttack = character?.attacks?.find((a) => target.includes(a.name.toLowerCase()));
        let baseDamageFormula = matchingAttack?.damage?.trim() || '';

        if (!baseDamageFormula) {
          const strScore = character?.abilities.str?.score ?? 10;
          const dexScore = character?.abilities.dex?.score ?? 10;
          const isFinesse = target.includes('adaga') || target.includes('rapieira') || target.includes('arco') || target.includes('destreza');
          const statMod = Math.floor(((isFinesse ? Math.max(strScore, dexScore) : strScore) - 10) / 2);
          const modStr = statMod > 0 ? `+${statMod}` : statMod < 0 ? `${statMod}` : '';

          if (target.includes('machado grande') || target.includes('greataxe')) {
            baseDamageFormula = `1d12${modStr}`;
          } else if (target.includes('espada grande') || target.includes('greatsword')) {
            baseDamageFormula = `2d6${modStr}`;
          } else if (target.includes('espada longa') || target.includes('longsword') || target.includes('martelo') || target.includes('warhammer')) {
            baseDamageFormula = `1d8${modStr}`;
          } else if (target.includes('adaga') || target.includes('dagger')) {
            baseDamageFormula = `1d4${modStr}`;
          } else if (target.includes('arco') || target.includes('lança')) {
            baseDamageFormula = `1d6${modStr}`;
          } else {
            baseDamageFormula = `1d8${modStr}`;
          }
        }

        // No Acerto Crítico (20 natural), dobra a quantidade de dados de dano
        let finalDamageFormula = baseDamageFormula;
        if (isCritHit) {
          finalDamageFormula = baseDamageFormula.replace(/^(\d+)d(\d+)/, (_, count, die) => `${Number(count) * 2}d${die}`);
        }

        const dmgRoll = rollFormula(finalDamageFormula, `Dano de ${req.skillOrAbility}`);
        const damageVal = Math.max(1, dmgRoll.total);

        // Aplica dedução de PV no monstro alvo
        if (targetMonster && onHpDelta) {
          onHpDelta(targetMonster.id, -damageVal);
        }

        if (typeof window !== 'undefined' && targetMonster && isCritHit) {
          const targetTok = tokens?.find(
            (t) =>
              t.combatantId === targetMonster?.id ||
              t.name.toLowerCase() === targetMonster?.name.toLowerCase() ||
              t.name.toLowerCase().startsWith(targetMonster?.name.toLowerCase().replace(/\s*\d+$/, ''))
          );
          if (targetTok) {
            window.dispatchEvent(
              new CustomEvent('arcanasheet_floating_text', {
                detail: {
                  tokenId: targetTok.id,
                  text: 'CRÍTICO!',
                  type: 'crit',
                },
              })
            );
          }
        }

        const newHp = targetMonster ? Math.max(0, targetMonster.currentHp - damageVal) : undefined;
        const isDefeated = newHp !== undefined && newHp <= 0;
        const hitStatus = isCritHit ? '💥 ACERTO CRÍTICO!' : '🎯 ACERTOU!';

        const hitAnnouncement = `${hitStatus} [${rollRes.breakdown}] = ${rollRes.total} (vs CA ${req.dc})\n` +
          `⚔️ **Dano (${finalDamageFormula}):** [${dmgRoll.breakdown}] = **${damageVal} de dano** em **${targetDisplayName}**!\n` +
          (targetMonster ? `🩸 **${targetDisplayName}** agora possui **${newHp}/${targetMonster.maxHp} PV** ${isDefeated ? '💀 (**DERROTADO!**)' : ''}` : '');

        const promptText = `@mestre [RESULTADO DO ATAQUE]: ${hitStatus} com rolagem ${rollRes.total} (vs CA ${req.dc}) causando ${damageVal} de dano em ${targetDisplayName}. ` +
          (targetMonster ? `O alvo ficou com ${newHp}/${targetMonster.maxHp} PV ${isDefeated ? 'e caiu derrotado em combate!' : 'e continua em combate.'} ` : '') +
          `Descreva cinematograficamente o impacto do golpe em ${targetDisplayName} e como a batalha prossegue!`;

        onSendMessage(
          {
            text: `${promptText}\n\n${hitAnnouncement}`,
            senderName: character?.name || currentUserName || 'Aventureiro',
            type: 'PUBLIC',
            diceRoll: rollRes,
          },
          currentUserName
        );
        return;
      } else {
        // Ataque Errou (Miss)
        if (typeof window !== 'undefined' && targetMonster) {
          const targetTok = tokens?.find(
            (t) =>
              t.combatantId === targetMonster?.id ||
              t.name.toLowerCase() === targetMonster?.name.toLowerCase() ||
              t.name.toLowerCase().startsWith(targetMonster?.name.toLowerCase().replace(/\s*\d+$/, ''))
          );
          if (targetTok) {
            window.dispatchEvent(
              new CustomEvent('arcanasheet_floating_text', {
                detail: {
                  tokenId: targetTok.id,
                  text: isCritMiss ? 'ERRO CRÍTICO!' : 'ERROU!',
                  type: 'miss',
                },
              })
            );
          }
        }

        const missStatus = isCritMiss ? '💨 FALHA CRÍTICA (1 natural - Erro Automático)!' : '❌ ERROU!';
        const missAnnouncement = `${missStatus} [${rollRes.breakdown}] = ${rollRes.total} (vs CA ${req.dc}). O ataque não conseguiu superar a defesa de ${targetDisplayName}.`;
        const promptText = `@mestre [RESULTADO DO ATAQUE]: ${missStatus} com rolagem ${rollRes.total} (vs CA ${req.dc}). O golpe não acertou ${targetDisplayName}. Descreva a esquiva ou defesa do adversário e como a batalha prossegue!`;

        onSendMessage(
          {
            text: `${promptText}\n\n${missAnnouncement}`,
            senderName: character?.name || currentUserName || 'Aventureiro',
            type: 'PUBLIC',
            diceRoll: rollRes,
          },
          currentUserName
        );
        return;
      }
    }

    // ─── APROXIMAÇÃO EM TESTES DE MOVIMENTAÇÃO, FLANCO OU FURTIVIDADE ───
    if (!isAttack && tokens && onMoveToken) {
      const reasonLower = req.reason.toLowerCase();
      const skillLower = req.skillOrAbility.toLowerCase();
      const isMovementAction =
        /avan[çc]ar|flanquear|aproximar|investir|esgueirar|correr|combate/i.test(reasonLower) ||
        /avan[çc]ar|flanquear|aproximar|investir|esgueirar|correr|combate/i.test(skillLower);

      if (isMovementAction) {
        const playerToken = tokens.find(
          (t) =>
            (character?.id && t.id === character.id) ||
            t.name.toLowerCase() === (character?.name || '').toLowerCase() ||
            t.name.toLowerCase() === currentUserName.toLowerCase() ||
            t.type === 'player'
        );
        const targetToken =
          tokens.find(
            (t) =>
              t.type === 'monster' &&
              (reasonLower.includes(t.name.toLowerCase().replace(/\s*\d+$/, '').trim()) ||
                skillLower.includes(t.name.toLowerCase().replace(/\s*\d+$/, '').trim()))
          ) || tokens.find((t) => t.type === 'monster');

        if (playerToken && targetToken && playerToken.id !== targetToken.id) {
          const dx = targetToken.x - playerToken.x;
          const dy = targetToken.y - playerToken.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 55) {
            let targetX = targetToken.x;
            let targetY = targetToken.y;
            if (Math.abs(dx) >= Math.abs(dy)) {
              targetX += dx > 0 ? -50 : 50;
            } else {
              targetY += dy > 0 ? -50 : 50;
            }
            onMoveToken(playerToken.id, Math.max(0, targetX), Math.max(0, targetY));
          }
        }
      }
    }

    let promptText = '';
    if (isAttack) {
      promptText = `@mestre Ataque realizado com ${req.skillOrAbility}: [${rollRes.breakdown}] = ${rollRes.total}${dcInfo}. O ataque acertou o alvo?`;
    } else if (isDamage) {
      promptText = `@mestre Rolagem de dano: [${rollRes.breakdown}] = ${rollRes.total} de dano! Qual o efeito no alvo?`;
    } else {
      promptText = `@mestre Realizei o teste de ${req.skillOrAbility}: [${rollRes.breakdown}] = ${rollRes.total}${dcInfo}. Como a cena prossegue?`;
    }

    onSendMessage(
      {
        text: promptText,
        senderName: character?.name || currentUserName || 'Aventureiro',
        type: 'PUBLIC',
        diceRoll: rollRes,
      },
      currentUserName
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    if (isSecretMode || raw.startsWith('/gmroll') || raw.startsWith('/gr')) {
      const formula = raw.replace(/^\/(gmroll|gr)\s*/, '') || '1d20';
      try {
        const rollRes = rollFormula(formula, 'Rolagem Secreta');
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

    onSendMessage(raw, currentUserName);
    setInputText('');
  };

  const renderLootCard = (msg: ChatMessage) => {
    if (!msg.lootReward) return null;
    const isCollected = collectedLootIds.has(msg.id);
    const coins = msg.lootReward.coins;
    const items = msg.lootReward.items;

    return (
      <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-[#2c1d11] via-[#3d2716] to-[#2c1d11] border-2 border-amber-500/70 text-amber-100 shadow-md animate-in fade-in">
        <div className="flex items-center justify-between border-b border-amber-600/40 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Coins className="text-yellow-400" size={16} />
            <span className="font-serif font-black text-xs uppercase tracking-wider text-yellow-300">
              Tesouro Descoberto!
            </span>
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono italic">
            Recompensa
          </span>
        </div>

        {coins && Object.values(coins).some(Boolean) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs py-1 px-2 bg-black/30 rounded border border-amber-800/40 mb-1.5 font-bold">
            <span className="text-amber-400 text-[10px] uppercase">Moedas:</span>
            {Boolean(coins.gp) && (
              <span className="text-yellow-400 bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-600/50 text-[11px]">
                🪙 {coins.gp} PO
              </span>
            )}
            {Boolean(coins.sp) && (
              <span className="text-slate-300 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-500/50 text-[11px]">
                🥈 {coins.sp} PP
              </span>
            )}
            {Boolean(coins.cp) && (
              <span className="text-amber-600 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50 text-[11px]">
                🥉 {coins.cp} PC
              </span>
            )}
            {Boolean(coins.ep) && (
              <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-600/50 text-[11px]">
                ⚡ {coins.ep} PE
              </span>
            )}
            {Boolean(coins.pp) && (
              <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/50 text-[11px]">
                💎 {coins.pp} PL
              </span>
            )}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="space-y-1 mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
              Itens & Relíquias:
            </span>
            <div className="grid grid-cols-1 gap-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="text-[11px] bg-black/25 px-2 py-1 rounded border border-amber-800/30 flex items-center justify-between text-amber-200"
                >
                  <span>{it.name}</span>
                  <span className="font-mono font-bold text-amber-400 text-[10px]">
                    x{it.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={isCollected}
          onClick={() => {
            onCollectLoot?.(msg.lootReward!, msg.id);
            setCollectedLootIds((prev) => new Set(prev).add(msg.id));
          }}
          className={`w-full py-1.5 px-3 rounded font-serif font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer ${
            isCollected
              ? 'bg-stone-800 text-stone-400 cursor-not-allowed border border-stone-600'
              : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 border border-amber-400'
          }`}
        >
          {isCollected ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Tesouro Guardado na Mochila</span>
            </>
          ) : (
            <>
              <PackagePlus size={13} />
              <span>Coletar Tesouro para a Ficha</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="tabletop-parchment flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
      {/* Cabeçalho de Grimório Arcano */}
      <div className="tabletop-parchment-header px-3.5 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <ScrollText size={17} className="text-amber-400" />
          <h2 className="font-serif font-black text-xs sm:text-sm tracking-wider uppercase text-amber-200">
            Crônica da Aventura
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCampaignMemoryOpen(true)}
            className="text-[10px] font-serif font-bold text-amber-300 hover:text-amber-100 bg-amber-950/60 hover:bg-amber-900/80 px-2.5 py-1 rounded-md border border-amber-600/40 flex items-center gap-1 transition shadow-xs cursor-pointer"
            title="Visualizar e gerenciar a Memória de Longo Prazo da Campanha"
          >
            <BookOpen size={11} className="text-amber-400" />
            <span>Memória IA</span>
          </button>
          <span className="text-[10px] font-serif font-bold text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-600/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Mestre IA
          </span>
          {onOpenEndSessionModal && (
            <button
              type="button"
              onClick={onOpenEndSessionModal}
              className="text-[10px] font-serif font-bold text-red-300 hover:text-red-100 bg-red-950/60 hover:bg-red-900/80 px-2.5 py-1 rounded-md border border-red-600/40 flex items-center gap-1 transition shadow-xs cursor-pointer"
              title="Finalizar esta mesa ou iniciar outra aventura"
            >
              <RotateCcw size={11} className="text-red-400" />
              <span>Nova Mesa</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── CARD DE SALVAGUARDA CONTRA A MORTE (0 PV) ─── */}
      {character && character.currentHp <= 0 && (
        <div className="mx-3 mt-2 p-3 bg-red-950/95 border-2 border-red-600 rounded-xl text-red-100 shadow-xl select-none animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skull className="text-red-400 animate-pulse" size={18} />
              <span className="font-serif font-black text-xs uppercase tracking-wider text-red-200">
                Salvaguardas contra a Morte (0 PV)
              </span>
            </div>
            <span className="text-[10px] text-red-300 font-serif font-bold italic">
              {(character.deathSaves?.failures || 0) >= 3
                ? '💀 Morto'
                : (character.deathSaves?.successes || 0) >= 3
                ? '✨ Estabilizado'
                : 'Inconsciente & Agonizando'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-black/50 rounded-lg border border-red-800/60 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-400">Sucessos:</span>
              {[0, 1, 2].map((idx) => {
                const filled = idx < (character.deathSaves?.successes || 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const curr = character.deathSaves?.successes || 0;
                      const next = idx < curr ? idx : idx + 1;
                      onUpdateCharacter?.({
                        deathSaves: {
                          successes: next,
                          failures: character.deathSaves?.failures || 0,
                        },
                      });
                    }}
                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                      filled
                        ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : 'border-emerald-700/60 bg-emerald-950/40'
                    }`}
                    title={`Sucesso ${idx + 1}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-400">Falhas:</span>
              {[0, 1, 2].map((idx) => {
                const filled = idx < (character.deathSaves?.failures || 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const curr = character.deathSaves?.failures || 0;
                      const next = idx < curr ? idx : idx + 1;
                      onUpdateCharacter?.({
                        deathSaves: {
                          successes: character.deathSaves?.successes || 0,
                          failures: next,
                        },
                      });
                    }}
                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                      filled
                        ? 'bg-rose-600 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : 'border-rose-700/60 bg-rose-950/40'
                    }`}
                    title={`Falha ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>

          {(character.deathSaves?.failures || 0) < 3 && (character.deathSaves?.successes || 0) < 3 && (
            <button
              type="button"
              onClick={handleRollDeathSave}
              className="w-full py-1.5 px-3 rounded bg-red-800 hover:bg-red-700 border border-red-500 font-serif font-bold text-xs text-white flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <Dices size={14} />
              <span>Rolar Salvaguarda contra a Morte (1d20)</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Banner de Combate D&D 5e (Iniciativa e Turnos) */}
      {isCombatActive && activeCombatant && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-slate-900/95 border border-amber-600/40 shadow-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isMyTurn ? 'bg-emerald-500 animate-ping' : isMonsterTurn ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div className="truncate">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 leading-tight">
                ⚔️ Combate D&D 5e · Rodada {encounter?.round ?? 1}
              </div>
              <div className="text-xs font-serif font-black text-amber-100 truncate">
                Turno Atual:{' '}
                <span className={isMyTurn ? 'text-emerald-400 underline font-bold' : isMonsterTurn ? 'text-rose-400' : 'text-amber-300'}>
                  {activeCombatant.name}
                </span>{' '}
                <span className="text-[10px] font-mono font-bold text-amber-400/80">
                  (Inic. {activeCombatant.initiative})
                </span>
              </div>
            </div>
          </div>

          {isMyTurn && onNextTurn && (
            <button
              type="button"
              onClick={() => {
                onSendMessage(`⚔️ ${currentUserName} finalizou o seu turno de combate.`, currentUserName);
                onNextTurn();
              }}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] py-1.5 px-3 rounded-lg shadow flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer transition"
              title="Passar a vez para o próximo combatente da iniciativa"
            >
              <span>Finalizar Turno</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Corpo do Log de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-serif text-xs select-text">
        {chatLog.length === 0 ? (
          <div className="h-full flex flex-col justify-start p-4 space-y-3.5 text-amber-950 overflow-y-auto">
            <div className="text-center space-y-1 py-1.5 border-b border-amber-900/20">
              <div className="inline-flex items-center justify-center p-2 rounded-full bg-amber-900/10 text-amber-900 mb-0.5">
                <ScrollText size={22} />
              </div>
              <h3 className="font-serif font-black text-sm text-amber-950 uppercase tracking-wide">
                Aventura Solo no Mapa Tático
              </h3>
              <p className="text-[11px] text-amber-900/80 leading-relaxed max-w-xs mx-auto">
                Escolha um cenário para o Mestre IA carregar o mapa tático, posicionar as miniaturas e narrar o prólogo:
              </p>
            </div>

            {onStartScenario && (
              <div className="space-y-2">
                {AI_ADVENTURE_SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => onStartScenario(scen)}
                    className="w-full text-left p-2.5 rounded-lg bg-amber-900/5 hover:bg-amber-900/15 border border-amber-900/20 hover:border-amber-900/40 transition group shadow-xs cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-xs text-amber-950 group-hover:text-amber-900 flex items-center gap-1.5">
                        <span className="text-base">{scen.icon}</span>
                        <span>{scen.title}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-900/10 text-amber-900 border border-amber-900/20 flex items-center gap-1">
                        <Swords size={10} />
                        <span>Jogar</span>
                      </span>
                    </div>
                    <p className="text-[10.5px] text-amber-900/70 line-clamp-2 leading-tight">
                      {scen.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="text-center pt-2 text-[11px] text-amber-900/60 space-y-1 border-t border-amber-900/10">
              <p>
                Ou digite <code className="font-bold bg-amber-900/10 px-1 py-0.5 rounded text-amber-950">@mestre</code> abaixo para iniciar uma história livre.
              </p>
            </div>
          </div>
        ) : (
          chatLog.map((msg) => {
            const isAi = msg.type === 'AI_DM' || msg.senderName.includes('IA');
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (isAi) {
              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-slate-900/95 border border-amber-600/35 shadow-md space-y-2 text-slate-200 animate-in fade-in"
                >
                  {/* Cabeçalho do Mestre IA */}
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                    <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>{msg.senderName}</span>
                    </div>
                    <span className="text-[10px] text-amber-400/60 font-mono">[{timeStr}]</span>
                  </div>

                  {/* Texto Narrativo */}
                  <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-amber-50 font-serif">
                    {msg.text}
                  </div>

                  {/* Teste Solicitado */}
                  {msg.requestedRoll && (
                    <div className="mt-2.5 p-2 bg-slate-950/80 rounded-lg border border-amber-500/40 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-amber-200 font-bold text-[11px]">
                        <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                        <span>
                          Teste: {msg.requestedRoll.skillOrAbility}{' '}
                          {msg.requestedRoll.dc ? `(CD ${msg.requestedRoll.dc})` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRollRequested(msg.requestedRoll!)}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] py-1 px-3 rounded shadow cursor-pointer transition active:scale-95"
                      >
                        <Dices size={12} />
                        <span>Rolar</span>
                      </button>
                    </div>
                  )}

                  {/* Ações Sugeridas */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                          {isCombatActive
                            ? isMyTurn
                              ? '⚔️ Seu Turno — Opções de Ação:'
                              : isOtherPlayerTurn
                              ? `⏳ Turno de ${activeCombatant?.name} — Opções:`
                              : `👹 Turno de ${activeCombatant?.name} — Opções:`
                            : 'Opções Sugeridas:'}
                        </span>
                        {isCombatActive && isOtherPlayerTurn && (
                          <span className="text-[9px] text-amber-400/80 font-mono italic">
                            Aguardando iniciativa
                          </span>
                        )}
                      </div>

                      {isCombatActive && isOtherPlayerTurn && (
                        <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-amber-200/80 italic">
                          ⏳ É a vez de <strong>{activeCombatant?.name}</strong> agir segundo a ordem de iniciativa D&D 5e.
                        </div>
                      )}

                      {isCombatActive && isMonsterTurn && (
                        <div className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-[10px] text-rose-300 italic">
                          👹 <strong>{activeCombatant?.name}</strong> está executando sua ação com o Mestre IA.
                        </div>
                      )}

                      <div className="space-y-1">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isCombatActive && !isMyTurn}
                            onClick={() => {
                              if (isCombatActive && !isMyTurn) return;
                              const actLower = act.toLowerCase();
                              const isMoveOrAttack =
                                /avan[çc]ar|flanquear|atacar|aproximar|investir|esgueirar|golpear|correr|bloquear|decapitar|finalizar|miseric[oó]rdia/i.test(actLower);

                              const isFinishingBlow =
                                /miseric[oó]rdia|decapitar|finalizar|executar|abater|degolar|acabar com/i.test(actLower);

                              if (isFinishingBlow && encounter && onHpDelta) {
                                const monsterCandidates = encounter.combatants.filter(
                                  (c) => (c.type === 'monster' || c.type === 'npc') && c.currentHp > 0
                                );
                                let targetMonster = monsterCandidates.find((m) => {
                                  const cName = m.name.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
                                  const cBase = cName.replace(/\s*\d+$/, '').trim();
                                  return actLower.includes(cName) || (cBase.length >= 3 && actLower.includes(cBase));
                                });
                                if (!targetMonster && monsterCandidates.length > 0) {
                                  targetMonster = [...monsterCandidates].sort((a, b) => a.currentHp - b.currentHp)[0];
                                }
                                if (targetMonster) {
                                  onHpDelta(targetMonster.id, -targetMonster.currentHp);
                                }
                              }

                              if (isMoveOrAttack && tokens && onMoveToken) {
                                const playerToken = tokens.find(
                                  (t) =>
                                    (character?.id && t.id === character.id) ||
                                    t.name.toLowerCase() === (character?.name || '').toLowerCase() ||
                                    t.name.toLowerCase() === currentUserName.toLowerCase() ||
                                    t.type === 'player'
                                );
                                const targetToken =
                                  tokens.find((t) => {
                                    if (t.type !== 'monster' || (t.currentHp ?? 1) <= 0) return false;
                                    const tClean = t.name.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
                                    const tBase = tClean.replace(/\s*\d+$/, '').trim();
                                    return actLower.includes(tClean) || (tBase.length >= 3 && actLower.includes(tBase));
                                  }) || tokens.find((t) => t.type === 'monster' && (t.currentHp ?? 1) > 0);

                                if (playerToken && targetToken && playerToken.id !== targetToken.id) {
                                  const dx = targetToken.x - playerToken.x;
                                  const dy = targetToken.y - playerToken.y;
                                  const dist = Math.hypot(dx, dy);
                                  if (dist > 55) {
                                    let targetX = targetToken.x;
                                    let targetY = targetToken.y;
                                    if (Math.abs(dx) >= Math.abs(dy)) {
                                      targetX += dx > 0 ? -50 : 50;
                                    } else {
                                      targetY += dy > 0 ? -50 : 50;
                                    }
                                    onMoveToken(playerToken.id, Math.max(0, targetX), Math.max(0, targetY));
                                  }
                                }
                              }
                              onSendMessage(`@mestre Escolho: ${act}`, currentUserName);
                            }}
                            className={`w-full text-left p-2 rounded-lg border text-[11px] font-medium transition flex items-center gap-2 shadow-xs ${
                              isCombatActive && !isMyTurn
                                ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                : 'bg-[#161b27] hover:bg-[#202738] border-amber-500/30 hover:border-amber-400 text-amber-100 cursor-pointer active:scale-98 shadow-sm'
                            }`}
                            title={
                              isCombatActive && !isMyTurn
                                ? `Aguardando a vez de ${activeCombatant?.name} na iniciativa`
                                : undefined
                            }
                          >
                            <ArrowRight size={11} className={isCombatActive && !isMyTurn ? 'text-slate-600 shrink-0' : 'text-amber-400 shrink-0'} />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>

                      {/* Botão de Finalizar Turno para o Jogador Ativo */}
                      {isCombatActive && isMyTurn && onNextTurn && (
                        <button
                          type="button"
                          onClick={() => {
                            onSendMessage(`⚔️ ${currentUserName} concluiu o seu turno no combate.`, currentUserName);
                            onNextTurn();
                          }}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-98"
                          title="Finalizar turno e passar para o próximo combatente na iniciativa"
                        >
                          <span>⚔️ Finalizar Meu Turno</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Baú de Loot / Tesouro Interativo */}
                  {renderLootCard(msg)}
                </div>
              );
            }

            // Mensagem de Jogador ou Sistema
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300">
                    {msg.senderName}:
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">[{timeStr}]</span>
                </div>

                <div className="text-[11px] leading-snug break-words text-slate-200">
                  {msg.text}
                </div>

                {/* Badge de Rolagem Inline */}
                {msg.diceRoll && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="dice-hex-badge">
                      <Dices size={10} className="text-amber-400" />
                      <span className="dice-val">{msg.diceRoll.total}</span>
                      <span className="dice-mod font-sans">({msg.diceRoll.breakdown})</span>
                    </span>
                    <span className="text-[10px] text-amber-300/80 font-bold italic">
                      {msg.diceRoll.label}
                    </span>
                  </div>
                )}

                {/* Baú de Loot / Tesouro Interativo */}
                {renderLootCard(msg)}
              </div>
            );
          })
        )}

        {/* Indicador de Carregamento da IA */}
        {isAiResponding && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-2 text-amber-200 text-xs animate-pulse shadow-md">
            <Loader2 size={16} className="animate-spin text-amber-400 shrink-0" />
            <span className="font-serif italic">
              O Mestre Supremo (IA) está consultando os pergaminhos...
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950/95 border-t border-slate-800 space-y-2 select-none">
        {/* Barra de Atalhos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
          {/* Seletor de Vantagem / Normal / Desvantagem */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setAdvantageMode('advantage')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                advantageMode === 'advantage'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rolar com Vantagem (2d20 - escolhe o maior)"
            >
              Vantagem
            </button>
            <button
              type="button"
              onClick={() => setAdvantageMode('normal')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                advantageMode === 'normal'
                  ? 'bg-amber-600 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rolagem Normal (1d20)"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setAdvantageMode('disadvantage')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                advantageMode === 'disadvantage'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rolar com Desvantagem (2d20 - escolhe o menor)"
            >
              Desvantagem
            </button>
          </div>

          <button
            type="button"
            onClick={() => setInputText((prev) => (prev.startsWith('@mestre ') ? prev : `@mestre ${prev}`))}
            className="px-2 py-1 rounded-md bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 shrink-0 shadow-xs cursor-pointer transition"
          >
            <Sparkles size={11} />
            <span>@mestre (IA)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 shrink-0 transition shadow-xs cursor-pointer border ${
              isSecretMode
                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Rolagem secreta visível apenas pelo mestre"
          >
            <Lock size={11} />
            <span>Secreta ({isSecretMode ? 'On' : 'Off'})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isSecretMode
                ? 'Rolagem secreta (ex: 1d20+5)...'
                : 'Digite uma fala ou @mestre [sua ação]...'
            }
            className="flex-1 py-1.5 px-3 text-xs bg-slate-900/90 text-amber-100 placeholder-slate-500 border border-slate-700/80 focus:border-amber-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif"
          />
          <button
            type="submit"
            disabled={isAiResponding}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg font-bold disabled:opacity-50 shadow cursor-pointer transition flex items-center justify-center shrink-0 active:scale-95"
            title="Enviar mensagem"
          >
            <Send size={13} />
          </button>
        </div>
      </form>

      {/* Modal de Memória da Campanha */}
      {isCampaignMemoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="tabletop-parchment w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border-2 border-amber-600/70 p-4 space-y-3 bg-[#111520] text-slate-200">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="text-amber-400" size={18} />
                <h3 className="font-serif font-black text-sm uppercase text-amber-200">
                  Memória de Longo Prazo da Campanha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCampaignMemoryOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-2 py-0.5 rounded cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-serif">
              Este resumo é injetado diretamente no cérebro do Mestre IA a cada turno para manter coerência contínua entre sessões, lembrando de inimigos abatidos, aliados, itens conquistados e objetivos imediatos.
            </p>

            <textarea
              value={campaignSummaryText}
              onChange={(e) => setCampaignSummaryText(e.target.value)}
              rows={6}
              placeholder="Nenhum resumo da campanha registrado ainda. Clique em 'Sintetizar com IA' ou digite os fatos marcantes da aventura..."
              className="w-full text-xs p-2.5 rounded-lg bg-slate-900/90 text-amber-100 placeholder-slate-500 border border-slate-700 font-serif focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={isSynthesizingMemory}
                onClick={handleSynthesizeMemory}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer disabled:opacity-50"
              >
                {isSynthesizingMemory ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-amber-300" />
                    <span>Sintetizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-yellow-300" />
                    <span>Sintetizar com IA</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveStoredCampaignSummary(campaignSummaryText);
                    setIsCampaignMemoryOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow cursor-pointer"
                >
                  Salvar Memória
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
