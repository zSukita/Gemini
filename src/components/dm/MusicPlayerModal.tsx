import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  PRESET_TRACKS, 
  playProceduralTrack, 
  playCustomAudioFile, 
  stopCurrentTrack, 
  setMasterSoundtrackVolume, 
  subscribeToSoundtrack,
  type SoundTrack,
  type ProceduralTrackId
} from '../../utils/fantasySoundtrack';
import { 
  X, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Upload, 
  Sparkles, 
  Swords, 
  Compass, 
  Beer, 
  Trophy, 
  FileAudio
} from 'lucide-react';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({ isOpen, onClose }) => {
  const [currentTrack, setCurrentTrack] = useState<SoundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSoundtrack((track, playing, vol) => {
      setCurrentTrack(track);
      setIsPlaying(playing);
      setVolume(vol);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleTogglePreset = (trackId: ProceduralTrackId) => {
    if (isPlaying && currentTrack?.id === trackId) {
      stopCurrentTrack();
    } else {
      playProceduralTrack(trackId, volume);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playCustomAudioFile(file, volume);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMasterSoundtrackVolume(val);
  };

  const getCategoryIcon = (category: SoundTrack['category']) => {
    switch (category) {
      case 'batalha':
        return <Swords className="w-5 h-5 text-red-400" />;
      case 'exploracao':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'ambiente':
        return <Beer className="w-5 h-5 text-amber-400" />;
      case 'vitoria':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileAudio className="w-5 h-5 text-purple-400" />;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="rpg-box w-full max-w-2xl bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-amber-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 tracking-wide flex items-center gap-2">
                Trilha Sonora & Músicas do Mestre
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Temas procedurais em tempo real e suporte para carregar músicas locais (.mp3, .wav)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Painel do Player Ativo */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`p-3 rounded-xl ${isPlaying ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                {isPlaying ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {isPlaying ? 'Em Reprodução' : 'Silêncio na Sessão'}
                </span>
                <h4 className="text-sm font-bold text-amber-200 truncate">
                  {currentTrack ? currentTrack.title : 'Nenhuma faixa tocando'}
                </h4>
              </div>
            </div>

            {/* Equalizador animado em CSS */}
            {isPlaying && (
              <div className="flex items-end gap-1 h-6 px-2">
                <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3" />
                <div className="w-1 bg-amber-300 rounded-full animate-bounce h-6" style={{ animationDelay: '150ms' }} />
                <div className="w-1 bg-yellow-400 rounded-full animate-bounce h-4" style={{ animationDelay: '300ms' }} />
                <div className="w-1 bg-amber-500 rounded-full animate-bounce h-5" style={{ animationDelay: '75ms' }} />
              </div>
            )}

            {/* Controle de Volume */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button 
                type="button"
                onClick={() => {
                  const newVol = volume > 0 ? 0 : 0.5;
                  setVolume(newVol);
                  setMasterSoundtrackVolume(newVol);
                }}
                className="text-slate-400 hover:text-amber-400 transition"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 md:w-28 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-mono text-amber-300 w-8 text-right">
                {Math.round(volume * 100)}%
              </span>

              {isPlaying && (
                <button
                  type="button"
                  onClick={stopCurrentTrack}
                  className="p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                  title="Parar reprodução"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Parar
                </button>
              )}
            </div>
          </div>

          {/* Lista de Músicas Sintetizadas (Procedural) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Temas Sintéticos Procedurais (Infinitos & 100% Offline)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_TRACKS.map(track => {
                const isThisActive = isPlaying && currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isThisActive
                        ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(track.category)}
                          <span className="text-xs font-bold text-slate-100">{track.title}</span>
                        </div>
                        {track.bpm && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {track.bpm} BPM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {track.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePreset(track.id as ProceduralTrackId)}
                      className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 ${
                        isThisActive
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isThisActive ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Pausar Trilha</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                          <span>Tocar Trilha</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Importação de Arquivos de Áudio Locais */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Música Personalizada da Sessão
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Carregue um arquivo .mp3, .wav ou .ogg do seu computador para rodar em loop
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="music-file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <FileAudio className="w-4 h-4" />
                <span>Escolher Arquivo...</span>
              </button>
            </div>

            {currentTrack?.isCustom && (
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded bg-purple-500/20 text-purple-300">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-purple-200 truncate">
                      {currentTrack.title}
                    </p>
                    <p className="text-[10px] text-purple-400">
                      Loop Contínuo Ativado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        stopCurrentTrack();
                      }
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300 transition"
                    title="Remover / Parar"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-amber-500/20 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Dica: A trilha continuará tocando mesmo após fechar esta janela.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
