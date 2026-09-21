import React, { useState } from 'react';
import { 
  startAmbience, 
  stopAmbience, 
  stopAllAmbience, 
  setAmbienceVolume, 
  isAmbienceActive,
  playVictoryFanfare,
  playDangerAlarm,
  playGoldCoins,
  playMonsterRoar,
  type AmbienceType
} from '../../utils/ambienceSound';
import { 
  Volume2, 
  Play, 
  Square, 
  X, 
  CloudRain, 
  Flame, 
  Beer, 
  Skull, 
  Swords, 
  Sparkles, 
  Volume1 
} from 'lucide-react';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AmbienceItem {
  id: AmbienceType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultVolume: number;
}

const AMBIENCE_LIST: AmbienceItem[] = [
  {
    id: 'tavern',
    title: 'Taverna Medieval',
    description: 'Burburinho de vozes, canecas e notas suaves de alaúde.',
    icon: <Beer className="w-5 h-5 text-amber-400" />,
    defaultVolume: 0.4,
  },
  {
    id: 'rain',
    title: 'Chuva & Tempestade',
    description: 'Chuva contínua com trovões distantes e envolventes.',
    icon: <CloudRain className="w-5 h-5 text-blue-400" />,
    defaultVolume: 0.35,
  },
  {
    id: 'campfire',
    title: 'Fogueira de Acampamento',
    description: 'Brasas crepitantes e brisa noturna tranquila.',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    defaultVolume: 0.4,
  },
  {
    id: 'dungeon',
    title: 'Masmorra & Caverna Sombria',
    description: 'Vento uivante em pedras frias e goteiras em eco.',
    icon: <Skull className="w-5 h-5 text-purple-400" />,
    defaultVolume: 0.3,
  },
  {
    id: 'battle',
    title: 'Tambores de Guerra (Combate)',
    description: 'Percussão rítmica e intensa para momentos de batalha.',
    icon: <Swords className="w-5 h-5 text-rose-400" />,
    defaultVolume: 0.45,
  },
];

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ isOpen, onClose }) => {
  const [activeStates, setActiveStates] = useState<Record<AmbienceType, boolean>>({
    tavern: isAmbienceActive('tavern'),
    rain: isAmbienceActive('rain'),
    campfire: isAmbienceActive('campfire'),
    dungeon: isAmbienceActive('dungeon'),
    battle: isAmbienceActive('battle'),
  });

  const [volumes, setVolumes] = useState<Record<AmbienceType, number>>({
    tavern: 0.4,
    rain: 0.35,
    campfire: 0.4,
    dungeon: 0.3,
    battle: 0.45,
  });

  if (!isOpen) return null;

  const handleToggle = (type: AmbienceType) => {
    const isPlaying = activeStates[type];
    if (isPlaying) {
      stopAmbience(type);
      setActiveStates((prev) => ({ ...prev, [type]: false }));
    } else {
      startAmbience(type, volumes[type]);
      setActiveStates((prev) => ({ ...prev, [type]: true }));
    }
  };

  const handleVolumeChange = (type: AmbienceType, val: number) => {
    setVolumes((prev) => ({ ...prev, [type]: val }));
    setAmbienceVolume(type, val);
  };

  const handleStopAll = () => {
    stopAllAmbience();
    setActiveStates({
      tavern: false,
      rain: false,
      campfire: false,
      dungeon: false,
      battle: false,
    });
  };

  const hasAnyActive = Object.values(activeStates).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="rpg-card w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border-amber-900/50 shadow-2xl overflow-hidden bg-slate-900/95">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Soundboard & Sons de Ambiente
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Áudio procedural 100% offline para criar atmosfera imersiva na sua sessão de RPG.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Seção 1: Ambientes Sonoros Contínuos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Volume1 className="w-4 h-4 text-amber-400" />
                Ambientes Contínuos (Loops)
              </h3>
              {hasAnyActive && (
                <button
                  onClick={handleStopAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Square className="w-3 h-3" />
                  Parar Todos
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {AMBIENCE_LIST.map((item) => {
                const isPlaying = activeStates[item.id];
                const volume = volumes[item.id];

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPlaying
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-slate-200">
                            {item.title}
                          </span>
                          {isPlaying && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                              Tocando
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-11 sm:pl-0">
                      {/* Slider de Volume */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <input
                          type="range"
                          min={0.05}
                          max={1}
                          step={0.05}
                          value={volume}
                          onChange={(e) => handleVolumeChange(item.id, parseFloat(e.target.value))}
                          className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <span className="font-mono text-[10px] w-7">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>

                      {/* Botão Play/Pause */}
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                          isPlaying
                            ? 'bg-rose-900/60 hover:bg-rose-800/70 text-rose-200 border border-rose-700/50'
                            : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3 h-3" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Tocar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Efeitos Sonoros Rápidos (Stings / One-shots) */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Efeitos Sonoros Rápidos (1 Clique)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Fanfarra de Vitória */}
              <button
                onClick={playVictoryFanfare}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-center transition flex flex-col items-center gap-1.5 active:scale-95 group"
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                  🎺
                </div>
                <span className="font-bold text-xs text-amber-200">Vitória</span>
                <span className="text-[10px] text-slate-400">Fanfarra triunfal</span>
              </button>

              {/* Alarme de Emboscada */}
              <button
                onClick={playDangerAlarm}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-center transition flex flex-col items-center gap-1.5 active:scale-95 group"
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                  ⚠️
                </div>
                <span className="font-bold text-xs text-rose-200">Perigo</span>
                <span className="text-[10px] text-slate-400">Alarme / Emboscada</span>
              </button>

              {/* Moedas de Ouro */}
              <button
                onClick={playGoldCoins}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-center transition flex flex-col items-center gap-1.5 active:scale-95 group"
              >
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 group-hover:scale-110 transition">
                  💰
                </div>
                <span className="font-bold text-xs text-yellow-200">Moedas</span>
                <span className="text-[10px] text-slate-400">Recompensa em ouro</span>
              </button>

              {/* Rugido de Fera */}
              <button
                onClick={playMonsterRoar}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-center transition flex flex-col items-center gap-1.5 active:scale-95 group"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition">
                  🐉
                </div>
                <span className="font-bold text-xs text-purple-200">Rugido</span>
                <span className="text-[10px] text-slate-400">Criatura / Chefe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            {hasAnyActive
              ? 'Áudio de ambiente em reprodução contínua.'
              : 'Nenhum som de ambiente ativo.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
