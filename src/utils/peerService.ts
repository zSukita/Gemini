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

export class P2PNetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost = false;
  private roomCode = '';
  private currentUserName = '';
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
    return this.activePeers;
  }

  public isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed;
  }

  /**
   * Inicializa uma sala como Anfitrião (Host / Mestre)
   */
  public async createRoom(userName: string, customCode?: string): Promise<string> {
    this.disconnect();
    this.currentUserName = userName;
    this.isHost = true;

    // Gera código legível de 5 dígitos ou usa o customizado (ex: ARCANA-8492)
    const code = customCode
      ? customCode.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      : `MESA-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullPeerId = `arcanasheet-room-${code.toLowerCase()}`;
    this.roomCode = code;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(fullPeerId, PEER_CONFIG);

      this.peer.on('open', () => {
        this.activePeers = [
          {
            peerId: fullPeerId,
            name: this.currentUserName,
            role: 'dm',
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
        console.warn('Erro PeerJS Host:', err);
        if (err.type === 'unavailable-id') {
          // Se já existir esse ID, tenta outro aleatório
          this.createRoom(userName)
            .then(resolve)
            .catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Conecta a uma sala existente como Jogador (Client)
   */
  public async joinRoom(roomCode: string, userName: string): Promise<boolean> {
    this.disconnect();
    this.currentUserName = userName;
    this.isHost = false;

    const cleanCode = roomCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const targetPeerId = `arcanasheet-room-${cleanCode.toLowerCase()}`;
    this.roomCode = cleanCode;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(PEER_CONFIG);

      this.peer.on('open', () => {
        if (!this.peer) return;
        const conn = this.peer.connect(targetPeerId, {
          metadata: { name: this.currentUserName, role: 'player' },
          reliable: true,
        });

        // Configura ouvintes da conexão imediatamente antes de abrir
        this.setupConnection(conn);

        conn.on('open', () => {
          this.activePeers = [
            {
              peerId: this.peer?.id || 'player',
              name: this.currentUserName,
              role: 'player',
              joinedAt: Date.now(),
            },
          ];
          this.notifyPeerList();

          // Avisa o host sobre a entrada
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
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Configura listeners em uma conexão de dados WebRTC
   */
  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    const registerPeer = () => {
      const metadata = conn.metadata as { name?: string; role?: 'dm' | 'player' } | undefined;
      const peerName = metadata?.name?.trim() || 'Aventureiro';
      const peerRole = metadata?.role || 'player';

      const peerUser: PeerUser = {
        peerId: conn.peer,
        name: peerName,
        role: peerRole,
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
      }
    };

    if (conn.open) {
      registerPeer();
    } else {
      conn.on('open', registerPeer);
    }

    conn.on('data', (data) => {
      const msg = data as P2PMessage;

      // Sincronização de lista de participantes
      if (msg.type === 'PEER_LIST' && Array.isArray(msg.payload)) {
        this.activePeers = msg.payload as PeerUser[];
        this.notifyPeerList();
        return;
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
   * Envia uma mensagem para todos os peers conectados (sem duplicar localmente)
   */
  public broadcast(msg: P2PMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
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
