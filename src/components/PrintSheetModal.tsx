import React from 'react';
import type { Character, AbilityKey, SkillKey } from '../types/dnd5e';
import { ABILITIES, SKILLS } from '../types/dnd5e';
import { 
  getAbilityModifier, 
  formatModifier, 
  getProficiencyBonus, 
  getPassivePerception, 
  getTotalInventoryWeight 
} from '../utils/calculations';
import { Printer, X } from 'lucide-react';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  character,
}) => {
  if (!isOpen) return null;

  const profBonus = getProficiencyBonus(character.level);
  const passivePerception = getPassivePerception(character);
  const totalWeight = getTotalInventoryWeight(character);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl my-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Barra de Ações Superior (Não impressa) */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm sm:text-base">
            <Printer className="w-5 h-5 text-amber-400" />
            <span>Ficha Oficial Pronta para Impressão & Salvar em PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-md flex items-center gap-2 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar em PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível da Ficha (id="printable-dnd-sheet") */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900">
          <div
            id="printable-dnd-sheet"
            className="w-full bg-[#fcfbfa] text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 font-serif text-[11px] leading-tight space-y-4"
          >
            {/* 1. Cabeçalho Superior da Ficha */}
            <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-sans">
                  Nome do Personagem
                </span>
                <h1 className="text-2xl font-black tracking-wide text-slate-900">
                  {character.name || 'Sem Nome'}
                </h1>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-sans">
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">Classe & Nível</span>
                  <span className="font-bold">{character.characterClass} {character.level}</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">Raça</span>
                  <span className="font-bold">{character.race}</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">Antecedente</span>
                  <span className="font-bold">{character.background || '—'}</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">Tendência</span>
                  <span className="font-bold">{character.alignment || 'Neutro'}</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">XP</span>
                  <span className="font-mono font-bold">{character.experience}</span>
                </div>
                <div className="border-b border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-500 uppercase block">Proficiência</span>
                  <span className="font-mono font-bold">+{profBonus}</span>
                </div>
              </div>
            </div>

            {/* 2. Três Colunas Clássicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ================= COLUNA 1: ATRIBUTOS & PERÍCIAS ================= */}
              <div className="space-y-3">
                {/* Atributos em Grid 6x1 */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(ABILITIES) as AbilityKey[]).map((key) => {
                    const score = character.abilities[key].score;
                    const mod = getAbilityModifier(score);
                    const def = ABILITIES[key];
                    return (
                      <div
                        key={key}
                        className="border-2 border-slate-800 rounded-lg p-1.5 text-center bg-white"
                      >
                        <span className="text-[9px] font-sans uppercase font-bold text-slate-600 block">
                          {def.name}
                        </span>
                        <span className="text-base font-black font-sans block">
                          {formatModifier(mod)}
                        </span>
                        <span className="text-[10px] font-sans text-slate-500 border-t border-slate-200 block pt-0.5 mt-0.5">
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Percepção Passiva */}
                <div className="border border-slate-800 rounded-lg p-2 flex items-center justify-between font-sans">
                  <span className="text-xs font-bold">Percepção Passiva (Sabedoria)</span>
                  <span className="font-mono font-black text-sm">{passivePerception}</span>
                </div>

                {/* Salvaguardas */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1 font-sans">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
                    Testes de Resistência (Salvaguardas)
                  </h3>
                  {(Object.keys(ABILITIES) as AbilityKey[]).map((key) => {
                    const isProf = character.abilities[key].saveProficient;
                    const mod = getAbilityModifier(character.abilities[key].score) + (isProf ? profBonus : 0);
                    return (
                      <div key={key} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full border border-slate-800 ${
                              isProf ? 'bg-slate-900' : 'bg-transparent'
                            }`}
                          />
                          <span>{ABILITIES[key].name}</span>
                        </span>
                        <span className="font-mono font-bold">{formatModifier(mod)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Perícias */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1 font-sans">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
                    Perícias
                  </h3>
                  {(Object.keys(SKILLS) as SkillKey[]).map((key) => {
                    const prof = character.skills[key]?.proficiency || 'none';
                    const abilityKey = SKILLS[key].ability;
                    const abilityMod = getAbilityModifier(character.abilities[abilityKey].score);
                    const bonus = prof === 'expertise' ? profBonus * 2 : prof === 'proficient' ? profBonus : 0;
                    const total = abilityMod + bonus;

                    return (
                      <div key={key} className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-2 h-2 rounded-full border border-slate-800 ${
                              prof === 'expertise'
                                ? 'bg-amber-600'
                                : prof === 'proficient'
                                ? 'bg-slate-900'
                                : 'bg-transparent'
                            }`}
                          />
                          <span className="truncate">{SKILLS[key].name}</span>
                          <span className="text-[8px] text-slate-400">({ABILITIES[abilityKey].abbr})</span>
                        </span>
                        <span className="font-mono font-bold">{formatModifier(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= COLUNA 2: COMBATE, ATAQUES & INVENTÁRIO ================= */}
              <div className="space-y-3">
                {/* Defesas Principais */}
                <div className="grid grid-cols-3 gap-2 font-sans text-center">
                  <div className="border-2 border-slate-800 rounded-lg p-2 bg-white">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Classe Armadura</span>
                    <span className="text-xl font-black">{character.armorClass}</span>
                  </div>
                  <div className="border-2 border-slate-800 rounded-lg p-2 bg-white">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Iniciativa</span>
                    <span className="text-xl font-black">
                      {formatModifier(getAbilityModifier(character.abilities.dex.score) + character.initiativeBonus)}
                    </span>
                  </div>
                  <div className="border-2 border-slate-800 rounded-lg p-2 bg-white">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Deslocamento</span>
                    <span className="text-xl font-black">{character.speed}m</span>
                  </div>
                </div>

                {/* Pontos de Vida */}
                <div className="border-2 border-slate-800 rounded-lg p-3 bg-white font-sans">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Pontos de Vida</span>
                    <span className="text-slate-500">Máximo: {character.maxHp}</span>
                  </div>
                  <div className="text-center py-1">
                    <span className="text-2xl font-black">{character.currentHp} / {character.maxHp}</span>
                    {character.tempHp > 0 && (
                      <span className="text-xs text-blue-600 block">+{character.tempHp} Temp</span>
                    )}
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between text-[10px]">
                    <span>Dados de Vida: <strong>{character.hitDice.current}/{character.hitDice.total} ({character.hitDice.dieType})</strong></span>
                  </div>
                </div>

                {/* Ataques & Conjuração */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1.5 font-sans">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    Ataques & Armas
                  </h3>
                  {character.attacks.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Nenhum ataque cadastrado.</p>
                  ) : (
                    <div className="space-y-1">
                      {character.attacks.map((att) => (
                        <div key={att.id} className="border-b border-slate-100 pb-1 text-[10px] flex items-center justify-between">
                          <div>
                            <span className="font-bold">{att.name}</span>
                            <span className="text-[9px] text-slate-500 block">{att.damage} {att.damageType}</span>
                          </div>
                          <span className="font-mono font-bold text-xs">{formatModifier(att.attackBonus)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Equipamento & Moedas */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1.5 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Inventário & Equipamento
                    </h3>
                    <span className="text-[9px] text-slate-500 font-mono">Peso: {totalWeight} kg</span>
                  </div>

                  {/* Moedas */}
                  <div className="grid grid-cols-5 gap-1 text-center text-[9px] bg-slate-100 p-1 rounded font-mono">
                    <div>PC: <strong>{character.currency.cp}</strong></div>
                    <div>PP: <strong>{character.currency.sp}</strong></div>
                    <div>PE: <strong>{character.currency.ep}</strong></div>
                    <div>PO: <strong>{character.currency.gp}</strong></div>
                    <div>PL: <strong>{character.currency.pp}</strong></div>
                  </div>

                  <div className="space-y-0.5 max-h-36 overflow-hidden">
                    {character.inventory.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex justify-between text-[9px] border-b border-slate-50">
                        <span className="truncate">
                          {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                        </span>
                        <span className="text-slate-400 font-mono">{item.weight * item.quantity}kg</span>
                      </div>
                    ))}
                    {character.inventory.length > 10 && (
                      <span className="text-[9px] text-slate-400 italic block pt-0.5">
                        + {character.inventory.length - 10} outros itens na mochila...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ================= COLUNA 3: CARACTERÍSTICAS & MAGIAS ================= */}
              <div className="space-y-3">
                {/* Idiomas e Proficiências */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white font-sans space-y-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    Idiomas & Outras Proficiências
                  </h3>
                  <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {character.proficienciesAndLanguages || 'Nenhum idioma cadastrado.'}
                  </p>
                </div>

                {/* Habilidades & Características */}
                <div className="border border-slate-800 rounded-lg p-2.5 bg-white font-sans space-y-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    Características & Talentos
                  </h3>
                  <div className="space-y-1.5 max-h-56 overflow-hidden">
                    {character.features.map((feat) => (
                      <div key={feat.id} className="border-b border-slate-100 pb-1 text-[10px]">
                        <span className="font-bold text-slate-900">{feat.name}</span>
                        <span className="text-[9px] text-slate-500 ml-1">({feat.source})</span>
                        <p className="text-slate-600 text-[9px] line-clamp-2 leading-tight mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grimório / Magias Cadastradas */}
                {character.spellcasting.spells.length > 0 && (
                  <div className="border border-slate-800 rounded-lg p-2.5 bg-white font-sans space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Magias Conhecidas & Preparadas
                      </h3>
                      <span className="text-[9px] text-slate-500 font-mono">
                        CD {8 + profBonus + getAbilityModifier(character.abilities[character.spellcasting.ability].score)}
                      </span>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-hidden text-[9px]">
                      {character.spellcasting.spells.slice(0, 10).map((spell) => (
                        <div key={spell.id} className="flex justify-between border-b border-slate-50 pb-0.5">
                          <span className="font-bold truncate">
                            {spell.level === 0 ? '✦' : `${spell.level}º`} {spell.name}
                          </span>
                          <span className="text-slate-500 truncate ml-1">{spell.school}</span>
                        </div>
                      ))}
                      {character.spellcasting.spells.length > 10 && (
                        <span className="text-[9px] text-slate-400 italic block pt-0.5">
                          + {character.spellcasting.spells.length - 10} outras magias no grimório...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
