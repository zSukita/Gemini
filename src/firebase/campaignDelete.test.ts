// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Variáveis de controle para o mock do Firestore
let mockCampaignDocExists = true;
let mockCampaignData: Record<string, unknown> = {
  id: 'camp_123',
  code: 'ARC-ABC123',
  name: 'Campanha Épica',
  dmId: 'dm_alice',
};
let mockHandoutDocs: Array<{ id: string; ref: { id: string; path: string } }> = [];
let mockInviteDocs: Array<{ id: string; ref: { id: string; path: string } }> = [];
let commitShouldFail = false;
const batchesCreated: Array<{ deletedRefs: unknown[]; commitCalled: boolean }> = [];

vi.mock('./config', () => ({
  get db() {
    return mockDbInstance;
  },
}));

let mockDbInstance: unknown = { name: 'mock-db' };

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...parts: string[]) => ({
    id: parts[parts.length - 1],
    path: parts.join('/'),
  })),
  getDoc: vi.fn(async (ref: { id: string; path: string }) => ({
    exists: () => mockCampaignDocExists,
    data: () => mockCampaignData,
    ref,
  })),
  collection: vi.fn((_db, ...parts: string[]) => ({
    path: parts.join('/'),
  })),
  query: vi.fn((colRef) => colRef),
  where: vi.fn(),
  getDocs: vi.fn(async (colRef: { path: string }) => {
    if (colRef.path.includes('handouts')) {
      return {
        empty: mockHandoutDocs.length === 0,
        forEach: (cb: (doc: unknown) => void) => mockHandoutDocs.forEach(cb),
        docs: mockHandoutDocs,
      };
    }
    if (colRef.path.includes('campaign_invites')) {
      return {
        empty: mockInviteDocs.length === 0,
        forEach: (cb: (doc: unknown) => void) => mockInviteDocs.forEach(cb),
        docs: mockInviteDocs,
      };
    }
    return { empty: true, forEach: () => {}, docs: [] };
  }),
  writeBatch: vi.fn(() => {
    const currentBatch = {
      deletedRefs: [] as unknown[],
      commitCalled: false,
      delete: (ref: unknown) => {
        currentBatch.deletedRefs.push(ref);
      },
      commit: async () => {
        currentBatch.commitCalled = true;
        if (commitShouldFail) {
          throw new Error('Firestore writeBatch simulated failure');
        }
      },
    };
    batchesCreated.push(currentBatch);
    return currentBatch;
  }),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

import { deleteCampaign, getLocalCampaigns, saveLocalCampaigns, type Campaign } from './campaignSync';

