import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Swords,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Heart,
  Globe,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { OnlineUserPresence, FriendUser } from '../../firebase/presenceAndFriends';

interface SocialSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onlineUsers: OnlineUserPresence[];
  friends: FriendUser[];
  currentUserId: string;
  currentUserName: string;
  currentRoomCode?: string;
  onAddFriend: (identifier: string) => Promise<{ success: boolean; message: string }>;
  onRemoveFriend: (friendUserId: string) => Promise<void>;
  onSendGameInvite: (friendUserId: string, friendName: string, roomCode: string) => Promise<{ ok: boolean }>;
  onCreateAndInvite?: (friendUserId: string, friendName: string) => Promise<void>;
  onJoinRoom?: (roomCode: string) => void;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({
  isOpen,
  onToggle,
  onlineUsers,
  friends,
  currentUserId,
  currentUserName,
  currentRoomCode,
  onAddFriend,
  onRemoveFriend,
  onSendGameInvite,
  onCreateAndInvite,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'friends'>('online');
  const [addInput, setAddInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [isSubmittingFriend, setIsSubmittingFriend] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});

  // Filtra outros usuários online (exceto o próprio usuário)
  const otherOnlineUsers = onlineUsers.filter((u) => u.userId !== currentUserId);

  // Mapeia quem dos amigos está online no momento
  const friendsWithStatus = friends.map((f) => {
    const isOnline = onlineUsers.some(
      (u) => u.userId === f.userId || (f.email && u.email && u.email.toLowerCase() === f.email.toLowerCase())
    );
    const onlineData = onlineUsers.find(
      (u) => u.userId === f.userId || (f.email && u.email && u.email.toLowerCase() === f.email.toLowerCase())
    );
    return {
      ...f,
      isOnline,
      status: onlineData?.status || 'offline',
      currentRoomCode: onlineData?.currentRoomCode,
    };
  });

  const onlineFriends = friendsWithStatus.filter((f) => f.isOnline);
  const offlineFriends = friendsWithStatus.filter((f) => !f.isOnline);

  const handleAddFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput.trim()) return;

    setIsSubmittingFriend(true);
    setAddFeedback(null);
    try {
      const res = await onAddFriend(addInput.trim());
      setAddFeedback({ msg: res.message, isError: !res.success });
      if (res.success) {
        setAddInput('');
      }
    } catch {
      setAddFeedback({ msg: 'Falha ao adicionar amigo.', isError: true });
    } finally {
      setIsSubmittingFriend(false);
      setTimeout(() => setAddFeedback(null), 4000);
    }
  };

  const handleInviteClick = async (friendUserId: string, friendName: string, targetRoom?: string) => {
    const code = targetRoom || currentRoomCode;
    if (code) {
      const res = await onSendGameInvite(friendUserId, friendName, code);
      if (res.ok) {
        setInvitedFriends((prev) => ({ ...prev, [friendUserId]: true }));
        setTimeout(() => {
          setInvitedFriends((prev) => ({ ...prev, [friendUserId]: false }));
        }, 8000);
      }
    } else if (onCreateAndInvite) {
      await onCreateAndInvite(friendUserId, friendName);
    }
  };

  // Se a barra estiver recolhida (minimizado na lateral direita)
  if (!isOpen) {
    return (
      <div className="fixed top-20 right-0 z-30 hidden xl:flex flex-col items-center">
        <button
          type="button"
          onClick={onToggle}
          className="bg-slate-900/95 hover:bg-slate-800 text-amber-300 border-l border-y border-amber-500/40 p-2.5 rounded-l-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 transition hover:scale-105 group"
          title="Abrir Lista de Pessoas Online & Amigos"
        >
          <ChevronLeft size={16} className="text-amber-400 group-hover:-translate-x-0.5 transition" />
          <div className="relative">
            <Users size={16} />
            {otherOnlineUsers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
            )}
          </div>
          <span className="[writing-mode:vertical-rl] text-[10px] font-serif font-bold uppercase tracking-wider text-amber-200">
            Amigos ({otherOnlineUsers.length})
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed top-3 right-3 bottom-24 w-72 max-w-[90vw] z-30 flex flex-col bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden animate-in slide-in-from-right-4 duration-200">
      
      {/* 1. Cabeçalho da Barra Lateral */}
      <div className="px-3.5 py-3 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0">
            <Users size={15} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xs text-amber-200 leading-tight">
              Comunidade Arcana
            </h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentUserName || 'Você'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          title="Recolher barra lateral"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2. Seletor de Abas: Online Agora vs Amigos */}
      <div className="flex p-1 bg-slate-950 border-b border-slate-800/80 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('online')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'online'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Online ({otherOnlineUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'friends'
              ? 'bg-amber-950/80 border border-amber-500/40 text-amber-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart size={12} className={activeTab === 'friends' ? 'text-rose-400 fill-rose-400' : 'text-slate-400'} />
          <span>Amigos ({friends.length})</span>
        </button>
      </div>

      {/* 3. Corpo das Abas */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 text-xs">
        
        {/* ABA 1: QUEM ESTÁ ONLINE NO SITE */}
        {activeTab === 'online' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Aventureiros no site agora</span>
              <span className="text-[9px] text-emerald-400 font-mono">Tempo real</span>
            </div>

            {otherOnlineUsers.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic text-[11px] bg-slate-900/40 rounded-xl border border-slate-800 my-auto flex flex-col items-center gap-1.5">
                <Globe size={20} className="text-slate-600 mb-1" />
                <span>Nenhum outro jogador online neste momento.</span>
                <span className="text-[10px] text-slate-600">Compartilhe seu link para amigos entrarem!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {otherOnlineUsers.map((u) => {
                  const isFriend = friends.some(
                    (f) => f.userId === u.userId || (f.email && u.email && f.email.toLowerCase() === u.email.toLowerCase())
                  );
                  const isInvited = invitedFriends[u.userId];
                  const isInGame = u.status === 'in_game';

                  return (
                    <div
                      key={u.userId}
                      className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 shrink-0 text-xs overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={13} />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-100 block truncate leading-tight">
                              {u.characterName || u.name}
                            </span>
                            {u.characterClass && (
                              <span className="text-[9px] text-amber-300/80 font-mono block truncate">
                                {u.characterClass} Nvl {u.characterLevel || 1}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
                      </div>

                      {/* Status e Ações */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
                        {isInGame && u.currentRoomCode ? (
                          onJoinRoom ? (
                            <button
                              type="button"
                              onClick={() => onJoinRoom(u.currentRoomCode!)}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 font-mono transition cursor-pointer"
                              title="Entrar nesta mesa"
                            >
                              Mesa {u.currentRoomCode} ↗
                            </button>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono">
                              Na Mesa {u.currentRoomCode}
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] text-emerald-400">● Disponível</span>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Convidar para Jogar */}
                          <button
                            type="button"
                            onClick={() => handleInviteClick(u.userId, u.characterName || u.name, currentRoomCode)}
                            disabled={isInvited}
                            className={`text-[10px] px-2 py-0.5 rounded transition flex items-center gap-1 font-bold ${
                              isInvited
                                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                            }`}
                            title="Convidar este aventureiro para sua mesa"
                          >
                            {isInvited ? <Check size={10} /> : <Swords size={10} />}
                            <span>{isInvited ? 'Convidado!' : 'Chamar'}</span>
                          </button>

                          {/* Adicionar Amigo */}
                          {!isFriend && (
                            <button
                              type="button"
                              onClick={() => onAddFriend(u.email || u.name)}
                              className="text-[10px] p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                              title="Adicionar aos Amigos"
                            >
                              <UserPlus size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: LISTA DE AMIGOS */}
        {activeTab === 'friends' && (
          <div className="flex flex-col gap-3">
            
            {/* Formulário: Adicionar Novo Amigo */}
            <form onSubmit={handleAddFriendSubmit} className="flex flex-col gap-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="text-[10px] font-serif font-bold text-slate-300 flex items-center gap-1">
                <UserPlus size={11} className="text-amber-400" />
                <span>Adicionar Amigo</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  placeholder="Email ou nome de usuário..."
                  className="rpg-input flex-1 text-xs py-1"
                />
                <button
                  type="submit"
                  disabled={isSubmittingFriend || !addInput.trim()}
                  className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1 px-2.5 disabled:opacity-40"
                >
                  {isSubmittingFriend ? <Loader2 size={12} className="animate-spin" /> : '+'}
                </button>
              </div>

              {addFeedback && (
                <span className={`text-[10px] ${addFeedback.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {addFeedback.msg}
                </span>
              )}
            </form>

            {/* Amigos Online */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 px-1 mb-1">
                <span>Amigos Online ({onlineFriends.length})</span>
              </div>

              {onlineFriends.length === 0 ? (
                <div className="p-2 text-center text-slate-500 italic text-[10px] bg-slate-900/30 rounded-lg border border-slate-800/80">
                  Nenhum amigo online agora.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {onlineFriends.map((friend) => {
                    const isInvited = invitedFriends[friend.userId];
                    return (
                      <div
                        key={friend.userId}
                        className="p-2 rounded-xl bg-slate-900/80 border border-emerald-500/40 flex flex-col gap-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="font-bold text-slate-100 truncate">
                              {friend.characterName || friend.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveFriend(friend.userId)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                            title="Remover dos amigos"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        {/* Botão de Chamar para Jogar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          {friend.status === 'in_game' && friend.currentRoomCode ? (
                            onJoinRoom ? (
                              <button
                                type="button"
                                onClick={() => onJoinRoom(friend.currentRoomCode!)}
                                className="text-[9px] text-purple-300 hover:text-purple-200 underline cursor-pointer"
                                title="Entrar na mesa do amigo"
                              >
                                Em jogo ({friend.currentRoomCode}) ↗
                              </button>
                            ) : (
                              <span className="text-[9px] text-purple-300">
                                Em jogo ({friend.currentRoomCode})
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-emerald-400">● Disponível</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleInviteClick(friend.userId, friend.name, currentRoomCode)}
                            disabled={isInvited}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 shadow ${
                              isInvited
                                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
                                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950'
                            }`}
                          >
                            {isInvited ? (
                              <>
                                <Check size={11} />
                                <span>Convite Enviado!</span>
                              </>
                            ) : (
                              <>
                                <Swords size={11} />
                                <span>Chamar para Jogar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Amigos Offline */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 mb-1">
                <span>Amigos Offline ({offlineFriends.length})</span>
              </div>

              {offlineFriends.length === 0 ? (
                <div className="p-2 text-center text-slate-500 italic text-[10px] bg-slate-900/30 rounded-lg border border-slate-800/80">
                  {friends.length === 0 ? 'Você ainda não tem amigos adicionados.' : 'Todos os amigos estão online!'}
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                  {offlineFriends.map((friend) => (
                    <div
                      key={friend.userId}
                      className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between text-slate-400 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                        <span className="truncate">{friend.characterName || friend.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveFriend(friend.userId)}
                        className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition"
                        title="Remover dos amigos"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 4. Rodapé da Barra Lateral */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span className="font-serif">
          {currentRoomCode ? `Sua Sala: ${currentRoomCode}` : 'Nenhuma sala ativa'}
        </span>
        <span className="text-amber-400 font-mono">
          {friends.length} amigo(s)
        </span>
      </div>

    </aside>
  );
};
