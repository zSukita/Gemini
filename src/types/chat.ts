import type { DiceRollResult } from './dnd5e';
import type { MonsterSpawnAction, MapMoveAction } from './aiDm';

export type ChatMessageType = 'PUBLIC' | 'WHISPER' | 'GM_ROLL' | 'SYSTEM' | 'AI_DM';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: ChatMessageType;
  recipientName?: string;
  diceRoll?: DiceRollResult;
  suggestedActions?: string[];
  requestedRoll?: {
    skillOrAbility: string;
    dc?: number;
    reason: string;
  };
  monsterAttack?: {
    monsterName: string;
    attackName: string;
    attackBonus: number;
    damageFormula: string;
    target?: string;
    description?: string;
  };
  monsterSpawns?: MonsterSpawnAction[];
  mapMoves?: MapMoveAction[];
  timestamp: number;
}
