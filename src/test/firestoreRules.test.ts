import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  writeBatch,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules - Campanhas e Índices', () => {
  beforeAll(async () => {
    try {
      await fetch('http://127.0.0.1:8080/');
    } catch {
      console.warn(
        '\n[FirestoreRulesTest] ⚠️  Emulador do Firestore offline na porta 8080.\n' +
        'Para executar estes testes no emulador, use: npm run test:rules\n'
      );
      return;
    }

    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-arcanasheet-test',
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async (context) => {
    if (!testEnv) {
      context.skip();
      return;
    }
    await testEnv.clearFirestore();
  });

  describe('1. Índice de Códigos (/campaign_codes)', () => {
    it('deve bloquear a listagem da coleção inteira por qualquer usuário', async () => {
      const alice = testEnv.authenticatedContext('alice').firestore();
      const colRef = collection(alice, 'campaign_codes');
      await assertFails(getDocs(colRef));
    });

    it('deve permitir buscar um código específico por ID para usuário autenticado', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaign_codes', 'ARC-ABC123'), {
          code: 'ARC-ABC123',
          campaignId: 'camp_1',
          dmId: 'alice',
          name: 'Mina Perdida',
          dmName: 'Alice DM',
          createdAt: Date.now(),
        });
      });

      const bob = testEnv.authenticatedContext('bob').firestore();
      const docRef = doc(bob, 'campaign_codes', 'ARC-ABC123');
      await assertSucceeds(getDoc(docRef));
    });

    it('deve impedir usuário de criar índice falso apontando para campanha inexistente ou de outro mestre', async () => {
      const bob = testEnv.authenticatedContext('bob').firestore();

      // Caso 1: Campanha não existe
      await assertFails(
        setDoc(doc(bob, 'campaign_codes', 'ARC-FAKE01'), {
          code: 'ARC-FAKE01',
          campaignId: 'camp_inexistente',
          dmId: 'bob',
          name: 'Fake',
          dmName: 'Bob',
          createdAt: Date.now(),
        })
      );

      // Setup de uma campanha legítima de Alice
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaigns', 'camp_alice'), {
          id: 'camp_alice',
          code: 'ARC-ALICE1',
          dmId: 'alice',
          name: 'Campanha da Alice',
          members: {},
          createdAt: Date.now(),
        });
      });

      // Caso 2: Bob tenta criar índice apontando para a campanha de Alice
      await assertFails(
        setDoc(doc(bob, 'campaign_codes', 'ARC-ALICE1'), {
          code: 'ARC-ALICE1',
          campaignId: 'camp_alice',
          dmId: 'bob',
          name: 'Hack',
          dmName: 'Bob',
          createdAt: Date.now(),
        })
      );

      // Caso 3: Alice cria o índice de forma correta para sua própria campanha existente
      const alice = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(
        setDoc(doc(alice, 'campaign_codes', 'ARC-ALICE1'), {
          code: 'ARC-ALICE1',
          campaignId: 'camp_alice',
          dmId: 'alice',
          name: 'Campanha da Alice',
          dmName: 'Alice',
          createdAt: Date.now(),
        })
      );
    });
  });

  describe('2. Controle de Ingresso e Convites (/campaign_invites e /campaigns)', () => {
    beforeEach(async () => {
      // Cria a campanha de Alice
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaigns', 'camp_alice'), {
          id: 'camp_alice',
          code: 'ARC-ALICE1',
          dmId: 'alice',
          name: 'Campanha da Alice',
          members: {},
          createdAt: Date.now(),
        });
      });
    });

    it('deve impedir jogador de ingressar na campanha sem convite prévio', async () => {
      const bob = testEnv.authenticatedContext('bob').firestore();
      const campRef = doc(bob, 'campaigns', 'camp_alice');

      // Bob tenta se adicionar à lista de membros diretamente
      await assertFails(
        updateDoc(campRef, {
          'members.bob': {
            userId: 'bob',
            characterId: 'char_bob',
            name: 'Bob Ladino',
            characterClass: 'Ladino',
            level: 1,
            currentHp: 10,
            maxHp: 10,
            armorClass: 14,
            passivePerception: 13,
            updatedAt: Date.now(),
          },
          updatedAt: Date.now(),
        })
      );
    });

    it('deve impedir jogador de ingressar com convite que ainda está apenas pending', async () => {
      // Alice cria convite pendente para Bob
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaign_invites', 'camp_alice_bob'), {
          id: 'camp_alice_bob',
          campaignId: 'camp_alice',
          userId: 'bob',
          dmId: 'alice',
          status: 'pending',
          createdAt: Date.now(),
        });
      });

      const bob = testEnv.authenticatedContext('bob').firestore();
      const campRef = doc(bob, 'campaigns', 'camp_alice');

      // Tenta entrar sem ter aceito o convite
      await assertFails(
        updateDoc(campRef, {
          'members.bob': {
            userId: 'bob',
            characterId: 'char_bob',
            name: 'Bob Ladino',
            characterClass: 'Ladino',
            level: 1,
            currentHp: 10,
            maxHp: 10,
            armorClass: 14,
            passivePerception: 13,
            updatedAt: Date.now(),
          },
          updatedAt: Date.now(),
        })
      );
    });

    it('deve permitir que o jogador ingresse com convite aceito e o marque como used', async () => {
      // Convite aceito para Bob
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaign_invites', 'camp_alice_bob'), {
          id: 'camp_alice_bob',
          campaignId: 'camp_alice',
          userId: 'bob',
          dmId: 'alice',
          status: 'accepted',
          createdAt: Date.now(),
        });
      });

      const bob = testEnv.authenticatedContext('bob').firestore();
      const campRef = doc(bob, 'campaigns', 'camp_alice');
      const inviteRef = doc(bob, 'campaign_invites', 'camp_alice_bob');

      const batch = writeBatch(bob);
      batch.update(campRef, {
        'members.bob': {
          userId: 'bob',
          characterId: 'char_bob',
          name: 'Bob Ladino',
          characterClass: 'Ladino',
          level: 1,
          currentHp: 10,
          maxHp: 10,
          armorClass: 14,
          passivePerception: 13,
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });
      batch.update(inviteRef, {
        status: 'used',
        updatedAt: Date.now(),
      });

      await assertSucceeds(batch.commit());
    });

    it('deve impedir reutilização de convite já marcado como used', async () => {
      // Convite já usado
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaign_invites', 'camp_alice_bob'), {
          id: 'camp_alice_bob',
          campaignId: 'camp_alice',
          userId: 'bob',
          dmId: 'alice',
          status: 'used',
          createdAt: Date.now(),
        });
      });

      const bob = testEnv.authenticatedContext('bob').firestore();
      const campRef = doc(bob, 'campaigns', 'camp_alice');
      const inviteRef = doc(bob, 'campaign_invites', 'camp_alice_bob');

      // Tenta re-ingressar atualizando o convite
      const batch = writeBatch(bob);
      batch.update(campRef, {
        'members.bob': {
          userId: 'bob',
          characterId: 'char_bob',
          name: 'Bob Ladino',
          characterClass: 'Ladino',
          level: 1,
          currentHp: 10,
          maxHp: 10,
          armorClass: 14,
          passivePerception: 13,
          updatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });
      batch.update(inviteRef, {
        status: 'used',
        updatedAt: Date.now(),
      });

      await assertFails(batch.commit());
    });
  });

  describe('3. Proteção de Membros e Handouts', () => {
    beforeEach(async () => {
      // Alice Mestre, Bob e Charlie no grupo
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'campaigns', 'camp_alice'), {
          id: 'camp_alice',
          code: 'ARC-ALICE1',
          dmId: 'alice',
          name: 'Campanha da Alice',
          members: {
            bob: {
              userId: 'bob',
              characterId: 'char_bob',
              name: 'Bob Ladino',
              characterClass: 'Ladino',
              level: 1,
              currentHp: 10,
              maxHp: 10,
              armorClass: 14,
              passivePerception: 13,
              updatedAt: Date.now(),
            },
            charlie: {
              userId: 'charlie',
              characterId: 'char_charlie',
              name: 'Charlie Mago',
              characterClass: 'Mago',
              level: 1,
              currentHp: 8,
              maxHp: 8,
              armorClass: 12,
              passivePerception: 12,
              updatedAt: Date.now(),
            },
          },
          createdAt: Date.now(),
        });

        await setDoc(doc(adminDb, 'campaigns', 'camp_alice', 'handouts', 'mapa_antigo'), {
          id: 'mapa_antigo',
          title: 'Mapa da Masmorra',
          content: 'Caminho secreto à esquerda',
          timestamp: Date.now(),
        });
      });
    });

    it('um membro NÃO consegue alterar os dados de outro membro', async () => {
      const charlie = testEnv.authenticatedContext('charlie').firestore();
      const campRef = doc(charlie, 'campaigns', 'camp_alice');

      // Charlie tenta alterar a vida de Bob
      await assertFails(
        updateDoc(campRef, {
          'members.bob.currentHp': 0,
          updatedAt: Date.now(),
        })
      );
    });

    it('um membro consegue alterar seus próprios dados de personagem', async () => {
      const charlie = testEnv.authenticatedContext('charlie').firestore();
      const campRef = doc(charlie, 'campaigns', 'camp_alice');

      // Charlie altera seu próprio HP
      await assertSucceeds(
        updateDoc(campRef, {
          'members.charlie.currentHp': 6,
          'members.charlie.updatedAt': Date.now(),
          updatedAt: Date.now(),
        })
      );
    });

    it('um usuário de fora (estranho) NÃO consegue ler a campanha nem seus handouts', async () => {
      const stranger = testEnv.authenticatedContext('stranger').firestore();
      const campRef = doc(stranger, 'campaigns', 'camp_alice');
      const handoutRef = doc(stranger, 'campaigns', 'camp_alice', 'handouts', 'mapa_antigo');

      // Tentativa de ler a campanha
      await assertFails(getDoc(campRef));
      // Tentativa de ler o handout
      await assertFails(getDoc(handoutRef));
    });

    it('um membro participante consegue ler a campanha e seus handouts', async () => {
      const bob = testEnv.authenticatedContext('bob').firestore();
      const campRef = doc(bob, 'campaigns', 'camp_alice');
      const handoutRef = doc(bob, 'campaigns', 'camp_alice', 'handouts', 'mapa_antigo');

      await assertSucceeds(getDoc(campRef));
      await assertSucceeds(getDoc(handoutRef));
    });
  });

  describe('4. Administração pelo Mestre', () => {
    it('o mestre consegue administrar sua campanha por completo', async () => {
      const alice = testEnv.authenticatedContext('alice').firestore();
      const campRef = doc(alice, 'campaigns', 'camp_nova');
      const codeRef = doc(alice, 'campaign_codes', 'ARC-NEW001');

      // 1. Criar campanha e índice
      await assertSucceeds(
        setDoc(campRef, {
          id: 'camp_nova',
          code: 'ARC-NEW001',
          dmId: 'alice',
          name: 'Nova Mesa',
          description: 'Aventura épica',
          dmName: 'Alice Mestre',
          members: {},
          createdAt: Date.now(),
        })
      );

      await assertSucceeds(
        setDoc(codeRef, {
          code: 'ARC-NEW001',
          campaignId: 'camp_nova',
          dmId: 'alice',
          name: 'Nova Mesa',
          dmName: 'Alice Mestre',
          createdAt: Date.now(),
        })
      );

      // 2. Mestre cria convite oficial para Davi
      const inviteRef = doc(alice, 'campaign_invites', 'camp_nova_davi');
      await assertSucceeds(
        setDoc(inviteRef, {
          id: 'camp_nova_davi',
          campaignId: 'camp_nova',
          userId: 'davi',
          dmId: 'alice',
          status: 'pending',
          createdAt: Date.now(),
        })
      );

      // 3. Mestre publica handout
      const handoutRef = doc(alice, 'campaigns', 'camp_nova', 'handouts', 'carta_rei');
      await assertSucceeds(
        setDoc(handoutRef, {
          id: 'carta_rei',
          title: 'Carta do Rei',
          content: 'Convocação urgente',
          timestamp: Date.now(),
        })
      );

      // 4. Mestre encerra e exclui a campanha e o código atômico
      const delBatch = writeBatch(alice);
      delBatch.delete(campRef);
      delBatch.delete(codeRef);
      await assertSucceeds(delBatch.commit());
    });
  });
});
