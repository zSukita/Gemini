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
  onToggleCondition,
  onUpdateInitiative,
  onRemoveCombatant,
  onRollMonsterAttack,
  onRollMonsterDamage,
}) => {
  const activeCombatant = encounter.combatants[encounter.activeCombatantIndex];

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
            </div>
          </div>

          {/* Lado Direito: Botões de Navegação de Turno */}
          <div className="flex flex-wrap items-center gap-2">
            {!encounter.isRunning ? (
              <button
                type="button"
                onClick={onStartEncounter}
                disabled={encounter.combatants.length === 0}
                className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40"
              >
                <Play size={14} fill="currentColor" />
                <span>Iniciar Combate</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPreviousTurn}
                  className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-2 px-3"
                  title="Turno anterior"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={onNextTurn}
                  className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 shadow-lg shadow-amber-500/20"
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
              className="rpg-button bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs py-2 px-2.5"
              title="Resetar combate e limpar participantes"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Barra de Ações Rápidas do Mestre */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onOpenBestiary}
            className="rpg-button bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs"
          >
            <BookOpen size={14} />
            <span>Bestiário SRD</span>
          </button>

          <button
            type="button"
            onClick={() => onImportPlayers(charactersList)}
            className="rpg-button bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs"
            title="Importa fichas de personagens ativas para o rastreador"
          >
            <Users size={14} />
            <span>Importar Jogadores ({charactersList.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomMonster}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs"
          >
            <UserPlus size={14} />
            <span>Criar Monstro / NPC</span>
          </button>

          <button
            type="button"
            onClick={onRollAllMonsters}
            disabled={encounter.combatants.filter((c) => c.type === 'monster').length === 0}
            className="rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs disabled:opacity-40"
            title="Rola d20 + DES para todos os monstros automaticamente"
          >
            <Dices size={14} />
            <span>Rolar Iniciativa dos Monstros</span>
          </button>

          <button
            type="button"
            onClick={onSortInitiative}
            disabled={encounter.combatants.length < 2}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs disabled:opacity-40"
            title="Reordenar participantes por valor de iniciativa decrescente"
          >
            <ArrowDownUp size={14} />
            <span>Ordenar por Iniciativa</span>
          </button>

          {/* Dificuldade Oficial D&D 5e e Resumo de XP */}
          {encounter.combatants.some((c) => c.type === 'monster') && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition shadow ${
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
