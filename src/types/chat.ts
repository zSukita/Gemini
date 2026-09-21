import type { DiceRollResult } from './dnd5e';

export type ChatMessageType = 'PUBLIC' | 'WHISPER' | 'GM_ROLL' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: ChatMessageType;
  recipientName?: string;
  diceRoll?: DiceRollResult;
  timestamp: number;
}
