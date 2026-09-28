import { Peer, type DataConnection } from 'peerjs';
import type { P2PMessage, PeerUser } from '../types/vtt';

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  },
};

export function generateSecureRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return `MESA-${code}`;
}

function sanitizeStat(val: unknown, min: number, max: number, defaultVal?: number): number | undefined {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return defaultVal;
  return Math.min(Math.max(Math.round(val), min), max);
}

export class P2PNetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost = false;
  private roomCode = '';
  private currentUserName = '';
  private currentUserAvatar = '';
  private messageListeners: ((msg: P2PMessage) => void)[] = [];
  private peerListListeners: ((peers: PeerUser[]) => void)[] = [];
  private activePeers: PeerUser[] = [];

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getConnectedPeers(): PeerUser[] {
    const curName = (this.currentUserName || '').toLowerCase().trim();
    const curPeerId = this.peer?.id;
    return this.activePeers.filter(
      (p) => p.peerId !== curPeerId && p.name.toLowerCase().trim() !== curName
    );
  }

  public isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed;
  }

  /**
   * Inicializa uma sala como Anfitrião (Host / Mestre)
   */
  public async createRoom(userName: string, customCode?: string, avatarUrl?: string): Promise<string> {
    this.disconnect();
    this.currentUserName = userName;
    this.currentUserAvatar = avatarUrl || '';
    this.isHost = true;

    // Gera código seguro de 6 caracteres aleatórios ou usa o customizado (ex: MESA-K9W2P4)
    const code = customCode
      ? customCode.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      : generateSecureRoomCode();

    const fullPeerId = `arcanasheet-room-${code.toLowerCase()}`;
    this.roomCode = code;

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.disconnect();
          reject(new Error('Tempo limite para inicializar a sala excedido. Verifique sua conexão com a internet.'));
        }
      }, 15000);

      this.peer = new Peer(fullPeerId, PEER_CONFIG);

      this.peer.on('open', () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        this.activePeers = [
          {
            peerId: fullPeerId,
            name: this.currentUserName,
            role: 'dm',
            avatarUrl: this.currentUserAvatar,
            joinedAt: Date.now(),
          },
        ];
        this.notifyPeerList();
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        if (isResolved) return;
        console.warn('Erro PeerJS Host:', err);
        clearTimeout(timeoutId);
        if (err.type === 'unavailable-id') {
          // Se já existir esse ID, tenta outro aleatório
          this.createRoom(userName)
            .then((res) => {
              isResolved = true;
              resolve(res);
            })
            .catch((rej) => {
              isResolved = true;
              reject(rej);
            });
        } else {
          isResolved = true;
          reject(err);
        }
      });
    });
  }

  /**
   * Conecta a uma sala existente como Jogador (Client)
   */
  public async joinRoom(
    roomCode: string,
    userName: string,
    avatarUrl?: string,
    characterData?: Partial<PeerUser>
  ): Promise<boolean> {
    this.disconnect();
    this.currentUserName = userName;
    this.currentUserAvatar = avatarUrl || '';
    this.isHost = false;

    const cleanCode = roomCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const targetPeerId = `arcanasheet-room-${cleanCode.toLowerCase()}`;
    this.roomCode = cleanCode;

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.disconnect();
          reject(new Error(`Não foi possível conectar à sala "${cleanCode}". Verifique se o código está correto e se o Mestre está online.`));
        }
      }, 15000);

      this.peer = new Peer(PEER_CONFIG);

      this.peer.on('open', () => {
        if (!this.peer || isResolved) return;
        const conn = this.peer.connect(targetPeerId, {
          metadata: {
            name: this.currentUserName,
            role: 'player',
            avatarUrl: this.currentUserAvatar,
            currentHp: characterData?.currentHp,
            maxHp: characterData?.maxHp,
            armorClass: characterData?.armorClass,
            characterClass: characterData?.characterClass,
            characterLevel: characterData?.characterLevel,
            dexScore: characterData?.dexScore,
            initiativeBonus: characterData?.initiativeBonus,
          },
          reliable: true,
        });

        // Configura ouvintes da conexão imediatamente antes de abrir
        this.setupConnection(conn);

        conn.on('open', () => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);

          const selfUser: PeerUser = {
            peerId: this.peer?.id || 'player',
            name: this.currentUserName,
            role: 'player',
            avatarUrl: this.currentUserAvatar,
            currentHp: characterData?.currentHp,
            maxHp: characterData?.maxHp,
            armorClass: characterData?.armorClass,
            characterClass: characterData?.characterClass,
            characterLevel: characterData?.characterLevel,
            dexScore: characterData?.dexScore,
            initiativeBonus: characterData?.initiativeBonus,
            joinedAt: Date.now(),
          };

          this.activePeers = [selfUser];
          this.notifyPeerList();

          // 1. Envia ficha e dados do personagem para o Mestre
          this.broadcast({
            type: 'CHARACTER_SYNC',
            senderId: this.peer?.id || 'player',
            senderName: this.currentUserName,
            payload: selfUser,
            timestamp: Date.now(),
          });

          // 2. Solicita imediatamente ao Mestre (Host) o estado atual da mesa (mapa, tokens, chat e combate)
          this.broadcast({
            type: 'REQUEST_ROOM_STATE',
            senderId: this.peer?.id || 'player',
            senderName: this.currentUserName,
            payload: selfUser,
            timestamp: Date.now(),
          });

          // 3. Avisa o host e a mesa sobre a entrada
          this.broadcast({
            type: 'CHAT_MESSAGE',
            senderId: this.peer?.id || 'player',
            senderName: this.currentUserName,
            payload: `${this.currentUserName} entrou na mesa de RPG!`,
            timestamp: Date.now(),
          });
          resolve(true);
        });

        conn.on('error', (err) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          this.disconnect();
          reject(err);
        });
      });

      this.peer.on('error', (err: { type?: string }) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        this.disconnect();
        if (err?.type === 'peer-unavailable') {
          reject(new Error(`A mesa "${cleanCode}" não foi encontrada. O Mestre pode estar offline.`));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Configura listeners em uma conexão de dados WebRTC
   */
  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    const registerPeer = () => {
      const metadata = conn.metadata as
        | (Partial<PeerUser> & { name?: string; role?: 'dm' | 'player'; avatarUrl?: string })
        | undefined;

      // Validação estrita de papel: Participantes externos NUNCA podem usurpar papel de 'dm'.
      // Apenas o host detém papel de 'dm'.
      const peerRole: 'dm' | 'player' = this.isHost ? 'player' : (metadata?.role === 'dm' ? 'dm' : 'player');

      // Sanitização de nome
      const rawName = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
      const peerName = rawName.slice(0, 40) || 'Aventureiro';

      // Sanitização de avatarUrl
      let peerAvatar: string | undefined = undefined;
      if (typeof metadata?.avatarUrl === 'string' && metadata.avatarUrl.length <= 500) {
        if (/^(https?:\/\/|data:image\/)/.test(metadata.avatarUrl)) {
          peerAvatar = metadata.avatarUrl;
        }
      }

      const characterClass = typeof metadata?.characterClass === 'string'
        ? metadata.characterClass.trim().slice(0, 30)
        : undefined;

      const peerUser: PeerUser = {
        peerId: conn.peer,
        name: peerName,
        role: peerRole,
        avatarUrl: peerAvatar,
        currentHp: sanitizeStat(metadata?.currentHp, -100, 9999),
        maxHp: sanitizeStat(metadata?.maxHp, 1, 9999),
        armorClass: sanitizeStat(metadata?.armorClass, 1, 99),
        characterClass,
        characterLevel: sanitizeStat(metadata?.characterLevel, 1, 20),
        dexScore: sanitizeStat(metadata?.dexScore, 1, 30),
        initiativeBonus: sanitizeStat(metadata?.initiativeBonus, -20, 50),
        joinedAt: Date.now(),
      };

      if (this.isHost) {
        if (!this.activePeers.some((p) => p.peerId === conn.peer)) {
          this.activePeers.push(peerUser);
          this.notifyPeerList();
        }

        const peerListMsg: P2PMessage = {
          type: 'PEER_LIST',
          senderId: this.peer?.id || 'host',
          senderName: this.currentUserName,
          payload: this.activePeers,
          timestamp: Date.now(),
        };

        // Envia diretamente para quem acabou de conectar e transmite aos demais
        if (conn.open) {
          try {
            conn.send(peerListMsg);
          } catch {
            // ignore
          }
        }
        this.broadcast(peerListMsg);

        // Notifica o Host para sincronizar a mesa com o novo peer
        setTimeout(() => {
          this.notifyMessage({
            type: 'REQUEST_ROOM_STATE',
            senderId: conn.peer,
            senderName: peerName,
            payload: { targetPeerId: conn.peer },
            timestamp: Date.now(),
          });
        }, 200);
      }
    };

    if (conn.open) {
      registerPeer();
    } else {
      conn.on('open', registerPeer);
    }

    // Rate Limiting e Validação de Mensagens P2P por Conexão
    const peerMessageTimestamps: number[] = [];
    const MAX_MESSAGES_PER_SECOND = 35;
    const MAX_PAYLOAD_SIZE = 128 * 1024; // 128 KB limite por mensagem

    conn.on('data', (data) => {
      // 1. Limite de frequência (Rate limiting anti-flood)
      const now = Date.now();
      while (peerMessageTimestamps.length > 0 && peerMessageTimestamps[0] < now - 1000) {
        peerMessageTimestamps.shift();
      }
      if (peerMessageTimestamps.length >= MAX_MESSAGES_PER_SECOND) {
        console.warn(`[P2P] Taxa de mensagens excedida pelo peer ${conn.peer}. Mensagem descartada.`);
        return;
      }
      peerMessageTimestamps.push(now);

      // 2. Validação básica de tamanho
      if (typeof data === 'string' && data.length > MAX_PAYLOAD_SIZE) {
        console.warn(`[P2P] Mensagem excessivamente grande recebida do peer ${conn.peer}. Descartada.`);
        return;
      }

      const msg = data as P2PMessage;
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
        return;
      }

      // 3. Proteção contra falsificação de identidade (Anti-Spoofing):
      // O peer conectado não pode fingir ser o Host ou outro participante
      if (this.isHost) {
        // Bloquear tipos de mensagens administrativas exclusivas do Host
        if (msg.type === 'PEER_LIST' || msg.type === 'ROOM_SYNC') {
          console.warn(`[P2P] Peer ${conn.peer} tentou enviar mensagem administrativa ${msg.type}. Bloqueado.`);
          return;
        }

        // Força o senderId real da conexão (impede forjar senderId de outros)
        msg.senderId = conn.peer;
        // Força o senderName registrado para evitar personificação
        const sender = this.activePeers.find((p) => p.peerId === conn.peer);
        if (sender) {
          msg.senderName = sender.name;
        }
      }

      // Sincronização de lista de participantes (apenas aceita se vier do Host)
      if (msg.type === 'PEER_LIST' && Array.isArray(msg.payload)) {
        if (!this.isHost) {
          this.activePeers = msg.payload as PeerUser[];
          this.notifyPeerList();
        }
        return;
      }

      // Validação de sincronização de ficha (CHARACTER_SYNC)
      if (msg.type === 'CHARACTER_SYNC' && msg.payload && typeof msg.payload === 'object') {
        const payloadUser = msg.payload as Partial<PeerUser>;
        if (this.isHost) {
          const target = this.activePeers.find((p) => p.peerId === conn.peer);
          if (target) {
            target.currentHp = sanitizeStat(payloadUser.currentHp, -100, 9999, target.currentHp);
            target.maxHp = sanitizeStat(payloadUser.maxHp, 1, 9999, target.maxHp);
            target.armorClass = sanitizeStat(payloadUser.armorClass, 1, 99, target.armorClass);
            if (typeof payloadUser.characterClass === 'string') {
              target.characterClass = payloadUser.characterClass.trim().slice(0, 30);
            }
            target.characterLevel = sanitizeStat(payloadUser.characterLevel, 1, 20, target.characterLevel);
            target.dexScore = sanitizeStat(payloadUser.dexScore, 1, 30, target.dexScore);
            target.initiativeBonus = sanitizeStat(payloadUser.initiativeBonus, -20, 50, target.initiativeBonus);
            this.notifyPeerList();
          }
        }
      }

      this.notifyMessage(msg);

      // Se for o Host, retransmite a mensagem para os outros participantes
      if (this.isHost) {
        this.connections.forEach((c, peerId) => {
          if (peerId !== conn.peer && c.open) {
            c.send(msg);
          }
        });
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.activePeers = this.activePeers.filter((p) => p.peerId !== conn.peer);
      this.notifyPeerList();

      if (this.isHost) {
        this.broadcast({
          type: 'PEER_LIST',
          senderId: this.peer?.id || 'host',
          senderName: this.currentUserName,
          payload: this.activePeers,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Envia uma mensagem diretamente para um peer específico
   */
  public sendToPeer(peerId: string, msg: P2PMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      try {
        conn.send(msg);
      } catch (e) {
        console.warn('Erro ao enviar mensagem P2P direta:', e);
      }
    }
  }

  /**
   * Envia uma mensagem para todos os peers conectados (sem duplicar localmente)
   */
  public broadcast(msg: P2PMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('Erro no broadcast P2P:', e);
        }
      }
    });
  }

  public onMessage(callback: (msg: P2PMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  public onPeerListChange(callback: (peers: PeerUser[]) => void): () => void {
    this.peerListListeners.push(callback);
    return () => {
      this.peerListListeners = this.peerListListeners.filter((l) => l !== callback);
    };
  }

  private notifyMessage(msg: P2PMessage) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('Erro em listener P2P', e);
      }
    });
  }

  private notifyPeerList() {
    this.peerListListeners.forEach((listener) => {
      try {
        listener(this.activePeers);
      } catch (e) {
        console.error('Erro em listener peer list', e);
      }
    });
  }

  /**
   * Encerra conexões e desliga o peer
   */
  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.activePeers = [];
    this.roomCode = '';
    this.isHost = false;
    this.notifyPeerList();
  }
}

export const p2pManager = new P2PNetworkManager();
