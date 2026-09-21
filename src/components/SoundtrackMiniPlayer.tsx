import React, { useState, useEffect } from 'react';
import { 
  subscribeToSoundtrack, 
  stopCurrentTrack, 
  setMasterSoundtrackVolume, 
  type SoundTrack 
} from '../utils/fantasySoundtrack';
import { Music, Volume2, VolumeX, Square, ExternalLink } from 'lucide-react';

interface SoundtrackMiniPlayerProps {
  onOpenFullModal: () => void;
}

export const SoundtrackMiniPlayer: React.FC<SoundtrackMiniPlayerProps> = ({ onOpenFullModal }) => {
  const [currentTrack, setCurrentTrack] = useState<SoundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    return subscribeToSoundtrack((track, playing, vol) => {
      setCurrentTrack(track);
      setIsPlaying(playing);
      setVolume(vol);
    });
  }, []);

  if (!isPlaying || !currentTrack) {
    return null;
  }

  const handleToggleMute = () => {
    const newVol = volume > 0 ? 0 : 0.5;
    setVolume(newVol);
    setMasterSoundtrackVolume(newVol);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/40 rounded-full px-3 py-1 text-xs shadow-lg backdrop-blur-md animate-in fade-in">
      <div className="flex items-center gap-1.5 text-amber-400">
        <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-bold max-w-[120px] md:max-w-[200px] truncate text-slate-200">
          {currentTrack.title}
        </span>
      </div>

      {/* Mini equalizador */}
      <div className="hidden sm:flex items-end gap-0.5 h-3.5 px-1">
        <div className="w-0.5 bg-amber-400 rounded-full animate-bounce h-2" />
        <div className="w-0.5 bg-amber-300 rounded-full animate-bounce h-3.5" style={{ animationDelay: '100ms' }} />
        <div className="w-0.5 bg-yellow-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: '200ms' }} />
      </div>

      <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
        <button
          type="button"
          onClick={handleToggleMute}
          className="text-slate-400 hover:text-amber-400 p-0.5 transition"
          title={volume === 0 ? 'Desmutar' : 'Mutar'}
        >
          {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={stopCurrentTrack}
          className="text-red-400 hover:text-red-300 p-0.5 transition"
          title="Parar música"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>

        <button
          type="button"
          onClick={onOpenFullModal}
          className="text-amber-400/80 hover:text-amber-300 p-0.5 transition ml-0.5"
          title="Abrir reprodutor de áudio completo"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
