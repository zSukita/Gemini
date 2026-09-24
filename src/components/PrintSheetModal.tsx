import React, { useState } from 'react';
import type { Character, AbilityKey, SkillKey } from '../types/dnd5e';
import { ABILITIES, SKILLS } from '../types/dnd5e';
import { 
  getAbilityModifier, 
  formatModifier, 
  getProficiencyBonus, 
  getPassivePerception, 
  getTotalInventoryWeight 
} from '../utils/calculations';
import { Printer, X, Shield, Sparkles, Heart, Award, User } from 'lucide-react';

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
  const [activePreviewPage, setActivePreviewPage] = useState<'all' | '1' | '2' | '3'>('all');

  if (!isOpen) return null;

  const profBonus = getProficiencyBonus(character.level);
  const passivePerception = getPassivePerception(character);
  const totalWeight = getTotalInventoryWeight(character);

  const spellAbility = character.spellcasting?.ability || 'int';
  const spellMod = getAbilityModifier(character.abilities[spellAbility]?.score || 10);
  const spellSaveDc = 8 + profBonus + spellMod + (character.spellcasting?.spellSaveDcBonus || 0);
  const spellAttackBonus = profBonus + spellMod + (character.spellcasting?.spellAttackBonusMod || 0);

  const spellsByLevel = (level: number) => 
    (character.spellcasting?.spells || []).filter((s) => s.level === level);

  const hasSpells = (character.spellcasting?.spells || []).length > 0;

  const handlePrint = () => {
    const oldTitle = document.title;
    const safeName = (character.name || 'Heroi').replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `${safeName}_Ficha_Oficial_DnD5e`;
    window.print();
    setTimeout(() => {
      document.title = oldTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl my-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Barra de Ações Superior (Não impressa) */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 text-amber-300 font-serif font-bold text-sm sm:text-base">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight">Ficha Oficial D&D 5e • Impressão & PDF</span>
              <span className="text-[11px] text-slate-400 font-sans font-normal">
                Compatível com papel A4 (Salvar como PDF ou Imprimir)
              </span>
            </div>
          </div>

          {/* Seletor de visualização na tela */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActivePreviewPage('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                activePreviewPage === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas as Páginas
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewPage('1')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                activePreviewPage === '1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pág. 1: Combate
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewPage('2')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                activePreviewPage === '2'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pág. 2: Biografia
            </button>
            {hasSpells && (
              <button
                type="button"
                onClick={() => setActivePreviewPage('3')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activePreviewPage === '3'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pág. 3: Grimório
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Salvar em PDF Oficial</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível da Ficha (id="printable-dnd-sheet") */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div id="printable-dnd-sheet" className="space-y-8">
            
            {/* ============================================================== */}
            {/* PÁGINA 1: ESTATÍSTICAS OFICIAIS DE COMBATE E EXPLORAÇÃO        */}
            {/* ============================================================== */}
            {(activePreviewPage === 'all' || activePreviewPage === '1') && (
              <div className="sheet-page w-full bg-[#fcfbfa] text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 font-serif text-[11px] leading-tight space-y-4">
                {/* 1. Cabeçalho Superior da Ficha Oficial */}
                <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-sans font-bold">
                      Nome do Personagem
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-900 truncate">
                      {character.name || 'Sem Nome'}
                    </h1>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-sans">
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Classe & Nível</span>
                      <span className="font-bold">{character.characterClass} {character.level}</span>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Raça</span>
                      <span className="font-bold">{character.race}</span>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Antecedente</span>
                      <span className="font-bold">{character.background || '—'}</span>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Tendência</span>
                      <span className="font-bold">{character.alignment || 'Neutro'}</span>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Experiência (XP)</span>
                      <span className="font-mono font-bold">{character.experience}</span>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Proficiência</span>
                      <span className="font-mono font-bold">+{profBonus}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Três Colunas Clássicas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                  
                  {/* ================= COLUNA 1: ATRIBUTOS & PERÍCIAS ================= */}
                  <div className="space-y-3">
                    {/* Inspiração & Bônus de Proficiência */}
                    <div className="grid grid-cols-2 gap-2 font-sans">
                      <div className="border border-slate-800 rounded-lg p-2 flex items-center justify-between bg-white">
                        <span className="text-[10px] uppercase font-bold text-slate-700">Inspiração</span>
                        <span className="font-bold text-sm">{character.inspiration ? '★ SIM' : '—'}</span>
                      </div>
                      <div className="border border-slate-800 rounded-lg p-2 flex items-center justify-between bg-white">
                        <span className="text-[10px] uppercase font-bold text-slate-700">Bônus Prof.</span>
                        <span className="font-mono font-bold text-sm">+{profBonus}</span>
                      </div>
                    </div>

                    {/* Atributos em Grid 6x1 */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(ABILITIES) as AbilityKey[]).map((key) => {
                        const score = character.abilities[key].score;
                        const mod = getAbilityModifier(score);
                        const def = ABILITIES[key];
                        return (
                          <div
                            key={key}
                            className="border-2 border-slate-800 rounded-lg p-1 text-center bg-white shadow-xs"
                          >
                            <span className="text-[8.5px] font-sans uppercase font-bold text-slate-600 block">
                              {def.name}
                            </span>
                            <span className="text-base font-black font-sans block leading-none py-0.5">
                              {formatModifier(mod)}
                            </span>
                            <span className="text-[9px] font-sans font-bold text-slate-500 border-t border-slate-200 block pt-0.5">
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Salvaguardas (Testes de Resistência) */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1 font-sans">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
                        Testes de Resistência
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
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-0.5 font-sans">
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
                          <div key={key} className="flex items-center justify-between text-[9.5px] py-0.5 border-b border-slate-100 last:border-0">
                            <span className="flex items-center gap-1.5 truncate">
                              <span
                                className={`w-2 h-2 rounded-full border border-slate-800 shrink-0 ${
                                  prof === 'expertise'
                                    ? 'bg-amber-600 ring-1 ring-amber-700'
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

                    {/* Percepção Passiva */}
                    <div className="border border-slate-800 rounded-lg p-2 flex items-center justify-between font-sans bg-white">
                      <span className="text-[10px] font-bold">Percepção Passiva (Sabedoria)</span>
                      <span className="font-mono font-black text-sm">{passivePerception}</span>
                    </div>
                  </div>

                  {/* ================= COLUNA 2: COMBATE & EQUIPAMENTO ================= */}
                  <div className="space-y-3">
                    {/* Tríade de Defesa: CA, Iniciativa e Deslocamento */}
                    <div className="grid grid-cols-3 gap-2 font-sans text-center">
                      <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white relative">
                        <Shield className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Classe Armadura</span>
                        <span className="text-xl font-black">{character.armorClass}</span>
                      </div>
                      <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white">
                        <Sparkles className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Iniciativa</span>
                        <span className="text-xl font-black">
                          {formatModifier(getAbilityModifier(character.abilities.dex.score) + character.initiativeBonus)}
                        </span>
                      </div>
                      <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white">
                        <Award className="w-3.5 h-3.5 mx-auto text-slate-400 mb-0.5" />
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Deslocamento</span>
                        <span className="text-xl font-black">{character.speed}m</span>
                      </div>
                    </div>

                    {/* Pontos de Vida & Dados de Vida */}
                    <div className="border-2 border-slate-800 rounded-lg p-3 bg-white font-sans space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Heart size={12} className="text-rose-600" /> Pontos de Vida
                        </span>
                        <span className="text-slate-600 font-mono text-[10px]">Máx: {character.maxHp}</span>
                      </div>
                      <div className="text-center py-0.5">
                        <span className="text-2xl font-black">{character.currentHp} / {character.maxHp}</span>
                        {character.tempHp > 0 && (
                          <span className="text-xs text-sky-600 block font-bold">+{character.tempHp} PV Temporários</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[9.5px]">
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[8.5px]">Dados de Vida</span>
                          <span className="font-bold">{character.hitDice.current}/{character.hitDice.total} ({character.hitDice.dieType})</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase font-bold text-[8.5px]">Testes contra a Morte</span>
                          <div className="flex items-center justify-between text-[9px] mt-0.5">
                            <span className="text-emerald-700 font-bold">Sucessos:</span>
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className={`w-2 h-2 rounded-full border border-slate-800 ${
                                    character.deathSaves?.successes > i ? 'bg-emerald-600' : 'bg-transparent'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-0.5">
                            <span className="text-rose-700 font-bold">Falhas:</span>
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className={`w-2 h-2 rounded-full border border-slate-800 ${
                                    character.deathSaves?.failures > i ? 'bg-rose-600' : 'bg-transparent'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ataques & Armas */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1.5 font-sans">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        Ataques & Armas
                      </h3>
                      {character.attacks.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Nenhum ataque cadastrado.</p>
                      ) : (
                        <table className="w-full text-left text-[9.5px]">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-200">
                              <th className="font-semibold pb-1">Arma / Golpe</th>
                              <th className="font-semibold pb-1 text-center">Bônus</th>
                              <th className="font-semibold pb-1 text-right">Dano / Tipo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {character.attacks.map((att) => (
                              <tr key={att.id} className="border-b border-slate-100 last:border-0">
                                <td className="font-bold py-1">{att.name}</td>
                                <td className="font-mono font-bold text-center">{formatModifier(att.attackBonus)}</td>
                                <td className="text-slate-600 text-right">{att.damage} {att.damageType}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Inventário & Moedas */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1.5 font-sans">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          Inventário & Equipamento
                        </h3>
                        <span className="text-[9px] text-slate-500 font-mono font-bold">Peso: {totalWeight} kg</span>
                      </div>

                      {/* Moedas Oficiais */}
                      <div className="grid grid-cols-5 gap-1 text-center text-[9px] bg-slate-100 p-1 rounded font-mono">
                        <div>PC: <strong>{character.currency.cp}</strong></div>
                        <div>PP: <strong>{character.currency.sp}</strong></div>
                        <div>PE: <strong>{character.currency.ep}</strong></div>
                        <div>PO: <strong>{character.currency.gp}</strong></div>
                        <div>PL: <strong>{character.currency.pp}</strong></div>
                      </div>

                      <div className="space-y-0.5 max-h-44 overflow-hidden text-[9px]">
                        {character.inventory.slice(0, 12).map((item) => (
                          <div key={item.id} className="flex justify-between text-[9px] border-b border-slate-50 py-0.5">
                            <span className="truncate">
                              {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                            </span>
                            <span className="text-slate-400 font-mono">{item.weight * item.quantity}kg</span>
                          </div>
                        ))}
                        {character.inventory.length > 12 && (
                          <span className="text-[8.5px] text-slate-400 italic block pt-0.5">
                            + {character.inventory.length - 12} outros itens na mochila...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ================= COLUNA 3: ROLEPLAY & TALENTOS ================= */}
                  <div className="space-y-3">
                    {/* Caixas Oficiais de Roleplay */}
                    <div className="space-y-2 font-sans">
                      <div className="border border-slate-800 rounded-lg p-2 bg-white">
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block border-b border-slate-100 pb-0.5 mb-1">
                          Traços de Personalidade
                        </span>
                        <p className="text-[9.5px] text-slate-700 line-clamp-3 leading-snug">
                          {character.personalityTraits || '—'}
                        </p>
                      </div>

                      <div className="border border-slate-800 rounded-lg p-2 bg-white">
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block border-b border-slate-100 pb-0.5 mb-1">
                          Ideais
                        </span>
                        <p className="text-[9.5px] text-slate-700 line-clamp-2 leading-snug">
                          {character.ideals || '—'}
                        </p>
                      </div>

                      <div className="border border-slate-800 rounded-lg p-2 bg-white">
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block border-b border-slate-100 pb-0.5 mb-1">
                          Vínculos
                        </span>
                        <p className="text-[9.5px] text-slate-700 line-clamp-2 leading-snug">
                          {character.bonds || '—'}
                        </p>
                      </div>

                      <div className="border border-slate-800 rounded-lg p-2 bg-white">
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 block border-b border-slate-100 pb-0.5 mb-1">
                          Defeitos
                        </span>
                        <p className="text-[9.5px] text-slate-700 line-clamp-2 leading-snug">
                          {character.flaws || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Idiomas e Proficiências */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white font-sans space-y-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        Idiomas & Outras Proficiências
                      </h3>
                      <p className="text-[9.5px] text-slate-700 whitespace-pre-line leading-relaxed">
                        {character.proficienciesAndLanguages || 'Nenhum idioma cadastrado.'}
                      </p>
                    </div>

                    {/* Características & Talentos */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white font-sans space-y-1.5">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        Características & Talentos
                      </h3>
                      <div className="space-y-1.5 max-h-56 overflow-hidden">
                        {character.features.map((feat) => (
                          <div key={feat.id} className="border-b border-slate-100 pb-1 text-[9.5px]">
                            <span className="font-bold text-slate-900">{feat.name}</span>
                            <span className="text-[8.5px] text-slate-500 ml-1">({feat.source})</span>
                            <p className="text-slate-600 text-[8.5px] line-clamp-2 leading-tight mt-0.5">
                              {feat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Rodapé da Página 1 */}
                <div className="text-center text-[9px] text-slate-400 font-sans border-t border-slate-200 pt-2">
                  ArcanaSheet VTT • D&D 5e Character Sheet • Página 1 (Combate & Exploração)
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PÁGINA 2: BIOGRAFIA, APARÊNCIA & DIÁRIO DE CAMPANHA            */}
            {/* ============================================================== */}
            {(activePreviewPage === 'all' || activePreviewPage === '2') && (
              <div className="sheet-page w-full bg-[#fcfbfa] text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 font-serif text-[11px] leading-tight space-y-4">
                {/* Cabeçalho da Página 2 */}
                <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-wide text-slate-900">
                      {character.name || 'Sem Nome'} — Biografia & Crônica
                    </h2>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {character.race} {character.characterClass} • Nível {character.level}
                    </span>
                  </div>
                  <div className="text-right text-[10px] font-sans text-slate-600">
                    <span className="font-bold block">Página 2</span>
                    <span>Detalhes do Personagem</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Coluna 1: Aparência e Retrato */}
                  <div className="space-y-3 font-sans">
                    <div className="border border-slate-800 rounded-lg p-3 bg-white text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                        Retrato do Personagem
                      </span>
                      {character.avatarUrl ? (
                        <img
                          src={character.avatarUrl}
                          alt={character.name}
                          className="w-36 h-36 mx-auto rounded-full object-cover border-2 border-slate-900 shadow-md"
                        />
                      ) : (
                        <div className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                          <User size={32} />
                          <span className="text-[10px] mt-1">Sem Imagem</span>
                        </div>
                      )}
                    </div>

                    {/* Características Físicas */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1.5 text-[10px]">
                      <span className="text-[10px] uppercase font-bold text-slate-700 block border-b border-slate-200 pb-1">
                        Aparência Física
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                        <div><strong className="text-slate-600">Raça:</strong> {character.race}</div>
                        <div><strong className="text-slate-600">Tendência:</strong> {character.alignment || 'Neutro'}</div>
                        <div><strong className="text-slate-600">Altura:</strong> —</div>
                        <div><strong className="text-slate-600">Peso:</strong> —</div>
                        <div><strong className="text-slate-600">Olhos:</strong> —</div>
                        <div><strong className="text-slate-600">Pele:</strong> —</div>
                      </div>
                    </div>

                    {/* Aliados & Organizações */}
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1 text-[10px]">
                      <span className="text-[10px] uppercase font-bold text-slate-700 block border-b border-slate-200 pb-1">
                        Aliados & Organizações
                      </span>
                      {character.journal?.npcs && character.journal.npcs.length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-hidden text-[9px]">
                          {character.journal.npcs.slice(0, 5).map((npc) => (
                            <div key={npc.id} className="border-b border-slate-100 pb-0.5">
                              <span className="font-bold">{npc.name}</span>
                              <span className="text-slate-500 block text-[8px] truncate">{npc.notes}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9.5px] text-slate-400 italic">Nenhum aliado registrado no diário.</p>
                      )}
                    </div>
                  </div>

                  {/* Coluna 2 e 3: História e Diário */}
                  <div className="md:col-span-2 space-y-3 font-sans">
                    {/* História Pregressa (Backstory) */}
                    <div className="border border-slate-800 rounded-lg p-3 bg-white space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-700 block border-b border-slate-200 pb-1">
                        História do Personagem (Backstory)
                      </span>
                      <p className="text-[10px] text-slate-800 font-serif whitespace-pre-line leading-relaxed min-h-[120px]">
                        {character.backstory || 'Nenhuma história pregressa informada.'}
                      </p>
                    </div>

                    {/* Notas do Diário de Campanha (LoreNotes) */}
                    <div className="border border-slate-800 rounded-lg p-3 bg-white space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-700 block border-b border-slate-200 pb-1">
                        Anotações & Crônicas de Aventura
                      </span>
                      <p className="text-[10px] text-slate-800 font-serif whitespace-pre-line leading-relaxed min-h-[140px]">
                        {character.journal?.loreNotes || character.notes || 'Nenhuma crônica registrada no diário.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Página 2 */}
                <div className="text-center text-[9px] text-slate-400 font-sans border-t border-slate-200 pt-2">
                  ArcanaSheet VTT • D&D 5e Character Sheet • Página 2 (Biografia & Lore)
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PÁGINA 3: GRIMÓRIO OFICIAL DE MAGIAS (SPELLCASTING SHEET)      */}
            {/* ============================================================== */}
            {hasSpells && (activePreviewPage === 'all' || activePreviewPage === '3') && (
              <div className="sheet-page w-full bg-[#fcfbfa] text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 font-serif text-[11px] leading-tight space-y-4">
                {/* Cabeçalho do Conjurador */}
                <div className="border-2 border-slate-900 rounded-lg p-3 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
                  <div>
                    <h2 className="text-2xl font-black tracking-wide text-slate-900 font-serif">
                      Grimório Oficial de Magias
                    </h2>
                    <span className="text-xs text-slate-600">
                      {character.name} • {character.characterClass}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white">
                      <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Atributo Conjurador</span>
                      <span className="font-bold text-sm">{ABILITIES[spellAbility]?.name || 'Inteligência'}</span>
                    </div>
                    <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white">
                      <span className="text-[8.5px] uppercase font-bold text-slate-500 block">CD para Evitar</span>
                      <span className="font-black text-sm font-mono">{spellSaveDc}</span>
                    </div>
                    <div className="border-2 border-slate-800 rounded-lg p-1.5 bg-white">
                      <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Bônus de Ataque</span>
                      <span className="font-black text-sm font-mono">{formatModifier(spellAttackBonus)}</span>
                    </div>
                  </div>
                </div>

                {/* Grid dos Círculos de Magia */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
                  {/* Truques (Círculo 0) */}
                  <div className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1">
                    <div className="border-b border-slate-200 pb-1 flex justify-between items-center">
                      <span className="font-bold text-xs">✦ Truques (Nível 0)</span>
                      <span className="text-[9px] text-slate-500">Ilimitados</span>
                    </div>
                    <div className="space-y-1 text-[9px] min-h-[90px]">
                      {spellsByLevel(0).map((sp) => (
                        <div key={sp.id} className="flex justify-between border-b border-slate-50 pb-0.5">
                          <span className="font-bold">{sp.name}</span>
                          <span className="text-slate-500">{sp.school}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Círculos 1 a 9 */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                    const spells = spellsByLevel(lvl);
                    const slot = (character.spellcasting?.slots || []).find((s) => s.level === lvl);
                    const maxSlots = slot?.max || 0;
                    const usedSlots = slot?.used || 0;

                    return (
                      <div key={lvl} className="border border-slate-800 rounded-lg p-2.5 bg-white space-y-1">
                        <div className="border-b border-slate-200 pb-1 flex justify-between items-center">
                          <span className="font-bold text-xs">{lvl}º Círculo</span>
                          <span className="text-[9px] font-mono text-slate-600">
                            Espaços: <strong>{maxSlots - usedSlots}/{maxSlots}</strong>
                          </span>
                        </div>
                        <div className="space-y-1 text-[9px] min-h-[85px]">
                          {spells.length === 0 ? (
                            <span className="text-slate-400 italic block pt-1 text-[8.5px]">Nenhuma magia aprendida</span>
                          ) : (
                            spells.map((sp) => (
                              <div key={sp.id} className="flex items-center justify-between border-b border-slate-50 pb-0.5">
                                <span className="flex items-center gap-1 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full ${sp.prepared ? 'bg-amber-600' : 'bg-slate-300'}`} />
                                  <span className="font-bold truncate">{sp.name}</span>
                                </span>
                                <span className="text-slate-400 text-[8px] truncate ml-1">{sp.school}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rodapé da Página 3 */}
                <div className="text-center text-[9px] text-slate-400 font-sans border-t border-slate-200 pt-2">
                  ArcanaSheet VTT • D&D 5e Character Sheet • Página 3 (Grimório & Magias)
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
