import React from 'react';
import type { Encounter, ConditionKey, Combatant } from '../../types/combat';
import type { Character } from '../../types/dnd5e';
import { 
  Swords, 
  ChevronRight, 
  ChevronLeft, 
  ArrowDownUp, 
  RotateCcw, 
  Plus, 
  Heart, 
  Shield, 
  Skull,
  Play
} from 'lucide-react';

interface TabletopCombatTrackerProps {
  encounter: Encounter;
  charactersList?: Character[];
  selectedCombatantId?: string | null;
  onSelectCombatant?: (combatant: Combatant) => void;
  onStartEncounter?: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onSortInitiative: () => void;
  onResetEncounter?: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onToggleCondition?: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative?: (id: string, init: number) => void;
  onRemoveCombatant?: (id: string) => void;
  onOpenBestiary?: () => void;
}

export const TabletopCombatTracker: React.FC<TabletopCombatTrackerProps> = ({
  encounter,
  charactersList = [],
  selectedCombatantId,
  onSelectCombatant,
  onStartEncounter,
  onNextTurn,
  onPreviousTurn,
  onSortInitiative,
  onResetEncounter,
  onHpDelta,
  onOpenBestiary,
}) => {
  const activeCombatant = encounter.combatants[encounter.activeCombatantIndex];

  return (
    <div className="tabletop-parchment flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
      {/* Cabeçalho */}
      <div className="tabletop-parchment-header px-3 py-1.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-amber-900" />
          <h3 className="font-serif font-black text-xs uppercase tracking-wider text-amber-950">
            Rastreador de Combate
          </h3>
          {encounter.isRunning && activeCombatant && (
            <span className="text-[10px] text-amber-950 font-bold bg-amber-800/20 px-1.5 py-0.5 rounded border border-amber-800/30">
              Vez: {activeCombatant.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-[#cbb592] px-2 py-0.5 rounded border border-[#9d8058] text-amber-950">
            Rodada: {encounter.round}
          </span>
          {onOpenBestiary && (
            <button
              type="button"
              onClick={onOpenBestiary}
              className="rpg-button bg-amber-800 hover:bg-amber-900 text-amber-100 text-[10px] py-0.5 px-2 rounded shadow-xs"
              title="Adicionar monstro do Bestiário"
            >
              <Plus size={12} />
              <span>Adicionar</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Combatentes (Estilo Fantasy Grounds) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {encounter.combatants.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-amber-900/60 font-serif">
            <Swords size={24} className="opacity-40 mb-1" />
            <p className="text-xs italic">Nenhum combatente na iniciativa.</p>
            <p className="text-[10px] font-sans">Adicione monstros ou importe heróis para iniciar o combate.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Linha de Cabeçalho da Tabela */}
            <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[10px] font-serif font-black uppercase tracking-wider text-amber-900/80 border-b border-[#cca97f] select-none">
              <div className="col-span-5">Combatente</div>
              <div className="col-span-2 text-center">Inic.</div>
              <div className="col-span-3 text-center">PV / Vida</div>
              <div className="col-span-2 text-right">Ação</div>
            </div>

            {/* Linhas de Combatentes */}
            <div className="divide-y divide-[#dfc8a5]/60">
              {encounter.combatants.map((c, idx) => {
                const isActive = encounter.isRunning && encounter.activeCombatantIndex === idx;
                const isSelected = selectedCombatantId === c.id;
                const isDown = c.currentHp <= 0;
                const isMonster = c.type === 'monster';

                // Busca avatar de personagem se existir
                const char = charactersList.find((ch) => ch.id === c.playerId || ch.name === c.name);
                const avatar = char?.avatarUrl || (isMonster ? '🐉' : '⚔️');

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCombatant?.(c)}
                    className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded cursor-pointer transition text-xs font-serif ${
                      isActive
                        ? 'bg-amber-800/15 border-l-4 border-amber-800 font-bold shadow-inner'
                        : isSelected
                        ? 'bg-[#e2ceae]/60'
                        : 'hover:bg-[#efe0c7]/60'
                    }`}
                  >
                    {/* Nome + Ícone */}
                    <div className="col-span-5 flex items-center gap-1.5 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-[#3c2410] border border-[#a68254] flex items-center justify-center shrink-0 overflow-hidden text-[10px] text-amber-100 shadow-xs">
                        {typeof avatar === 'string' && avatar.startsWith('data:') ? (
                          <img src={avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{avatar}</span>
                        )}
                      </div>
                      <span className={`truncate text-[11px] ${isDown ? 'line-through text-red-900 opacity-60' : 'text-amber-950'}`}>
                        {c.name}
                      </span>
                    </div>

                    {/* Iniciativa */}
                    <div className="col-span-2 text-center font-mono font-bold text-amber-900 text-xs">
                      {c.initiative}
                    </div>

                    {/* Vida (HP) e botões de delta */}
                    <div className="col-span-3 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onHpDelta(c.id, -1);
                        }}
                        className="w-4 h-4 rounded bg-red-800 hover:bg-red-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                        title="Perder 1 PV"
                      >
                        -
                      </button>

                      <span className={`font-mono text-[11px] font-bold ${isDown ? 'text-red-800' : 'text-amber-950'}`}>
                        {c.currentHp}/{c.maxHp}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onHpDelta(c.id, 1);
                        }}
                        className="w-4 h-4 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                        title="Recuperar 1 PV"
                      >
                        +
                      </button>
                    </div>

                    {/* Estado / CA */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <div className="flex items-center gap-0.5 font-mono text-[10px] text-amber-900 font-bold bg-[#cbb592]/50 px-1 rounded">
                        <Shield size={10} />
                        <span>{c.armorClass}</span>
                      </div>
                      {isDown ? (
                        <Skull size={12} className="text-red-800 shrink-0" />
                      ) : (
                        <Heart size={12} className="text-emerald-800 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ações de Combate Inferior */}
      <div className="p-2 bg-[#dfd0b5] border-t-2 border-[#8a6840] flex items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSortInitiative}
            className="rpg-button bg-[#c9b18a] hover:bg-[#ba9f73] text-amber-950 text-[10px] py-1 px-2 rounded shadow-xs"
            title="Ordenar por Iniciativa (Maior para menor)"
          >
            <ArrowDownUp size={11} />
            <span>Ordenar</span>
          </button>

          {onResetEncounter && (
            <button
              type="button"
              onClick={onResetEncounter}
              className="rpg-button bg-[#c9b18a] hover:bg-[#ba9f73] text-amber-950 text-[10px] py-1 px-1.5 rounded shadow-xs"
              title="Resetar Encontro"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {encounter.isRunning ? (
            <>
              <button
                type="button"
                onClick={onPreviousTurn}
                className="rpg-button bg-[#c9b18a] hover:bg-[#ba9f73] text-amber-950 text-[10px] py-1 px-2 rounded shadow-xs"
                title="Turno Anterior"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={onNextTurn}
                className="rpg-button bg-amber-800 hover:bg-amber-900 text-amber-100 font-bold text-[10px] py-1 px-3 rounded shadow"
                title="Próximo Turno"
              >
                <span>Próximo</span>
                <ChevronRight size={13} />
              </button>
            </>
          ) : (
            onStartEncounter && (
              <button
                type="button"
                onClick={onStartEncounter}
                className="rpg-button bg-amber-800 hover:bg-amber-900 text-amber-100 font-bold text-[10px] py-1 px-3 rounded shadow flex items-center gap-1"
                title="Iniciar o Combate"
              >
                <Play size={11} />
                <span>Iniciar Combate</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
