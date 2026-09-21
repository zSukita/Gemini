import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./config', () => ({
  db: null,
}));

import {
  createCampaign,
  findCampaignByCode,
  joinCampaign,
  leaveCampaign,
  deleteCampaign,
  broadcastHandoutToCampaign,
  dismissCampaignHandout,
  type CampaignPartyMember,
} from './campaignSync';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
// @ts-expect-error - node environment polyfill
globalThis.localStorage = localStorageMock;

describe('Sistema de Campanhas na Nuvem & Pistas (campaignSync)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve criar uma campanha com código no formato ARC-XXXX', async () => {
    const camp = await createCampaign('dm-123', 'Mestre Teste', 'A Mina Perdida', 'Aventura de introdução');

    expect(camp.id).toBeDefined();
    expect(camp.code).toMatch(/^ARC-[A-Z0-9]{4}$/);
    expect(camp.name).toBe('A Mina Perdida');
    expect(camp.dmId).toBe('dm-123');
    expect(camp.dmName).toBe('Mestre Teste');
    expect(camp.members).toEqual({});
  });

  it('deve localizar uma campanha pelo código de 6 caracteres', async () => {
    const created = await createCampaign('dm-456', 'Mestre 2', 'Maldição de Strahd', 'Terror gótico');
    const found = await findCampaignByCode(created.code);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('Maldição de Strahd');
  });

  it('deve permitir que jogadores ingressem na campanha e saiam', async () => {
    const camp = await createCampaign('dm-789', 'Mestre 3', 'Torre do Mago', '');
    const member: CampaignPartyMember = {
      userId: 'player-001',
      characterId: 'char-101',
      name: 'Ragnar',
      characterClass: 'Guerreiro',
      level: 3,
      currentHp: 28,
      maxHp: 28,
      armorClass: 16,
      passivePerception: 12,
      updatedAt: Date.now(),
    };

    await joinCampaign(camp.id, member);
    const updated = await findCampaignByCode(camp.code);
    expect(updated?.members['player-001']).toBeDefined();
    expect(updated?.members['player-001'].name).toBe('Ragnar');

    await leaveCampaign(camp.id, 'player-001');
    const afterLeave = await findCampaignByCode(camp.code);
    expect(afterLeave?.members['player-001']).toBeUndefined();
  });

  it('deve transmitir e dispensar Handouts (pistas/documentos)', async () => {
    const camp = await createCampaign('dm-handout', 'Mestre', 'Campanha Misteriosa', '');

    await broadcastHandoutToCampaign(camp.id, {
      title: 'Carta Secreta',
      content: 'Encontre-me na taverna ao anoitecer.',
    });

    const withHandout = await findCampaignByCode(camp.code);
    expect(withHandout?.activeHandout).toBeDefined();
    expect(withHandout?.activeHandout?.title).toBe('Carta Secreta');
    expect(withHandout?.activeHandout?.content).toContain('taverna');

    await dismissCampaignHandout(camp.id);
    const dismissed = await findCampaignByCode(camp.code);
    expect(dismissed?.activeHandout).toBeNull();
  });

  it('deve permitir deletar uma campanha', async () => {
    const camp = await createCampaign('dm-del', 'Mestre', 'Campanha Temporária', '');
    expect(await findCampaignByCode(camp.code)).not.toBeNull();

    await deleteCampaign(camp.id);
    expect(await findCampaignByCode(camp.code)).toBeNull();
  });
});
