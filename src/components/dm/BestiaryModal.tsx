import React, { useState } from 'react';
import type { Monster } from '../../types/combat';
import { SRD_MONSTERS } from '../../data/srdMonsters';
import { getAbilityModifier, formatModifier } from '../../utils/calculations';
import { 
  BookOpen, 
  X, 
  Search, 
  Plus, 
  Shield, 
  Heart, 
  Footprints, 
  Sparkles,
  Swords,
  MapPin,
  Dices
} from 'lucide-react';

interface BestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonster: (monster: Monster, count: number) => void;
  onRollMonsterAttack?: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollMonsterDamage?: (monsterName: string, actionName: string, formula: string) => void;
  onAddTokenToMap?: (monster: Monster) => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({
  isOpen,
  onClose,
  onAddMonster,
  onRollMonsterAttack,
  onRollMonsterDamage,
  onAddTokenToMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredMonsters = SRD_MONSTERS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === 'all' || m.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const getCount = (id: string) => counts[id] || 1;
  const setCount = (id: string, val: number) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(1, Math.min(20, val)) }));
  };

  const typesList = ['all', 'Humanoide', 'Morto-vivo', 'Monstruosidade', 'Besta', 'Gigante', 'Dragão', 'Aberração'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-4xl rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Catálogo de Criaturas & Bestiário D&D 5e (SRD)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 py-3 border-b border-slate-800">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar monstro por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rpg-input pl-9 text-xs w-full py-1.5"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rpg-input py-1.5 text-xs w-full sm:w-auto"
            >
              <option value="all">Todos os Tipos</option>
              {typesList.filter((t) => t !== 'all').map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Monstros */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 flex flex-col gap-3">
          {filteredMonsters.map((monster) => {
            const isExpanded = expandedId === monster.id;
            const count = getCount(monster.id);

            return (
              <div
                key={monster.id}
                className="bg-slate-900/80 rounded-xl border border-slate-800 p-3.5 hover:border-slate-700 transition flex flex-col gap-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {monster.avatarUrl ? (
                      <img
                        src={monster.avatarUrl}
                        alt={monster.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/50 bg-slate-950 shrink-0 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setExpandedId(isExpanded ? null : monster.id)}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : monster.id)}
                        className="w-12 h-12 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold font-serif cursor-pointer hover:border-amber-500/50 transition-colors"
                      >
                        {monster.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          onClick={() => setExpandedId(isExpanded ? null : monster.id)}
                          className="text-base font-serif font-bold text-amber-200 cursor-pointer hover:text-amber-300 transition"
                        >
                          {monster.name}
                        </h3>
                        <span className="text-xs text-slate-400">
                          {monster.size} {monster.type}, {monster.alignment}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                          ND {monster.challengeRating} ({monster.xp} XP)
                        </span>
                      </div>

                    <div className="flex items-center gap-4 text-xs text-slate-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Shield size={13} className="text-amber-400" /> CA {monster.armorClass}
                        {monster.armorType && <span className="text-slate-500 text-[10px]">({monster.armorType})</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={13} className="text-rose-400" /> {monster.hitPoints} PV ({monster.hitDice})
                      </span>
                      <span className="flex items-center gap-1">
                        <Footprints size={13} className="text-emerald-400" /> {monster.speed}
                      </span>
                    </div>
                  </div>
                </div>

                  {/* Controle de Adição ao Combate e Mapa */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                    {onAddTokenToMap && (
                      <button
                        type="button"
                        onClick={() => onAddTokenToMap(monster)}
                        className="rpg-button bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 text-xs py-1.5 px-2.5 flex items-center gap-1"
                        title="Enviar este monstro para o Mapa Tático como Token"
                      >
                        <MapPin size={13} />
                        <span className="hidden sm:inline">Mapa</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400">Qtd:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={count}
                        onChange={(e) => setCount(monster.id, parseInt(e.target.value, 10) || 1)}
                        className="w-10 text-center font-mono font-bold text-xs bg-transparent text-slate-200 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        onAddMonster(monster, count);
                        onClose();
                      }}
                      className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5"
                    >
                      <Plus size={14} />
                      Adicionar ({count})
                    </button>
                  </div>
                </div>

                {/* Bloco de Estatísticas Expandidas */}
                {isExpanded && (
                  <div className="mt-2 pt-3 border-t border-slate-800 text-xs flex flex-col gap-3 animate-in fade-in">
                    {/* Grade de Atributos */}
                    <div className="grid grid-cols-6 gap-1 bg-slate-950 p-2 rounded-lg text-center font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500">FOR</div>
                        <div className="font-bold text-slate-200">{monster.abilities.str} ({formatModifier(getAbilityModifier(monster.abilities.str))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">DES</div>
                        <div className="font-bold text-slate-200">{monster.abilities.dex} ({formatModifier(getAbilityModifier(monster.abilities.dex))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">CON</div>
                        <div className="font-bold text-slate-200">{monster.abilities.con} ({formatModifier(getAbilityModifier(monster.abilities.con))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">INT</div>
                        <div className="font-bold text-slate-200">{monster.abilities.int} ({formatModifier(getAbilityModifier(monster.abilities.int))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">SAB</div>
                        <div className="font-bold text-slate-200">{monster.abilities.wis} ({formatModifier(getAbilityModifier(monster.abilities.wis))})</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">CAR</div>
                        <div className="font-bold text-slate-200">{monster.abilities.cha} ({formatModifier(getAbilityModifier(monster.abilities.cha))})</div>
                      </div>
                    </div>

                    {/* Habilidades e Ações */}
                    {monster.traits && monster.traits.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                          <Sparkles size={12} /> Habilidades Especiais:
                        </span>
                        <div className="flex flex-col gap-1 text-slate-300 text-[11px]">
                          {monster.traits.map((t, idx) => (
                            <p key={idx}><strong>{t.name}:</strong> {t.description}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                        <Swords size={12} /> Ações e Ataques Roláveis:
                      </span>
                      <div className="flex flex-col gap-2 text-slate-300 text-[11px]">
                        {monster.actions.map((act, idx) => (
                          <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1">
                              <span className="font-bold text-slate-200">{act.name}: </span>
                              <span className="text-slate-400">{act.description}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              {act.attackBonus !== undefined && onRollMonsterAttack && (
                                <button
                                  type="button"
                                  onClick={() => onRollMonsterAttack(monster.name, act.name, act.attackBonus || 0)}
                                  className="rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 text-xs py-1 px-2.5 font-mono font-bold flex items-center gap-1"
                                  title={`Rolar teste de ataque para ${act.name}`}
                                >
                                  <Dices size={12} />
                                  Acerto +{act.attackBonus}
                                </button>
                              )}

                              {act.damageFormula && onRollMonsterDamage && (
                                <button
                                  type="button"
                                  onClick={() => onRollMonsterDamage(monster.name, `${act.name} (Dano)`, act.damageFormula || '1d6')}
                                  className="rpg-button bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs py-1 px-2.5 font-mono font-bold flex items-center gap-1"
                                  title={`Rolar dano para ${act.name}`}
                                >
                                  <Swords size={12} />
                                  Dano {act.damageFormula}
                                </button>
                              )}

                              {act.attackBonus !== undefined && act.damageFormula && onRollMonsterAttack && onRollMonsterDamage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRollMonsterAttack(monster.name, act.name, act.attackBonus || 0);
                                    setTimeout(() => {
                                      onRollMonsterDamage(monster.name, `${act.name} (Dano)`, act.damageFormula || '1d6');
                                    }, 250);
                                  }}
                                  className="rpg-button bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/60 text-xs py-1 px-2.5 font-mono font-bold flex items-center gap-1 shadow-sm"
                                  title={`Rolar ataque e dano em combo para ${act.name}`}
                                >
                                  <Sparkles size={12} className="text-amber-400" />
                                  Combo
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMonsters.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs italic">
              Nenhuma criatura encontrada para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
