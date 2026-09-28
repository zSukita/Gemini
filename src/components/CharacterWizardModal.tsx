import React, { useState, useMemo } from 'react';
import type { AbilityKey, Character } from '../types/dnd5e';
import { ABILITIES } from '../types/dnd5e';
import { SRD_CLASSES, type SrdClassDefinition } from '../data/srdClasses';
import { SRD_RACES, type SrdRaceDefinition } from '../data/srdRaces';
import {
  STANDARD_ARRAY,
  roll4d6DropLowest,
  buildCharacterFromWizard,
} from '../utils/characterCreation';
import { getAbilityModifier } from '../utils/calculations';
import {
  X,
  Shield,
  Heart,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Dices,
  Check,
  Award,
  Zap,
  Play,
} from 'lucide-react';

interface CharacterWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
}

export interface PresetHero {
  id: string;
  name: string;
  title: string;
  classId: string;
  raceId: string;
  background: string;
  alignment: string;
  avatarUrl: string;
  tagline: string;
  role: string;
  description: string;
  highlights: string[];
  baseAbilities: Record<AbilityKey, number>;
  difficulty: 'Muito Fácil' | 'Fácil' | 'Equilibrado';
}

export const PRESET_HEROES: PresetHero[] = [
  {
    id: 'preset-paladin',
    name: 'Valerius da Alvorada',
    title: 'Paladino Sagrado',
    classId: 'paladin',
    raceId: 'human',
    background: 'Soldado',
    alignment: 'Leal e Bom',
    avatarUrl: '/tokens/classes/paladin.png',
    tagline: 'Defensor Inquebrável & Golpe Sagrado',
    role: 'Tanque / Linha de Frente / Cura',
    description: 'Veste cota de malha pesada, escudo de ferro e espada longa. Protege companheiros e purifica monstros malignos.',
    highlights: ['🛡️ CA 18 (Muito resistente)', '❤️ 12 PVs iniciais', '✨ Imposição de Mãos (Cura)', '⚔️ Espada Longa (+5 / 1d8+3)'],
    baseAbilities: { str: 15, con: 14, cha: 13, dex: 12, wis: 10, int: 8 },
    difficulty: 'Muito Fácil',
  },
  {
    id: 'preset-wizard',
    name: 'Lyra Luaprata',
    title: 'Maga Arcana',
    classId: 'wizard',
    raceId: 'elf',
    background: 'Sábio',
    alignment: 'Caótico e Bom',
    avatarUrl: '/tokens/classes/wizard.png',
    tagline: 'Mestra dos Elementos & Magias Arcanas',
    role: 'Dano à Distância / Controle Arcano',
    description: 'Erudita élfica que domina as leis arcanas. Conhece truques elementais, dispara Mísseis Mágicos certeiros e ergue Escudo Arcano.',
    highlights: ['✨ Mísseis Mágicos & Escudo', '🎯 Ataques Mágicos à Distância', '👁️ Visão no Escuro (18m)', '🧠 Inteligência 16 (+3 no ataque)'],
    baseAbilities: { int: 15, dex: 14, con: 13, wis: 12, cha: 10, str: 8 },
    difficulty: 'Fácil',
  },
  {
    id: 'preset-rogue',
    name: 'Finnick Pés-Leves',
    title: 'Ladino Trapaceiro',
    classId: 'rogue',
    raceId: 'halfling',
    background: 'Criminoso',
    alignment: 'Neutro e Bom',
    avatarUrl: '/tokens/classes/rogue.png',
    tagline: 'Furtividade Suprema & Ataque Furtivo',
    role: 'Dano Crítico / Desarmar Armadilhas',
    description: 'Ágil e silencioso. Move-se pelas sombras sem ser visto, desarma perigos mortais e golpeia pontos vitais com ataque furtivo devastador.',
    highlights: ['🗡️ Ataque Furtivo (+1d6 de dano)', '🎲 Sortudo (Rola de novo 1 natural)', '🤫 Furtividade (+5)', '🏹 Rapieira & Arco Curto'],
    baseAbilities: { dex: 15, con: 14, int: 13, cha: 12, wis: 10, str: 8 },
    difficulty: 'Muito Fácil',
  },
  {
    id: 'preset-cleric',
    name: 'Thorin Martelo-de-Ferro',
    title: 'Clérigo da Guerra & Vida',
    classId: 'cleric',
    raceId: 'dwarf',
    background: 'Acólito',
    alignment: 'Leal e Bom',
    avatarUrl: '/tokens/classes/cleric.png',
    tagline: 'Bênção Divina & Força Implacável',
    role: 'Suporte Vital / Cura / Combatente',
    description: 'Sacerdote anão da cura e da forja. Empunha maça de guerra e orações para manter seus companheiros sempre protegidos e vivos.',
    highlights: ['💚 Magias de Cura Divina', '🛡️ CA 18 (Escudo + Armadura)', '🧪 Resistência Anã a Venenos', '❤️ 11 PVs & Constituição 16 (+3)'],
    baseAbilities: { wis: 15, con: 14, str: 13, cha: 12, dex: 10, int: 8 },
    difficulty: 'Fácil',
  },
];

