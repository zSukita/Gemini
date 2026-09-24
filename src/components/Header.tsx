import React, { useState } from 'react';
import type { Character } from '../types/dnd5e';
import { getProficiencyBonus } from '../utils/calculations';
import { SRD_CLASSES } from '../data/srdClasses';
import { SRD_RACES } from '../data/srdRaces';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Users, 
  Award, 
  ChevronDown, 
  Edit3, 
  Check,
  ArrowUpCircle
} from 'lucide-react';

interface HeaderProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  onOpenCharacterManager: () => void;
  onOpenLevelUp?: () => void;
  onOpenWizard?: () => void;
  onShortRest: () => void;
  onLongRest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  character,
  updateCharacter,
  onOpenCharacterManager,
  onOpenLevelUp,
  onOpenWizard,
  onShortRest,
  onLongRest,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showRestMenu, setShowRestMenu] = useState(false);
  const [isCustomClass, setIsCustomClass] = useState(() => !SRD_CLASSES.some((c) => c.name === character.characterClass));
  const [isCustomRace, setIsCustomRace] = useState(() => !SRD_RACES.some((r) => r.name === character.race));

  const handleSelectClass = (className: string) => {
    const cls = SRD_CLASSES.find((c) => c.name === className);
    if (cls) {
      updateCharacter((prev) => ({
        ...prev,
        characterClass: cls.name,
        avatarUrl: prev.avatarUrl && !prev.avatarUrl.startsWith('/tokens/classes/') ? prev.avatarUrl : cls.avatarUrl,
        hitDice: {
          ...prev.hitDice,
          dieType: cls.hitDie,
        },
        abilities: {
          ...prev.abilities,
          str: { ...prev.abilities.str, saveProficient: cls.savingThrows.includes('str') },
          dex: { ...prev.abilities.dex, saveProficient: cls.savingThrows.includes('dex') },
          con: { ...prev.abilities.con, saveProficient: cls.savingThrows.includes('con') },
          int: { ...prev.abilities.int, saveProficient: cls.savingThrows.includes('int') },
          wis: { ...prev.abilities.wis, saveProficient: cls.savingThrows.includes('wis') },
          cha: { ...prev.abilities.cha, saveProficient: cls.savingThrows.includes('cha') },
        },
      }));
    } else {
      updateCharacter({ characterClass: className });
    }
  };

  const handleSelectRace = (raceName: string) => {
    const rc = SRD_RACES.find((r) => r.name === raceName);
    if (rc) {
      updateCharacter((prev) => ({
        ...prev,
        race: rc.name,
        speed: rc.speed,
      }));
    } else {
      updateCharacter({ race: raceName });
    }
  };

  const profBonus = getProficiencyBonus(character.level);

  // Níveis de XP no D&D 5e
  const xpThresholds = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
  ];
  const nextXp = xpThresholds[character.level] || 355000;
  const prevXp = xpThresholds[character.level - 1] || 0;
  const xpProgress = Math.min(100, Math.max(0, ((character.experience - prevXp) / (nextXp - prevXp || 1)) * 100));

  const currentClassObj = SRD_CLASSES.find(
    (c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()
  );
  const avatarSrc = character.avatarUrl || currentClassObj?.avatarUrl;

  return (
    <header className="rpg-card rounded-xl p-4 sm:p-6 mb-6 relative overflow-hidden border-amber-900/30">
      {/* Detalhe estético dourado superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 opacity-70" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Lado Esquerdo: Nome e Detalhes Principais */}
        <div className="flex-1 flex items-start gap-3.5 sm:gap-4">
          {avatarSrc && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-xl shadow-amber-950/30 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={avatarSrc}
                alt={character.name || character.characterClass}
                className="w-full h-full object-contain filter drop-shadow hover:scale-105 transition duration-200"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-amber-200 drop-shadow-sm flex items-center gap-2 truncate">
                {character.name ? (
                  character.name
                ) : (
                  <span className="text-slate-500 italic font-normal text-xl">Novo Personagem (Em Branco)</span>
                )}
              </h1>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition shrink-0"
                title="Editar dados básicos"
              >
                {isEditingInfo ? <Check size={18} className="text-emerald-400" /> : <Edit3 size={18} />}
              </button>
            </div>

          {/* Botões de Ação Imediata se a Ficha Estiver em Branco */}
          {!character.name && !isEditingInfo && (
            <div className="mt-2.5 mb-1 flex flex-wrap items-center gap-2">
              {onOpenWizard && (
                <button
                  type="button"
                  onClick={onOpenWizard}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-600/20 transition active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Criar Personagem (Passo a Passo)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                Preencher Ficha Manualmente
              </button>
            </div>
          )}

          {/* Subtítulo / Informações de Classe e Raça */}
          {!isEditingInfo ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              <span className="font-semibold text-amber-300/90">
                {character.characterClass || 'Classe a Definir'} Nvl {character.level}
              </span>
              <span className="text-slate-500">•</span>
              <span>{character.race || 'Raça a Definir'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{character.background || 'Antecedente'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{character.alignment || 'Tendência'}</span>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">Nome</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => updateCharacter({ name: e.target.value })}
                  className="rpg-input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Classe</label>
                <select
                  value={isCustomClass ? '__custom__' : character.characterClass}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomClass(true);
                    } else {
                      setIsCustomClass(false);
                      handleSelectClass(e.target.value);
                    }
                  }}
                  className="rpg-input w-full text-xs"
                >
                  <optgroup label="Classes D&D 5e SRD">
                    {SRD_CLASSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.hitDie})
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">Outra / Personalizada...</option>
                </select>
                {isCustomClass && (
                  <input
                    type="text"
                    placeholder="Nome da classe..."
                    value={character.characterClass}
                    onChange={(e) => updateCharacter({ characterClass: e.target.value })}
                    className="rpg-input w-full text-xs mt-1"
                  />
                )}
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Nível (1-20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={character.level}
                  onChange={(e) => updateCharacter({ level: parseInt(e.target.value, 10) || 1 })}
                  className="rpg-input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Raça</label>
                <select
                  value={isCustomRace ? '__custom__' : character.race}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomRace(true);
                    } else {
                      setIsCustomRace(false);
                      handleSelectRace(e.target.value);
                    }
                  }}
                  className="rpg-input w-full text-xs"
                >
                  <optgroup label="Raças D&D 5e SRD">
                    {SRD_RACES.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">Outra / Personalizada...</option>
                </select>
                {isCustomRace && (
                  <input
                    type="text"
                    placeholder="Nome da raça..."
                    value={character.race}
                    onChange={(e) => updateCharacter({ race: e.target.value })}
                    className="rpg-input w-full text-xs mt-1"
                  />
                )}
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Antecedente</label>
                <input
                  type="text"
                  value={character.background}
                  onChange={(e) => updateCharacter({ background: e.target.value })}
                  className="rpg-input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Tendência</label>
                <input
                  type="text"
                  value={character.alignment}
                  onChange={(e) => updateCharacter({ alignment: e.target.value })}
                  className="rpg-input w-full text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Experiência (XP)</label>
                <input
                  type="number"
                  min={0}
                  value={character.experience}
                  onChange={(e) => updateCharacter({ experience: parseInt(e.target.value, 10) || 0 })}
                  className="rpg-input w-full text-xs"
                />
              </div>
            </div>
          )}

          {/* Barra de XP */}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 max-w-md">
            <span className="font-mono text-amber-300/80">{character.experience} XP</span>
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <span className="text-slate-500 font-mono">Próx: {nextXp}</span>
          </div>
        </div>
      </div>

        {/* Lado Direito: Ações Rápidas, Inspiração e Descansos */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          {/* Bônus de Proficiência */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 rounded-lg px-3 py-1.5">
            <Award className="text-amber-400" size={18} />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Proficiência</span>
              <span className="text-sm font-bold text-amber-300 font-mono">+{profBonus}</span>
            </div>
          </div>

          {/* Inspiração */}
          <button
            onClick={() => updateCharacter((prev) => ({ ...prev, inspiration: !prev.inspiration }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              character.inspiration
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
            title="Clique para ativar/desativar Inspiração"
          >
            <Sparkles size={16} className={character.inspiration ? 'text-amber-400 animate-pulse' : 'text-slate-500'} />
            <span className="text-xs font-semibold">Inspiração</span>
          </button>

          {/* Menu de Descanso */}
          <div className="relative">
            <button
              onClick={() => setShowRestMenu(!showRestMenu)}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Moon size={15} className="text-indigo-400" />
              <span>Descanso</span>
              <ChevronDown size={14} />
            </button>

            {showRestMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 z-30 flex flex-col gap-1 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowRestMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowRestMenu(false);
                    onShortRest();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded transition"
                >
                  <Sun size={14} className="text-amber-400" />
                  <div>
                    <div className="font-semibold">Descanso Curto</div>
                    <div className="text-[10px] text-slate-400">Gastar dados de vida</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowRestMenu(false);
                    onLongRest();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded transition"
                >
                  <Moon size={14} className="text-indigo-400" />
                  <div>
                    <div className="font-semibold text-indigo-300">Descanso Longo</div>
                    <div className="text-[10px] text-slate-400">Recupera todo HP e slots</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Botão de Subir de Nível */}
          <button
            onClick={() => onOpenLevelUp?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-600/30 active:scale-95 transition"
            title="Subir de Nível (Level Up Wizard)"
          >
            <ArrowUpCircle size={16} />
            <span>Evoluir (Nvl {character.level + 1})</span>
          </button>

          {/* Trocar / Gerenciar Personagens */}
          <button
            onClick={onOpenCharacterManager}
            className="rpg-button bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40"
            title="Alternar ou gerenciar fichas"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Fichas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
