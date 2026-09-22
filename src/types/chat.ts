import type { DiceRollResult } from './dnd5e';

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
  timestamp: number;
}