const BACKGROUNDS = [
  'Acólito',
  'Charlatão',
  'Criminoso',
  'Artista',
  'Herói do Povo',
  'Artesão de Guilda',
  'Nobre',
  'Forasteiro',
  'Sábio',
  'Marinheiro',
  'Soldado',
  'Órfão',
];

const ALIGNMENTS = [
  'Leal e Bom',
  'Neutro e Bom',
  'Caótico e Bom',
  'Leal e Neutro',
  'Neutro Puro',
  'Caótico e Neutro',
  'Leal e Mau',
  'Neutro e Mau',
  'Caótico e Mau',
];

const RANDOM_NAMES = [
  'Valeros',
  'Eldrin Coração-de-Carvalho',
  'Lyra Luaprata',
  'Thorin Martelo-de-Ferro',
  'Seraphina Nightshade',
  'Garrick Lâmina-Ágil',
  'Tharok Olho-de-Fogo',
  'Morrigan das Brumas',
  'Baelor da Luz Solar',
  'Kaelen Vento-do-Norte',
];

export const CharacterWizardModal: React.FC<CharacterWizardModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [creationMode, setCreationMode] = useState<'presets' | 'custom'>('presets');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Passo 1: Identidade
  const [name, setName] = useState('');
  const [background, setBackground] = useState('Soldado');
  const [alignment, setAlignment] = useState('Neutro e Bom');

  // Passo 2: Raça
  const [selectedRaceId, setSelectedRaceId] = useState<string>('human');

  // Passo 3: Classe
  const [selectedClassId, setSelectedClassId] = useState<string>('fighter');

  // Passo 4: Atributos
  const [attributeMode, setAttributeMode] = useState<'standard' | 'rolled'>('standard');
  const [baseScores, setBaseScores] = useState<Record<AbilityKey, number>>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  const selectedRace: SrdRaceDefinition = useMemo(
    () => SRD_RACES.find((r) => r.id === selectedRaceId) || SRD_RACES[0],
    [selectedRaceId]
  );

  const selectedClass: SrdClassDefinition = useMemo(
    () => SRD_CLASSES.find((c) => c.id === selectedClassId) || SRD_CLASSES[4],
    [selectedClassId]
  );

  // Calcula valores finais dos atributos com bônus racial
  const finalAbilities = useMemo(() => {
    const keys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const res: Record<AbilityKey, { base: number; bonus: number; total: number; mod: number }> = {} as any;

    keys.forEach((k) => {
      const base = baseScores[k] || 10;
      const bonus = selectedRace.abilityBonuses[k] || 0;
      const total = base + bonus;
      const mod = getAbilityModifier(total);
      res[k] = { base, bonus, total, mod };
    });
    return res;
  }, [baseScores, selectedRace]);

  // PV Inicial
  const startingHp = useMemo(() => {
    const conMod = finalAbilities.con.mod;
    return Math.max(1, selectedClass.hitDieValue + conMod);
  }, [selectedClass, finalAbilities]);

  // Rolar 4d6 para todos os 6 atributos
  const handleRollAllAttributes = () => {
    const keys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const newScores: Record<AbilityKey, number> = {} as any;

    keys.forEach((k) => {
      const res = roll4d6DropLowest();
      newScores[k] = res.total;
    });

    setBaseScores(newScores);
    setAttributeMode('rolled');
  };

  // Reset para Array Padrão
  const handleResetStandardArray = () => {
    // Aloca os valores mais altos nos atributos primários da classe
    const prim = selectedClass.primaryAbilities;
    const remainingKeys = (['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).filter(
      (k) => !prim.includes(k)
    );

    const orderedKeys = [...prim, ...remainingKeys];
    const newScores: Record<AbilityKey, number> = {} as any;

    orderedKeys.forEach((key, idx) => {
      newScores[key] = STANDARD_ARRAY[idx] || 10;
    });

    setBaseScores(newScores);
    setAttributeMode('standard');
  };

  const handleFinishCreation = () => {
    const character = buildCharacterFromWizard({
      name: name.trim() || 'Aventureiro Sem Nome',
      classId: selectedClassId,
      raceId: selectedRaceId,
      background,
      alignment,
      baseAbilities: baseScores,
    });

    onCharacterCreated(character);
    onClose();
  };

  const handleInstantPresetSelect = (preset: PresetHero) => {
    const character = buildCharacterFromWizard({
      name: preset.name,
      classId: preset.classId,
      raceId: preset.raceId,
      background: preset.background,
      alignment: preset.alignment,
      baseAbilities: preset.baseAbilities,
    });
    onCharacterCreated(character);
    onClose();
  };

  const handleCustomizePreset = (preset: PresetHero) => {
    setName(preset.name);
    setSelectedRaceId(preset.raceId);
    setSelectedClassId(preset.classId);
    setBackground(preset.background);
    setAlignment(preset.alignment);
    setBaseScores(preset.baseAbilities);
    setCreationMode('custom');
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Assistente de Criação de Personagem"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="rpg-card w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col border border-amber-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo / Progresso & Seleção de Modo */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} />
              <h2 className="font-serif text-lg font-bold text-amber-200">
                Criar Aventureiro (D&D 5e)
              </h2>
            </div>

            {/* Alternador de Modo: Heróis Prontos vs Passo a Passo */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCreationMode('presets')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  creationMode === 'presets'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={13} className={creationMode === 'presets' ? 'text-slate-950' : 'text-amber-400'} />
                <span>Heróis Prontos (Rápido)</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('custom')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  creationMode === 'custom'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={13} className={creationMode === 'custom' ? 'text-slate-950' : 'text-amber-400'} />
                <span>Criar do Zero</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Se estiver no modo personalizado, exibe indicador de 5 passos */}
          {creationMode === 'custom' ? (
            <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold text-center">
              {[
                { num: 1, label: 'Identidade' },
                { num: 2, label: 'Raça' },
                { num: 3, label: 'Classe' },
                { num: 4, label: 'Atributos' },
                { num: 5, label: 'Resumo' },
              ].map((p) => (
                <button
                  key={p.num}
                  type="button"
                  onClick={() => setStep(p.num as any)}
                  className={`py-1.5 px-1 rounded-lg border transition flex items-center justify-center gap-1.5 ${
                    step === p.num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                      : step > p.num
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                      : 'bg-slate-950/60 text-slate-500 border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">
                    {step > p.num ? '✓' : p.num}
                  </span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-amber-300/80 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2">
              <span>⚡ <strong>Começo em 1 Clique:</strong> Escolha um arquétipo equilibrado e balanceado para entrar na aventura em segundos!</span>
              <span className="text-[11px] text-amber-400/90 font-mono hidden sm:inline">1º Nível Oficial D&D 5e</span>
            </div>
          )}
        </div>

        {/* Conteúdo Dinâmico por Passo ou Heróis Prontos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {creationMode === 'presets' ? (
            <div className="space-y-4">
              <div className="text-center max-w-xl mx-auto mb-2">
                <h3 className="font-serif text-xl font-bold text-amber-100 flex items-center justify-center gap-2">
                  <Zap className="text-amber-400" size={20} />
                  <span>Escolha seu Herói Pronto</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Personagens clássicos de 1º Nível balanceados para D&D 5e. Escolha um para começar a jogar imediatamente ou ajuste detalhes do seu jeito.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_HEROES.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/60 hover:bg-slate-900/95 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={preset.avatarUrl}
                              alt={preset.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="font-serif text-base font-bold text-amber-200 group-hover:text-amber-100 transition">
                              {preset.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="font-semibold text-amber-400">{preset.title}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[11px] text-slate-400">{preset.background}</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0">
                          {preset.difficulty}
                        </span>
                      </div>

                      {/* Tagline e Descrição */}
                      <div>
                        <p className="text-xs font-semibold text-amber-300/90">{preset.tagline}</p>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{preset.description}</p>
                      </div>

                      {/* Destaques em Badges */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/60">
                        {preset.highlights.map((h, i) => (
                          <div
                            key={i}
                            className="text-[10px] bg-slate-950/70 border border-slate-800 px-2 py-1 rounded text-slate-300 flex items-center gap-1 font-medium"
                          >
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações: Jogar Agora vs Ajustar */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInstantPresetSelect(preset)}
                        className="flex-1 rpg-button bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
                      >
                        <Play size={13} className="fill-slate-950" />
                        <span>⚡ Jogar Agora</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCustomizePreset(preset)}
                        className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition border border-slate-700 hover:border-slate-500"
                        title="Personalizar detalhes deste herói no criador passo a passo"
                      >
                        <span>✏️ Ajustar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* PASSO 1: IDENTIDADE */}
              {step === 1 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-amber-100">
                  Quem é o seu herói?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Defina o nome, a conduta moral e a história pregressa do aventureiro.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Nome do Personagem</label>
                  <button
                    type="button"
                    onClick={() => {
                      const r = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
                      setName(r);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    Sugerir Nome
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Valeros, o Destemido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rpg-input w-full py-2 px-3 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Antecedente (Background)
                  </label>
                  <select
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="rpg-input w-full py-2 px-2 text-xs"
                  >
                    {BACKGROUNDS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tendência Moral (Alignment)
                  </label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="rpg-input w-full py-2 px-2 text-xs"
                  >
                    {ALIGNMENTS.map((al) => (
                      <option key={al} value={al}>{al}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                <Award className="text-amber-400 shrink-0 mt-0.5" size={16} />
                <span>
                  O antecedente e a tendência enriquecem a interpretação do seu personagem e fornecem o contexto das suas motivações no mundo.
                </span>
              </div>
            </div>
          )}

          {/* PASSO 2: RAÇA */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-amber-100">
                  Escolha a Raça do seu Aventureiro
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A raça define traços biológicos, velocidade, visão no escuro e bônus de atributos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SRD_RACES.map((race) => {
                  const isSelected = selectedRaceId === race.id;

                  return (
                    <div
                      key={race.id}
                      onClick={() => setSelectedRaceId(race.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition flex flex-col justify-between gap-3 text-left ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-base text-slate-100">
                            {race.name}
                          </h4>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {race.description}
                        </p>
                      </div>

                      {/* Bônus de Atributos */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 text-[11px]">
                        {Object.entries(race.abilityBonuses).map(([key, val]) => (
                          <span
                            key={key}
                            className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/40"
                          >
                            +{val} {ABILITIES[key as AbilityKey]?.abbr}
                          </span>
                        ))}
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {race.speed}m
                        </span>
                        {race.darkvision > 0 && (
                          <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700/50">
                            Visão Escuro {race.darkvision}m
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalhes da Raça Selecionada */}
              {selectedRace && (
                <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2">
                  <h4 className="font-serif font-bold text-sm text-amber-200">
                    Traços Raciais de {selectedRace.name}:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedRace.traits.map((t) => (
                      <div key={t.name} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <strong className="text-amber-300">{t.name}:</strong>{' '}
                        <span className="text-slate-300">{t.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 3: CLASSE */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-amber-100">
                  Escolha a Classe
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  A classe é a vocação marcial ou mágica, determinando dados de vida, perícias e armas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SRD_CLASSES.map((cls) => {
                  const isSelected = selectedClassId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`cursor-pointer p-3 sm:p-4 rounded-xl border transition flex flex-col justify-between gap-3 text-left ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                          <img
                            src={cls.avatarUrl}
                            alt={cls.name}
                            className="w-full h-full object-contain filter drop-shadow hover:scale-110 transition duration-200"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-serif font-bold text-base text-slate-100 truncate">
                              {cls.name}
                            </h4>
                            <span className="font-mono text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded shrink-0">
                              {cls.hitDie}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {cls.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 text-[11px]">
                        <span className="text-slate-400">Salvas:</span>
                        {cls.savingThrows.map((s) => (
                          <span key={s} className="bg-slate-800 text-slate-200 font-bold px-1.5 py-0.5 rounded">
                            {ABILITIES[s]?.abbr}
                          </span>
                        ))}
                        {cls.spellcastingAbility && (
                          <span className="bg-sky-950 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-700/50 flex items-center gap-1">
                            <Zap size={10} /> Magia
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalhes da Classe Selecionada */}
              {selectedClass && (
                <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-amber-950/40 border border-amber-500/40 p-1 flex items-center justify-center shrink-0 shadow-lg">
                      <img
                        src={selectedClass.avatarUrl}
                        alt={selectedClass.name}
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-serif font-bold text-base text-amber-200">
                          {selectedClass.name} — Habilidades de 1º Nível
                        </h4>
                        <span className="text-xs text-slate-400">
                          Dado de Vida: <strong className="text-amber-300">1{selectedClass.hitDie}</strong> • PV Inicial:{' '}
                          <strong className="text-emerald-400">{selectedClass.hitDieValue} + Mod CON</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedClass.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedClass.features.map((f) => (
                      <div key={f.name} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <strong className="text-amber-300">{f.name}:</strong>{' '}
                        <span className="text-slate-300">{f.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 4: DISTRIBUIÇÃO DE ATRIBUTOS */}
          {step === 4 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-amber-100">
                  Distribuição de Atributos
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Defina os valores de Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma.
                </p>
              </div>

              {/* Controles de Modo de Geração */}
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={handleResetStandardArray}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    attributeMode === 'standard'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Array Padrão (15, 14, 13, 12, 10, 8)
                </button>

                <button
                  type="button"
                  onClick={handleRollAllAttributes}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    attributeMode === 'rolled'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Dices size={14} />
                  Rolar 4d6 (Descarta Menor)
                </button>
              </div>

              {/* Tabela de Atributos */}
              <div className="space-y-2">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map((key) => {
                  const def = ABILITIES[key];
                  const item = finalAbilities[key];
                  const isPrimary = selectedClass.primaryAbilities.includes(key);

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isPrimary
                          ? 'bg-amber-950/20 border-amber-600/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif font-black text-sm text-slate-100 w-10">
                          {def.abbr}
                        </span>
                        <div>
                          <span className="text-xs text-slate-300 font-semibold">{def.name}</span>
                          {isPrimary && (
                            <span className="text-[10px] text-amber-400 ml-2 font-bold">
                              ★ Primário da Classe
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Seletor de Base */}
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-500">Base:</label>
                          <input
                            type="number"
                            min={3}
                            max={18}
                            value={baseScores[key]}
                            onChange={(e) =>
                              setBaseScores((prev) => ({
                                ...prev,
                                [key]: parseInt(e.target.value, 10) || 10,
                              }))
                            }
                            className="rpg-input w-14 text-center text-xs font-mono font-bold py-1"
                          />
                        </div>

                        {/* Bônus Racial */}
                        <span className="text-xs font-mono font-bold text-amber-400 w-12 text-center">
                          {item.bonus > 0 ? `+${item.bonus}` : '—'}
                        </span>

                        {/* Total Final e Modificador */}
                        <div className="flex items-center gap-1.5 w-20 justify-end">
                          <span className="font-mono text-base font-black text-slate-100">
                            {item.total}
                          </span>
                          <span
                            className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                              item.mod >= 0
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                            }`}
                          >
                            {item.mod >= 0 ? `+${item.mod}` : item.mod}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Os bônus de <strong>{selectedRace.name}</strong> já foram aplicados automaticamente na coluna da direita!
              </p>
            </div>
          )}

          {/* PASSO 5: RESUMO E CONFIRMAÇÃO */}
          {step === 5 && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-amber-100">
                  Pronto para a Aventura!
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Revise os dados antes de gerar sua ficha oficial.
                </p>
              </div>

              {/* Card de Apresentação */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950/90 border border-amber-500/50 p-1 flex items-center justify-center shrink-0 shadow-md">
                      <img
                        src={selectedClass.avatarUrl}
                        alt={selectedClass.name}
                        className="w-full h-full object-contain filter drop-shadow"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-black text-xl text-amber-200 truncate">
                        {name.trim() || 'Aventureiro Sem Nome'}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {selectedRace.name} • {selectedClass.name} Nível 1 • {background}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg shrink-0">
                    {alignment}
                  </span>
                </div>

                {/* Métricas Principais */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <Heart size={16} className="text-rose-500 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">Pontos de Vida</span>
                    <strong className="font-mono text-base text-rose-300">{startingHp} PV</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <Shield size={16} className="text-cyan-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">Dado de Vida</span>
                    <strong className="font-mono text-base text-cyan-300">1{selectedClass.hitDie}</strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <Zap size={16} className="text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">Deslocamento</span>
                    <strong className="font-mono text-base text-amber-300">{selectedRace.speed}m</strong>
                  </div>
                </div>

                {/* Resumo de Atributos */}
                <div className="grid grid-cols-6 gap-1 text-center font-mono text-xs pt-1">
                  {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map((k) => (
                    <div key={k} className="bg-slate-950/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block font-serif font-bold">
                        {ABILITIES[k]?.abbr}
                      </span>
                      <strong className="text-slate-100">{finalAbilities[k].total}</strong>
                      <span className="text-[10px] text-emerald-400 block font-bold">
                        {finalAbilities[k].mod >= 0 ? `+${finalAbilities[k].mod}` : finalAbilities[k].mod}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Equipamento Inicial */}
                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Armas Iniciais:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedClass.startingEquipment
                      .filter((e) => e.damage)
                      .map((e) => (
                        <span key={e.name} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {e.name} ({e.damage})
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>

    {/* Rodapé com Navegação */}
    <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
      {creationMode === 'presets' ? (
        <div className="w-full flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-400">
            Quer escolher cada atributo, talento e histórico por conta própria?
          </span>
          <button
            type="button"
            onClick={() => setCreationMode('custom')}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Sparkles size={14} />
            <span>Criar Ficha do Zero Passo a Passo</span>
          </button>
        </div>
      ) : (
        <>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-4 rounded-xl"
            >
              <ChevronLeft size={14} />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCreationMode('presets')}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded-xl flex items-center gap-1"
            >
              <Zap size={13} className="text-amber-400" />
              <span>Voltar para Heróis Prontos</span>
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl shadow"
            >
              <span>Avançar</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishCreation}
              className="rpg-button bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2 animate-pulse"
            >
              <Check size={16} />
              <span>Concluir e Criar Personagem</span>
            </button>
          )}
        </>
      )}
    </div>
      </div>
    </div>
  );
};
