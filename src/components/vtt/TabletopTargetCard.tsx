import React from 'react';
import type { Combatant } from '../../types/combat';
import { 
  X, 
  Dices, 
  Swords, 
  Eye 
} from 'lucide-react';

interface TabletopTargetCardProps {
  target: Combatant | null;
  onClose?: () => void;
  onRollAttack?: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollDamage?: (monsterName: string, actionName: string, formula: string) => void;
}

export const TabletopTargetCard: React.FC<TabletopTargetCardProps> = ({
  target,
  onClose,
  onRollAttack,
  onRollDamage,
}) => {
  if (!target) {
    return (
      <div className="tabletop-parchment flex flex-col h-full rounded-xl p-4 items-center justify-center text-center text-amber-900/60 font-serif select-none">
        <Eye size={28} className="opacity-40 mb-2" />
        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950">
          Inspetor de Alvo & Atributos
        </h4>
        <p className="text-[11px] italic mt-1 max-w-[200px]">
          Clique em qualquer token no mapa ou linha no rastreador para inspecionar atributos, CA e rolar ataques.
        </p>
      </div>
    );
  }

  const mon = target.monsterData;

  return (
    <div className="tabletop-parchment flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
      {/* Cabeçalho do Card */}
      <div className="tabletop-parchment-header px-3 py-1.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-800 shrink-0" />
          <h3 className="font-serif font-black text-xs uppercase tracking-wide truncate text-amber-950">
            {target.name}
          </h3>
          {mon && (
            <span className="text-[10px] text-amber-900/70 font-mono">
              ({mon.size} {mon.type})
            </span>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-amber-900 hover:text-amber-950 p-0.5 rounded transition"
            title="Fechar ficha de alvo"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Estatísticas Principais (HD, HP, CA, Deslocamento) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs font-serif text-[#2a1b0d]">
        {/* Bloco de Métricas Rápidas */}
        <div className="grid grid-cols-4 gap-1.5 p-2 rounded bg-[#faeed8] border border-[#cca97f] text-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-amber-900/70 block">Pontos de Vida</span>
            <span className="font-mono font-black text-xs text-red-900">
              {target.currentHp} / {target.maxHp}
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-amber-900/70 block">Classe Armadura</span>
            <span className="font-mono font-black text-xs text-amber-900">
              {target.armorClass}
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-amber-900/70 block">Iniciativa</span>
            <span className="font-mono font-black text-xs text-amber-900">
              {target.initiative >= 0 ? `+${target.initiative}` : target.initiative}
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-amber-900/70 block">ND / Desafio</span>
            <span className="font-mono font-black text-xs text-amber-900">
              {mon?.challengeRating || (target.type === 'player' ? 'Herói' : '1')}
            </span>
          </div>
        </div>

        {/* Deslocamento & Sentidos */}
        {mon && (
          <div className="text-[11px] space-y-1 border-b border-[#dfc9a7] pb-2">
            <div>
              <strong className="text-amber-950">Deslocamento:</strong> {mon.speed}
            </div>
            {mon.senses && (
              <div>
                <strong className="text-amber-950">Sentidos:</strong> {mon.senses}
              </div>
            )}
          </div>
        )}

        {/* Habilidades e Ações de Ataque */}
        {mon?.actions && mon.actions.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block border-b border-[#cca97f] pb-0.5">
              Ataques & Ações (D&D 5e)
            </span>

            <div className="space-y-1.5">
              {mon.actions.map((act, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-[#f6ebd4] border border-[#d2b38c] space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-950 text-[11px]">{act.name}</strong>
                    <div className="flex items-center gap-1">
                      {act.attackBonus !== undefined && onRollAttack && (
                        <button
                          type="button"
                          onClick={() => onRollAttack(target.name, act.name, act.attackBonus || 0)}
                          className="rpg-button bg-amber-800 hover:bg-amber-900 text-amber-50 text-[10px] py-0.5 px-2 rounded font-bold shadow-xs flex items-center gap-1"
                          title="Rolar Ataque com d20"
                        >
                          <Dices size={11} />
                          <span>+{act.attackBonus} Ataque</span>
                        </button>
                      )}

                      {act.damageFormula && onRollDamage && (
                        <button
                          type="button"
                          onClick={() => onRollDamage(target.name, act.name, act.damageFormula || '1d6')}
                          className="rpg-button bg-red-800 hover:bg-red-900 text-white text-[10px] py-0.5 px-2 rounded font-bold shadow-xs flex items-center gap-1"
                          title="Rolar Dano do Ataque"
                        >
                          <Swords size={11} />
                          <span>{act.damageFormula}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {act.description && (
                    <p className="text-[10px] leading-snug text-amber-900/80 italic">
                      {act.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[11px] italic text-amber-900/70 p-2">
            {target.type === 'player'
              ? 'Este combatente é um Personagem Jogador. Use as ações da ficha do jogador.'
              : 'Nenhuma ação especial detalhada cadastrada para este monstro.'}
          </div>
        )}

        {/* Traços e Características */}
        {mon?.traits && mon.traits.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block border-b border-[#cca97f] pb-0.5">
              Habilidades Especiais
            </span>
            {mon.traits.map((t, idx) => (
              <div key={idx} className="text-[10px] leading-snug">
                <strong className="text-amber-950">{t.name}:</strong>{' '}
                <span className="text-amber-900/80">{t.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
