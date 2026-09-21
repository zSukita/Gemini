import React, { useState } from 'react';
import type { Character, SkillKey } from '../types/dnd5e';
import { SKILLS, ABILITIES } from '../types/dnd5e';
import { getSkillModifier, formatModifier } from '../utils/calculations';
import { Dices, Search, Check, Star } from 'lucide-react';

interface SkillsListProps {
  character: Character;
  onCycleProficiency: (skillKey: SkillKey) => void;
  onRollSkill: (skillName: string, modifier: number) => void;
}

export const SkillsList: React.FC<SkillsListProps> = ({
  character,
  onCycleProficiency,
  onRollSkill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAbility, setFilterAbility] = useState<string>('all');

  const skillKeys = Object.keys(SKILLS) as SkillKey[];

  const filteredSkills = skillKeys.filter((key) => {
    const def = SKILLS[key];
    const matchesSearch = def.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAbility = filterAbility === 'all' || def.ability === filterAbility;
    return matchesSearch && matchesAbility;
  });

  return (
    <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80">
      {/* Cabeçalho das Perícias */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
            Perícias (Skills)
          </h2>
          <p className="text-xs text-slate-400">
            Clique no círculo para alternar: <strong>Normal</strong> → <strong>Proficiente</strong> → <strong>Especialização</strong>
          </p>
        </div>

        {/* Barra de Busca e Filtro de Atributo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar perícia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rpg-input pl-8 py-1 text-xs w-36 sm:w-44"
            />
          </div>

          <select
            value={filterAbility}
            onChange={(e) => setFilterAbility(e.target.value)}
            className="rpg-input py-1 text-xs"
          >
            <option value="all">Todos Atributos</option>
            <option value="str">Força (FOR)</option>
            <option value="dex">Destreza (DES)</option>
            <option value="con">Constituição (CON)</option>
            <option value="int">Inteligência (INT)</option>
            <option value="wis">Sabedoria (SAB)</option>
            <option value="cha">Carisma (CAR)</option>
          </select>
        </div>
      </div>

      {/* Lista de Perícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filteredSkills.map((key) => {
          const def = SKILLS[key];
          const abilityDef = ABILITIES[def.ability];
          const profLevel = character.skills[key]?.proficiency || 'none';
          const mod = getSkillModifier(character, key);

          return (
            <div
              key={key}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition group"
            >
              {/* Botão de Proficiência (cicla none -> proficient -> expertise) */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onCycleProficiency(key)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition border ${
                    profLevel === 'expertise'
                      ? 'bg-amber-400 border-amber-300 text-slate-950 ring-2 ring-amber-400/40'
                      : profLevel === 'proficient'
                      ? 'bg-amber-600/80 border-amber-500 text-amber-100'
                      : 'border-slate-600 hover:border-slate-400 bg-slate-800/40'
                  }`}
                  title={`Proficiência: ${
                    profLevel === 'expertise'
                      ? 'Especialização (Dobro)'
                      : profLevel === 'proficient'
                      ? 'Proficiente (+Bônus)'
                      : 'Sem treinamento'
                  }. Clique para alternar.`}
                >
                  {profLevel === 'expertise' && <Star size={11} className="fill-current" />}
                  {profLevel === 'proficient' && <Check size={11} strokeWidth={3} />}
                </button>

                {/* Badge do Atributo */}
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {abilityDef.abbr}
                </span>

                {/* Nome da Perícia */}
                <span
                  onClick={() => onRollSkill(def.name, mod)}
                  className="text-xs font-medium text-slate-200 truncate cursor-pointer hover:text-amber-300 transition"
                >
                  {def.name}
                </span>
              </div>

              {/* Botão de Rolagem */}
              <button
                onClick={() => onRollSkill(def.name, mod)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 group-hover:bg-amber-600/30 text-amber-300 border border-slate-700 group-hover:border-amber-500/50 text-xs font-mono font-bold transition active:scale-95 ml-2"
                title={`Rolar ${def.name} (d20 ${formatModifier(mod)})`}
              >
                <span>{formatModifier(mod)}</span>
                <Dices size={13} className="text-slate-400 group-hover:text-amber-300 transition" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
