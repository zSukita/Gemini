import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatMessageType } from '../../types/chat';
import type { Character, DiceRollResult, SkillKey, AbilityKey } from '../../types/dnd5e';
import type { Encounter } from '../../types/combat';
import { SKILLS, ABILITIES } from '../../types/dnd5e';
import { rollFormula } from '../../utils/diceRoller';
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
  Swords
} from 'lucide-react';
import { AI_ADVENTURE_SCENARIOS, type AiAdventureScenario } from '../../data/aiAdventureScenarios';

interface TabletopParchmentChatProps {
  chatLog: ChatMessage[];
  currentUserName: string;
  character?: Character | null;
  isAiResponding?: boolean;
  encounter?: Encounter;
  onHpDelta?: (combatantId: string, delta: number) => void;
  onOpenEndSessionModal?: () => void;
  onStartScenario?: (scenario: AiAdventureScenario) => void;
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
  onHpDelta,
  onOpenEndSessionModal,
  onStartScenario,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isAiResponding]);

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

    const rollRes = rollFormula(formula, label);
    const dcInfo = req.dc ? ` (vs ${isAttack ? 'CA' : 'CD'} ${req.dc})` : '';

    // Resolução Completa de Ataque D&D 5e com Acerto/Erro, Dano e Redução de PV
    if (isAttack && req.dc) {
      const natural = rollRes.rolls?.[0] ?? rollRes.selectedRoll;
      const isCritHit = Boolean(rollRes.isCriticalSuccess || natural === 20);
      const isCritMiss = Boolean(rollRes.isCriticalFailure || natural === 1);
      const isHit = isCritHit || (!isCritMiss && rollRes.total >= req.dc);

      // Localiza o monstro alvo nos combatentes ativos
      const monsterCandidates = encounter?.combatants.filter((c) => c.type === 'monster' && c.currentHp > 0) || [];
      const reasonLower = req.reason.toLowerCase();
      const skillLower = req.skillOrAbility.toLowerCase();

      let targetMonster = monsterCandidates.find(
        (m) => reasonLower.includes(m.name.toLowerCase()) || skillLower.includes(m.name.toLowerCase())
      );
      if (!targetMonster && monsterCandidates.length > 0) {
        targetMonster = monsterCandidates[0];
      }

      const targetDisplayName = targetMonster?.name || 'o Inimigo';

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

        const newHp = targetMonster ? Math.max(0, targetMonster.currentHp - damageVal) : undefined;
        const isDefeated = newHp !== undefined && newHp <= 0;
        const hitStatus = isCritHit ? '💥 ACERTO CRÍTICO!' : '🎯 ACERTOU!';

        const hitAnnouncement = `${hitStatus} [${rollRes.breakdown}] = ${rollRes.total} (vs CA ${req.dc})\n` +
          `⚔️ **Dano (${finalDamageFormula}):** [${dmgRoll.breakdown}] = **${damageVal} de dano** em **${targetDisplayName}**!\n` +
          (targetMonster ? `🩸 **${targetDisplayName}** agora possui **${newHp}/${targetMonster.maxHp} PV** ${isDefeated ? '💀 (**DERROTADO!**)' : ''}` : '');

        const promptText = `@mestre Ataque realizado com ${req.skillOrAbility}: ${hitStatus} com resultado ${rollRes.total} (vs CA ${req.dc}) causando ${damageVal} de dano. ` +
          (targetMonster ? `O monstro ${targetDisplayName} ficou com ${newHp}/${targetMonster.maxHp} PV ${isDefeated ? 'e caiu derrotado em combate!' : 'e continua em combate.'} ` : '') +
          `Descreva cinematograficamente o impacto do golpe e a reação do monstro.`;

        onSendMessage(
          {
            text: `${hitAnnouncement}\n\n${promptText}`,
            senderName: character?.name || currentUserName || 'Aventureiro',
            type: 'PUBLIC',
            diceRoll: rollRes,
          },
          currentUserName
        );
        return;
      } else {
        // Ataque Errou (Miss)
        const missStatus = isCritMiss ? '💨 FALHA CRÍTICA (1 natural - Erro Automático)!' : '❌ ERROU!';
        const missAnnouncement = `${missStatus} [${rollRes.breakdown}] = ${rollRes.total} (vs CA ${req.dc}). O ataque não conseguiu superar a defesa de ${targetDisplayName}.`;
        const promptText = `@mestre Ataque realizado com ${req.skillOrAbility}: ${missStatus} com resultado ${rollRes.total} (vs CA ${req.dc}). O golpe não acertou ${targetDisplayName}. Descreva a esquiva ou defesa do adversário.`;

        onSendMessage(
          {
            text: `${missAnnouncement}\n\n${promptText}`,
            senderName: character?.name || currentUserName || 'Aventureiro',
            type: 'PUBLIC',
            diceRoll: rollRes,
          },
          currentUserName
        );
        return;
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

  return (
    <div className="tabletop-parchment flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
      {/* Cabeçalho de Pergaminho */}
      <div className="tabletop-parchment-header px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-amber-900" />
          <h2 className="font-serif font-black text-sm tracking-wider uppercase text-amber-950">
            Crônica da Aventura
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-serif font-bold text-amber-900/80 bg-amber-900/10 px-2 py-0.5 rounded border border-amber-900/20">
            Mestre IA Ativo
          </span>
          {onOpenEndSessionModal && (
            <button
              type="button"
              onClick={onOpenEndSessionModal}
              className="text-[10px] font-serif font-bold text-red-950 hover:text-red-900 bg-red-900/10 hover:bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30 flex items-center gap-1 transition shadow-xs"
              title="Finalizar esta mesa ou iniciar outra aventura"
            >
              <RotateCcw size={10} />
              <span>Nova Mesa</span>
            </button>
          )}
        </div>
      </div>

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
                  className="p-3.5 rounded-lg bg-[#faeed8] border-2 border-[#b89569] shadow-sm space-y-2 text-[#2d1e10]"
                >
                  {/* Cabeçalho do Mestre IA */}
                  <div className="flex items-center justify-between border-b border-[#cfb28d] pb-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                      <Sparkles size={14} className="text-amber-700" />
                      <span>{msg.senderName}</span>
                    </div>
                    <span className="text-[10px] text-amber-900/60 font-mono">[{timeStr}]</span>
                  </div>

                  {/* Texto Narrativo */}
                  <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-[#26170a] font-serif">
                    {msg.text}
                  </div>

                  {/* Teste Solicitado */}
                  {msg.requestedRoll && (
                    <div className="mt-2.5 p-2 bg-[#f0deb9] rounded-md border border-[#c4a275] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold text-[11px]">
                        <ShieldAlert size={14} className="text-amber-800 shrink-0" />
                        <span>
                          Teste: {msg.requestedRoll.skillOrAbility}{' '}
                          {msg.requestedRoll.dc ? `(CD ${msg.requestedRoll.dc})` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRollRequested(msg.requestedRoll!)}
                        className="rpg-button bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold text-[10px] py-1 px-2.5 rounded shadow"
                      >
                        <Dices size={12} />
                        <span>Rolar</span>
                      </button>
                    </div>
                  )}

                  {/* Ações Sugeridas */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">
                        Opções Sugeridas:
                      </span>
                      <div className="space-y-1">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onSendMessage(`@mestre Escolho: ${act}`, currentUserName)}
                            className="w-full text-left p-1.5 rounded bg-[#f0e3c5] hover:bg-[#e4d1aa] border border-[#cfb48c] text-[11px] text-amber-950 font-medium transition flex items-center gap-1.5 shadow-xs"
                          >
                            <ArrowRight size={11} className="text-amber-800 shrink-0" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Mensagem de Jogador ou Sistema
            return (
              <div
                key={msg.id}
                className="p-2.5 rounded-lg bg-[#faf4e6]/90 border border-[#d8c3a2] text-[#2c1b0c] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950">
                    {msg.senderName}:
                  </span>
                  <span className="text-[10px] text-amber-900/60 font-mono">[{timeStr}]</span>
                </div>

                <div className="text-[11px] leading-snug break-words">
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
                    <span className="text-[10px] text-amber-900 font-bold italic">
                      {msg.diceRoll.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Indicador de Carregamento da IA */}
        {isAiResponding && (
          <div className="p-3 rounded-lg bg-[#faeed8] border-2 border-[#b89569] flex items-center gap-2 text-amber-950 text-xs animate-pulse">
            <Loader2 size={16} className="animate-spin text-amber-800 shrink-0" />
            <span className="font-serif italic">
              O Mestre Supremo (IA) está consultando os pergaminhos...
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#dfd0b5] border-t-2 border-[#8a6840] space-y-1.5">
        {/* Barra de Atalhos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setInputText((prev) => (prev.startsWith('@mestre ') ? prev : `@mestre ${prev}`))}
            className="px-2 py-0.5 rounded bg-amber-800 hover:bg-amber-900 text-amber-100 font-bold flex items-center gap-1 shrink-0 shadow-xs"
          >
            <Sparkles size={10} />
            <span>@mestre (IA)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 shrink-0 transition shadow-xs ${
              isSecretMode
                ? 'bg-red-800 text-white'
                : 'bg-[#cbbb9e] text-amber-950 hover:bg-[#b8a584]'
            }`}
            title="Rolagem secreta visível apenas pelo mestre"
          >
            <Lock size={10} />
            <span>Rolagem Secreta ({isSecretMode ? 'On' : 'Off'})</span>
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
            className="flex-1 py-1.5 px-2.5 text-xs bg-[#f8f2e2] text-[#2c1c0d] placeholder-[#8c7457] border border-[#9b784f] rounded focus:outline-none focus:ring-1 focus:ring-amber-700 font-serif"
          />
          <button
            type="submit"
            disabled={isAiResponding}
            className="rpg-button bg-amber-800 hover:bg-amber-900 text-amber-100 px-3 py-1.5 font-bold disabled:opacity-50 shadow"
            title="Enviar mensagem"
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  );
};
