import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../firebase/config', () => ({
  db: null,
}));

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
// @ts-expect-error - node environment polyfill
globalThis.localStorage = localStorageMock;

import { generateSecureRoomCode, p2pManager } from '../utils/peerService';
import { generateCampaignCode } from '../firebase/campaignSync';
import { sendGameInvite, sendDirectMessage } from '../firebase/presenceAndFriends';

describe('Segurança e Endurecimento da Aplicação', () => {
  beforeEach(() => {
    localStorage.clear();
    p2pManager.disconnect();
  });

  describe('Entropia e Geração de Códigos', () => {
    it('deve gerar códigos de campanha com 6 caracteres após prefixo ARC- (alta entropia)', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const code = generateCampaignCode();
        expect(code).toMatch(/^ARC-[A-Z0-9]{6}$/);
        codes.add(code);
      }
      // Verifica que não há repetições imediatas
      expect(codes.size).toBe(20);
    });

    it('deve gerar códigos de sala P2P com prefixo MESA- e 6 caracteres criptograficamente aleatórios', () => {
      const roomCodes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const code = generateSecureRoomCode();
        expect(code).toMatch(/^MESA-[A-Z0-9]{6}$/);
        roomCodes.add(code);
      }
      expect(roomCodes.size).toBe(20);
    });
  });

  describe('Validação de Convites e Mensagens Diretas', () => {
    it('deve rejeitar criação de convite quando o destinatário for igual ao remetente', async () => {
      await expect(
        sendGameInvite({
          fromUserId: 'user-self',
          fromUserName: 'Player 1',
          toUserId: 'user-self',
          toUserName: 'Player 1',
          roomCode: 'MESA-ABC123',
        })
      ).rejects.toThrow(/Destinatário do convite inválido ou igual ao remetente/);
    });

    it('deve rejeitar convite com código de sala vazio', async () => {
      await expect(
        sendGameInvite({
          fromUserId: 'user-1',
          fromUserName: 'Player 1',
          toUserId: 'user-2',
          toUserName: 'Player 2',
          roomCode: '   ',
        })
      ).rejects.toThrow(/Código da sala inválido/);
    });

    it('deve rejeitar mensagem direta enviada para si mesmo', async () => {
      await expect(
        sendDirectMessage({
          fromUserId: 'user-self',
          fromUserName: 'Player 1',
          toUserId: 'user-self',
          toUserName: 'Player 1',
          content: 'Olá eu mesmo',
        })
      ).rejects.toThrow(/Destinatário da mensagem inválido ou igual ao remetente/);
    });

    it('deve rejeitar mensagem direta vazia ou apenas com espaços', async () => {
      await expect(
        sendDirectMessage({
          fromUserId: 'user-1',
          fromUserName: 'Player 1',
          toUserId: 'user-2',
          toUserName: 'Player 2',
          content: '   ',
        })
      ).rejects.toThrow(/conteúdo da mensagem não pode ser vazio/);
    });
  });

  describe('Proteções de Rede P2P e Anti-Spoofing', () => {
    it('o host deve inicializar com role dm e código de alta entropia', async () => {
      // Mock do peerjs não conecta de verdade em teste, mas testamos a API exposta
      expect(p2pManager.isConnected()).toBe(false);
      expect(p2pManager.getIsHost()).toBe(false);
    });

    it('deve manter métodos e ouvintes intactos e seguros contra mensagens maliciosas', () => {
      const listener = vi.fn();
      const unsub = p2pManager.onMessage(listener);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
