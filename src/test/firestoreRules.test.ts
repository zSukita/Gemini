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
  deleteDoc,
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
      const msg =
        '\n[FirestoreRulesTest] ⚠️  Emulador do Firestore offline na porta 8080.\n' +
        'Para executar estes testes no emulador, use: npm run test:rules\n';
      if (process.env.REQUIRE_RULES_EMULATOR === 'true') {
        throw new Error(msg);
      }
      console.warn(msg);
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

    it('deve impedir ingresso direto na campanha se o convite estiver marcado como used (sem atualizar o convite)', async () => {
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

      // Tenta se adicionar diretamente na campanha tendo apenas um convite used
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

    it('deve permitir que o Mestre reautorize um jogador cujo convite era used e este consiga ingressar novamente', async () => {
      // 1. Convite usado previamente
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

      const alice = testEnv.authenticatedContext('alice').firestore();
      const bob = testEnv.authenticatedContext('bob').firestore();
      const inviteRefAlice = doc(alice, 'campaign_invites', 'camp_alice_bob');
      const inviteRefBob = doc(bob, 'campaign_invites', 'camp_alice_bob');
      const campRefBob = doc(bob, 'campaigns', 'camp_alice');

      // Alice (Mestre) reautoriza Bob (muda de 'used' para 'accepted')
      await assertSucceeds(
        updateDoc(inviteRefAlice, {
          status: 'accepted',
          updatedAt: Date.now(),
        })
      );

      // Agora Bob consegue ingressar novamente e marcar como used
      const batch = writeBatch(bob);
      batch.update(campRefBob, {
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
      batch.update(inviteRefBob, {
        status: 'used',
        updatedAt: Date.now(),
      });

      await assertSucceeds(batch.commit());
    });

    it('deve permitir que o jogador remova seu membro e exclua seu convite ao sair da campanha', async () => {
      // Alice Mestre, Bob membro ativo
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
          },
          createdAt: Date.now(),
        });
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

      // Bob sai da campanha e exclui o convite consumido
      const batch = writeBatch(bob);
      batch.update(campRef, {
        members: {},
        updatedAt: Date.now(),
      });
      batch.delete(inviteRef);

      await assertSucceeds(batch.commit());
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

  describe('5. Presença, Amigos e Mensagens Privadas', () => {
    it('1 e 2: remetente e destinatário conseguem acessar a mensagem, mas um terceiro usuário não consegue ler', async () => {
      // Alice envia uma mensagem direta para Bob
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'direct_messages', 'msg_alice_bob'), {
          id: 'msg_alice_bob',
          fromUserId: 'alice',
          fromUserName: 'Alice',
          toUserId: 'bob',
          toUserName: 'Bob',
          content: 'Mensagem confidencial entre Alice e Bob',
          timestamp: Date.now(),
          read: false,
        });
      });

      const alice = testEnv.authenticatedContext('alice').firestore();
      const bob = testEnv.authenticatedContext('bob').firestore();
      const eve = testEnv.authenticatedContext('eve').firestore();

      const msgRefAlice = doc(alice, 'direct_messages', 'msg_alice_bob');
      const msgRefBob = doc(bob, 'direct_messages', 'msg_alice_bob');
      const msgRefEve = doc(eve, 'direct_messages', 'msg_alice_bob');

      // Remetente (Alice) acessa com sucesso
      await assertSucceeds(getDoc(msgRefAlice));
      // Destinatário (Bob) acessa com sucesso
      await assertSucceeds(getDoc(msgRefBob));
      // Terceiro usuário (Eve) é bloqueado pelas regras
      await assertFails(getDoc(msgRefEve));
    });

    it('4. usuários só podem criar, modificar e apagar a própria presença', async () => {
      const alice = testEnv.authenticatedContext('alice').firestore();
      const bob = testEnv.authenticatedContext('bob').firestore();
      const eve = testEnv.authenticatedContext('eve').firestore();

      const alicePresence = doc(alice, 'public_presence', 'alice');
      const bobPresence = doc(bob, 'public_presence', 'bob');
      const eveTriesAlice = doc(eve, 'public_presence', 'alice');

      // Alice e Bob registram sua própria presença
      await assertSucceeds(
        setDoc(alicePresence, {
          userId: 'alice',
          name: 'Alice Aventureira',
          lastSeen: Date.now(),
          status: 'online',
        })
      );

      await assertSucceeds(
        setDoc(bobPresence, {
          userId: 'bob',
          name: 'Bob Ladino',
          lastSeen: Date.now(),
          status: 'online',
        })
      );

      await assertFails(setDoc(doc(alice, 'public_presence', 'alice'), {
        userId: 'alice', name: 'Alice', email: 'alice@example.com',
        lastSeen: Date.now(), status: 'online',
      }));

      // Eve NÃO pode modificar a presença da Alice
      await assertFails(
        updateDoc(eveTriesAlice, {
          status: 'offline',
          lastSeen: Date.now(),
        })
      );

      // Eve NÃO pode apagar a presença da Alice
      await assertFails(deleteDoc(eveTriesAlice));

      // Alice PODE apagar seu próprio registro de presença ao sair
      await assertSucceeds(deleteDoc(alicePresence));
    });

    it('bloqueia leitura dos documentos legados que podem conter e-mails', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'online_users', 'alice'), {
          userId: 'alice', name: 'Alice', email: 'alice@example.com',
          lastSeen: Date.now(), status: 'online',
        });
        await setDoc(doc(adminDb, 'user_profiles', 'alice'), {
          userId: 'alice', displayName: 'Alice', email: 'alice@example.com',
        });
      });

      const alice = testEnv.authenticatedContext('alice').firestore();
      const eve = testEnv.authenticatedContext('eve').firestore();
      await assertFails(getDoc(doc(eve, 'online_users', 'alice')));
      await assertFails(getDoc(doc(eve, 'user_profiles', 'alice')));
      // O proprietário consegue apagar registros legados no próximo heartbeat/logout.
      await assertSucceeds(deleteDoc(doc(alice, 'online_users', 'alice')));
      await assertSucceeds(deleteDoc(doc(alice, 'user_profiles', 'alice')));
    });

    it('publica perfil sem e-mail, acessível por UID e não enumerável', async () => {
      const alice = testEnv.authenticatedContext('alice').firestore();
      const bob = testEnv.authenticatedContext('bob').firestore();
      const profile = doc(alice, 'public_profiles', 'alice');
      await assertSucceeds(setDoc(profile, {
        userId: 'alice', displayName: 'Alice', avatarUrl: '', updatedAt: Date.now(),
      }));
      await assertSucceeds(getDoc(doc(bob, 'public_profiles', 'alice')));
      await assertFails(setDoc(doc(alice, 'public_profiles', 'alice'), {
        userId: 'alice', displayName: 'Alice', email: 'alice@example.com', updatedAt: Date.now(),
      }));
      await assertFails(getDocs(collection(bob, 'public_profiles')));
    });

    it('4. usuários só podem modificar sua própria lista de amigos', async () => {
      const alice = testEnv.authenticatedContext('alice').firestore();
      const eve = testEnv.authenticatedContext('eve').firestore();

      const aliceFriends = doc(alice, 'user_friends', 'alice');
      const eveTriesAliceFriends = doc(eve, 'user_friends', 'alice');

      // Alice atualiza sua lista de amigos
      await assertSucceeds(
        setDoc(aliceFriends, {
          friends: [
            {
              userId: 'bob',
              name: 'Bob',
              addedAt: Date.now(),
            },
          ],
        })
      );

      // Eve NÃO pode alterar os amigos da Alice
      await assertFails(
        setDoc(eveTriesAliceFriends, {
          friends: [],
        })
      );
    });

    it('5. somente o destinatário pode marcar uma mensagem recebida como lida', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'direct_messages', 'msg_read_test'), {
          id: 'msg_read_test',
          fromUserId: 'alice',
          fromUserName: 'Alice',
          toUserId: 'bob',
          toUserName: 'Bob',
          content: 'Você leu isso?',
          timestamp: Date.now(),
          read: false,
        });
      });

      const alice = testEnv.authenticatedContext('alice').firestore();
      const bob = testEnv.authenticatedContext('bob').firestore();
      const eve = testEnv.authenticatedContext('eve').firestore();

      const refAlice = doc(alice, 'direct_messages', 'msg_read_test');
      const refBob = doc(bob, 'direct_messages', 'msg_read_test');
      const refEve = doc(eve, 'direct_messages', 'msg_read_test');

      // Terceiro (Eve) tenta marcar como lida -> Falha
      await assertFails(
        updateDoc(refEve, {
          read: true,
        })
      );

      // Remetente (Alice) tenta marcar mensagem enviada como lida -> Falha (apenas o destinatário Bob pode)
      await assertFails(
        updateDoc(refAlice, {
          read: true,
        })
      );

      // Destinatário (Bob) marca como lida -> Sucesso
      await assertSucceeds(
        updateDoc(refBob, {
          read: true,
        })
      );
    });
  });
});
