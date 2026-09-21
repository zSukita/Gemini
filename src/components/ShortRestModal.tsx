import React, { useState } from 'react';
import type { Character } from '../types/dnd5e';
import { getAbilityModifier } from '../utils/calculations';
import {
  Sun,
  X,
  Heart,
  Dices,
  Check,
  Sparkles,
  Flame,
} from 'lucide-react';

interface ShortRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSpendHitDie: () => { dieRoll: number; conMod: number; totalHealed: number } | null;
  onCompleteShortRest: () => void;
  showNotification: (msg: string) => void;
}

export const ShortRestModal: React.FC<ShortRestModalProps> = ({
  isOpen,
  onClose,
  character,
  onSpendHitDie,
  onCompleteShortRest,
  showNotification,
}) => {
  const [lastRoll, setLastRoll] = useState<{ dieRoll: number; conMod: number; totalHealed: number } | null>(null);
  const [sessionHealed, setSessionHealed] = useState(0);

  if (!isOpen) return null;

  const conMod = getAbilityModifier(character.abilities.con.score);
  const remainingDice = character.hitDice.current;
  const totalDice = character.hitDice.total;
  const dieType = character.hitDice.dieType;

  // Recursos que recarregam no descanso curto
  const shortRestResources = (character.resources || []).filter((r) => r.resetOn === 'short');

  const handleRollDie = () => {
    const res = onSpendHitDie();
    if (res) {
      setLastRoll(res);
      setSessionHealed((prev) => prev + res.totalHealed);
      showNotification(`Curou +${res.totalHealed} PV (${res.dieRoll} no ${dieType} + ${res.conMod >= 0 ? `+${res.conMod}` : res.conMod} CON)!`);
    }
  };

  const handleFinish = () => {
    onCompleteShortRest();
    if (shortRestResources.length > 0) {
      showNotification(`Descanso curto finalizado! ${shortRestResources.length} recurso(s) de classe recarregado(s).`);
    } else {
      showNotification('Descanso curto finalizado!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-md rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-300">
            <Sun className="text-amber-400 animate-spin-slow" size={20} />
            <h2 className="text-base font-serif font-bold">Descanso Curto (1 Hora)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo de Saúde Atual */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pontos de Vida</span>
            <div className="flex items-center justify-center gap-1.5 font-mono text-xl font-black">
              <Heart size={16} className="text-rose-500 fill-rose-500" />
              <span className="text-emerald-400">{character.currentHp}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200">{character.maxHp}</span>
            </div>
            {sessionHealed > 0 && (
              <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                (+{sessionHealed} recuperados agora)
              </span>
            )}
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dados de Vida</span>
            <div className="flex items-center justify-center gap-1.5 font-mono text-xl font-black text-amber-300">
              <Dices size={16} className="text-amber-400" />
              <span>{remainingDice}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200">{totalDice}</span>
              <span className="text-xs text-amber-400 font-sans ml-1 font-bold">{dieType}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Bônus CON: {conMod >= 0 ? `+${conMod}` : conMod}
            </span>
          </div>
        </div>

        {/* Última Rolagem */}
        {lastRoll && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center flex items-center justify-center gap-3 animate-in fade-in">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs text-slate-300">
              Rolou <strong className="text-amber-300 font-mono">{lastRoll.dieRoll}</strong> no {dieType} + <strong className="text-amber-300 font-mono">{lastRoll.conMod >= 0 ? `+${lastRoll.conMod}` : lastRoll.conMod}</strong> CON = <strong className="text-emerald-300 text-sm font-mono">+{lastRoll.totalHealed} PV</strong>
            </span>
          </div>
        )}

        {/* Recursos de Descanso Curto */}
        {shortRestResources.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-2">
              <Flame size={13} className="text-amber-400" />
              Recursos que recarregarão neste descanso:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {shortRestResources.map((res) => (
                <span
                  key={res.id}
                  className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold"
                >
                  {res.name} ({res.max}/{res.max})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Gastar Dado de Vida */}
        <div>
          <button
            type="button"
            onClick={handleRollDie}
            disabled={remainingDice <= 0 || character.currentHp >= character.maxHp}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Dices size={18} />
            <span>Gastar 1 Dado de Vida ({dieType} {conMod >= 0 ? `+ ${conMod}` : `- ${Math.abs(conMod)}`})</span>
          </button>
          {character.currentHp >= character.maxHp && (
            <p className="text-[11px] text-emerald-400 text-center mt-1">Seu personagem já está com PV máximo!</p>
          )}
        </div>

        {/* Botão Concluir Descanso */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleFinish}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 text-xs flex items-center gap-2 font-bold"
          >
            <Check size={14} className="text-emerald-400" />
            <span>Concluir Descanso Curto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
