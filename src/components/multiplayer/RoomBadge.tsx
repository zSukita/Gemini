import React from 'react';
import { Wifi } from 'lucide-react';

interface RoomBadgeProps {
  isConnected: boolean;
  roomCode: string;
  peersCount: number;
  onClick: () => void;
}

export const RoomBadge: React.FC<RoomBadgeProps> = ({
  isConnected,
  roomCode,
  peersCount,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
        isConnected
          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 shadow-md shadow-emerald-500/10'
          : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
      }`}
      title={isConnected ? `Conectado à sala ${roomCode}. Clique para detalhes.` : 'Clique para jogar online com amigos'}
    >
      {isConnected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">{roomCode}</span>
          <span className="text-[10px] text-emerald-400 font-normal">({peersCount} online)</span>
        </>
      ) : (
        <>
          <Wifi size={13} className="text-slate-400" />
          <span>Mesa Online</span>
        </>
      )}
    </button>
  );
};
