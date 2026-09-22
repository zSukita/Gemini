import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react';
import {
  type OnlineUserPresence,
  type FriendUser,
  type DirectMessage,
  subscribeToDirectMessages,
  sendDirectMessage,
  markDirectMessagesAsRead,
} from '../../firebase/presenceAndFriends';

interface SocialSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onlineUsers: OnlineUserPresence[];
  friends: FriendUser[];
  currentUserId: string;
  currentUserName: string;
  currentRoomCode?: string;
  directMessages?: DirectMessage[];
  onAddFriend: (identifier: string) => Promise<{ success: boolean; message: string }>;
  onRemoveFriend: (friendUserId: string) => Promise<void>;
  onSendGameInvite: (friendUserId: string, friendName: string, roomCode: string) => Promise<{ ok: boolean }>;
  onSendDirectMessage?: (toUserId: string, toUserName: string, content: string) => Promise<void>;
  onMarkMessagesAsRead?: (partnerUserId: string) => Promise<void>;
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
  directMessages,
  onAddFriend,
  onRemoveFriend,
  onSendGameInvite,
  onSendDirectMessage,
  onMarkMessagesAsRead,
  onCreateAndInvite,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'friends' | 'messages'>('online');
  const [activeChatPartner, setActiveChatPartner] = useState<{
    userId: string;
    name: string;
    avatarUrl?: string;
  } | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [internalMessages, setInternalMessages] = useState<DirectMessage[]>([]);
  const [addInput, setAddInput] = useState('');
  const [addFeedback, setAddFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [isSubmittingFriend, setIsSubmittingFriend] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Usa mensagens passadas via prop ou gerencia subscrição interna
  const messages = directMessages || internalMessages;

  useEffect(() => {
    if (directMessages) return;
    const unsub = subscribeToDirectMessages(currentUserId, (msgs) => {
      setInternalMessages(msgs);
    });
    return unsub;
  }, [currentUserId, directMessages]);

  // Filtra outros usuários online (exceto o próprio usuário)
  const otherOnlineUsers = onlineUsers.filter((u) => u.userId !== currentUserId);

  // Mapeia quem dos amigos está online no momento
  const friendsWithStatus = friends.map((f) => {
    const isOnline = onlineUsers.some(
      (u) => u.userId === f.userId || (f.name && u.name && u.name.toLowerCase() === f.name.toLowerCase())
    );
    const onlineData = onlineUsers.find(
      (u) => u.userId === f.userId || (f.name && u.name && u.name.toLowerCase() === f.name.toLowerCase())
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

  // Mensagens não lidas por remetente
  const unreadCountByUser = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.toUserId === currentUserId && !m.read) {
        map[m.fromUserId] = (map[m.fromUserId] || 0) + 1;
      }
    });
    return map;
  }, [messages, currentUserId]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCountByUser).reduce((acc, count) => acc + count, 0);
  }, [unreadCountByUser]);

  // Mensagens da conversa atual
  const activeChatMessages = useMemo(() => {
    if (!activeChatPartner) return [];
    return messages
      .filter(
        (m) =>
          (m.fromUserId === currentUserId && m.toUserId === activeChatPartner.userId) ||
          (m.toUserId === currentUserId && m.fromUserId === activeChatPartner.userId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, currentUserId, activeChatPartner]);

  // Lista de conversas para a aba de mensagens
  const conversationsList = useMemo(() => {
    const map = new Map<
      string,
      { userId: string; name: string; avatarUrl?: string; lastMsg: DirectMessage }
    >();

    messages.forEach((m) => {
      const partnerId = m.fromUserId === currentUserId ? m.toUserId : m.fromUserId;
      const partnerName = m.fromUserId === currentUserId ? m.toUserName : m.fromUserName;
      const existing = map.get(partnerId);
      if (!existing || m.timestamp > existing.lastMsg.timestamp) {
        const foundFriend = friends.find((f) => f.userId === partnerId);
        const foundOnline = onlineUsers.find((u) => u.userId === partnerId);
        map.set(partnerId, {
          userId: partnerId,
          name: partnerName || foundFriend?.name || foundOnline?.name || 'Aventureiro',
          avatarUrl: foundFriend?.avatarUrl || foundOnline?.avatarUrl,
          lastMsg: m,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp);
  }, [messages, currentUserId, friends, onlineUsers]);

  // Scroll automático ao receber novas mensagens
  useEffect(() => {
    if (activeChatPartner) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatPartner, activeChatMessages]);

  const handleOpenChat = (partner: { userId: string; name: string; avatarUrl?: string }) => {
    setActiveChatPartner(partner);
    if (onMarkMessagesAsRead) {
      onMarkMessagesAsRead(partner.userId);
    } else {
      markDirectMessagesAsRead(currentUserId, partner.userId);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatPartner || !messageInput.trim() || isSendingMessage) return;

    const text = messageInput.trim();
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      if (onSendDirectMessage) {
        await onSendDirectMessage(activeChatPartner.userId, activeChatPartner.name, text);
      } else {
        await sendDirectMessage({
          fromUserId: currentUserId,
          fromUserName: currentUserName,
          toUserId: activeChatPartner.userId,
          toUserName: activeChatPartner.name,
          content: text,
        });
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem direta:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

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
          title="Abrir Lista de Pessoas Online, Amigos e Mensagens"
        >
          <ChevronLeft size={16} className="text-amber-400 group-hover:-translate-x-0.5 transition" />
          <div className="relative">
            <Users size={16} />
            {totalUnreadCount > 0 ? (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse border border-slate-900">
                {totalUnreadCount}
              </span>
            ) : otherOnlineUsers.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
            ) : null}
          </div>
          <span className="[writing-mode:vertical-rl] text-[10px] font-serif font-bold uppercase tracking-wider text-amber-200">
            Social ({otherOnlineUsers.length})
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed top-3 right-3 bottom-24 w-80 max-w-[92vw] z-30 flex flex-col bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden animate-in slide-in-from-right-4 duration-200">
      
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

      {/* TELA DE CHAT ATIVO COM UM USUÁRIO */}
      {activeChatPartner ? (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          {/* Cabeçalho da Conversa */}
          <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveChatPartner(null)}
              className="text-slate-400 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-xs"
              title="Voltar para a lista"
            >
              <ArrowLeft size={14} />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-[11px] font-bold text-amber-200 overflow-hidden shrink-0 shadow-inner">
                {activeChatPartner.avatarUrl ? (
                  <img src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} className="w-full h-full object-cover" />
                ) : (
                  activeChatPartner.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="truncate min-w-0">
                <span className="font-bold text-xs text-slate-100 block truncate leading-tight">
                  {activeChatPartner.name}
                </span>
                <span className="text-[9px] text-amber-300/80 font-mono flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      onlineUsers.some((u) => u.userId === activeChatPartner.userId)
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-slate-500'
                    }`}
                  />
                  {onlineUsers.some((u) => u.userId === activeChatPartner.userId) ? 'Online agora' : 'Offline'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveChatPartner(null)}
              className="text-slate-400 hover:text-rose-400 p-1 rounded transition"
              title="Fechar conversa"
            >
              <X size={14} />
            </button>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 text-xs">
            {activeChatMessages.length === 0 ? (
              <div className="my-auto text-center p-4 text-slate-500 italic text-[11px] bg-slate-900/40 rounded-xl border border-slate-800/80 flex flex-col items-center gap-2">
                <MessageSquare size={24} className="text-amber-500/60" />
                <span>Nenhuma mensagem com {activeChatPartner.name} ainda.</span>
                <span className="text-[10px] text-slate-400">
                  Envie um sussurro para iniciar uma conversa em tempo real!
                </span>
              </div>
            ) : (
              activeChatMessages.map((m) => {
                const isMe = m.fromUserId === currentUserId;
                const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div
                      className={`p-2.5 rounded-2xl shadow-md text-xs leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-950/90 to-amber-900/90 border border-amber-500/50 text-amber-100 rounded-tr-xs'
                          : 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono flex items-center gap-1">
                      {timeStr}
                      {isMe && <Check size={10} className="text-emerald-400" />}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Envio de Mensagem */}
          <form onSubmit={handleSendMessageSubmit} className="p-2 border-t border-slate-800 bg-slate-900/80 flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Sussurrar para ${activeChatPartner.name}...`}
              className="rpg-input flex-1 text-xs py-1.5 px-2.5"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSendingMessage || !messageInput.trim()}
              className="rpg-button bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-1.5 px-2.5 text-xs disabled:opacity-40 flex items-center justify-center transition active:scale-95 shadow"
              title="Enviar mensagem (Enter)"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* 2. Seletor de Abas: Online Agora vs Amigos vs Mensagens */}
          <div className="flex p-1 bg-slate-950 border-b border-slate-800/80 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('online')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'online'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Online ({otherOnlineUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'friends'
                  ? 'bg-amber-950/80 border border-amber-500/40 text-amber-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart size={11} className={activeTab === 'friends' ? 'text-rose-400 fill-rose-400 shrink-0' : 'text-slate-400 shrink-0'} />
              <span className="truncate">Amigos ({friends.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 relative ${
                activeTab === 'messages'
                  ? 'bg-purple-950/80 border border-purple-500/40 text-purple-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={11} className={activeTab === 'messages' ? 'text-purple-300 shrink-0' : 'text-slate-400 shrink-0'} />
              <span className="truncate">Chat</span>
              {totalUnreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[8px] font-bold px-1 rounded-full animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
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
                        (f) => f.userId === u.userId || (f.name && u.name && f.name.toLowerCase() === u.name.toLowerCase())
                      );
                      const isInvited = invitedFriends[u.userId];
                      const isInGame = u.status === 'in_game';
                      const unread = unreadCountByUser[u.userId] || 0;

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
                              {/* Botão Enviar Mensagem */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenChat({
                                    userId: u.userId,
                                    name: u.characterName || u.name,
                                    avatarUrl: u.avatarUrl,
                                  })
                                }
                                className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 transition flex items-center gap-1 font-semibold active:scale-95"
                                title={`Conversar com ${u.characterName || u.name}`}
                              >
                                <MessageSquare size={10} />
                                <span>Mensagem</span>
                                {unread > 0 && (
                                  <span className="bg-rose-500 text-white rounded-full px-1 text-[8px] font-bold">
                                    {unread}
                                  </span>
                                )}
                              </button>

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
                                  onClick={() => onAddFriend(u.characterName || u.name)}
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
                        const unread = unreadCountByUser[friend.userId] || 0;
                        return (
                          <div
                            key={friend.userId}
                            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1"
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

                            {/* Ações com o amigo online */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800 gap-1">
                              {friend.status === 'in_game' && friend.currentRoomCode ? (
                                onJoinRoom ? (
                                  <button
                                    type="button"
                                    onClick={() => onJoinRoom(friend.currentRoomCode!)}
                                    className="text-[9px] text-purple-300 hover:text-purple-200 underline cursor-pointer"
                                    title="Entrar na mesa do amigo"
                                  >
                                    Mesa {friend.currentRoomCode} ↗
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-purple-300">
                                    Mesa {friend.currentRoomCode}
                                  </span>
                                )
                              ) : (
                                <span className="text-[9px] text-emerald-400">● Disponível</span>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenChat({
                                      userId: friend.userId,
                                      name: friend.characterName || friend.name,
                                      avatarUrl: friend.avatarUrl,
                                    })
                                  }
                                  className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 transition flex items-center gap-1 font-semibold active:scale-95"
                                  title={`Conversar com ${friend.characterName || friend.name}`}
                                >
                                  <MessageSquare size={10} />
                                  <span>Mensagem</span>
                                  {unread > 0 && (
                                    <span className="bg-rose-500 text-white rounded-full px-1 text-[8px] font-bold">
                                      {unread}
                                    </span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInviteClick(friend.userId, friend.name, currentRoomCode)}
                                  disabled={isInvited}
                                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition flex items-center gap-1 shadow ${
                                    isInvited
                                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
                                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  }`}
                                >
                                  {isInvited ? <Check size={10} /> : <Swords size={10} />}
                                  <span>{isInvited ? 'Chamado' : 'Chamar'}</span>
                                </button>
                              </div>
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
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-0.5">
                      {offlineFriends.map((friend) => {
                        const unread = unreadCountByUser[friend.userId] || 0;
                        return (
                          <div
                            key={friend.userId}
                            className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between text-slate-400 text-xs"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                              <span className="truncate">{friend.characterName || friend.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenChat({
                                    userId: friend.userId,
                                    name: friend.characterName || friend.name,
                                    avatarUrl: friend.avatarUrl,
                                  })
                                }
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition flex items-center gap-1"
                                title="Enviar mensagem"
                              >
                                <MessageSquare size={10} />
                                {unread > 0 && (
                                  <span className="bg-rose-500 text-white rounded-full px-1 text-[8px] font-bold">
                                    {unread}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => onRemoveFriend(friend.userId)}
                                className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition"
                                title="Remover dos amigos"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ABA 3: TODAS AS CONVERSAS / MENSAGENS */}
            {activeTab === 'messages' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Conversas Recentes</span>
                  <span className="text-[9px] text-amber-400 font-mono">{conversationsList.length} ativa(s)</span>
                </div>

                {conversationsList.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 italic text-[11px] bg-slate-900/40 rounded-xl border border-slate-800 my-auto flex flex-col items-center gap-2">
                    <MessageSquare size={22} className="text-slate-600" />
                    <span>Nenhuma conversa iniciada ainda.</span>
                    <span className="text-[10px] text-slate-500">
                      Clique no botão "Mensagem" em qualquer pessoa online ou amigo para conversar!
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {conversationsList.map((conv) => {
                      const unread = unreadCountByUser[conv.userId] || 0;
                      const timeStr = new Date(conv.lastMsg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isOnline = onlineUsers.some((u) => u.userId === conv.userId);

                      return (
                        <div
                          key={conv.userId}
                          onClick={() => handleOpenChat(conv)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            unread > 0
                              ? 'bg-amber-950/40 border-amber-500/50 hover:bg-amber-900/40'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/40 flex items-center justify-center font-bold text-amber-200 text-xs overflow-hidden">
                                {conv.avatarUrl ? (
                                  <img src={conv.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
                                ) : (
                                  conv.name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                                  isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                                }`}
                              />
                            </div>

                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-100 block truncate leading-tight">
                                {conv.name}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {conv.lastMsg.fromUserId === currentUserId ? 'Você: ' : ''}
                                {conv.lastMsg.content}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1">
                            <span className="text-[9px] text-slate-500 font-mono">{timeStr}</span>
                            {unread > 0 && (
                              <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[9px] font-bold animate-pulse">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
        </>
      )}

    </aside>
  );
};
