import React, { useState } from 'react';
import type { Combatant, ConditionKey } from '../../types/combat';
import { CONDITIONS } from '../../data/conditions';
import { 
  Shield, 
  Heart, 
  Swords, 
  Plus, 
  Minus, 
  Trash2, 
  Skull, 
  Sparkles,
  ChevronDown,
  Zap
} from 'lucide-react';

interface CombatantCardProps {
  combatant: Combatant;
  isActive: boolean;
  onHpDelta: (delta: number) => void;
  onToggleCondition: (condition: ConditionKey) => void;
  onUpdateInitiative: (init: number) => void;
  onRemove: () => void;
  onRollMonsterAttack: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollMonsterDamage: (monsterName: string, actionName: string, formula: string) => void;
}

export const CombatantCard: React.FC<CombatantCardProps> = ({
  combatant,
  isActive,
  onHpDelta,
  onToggleCondition,
  onUpdateInitiative,
  onRemove,
  onRollMonsterAttack,
  onRollMonsterDamage,
}) => {
  const [hpInput, setHpInput] = useState<number | ''>('');
  const [showConditionsMenu, setShowConditionsMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const hpPercent = Math.max(0, Math.min(100, (combatant.currentHp / (combatant.maxHp || 1)) * 100));
  const isDead = combatant.currentHp <= 0;

  const handleApplyDamage = () => {
    if (typeof hpInput === 'number' && hpInput > 0) {
      onHpDelta(-hpInput);
      setHpInput('');
    }
  };

  const handleApplyHealing = () => {
    if (typeof hpInput === 'number' && hpInput > 0) {
      onHpDelta(hpInput);
      setHpInput('');
    }
  };

  const conditionKeys = Object.keys(CONDITIONS) as ConditionKey[];

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 border relative ${
        isActive
          ? 'bg-slate-900/95 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/40'
          : isDead
          ? 'bg-slate-950/70 border-slate-800 opacity-60'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Indicador de Turno Ativo */}
      {isActive && (
        <div className="absolute -top-3 left-4 bg-amber-400 text-slate-950 font-serif font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Sparkles size={11} /> Turno Atual
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Esquerda: Iniciativa, Nome, Tipo e CA */}
        <div className="flex items-center gap-3">
          {/* Caixa de Iniciativa */}
          <div className="flex flex-col items-center justify-center bg-slate-950/90 border border-slate-700 rounded-xl w-12 h-14 shadow-inner">
            <span className="text-[9px] uppercase font-bold text-slate-400">Init</span>
            <input
              type="number"
              value={combatant.initiative}
              onChange={(e) => onUpdateInitiative(parseInt(e.target.value, 10) || 0)}
              className="w-10 text-center font-mono font-black text-lg text-amber-300 bg-transparent focus:outline-none"
              title="Iniciativa do combatente (clique para alterar)"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold ${isActive ? 'text-amber-200' : 'text-slate-100'}`}>
                {combatant.name}
              </span>

              {/* Tag de Tipo */}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                  combatant.type === 'player'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : combatant.type === 'monster'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {combatant.type === 'player' ? 'Jogador' : combatant.type === 'monster' ? 'Monstro' : 'NPC'}
              </span>

              {isDead && (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40 flex items-center gap-1">
                  <Skull size={11} /> 0 PV
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Shield size={13} className="text-amber-400" /> CA {combatant.armorClass}
              </span>
              {combatant.monsterData && (
                <span className="text-[11px] text-slate-400">
                  ND {combatant.monsterData.challengeRating} ({combatant.monsterData.xp} XP)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Centro: Vida (HP) e Ações de Dano/Cura */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-44">
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Heart size={12} className="text-rose-400" /> PV
              </span>
              <span className="font-bold text-slate-200">
                {combatant.currentHp} / {combatant.maxHp}
                {combatant.tempHp > 0 && <span className="text-indigo-400 font-normal"> (+{combatant.tempHp})</span>}
              </span>
            </div>

            {/* Barra de Vida */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  hpPercent > 50
                    ? 'bg-emerald-500'
                    : hpPercent > 20
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Atalho de Dano / Cura */}
          <div className="flex items-center gap-1 self-stretch sm:self-auto">
            <input
              type="number"
              placeholder="Qtd"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="rpg-input text-xs w-14 py-1 text-center font-mono"
            />
            <button
              onClick={handleApplyDamage}
              className="rpg-button bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs py-1 px-2"
              title="Causar Dano"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={handleApplyHealing}
              className="rpg-button bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-xs py-1 px-2"
              title="Curar"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Direita: Condições e Ações */}
        <div className="flex items-center gap-2 justify-end">
          {/* Menu de Condições */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConditionsMenu(!showConditionsMenu)}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1"
              title="Adicionar ou remover condições"
            >
              <span>Condições ({combatant.conditions.length})</span>
              <ChevronDown size={13} />
            </button>

            {showConditionsMenu && (
              <div
                className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 max-h-72 overflow-y-auto grid grid-cols-2 gap-1 animate-in fade-in"
                onMouseLeave={() => setShowConditionsMenu(false)}
              >
                {conditionKeys.map((condKey) => {
                  const cond = CONDITIONS[condKey];
                  const hasCond = combatant.conditions.includes(condKey);

                  return (
                    <button
                      key={condKey}
                      onClick={() => onToggleCondition(condKey)}
                      className={`text-left p-1.5 rounded text-[11px] font-medium border transition ${
                        hasCond ? cond.color : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                      title={cond.description}
                    >
                      {cond.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão para ver Ações do Monstro */}
          {combatant.monsterData && (
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              className={`rpg-button text-xs py-1 ${
                showActions
                  ? 'bg-rose-900/80 text-rose-200 border border-rose-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Ver e rolar ataques do monstro"
            >
              <Swords size={13} />
              <span>Ações</span>
            </button>
          )}

          {/* Remover do Combate */}
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition"
            title="Remover do combate"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Badges de Condições Ativas */}
      {combatant.conditions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
          {combatant.conditions.map((condKey) => {
            const cond = CONDITIONS[condKey];
            if (!cond) return null;

            return (
              <span
                key={condKey}
                onClick={() => onToggleCondition(condKey)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:line-through transition ${cond.color}`}
                title={`${cond.name}: ${cond.description} (clique para remover)`}
              >
                {cond.name} &times;
              </span>
            );
          })}
        </div>
      )}

      {/* Painel de Ações do Monstro com Rolagens Rápidas */}
      {showActions && combatant.monsterData && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2 animate-in fade-in">
          <div className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
            <Swords size={13} className="text-rose-400" /> Ações de Ataque de {combatant.name}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {combatant.monsterData.actions.map((act, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-1.5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span>{act.name}</span>
                    <span className="text-[10px] text-slate-400">{act.range || '1,5m'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    {act.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                  {act.attackBonus !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        onRollMonsterAttack(combatant.name, act.name, act.attackBonus || 0)
                      }
                      className="rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 text-xs py-0.5 px-2 flex-1 font-mono font-bold"
                    >
                      Acerto +{act.attackBonus}
                    </button>
                  )}

                  {act.damageFormula && (
                    <button
                      type="button"
                      onClick={() =>
                        onRollMonsterDamage(combatant.name, `${act.name} (Dano)`, act.damageFormula || '1d6')
                      }
                      className="rpg-button bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs py-0.5 px-2 flex-1 font-mono font-bold"
                    >
                      Dano {act.damageFormula}
                    </button>
                  )}

                  {act.attackBonus !== undefined && act.damageFormula && (
                    <button
                      type="button"
                      onClick={() => {
                        onRollMonsterAttack(combatant.name, act.name, act.attackBonus || 0);
                        setTimeout(() => {
                          onRollMonsterDamage(combatant.name, `${act.name} (Dano)`, act.damageFormula || '1d6');
                        }, 250);
                      }}
                      className="rpg-button bg-amber-600/25 hover:bg-amber-600/50 text-amber-200 border border-amber-500/50 text-xs py-0.5 px-2 flex-1 font-mono font-bold flex items-center justify-center gap-1 shadow-sm"
                      title="Rolar Ataque e Dano em 1 clique"
                    >
                      <Zap size={11} className="text-amber-400" /> Combo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
