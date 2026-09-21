import { Peer, type DataConnection } from 'peerjs';
import type { P2PMessage, PeerUser } from '../types/vtt';

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
      this.peer = new Peer(fullPeerId, {
        debug: 1,
      });

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
      this.peer = new Peer();

      this.peer.on('open', () => {
        if (!this.peer) return;
        const conn = this.peer.connect(targetPeerId, {
          metadata: { name: this.currentUserName, role: 'player' },
          reliable: true,
        });

        conn.on('open', () => {
          this.setupConnection(conn);
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

    conn.on('data', (data) => {
      const msg = data as P2PMessage;
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
    });
  }

  /**
   * Envia uma mensagem para todos os peers conectados
   */
  public broadcast(msg: P2PMessage) {
    // Notifica ouvintes locais também
    this.notifyMessage(msg);

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
