import React from 'react';
import type { Encounter, ConditionKey } from '../../types/combat';
import type { Character } from '../../types/dnd5e';
import { CombatantCard } from './CombatantCard';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Dices, 
  ArrowDownUp, 
  Users, 
  BookOpen, 
  UserPlus, 
  Sparkles,
  Trophy,
  Swords
} from 'lucide-react';
import { calculateEncounterDifficulty } from '../../utils/encounterDifficulty';

interface InitiativeTrackerProps {
  encounter: Encounter;
  charactersList: Character[];
  onStartEncounter: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onRollAllMonsters: () => void;
  onSortInitiative: () => void;
  onImportPlayers: (characters: Character[]) => void;
  onOpenBestiary: () => void;
  onOpenCustomMonster: () => void;
  onResetEncounter: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onUndoLastHpChange: () => void;
  onToggleCondition: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative: (id: string, init: number) => void;
  onRemoveCombatant: (id: string) => void;
  onRollMonsterAttack: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollMonsterDamage: (monsterName: string, actionName: string, formula: string) => void;
}

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
  encounter,
  charactersList,
  onStartEncounter,
  onNextTurn,
  onPreviousTurn,
  onRollAllMonsters,
  onSortInitiative,
  onImportPlayers,
  onOpenBestiary,
  onOpenCustomMonster,
  onResetEncounter,
  onHpDelta,
  onUndoLastHpChange,
  onToggleCondition,
  onUpdateInitiative,
  onRemoveCombatant,
  onRollMonsterAttack,
  onRollMonsterDamage,
}) => {
  const activeCombatant = encounter.activeCombatantId
    ? encounter.combatants.find((c) => c.id === encounter.activeCombatantId) || encounter.combatants[encounter.activeCombatantIndex]
    : encounter.combatants[encounter.activeCombatantIndex];
  const activeCharacter = activeCombatant?.playerId ? charactersList.find((ch) => ch.id === activeCombatant.playerId) : undefined;

  // Cálculo Oficial de Dificuldade (D&D 5e)
  const playerCombatants = encounter.combatants
    .filter((c) => c.type === 'player')
    .map((c) => {
      const char = charactersList.find((ch) => ch.id === c.playerId || ch.name === c.name);
      return { level: char?.level || 1 };
    });

  const monsterCombatants = encounter.combatants
    .filter((c) => c.type === 'monster')
    .map((c) => ({
      cr: c.monsterData?.challengeRating || '1/4',
      xp: c.monsterData?.xp,
    }));

  const difficultyResult = calculateEncounterDifficulty(
    playerCombatants.length > 0 ? playerCombatants : [{ level: 1 }],
    monsterCombatants
  );

  const totalXp = difficultyResult.totalMonsterXp;
  const aliveMonsters = encounter.combatants.filter((c) => c.type === 'monster' && c.currentHp > 0).length;
  const alivePlayers = encounter.combatants.filter((c) => c.type === 'player' && c.currentHp > 0).length;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Painel de Controle Superior de Rodadas & Turnos */}
      <div className="rpg-card rounded-2xl p-4 sm:p-5 border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Esquerdo: Rodada & Turno Atual */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rodada</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-amber-300">
                {encounter.round}
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Sparkles size={13} className="text-amber-400" />
                <span>
                  Turno {encounter.combatants.length > 0 ? encounter.activeCombatantIndex + 1 : 0} de {encounter.combatants.length}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                {activeCombatant ? (
                  <>
                    <span>Vez de:</span>
                    <span className="text-amber-300 underline decoration-amber-500/50">
                      {activeCombatant.name}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 italic">Nenhum combatente na mesa</span>
                )}
              </h2>
              {activeCombatant && (
                <div
                  className="flex flex-wrap items-center gap-1.5 mt-1.5"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {activeCombatant.currentHp <= 0 && (
                    <span
                      role="alert"
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        activeCombatant.type === 'player'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-600/70 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {activeCombatant.type === 'player'
                        ? '💀 0 PV — Salvaguarda contra a Morte pendente'
                        : '💀 0 PV — Monstro Derrotado'}
                    </span>
                  )}
                  {activeCombatant.conditions
                    .filter((c) => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(c))
                    .map((c) => (
                      <span
                        key={c}
                        role="alert"
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-200 border border-purple-600/60"
                      >
                        ⚠️ {c} (Incapaz de agir)
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Botões de Navegação de Turno */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {!encounter.isRunning ? (
              <button
                type="button"
                onClick={onStartEncounter}
                disabled={encounter.combatants.length === 0}
                className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40 w-full sm:w-auto min-h-[44px] justify-center"
              >
                <Play size={14} fill="currentColor" />
                <span>Iniciar Combate</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPreviousTurn}
                  className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-2 px-3 flex-1 sm:flex-none justify-center min-h-[44px]"
                  title="Turno anterior"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={onNextTurn}
                  className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 shadow-lg shadow-amber-500/20 flex-1 sm:flex-none justify-center min-h-[44px]"
                  title="Avançar para o próximo turno"
                >
                  <span>Próximo Turno</span>
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja realmente reiniciar o encontro de combate?')) {
                  onResetEncounter();
                }
              }}
              className="rpg-button bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs py-2 px-3 min-h-[44px] shrink-0"
              title="Resetar combate e limpar participantes"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Barra de Ações Rápidas do Mestre */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onOpenBestiary}
            className="rpg-button bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs justify-center min-h-[40px]"
          >
            <BookOpen size={14} />
            <span>Bestiário SRD</span>
          </button>

          <button
            type="button"
            onClick={() => onImportPlayers(charactersList)}
            className="rpg-button bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs justify-center min-h-[40px]"
            title="Importa fichas de personagens ativas para o rastreador"
          >
            <Users size={14} />
            <span>Importar ({charactersList.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomMonster}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs justify-center min-h-[40px]"
          >
            <UserPlus size={14} />
            <span>Criar Monstro</span>
          </button>

          <button
            type="button"
            onClick={onRollAllMonsters}
            disabled={encounter.combatants.filter((c) => c.type === 'monster').length === 0}
            className="rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs disabled:opacity-40 justify-center min-h-[40px]"
            title="Rola d20 + DES para todos os monstros automaticamente"
          >
            <Dices size={14} />
            <span className="truncate">Rolar Monstros</span>
          </button>

          <button
            type="button"
            onClick={onSortInitiative}
            disabled={encounter.combatants.length < 2}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs disabled:opacity-40 justify-center min-h-[40px]"
            title="Reordenar participantes por valor de iniciativa decrescente (com desempate oficial por Destreza, tipo e ID)"
          >
            <ArrowDownUp size={14} />
            <span>Ordenar</span>
          </button>

          {/* Dificuldade Oficial D&D 5e e Resumo de XP */}
          {encounter.combatants.some((c) => c.type === 'monster') && (
            <div className="col-span-2 sm:col-span-1 sm:ml-auto w-full sm:w-auto flex items-center justify-center sm:justify-start">
              <div
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow w-full sm:w-auto min-h-[38px] ${
                  difficultyResult.difficulty === 'deadly'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 shadow-rose-950/50 animate-pulse'
                    : difficultyResult.difficulty === 'hard'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                    : difficultyResult.difficulty === 'medium'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/60'
                    : difficultyResult.difficulty === 'easy'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title={`Dificuldade calculada para ${difficultyResult.playerCount} jogador(es): XP Ajustado ${difficultyResult.adjustedXp} (Limites: Fácil ${difficultyResult.partyThresholds.easy}, Médio ${difficultyResult.partyThresholds.medium}, Difícil ${difficultyResult.partyThresholds.hard}, Mortal ${difficultyResult.partyThresholds.deadly})`}
              >
                <Swords size={13} />
                <span>{difficultyResult.difficultyLabel}</span>
                <span className="text-[10px] opacity-75 font-mono">({difficultyResult.adjustedXp} XP Aj.)</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 font-mono">
                <Trophy size={13} />
                <span className="font-bold">{totalXp} XP</span>
                <span className="text-[10px] text-slate-400">({difficultyResult.xpPerPlayer}/jogador)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeCombatant && encounter.isRunning && (
        <aside aria-live="polite" className="rounded-xl border border-sky-500/30 bg-sky-950/20 px-4 py-3 text-sm">
          <strong className="text-sky-200">Lembrete do turno de {activeCombatant.name}:</strong>
          <span className="ml-2 text-slate-300">{activeCombatant.conditions.length ? `Condições: ${activeCombatant.conditions.join(', ')}.` : 'Sem condições registradas.'}</span>
          {activeCharacter?.resources?.length ? <ul className="mt-2 flex flex-wrap gap-2">{activeCharacter.resources.map((resource) => <li key={resource.id} className="rounded-lg bg-slate-900 px-2 py-1 text-xs text-amber-200">{resource.name}: {resource.current}/{resource.max}</li>)}</ul> : activeCombatant.type === 'player' ? <p className="mt-1 text-xs text-slate-400">Nenhum recurso de classe cadastrado nesta ficha.</p> : null}
        </aside>
      )}

      {(encounter.actionLog?.length || 0) > 0 && (
        <section aria-labelledby="combat-log-title" className="rpg-card rounded-2xl border-slate-700/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 id="combat-log-title" className="font-serif font-bold text-amber-200">Registro recente do combate</h3>
            {encounter.lastHpChange && <button type="button" onClick={onUndoLastHpChange} className="min-h-10 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-bold text-amber-200">Desfazer última alteração de PV</button>}
          </div>
          <ol className="max-h-40 space-y-2 overflow-y-auto text-xs text-slate-300" aria-live="polite">
            {encounter.actionLog?.slice(0, 8).map((entry) => <li key={entry.id} className="flex gap-2 border-l-2 border-slate-700 pl-2"><time className="shrink-0 text-slate-500">R{entry.round}</time><span>{entry.message}</span><span className="ml-auto shrink-0 text-slate-500">{entry.actor}</span></li>)}
          </ol>
        </section>
      )}

      {/* 2. Lista de Combatentes */}
      <div className="flex flex-col gap-3">
        {encounter.combatants.length === 0 ? (
          <div className="rpg-card rounded-2xl p-10 text-center border-slate-800 flex flex-col items-center gap-3">
            <BookOpen size={36} className="text-slate-600 stroke-1" />
            <h3 className="text-base font-serif font-bold text-slate-300">
              Nenhum combatente ativo no rastreador de iniciativa
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Adicione monstros a partir do <strong>Bestiário SRD</strong>, importe a ficha do herói clicando em <strong>Importar Jogadores</strong>, ou crie um NPC personalizado para começar a batalha!
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={onOpenBestiary}
                className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4"
              >
                <BookOpen size={14} />
                <span>Explorar Bestiário</span>
              </button>
              <button
                type="button"
                onClick={() => onImportPlayers(charactersList)}
                className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-2 px-4"
              >
                <Users size={14} />
                <span>Importar Jogadores</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
              <span>Ordem de Turnos (Total: {encounter.combatants.length})</span>
              <span>Jogadores Vivos: {alivePlayers} • Inimigos: {aliveMonsters}</span>
            </div>

            {encounter.combatants.map((combatant, idx) => (
              <CombatantCard
                key={combatant.id}
                combatant={combatant}
                isActive={encounter.isRunning && idx === encounter.activeCombatantIndex}
                onHpDelta={(delta) => onHpDelta(combatant.id, delta)}
                onToggleCondition={(cond) => onToggleCondition(combatant.id, cond)}
                onUpdateInitiative={(init) => onUpdateInitiative(combatant.id, init)}
                onRemove={() => onRemoveCombatant(combatant.id)}
                onRollMonsterAttack={onRollMonsterAttack}
                onRollMonsterDamage={onRollMonsterDamage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