describe('deleteCampaign - Integridade e Exclusão Segura de Campanhas', () => {
  beforeEach(() => {
    localStorage.clear();
    batchesCreated.length = 0;
    mockCampaignDocExists = true;
    mockCampaignData = {
      id: 'camp_123',
      code: 'ARC-ABC123',
      name: 'Campanha Épica',
      dmId: 'dm_alice',
    };
    mockHandoutDocs = [];
    mockInviteDocs = [];
    commitShouldFail = false;
    mockDbInstance = { name: 'mock-db' };
  });

  it('deve excluir com sucesso uma campanha sem handouts nem convites', async () => {
    const testCampaign: Campaign = {
      id: 'camp_123',
      code: 'ARC-ABC123',
      name: 'Campanha Épica',
      description: '',
      dmId: 'dm_alice',
      dmName: 'Alice',
      members: {},
      createdAt: Date.now(),
    };
    saveLocalCampaigns([testCampaign], 'dm_alice');
    expect(getLocalCampaigns('dm_alice')).toHaveLength(1);

    await deleteCampaign('camp_123', 'ARC-ABC123', 'dm_alice');

    // Verifica que o batch deletou o código e a campanha
    expect(batchesCreated.length).toBe(1);
    expect(batchesCreated[0].deletedRefs.length).toBe(2); // code + campaign doc
    expect(batchesCreated[0].commitCalled).toBe(true);

    // Deve ter removido do armazenamento local
    expect(getLocalCampaigns('dm_alice')).toHaveLength(0);
  });

  it('deve identificar e excluir handouts e convites em lotes respeitando o limite de 500 (<= 400 por batch)', async () => {
    // Simula 450 handouts e 100 convites (Total 550 docs + 1 code + 1 camp = 552 docs)
    mockHandoutDocs = Array.from({ length: 450 }, (_, i) => ({
      id: `handout_${i}`,
      ref: { id: `handout_${i}`, path: `campaigns/camp_123/handouts/handout_${i}` },
    }));
    mockInviteDocs = Array.from({ length: 100 }, (_, i) => ({
      id: `invite_${i}`,
      ref: { id: `invite_${i}`, path: `campaign_invites/invite_${i}` },
    }));

    const testCampaign: Campaign = {
      id: 'camp_123',
      code: 'ARC-ABC123',
      name: 'Campanha Grande',
      description: '',
      dmId: 'dm_alice',
      dmName: 'Alice',
      members: {},
      createdAt: Date.now(),
    };
    saveLocalCampaigns([testCampaign], 'dm_alice');

    await deleteCampaign('camp_123', 'ARC-ABC123', 'dm_alice');

    // Com 552 docs e chunk de 400, devem ser criados exatamente 2 lotes (400 no primeiro e 152 no segundo)
    expect(batchesCreated.length).toBe(2);
    expect(batchesCreated[0].deletedRefs.length).toBe(400);
    expect(batchesCreated[1].deletedRefs.length).toBe(152);
    expect(batchesCreated[0].commitCalled).toBe(true);
    expect(batchesCreated[1].commitCalled).toBe(true);

    // Handouts e convites devem ser deletados no primeiro/segundo lote antes do documento da campanha
    const lastBatch = batchesCreated[1];
    const lastDeletedRef = lastBatch.deletedRefs[lastBatch.deletedRefs.length - 1] as { path: string };
    expect(lastDeletedRef.path).toBe('campaigns/camp_123');

    // Sucesso remove do armazenamento local
    expect(getLocalCampaigns('dm_alice')).toHaveLength(0);
  });

  it('deve reter a campanha no armazenamento local e propagar erro se ocorrer falha intermediária no Firestore', async () => {
    commitShouldFail = true;
    const testCampaign: Campaign = {
      id: 'camp_123',
      code: 'ARC-ABC123',
      name: 'Campanha Protegida',
      description: '',
      dmId: 'dm_alice',
      dmName: 'Alice',
      members: {},
      createdAt: Date.now(),
    };
    saveLocalCampaigns([testCampaign], 'dm_alice');

    await expect(deleteCampaign('camp_123', 'ARC-ABC123', 'dm_alice')).rejects.toThrow(
      'Falha ao excluir campanha na nuvem'
    );

    // A campanha NÃO deve ter sido apagada localmente, permitindo recuperação e retry pelo usuário
    const retained = getLocalCampaigns('dm_alice');
    expect(retained).toHaveLength(1);
    expect(retained[0].id).toBe('camp_123');
  });

  it('deve rejeitar e abortar a exclusão se o usuário não for o Mestre criador da campanha', async () => {
    const testCampaign: Campaign = {
      id: 'camp_123',
      code: 'ARC-ABC123',
      name: 'Campanha Alheia',
      description: '',
      dmId: 'dm_alice',
      dmName: 'Alice',
      members: {},
      createdAt: Date.now(),
    };
    saveLocalCampaigns([testCampaign], 'dm_bob');

    // Bob tenta deletar a campanha de Alice
    await expect(deleteCampaign('camp_123', 'ARC-ABC123', 'dm_bob')).rejects.toThrow(
      'Apenas o Mestre criador da campanha tem permissão para excluí-la.'
    );

    // Nenhum batch foi commitado
    expect(batchesCreated).toHaveLength(0);

    // Campanha permanece intacta localmente
    expect(getLocalCampaigns('dm_bob')).toHaveLength(1);
  });

  it('deve excluir localmente com segurança na ausência do Firestore (modo offline)', async () => {
    mockDbInstance = null; // Simula Firestore desabilitado/offline
    const testCampaign: Campaign = {
      id: 'camp_offline',
      code: 'ARC-OFF123',
      name: 'Campanha Offline',
      description: '',
      dmId: 'dm_local',
      dmName: 'Local DM',
      members: {},
      createdAt: Date.now(),
    };
    saveLocalCampaigns([testCampaign], 'dm_local');
    expect(getLocalCampaigns('dm_local')).toHaveLength(1);

    await deleteCampaign('camp_offline', 'ARC-OFF123', 'dm_local');

    expect(getLocalCampaigns('dm_local')).toHaveLength(0);
  });
});
