export interface MapToken {
  id: string;
  combatantId?: string;
  name: string;
  x: number; // Coordenada X na grade (em células ou pixels)
  y: number; // Coordenada Y na grade
  size: number; // 1 = 1x1 (Médio/Pequeno), 2 = 2x2 (Grande), 3 = 3x3 (Enorme)
  color: string;
  avatarUrl?: string;
  currentHp: number;
  maxHp: number;
  type: 'player' | 'monster' | 'npc';
  conditions: string[];
  hasTorch?: boolean;
}

export type AoEShapeType = 'circle' | 'cone' | 'line' | 'cube';

export interface SpellAoETemplate {
  id: string;
  type: AoEShapeType;
  x: number;
  y: number;
  sizeMeters: number;
  angle?: number;
  color: string;
  label: string;
}

export interface FogShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rect' | 'circle';
  isRevealed: boolean;
}

export type AmbientLightType = 'day' | 'dusk' | 'night';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface MapPing {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
  senderName?: string;
}

export interface BattleMapConfig {
  id: string;
  title: string;
  imageUrl: string;
  gridSize: number; // tamanho da célula em pixels (ex: 50)
  gridColor: string;
  gridOpacity: number;
  showGrid: boolean;
  snapToGrid: boolean;
  width: number;
  height: number;
  fogOfWarEnabled: boolean;
  revealedShapes: FogShape[];
  ambientLight?: AmbientLightType;
  aoeTemplates?: SpellAoETemplate[];
  drawings?: DrawingStroke[];
}

export type P2PMessageType =
  | 'ROOM_SYNC'
  | 'REQUEST_ROOM_STATE'
  | 'PEER_LIST'
  | 'DICE_ROLL'
  | 'TOKEN_MOVE'
  | 'TOKEN_ADD'
  | 'TOKEN_REMOVE'
  | 'FOG_UPDATE'
  | 'MAP_CONFIG'
  | 'MAP_DRAWING'
  | 'MAP_PING'
  | 'CHAT_MESSAGE'
  | 'DIRECT_MESSAGE'
  | 'GAME_INVITE';

export interface P2PMessage {
  type: P2PMessageType;
  senderId: string;
  senderName: string;
  payload: unknown;
  timestamp: number;
}

export interface PeerUser {
  peerId: string;
  name: string;
  role: 'dm' | 'player';
  joinedAt: number;
  avatarUrl?: string;
  currentHp?: number;
  maxHp?: number;
}
