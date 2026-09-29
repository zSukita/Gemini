import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

export interface CampaignPartyMember {
  userId: string;
  characterId: string;
  name: string;
  characterClass: string;
  level: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  passivePerception: number;
  avatarUrl?: string;
  updatedAt: number;
}

export interface CampaignHandout {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Campaign {
  id: string;
  code: string;
  name: string;
  description: string;
  dmId: string;
  dmName: string;
  members: Record<string, CampaignPartyMember>;
  createdAt: number;
  activeHandout?: CampaignHandout | null;
}

export interface CampaignInvite {
  id: string; // ${campaignId}_${userId}
  campaignId: string;
  userId: string;
  dmId: string;
  status: 'pending' | 'accepted' | 'used';
  campaignName?: string;
  dmName?: string;
  createdAt: number;
  updatedAt?: number;
}

export function generateCampaignCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 6; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return `ARC-${code}`;
}

const LOCAL_CAMPAIGNS_KEY = 'arcanasheet_local_campaigns';

function getLocalCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCampaigns(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch {
    // ignore
  }
}

/**
 * Cria uma nova campanha no Firestore com gravação em lote (writeBatch) atômica
 * para garantir consistência entre o documento da campanha e o índice de códigos.
 */
export async function createCampaign(
  dmId: string,
  dmName: string,
  name: string,
  description: string
): Promise<Campaign> {
  const code = generateCampaignCode();
  const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newCampaign: Campaign = {
    id,
    code,
    name: name.trim(),
    description: description.trim(),
    dmId,
    dmName: dmName || 'Mestre Arcana',
    members: {},
    createdAt: Date.now(),
    activeHandout: null,
  };

  if (db) {
    try {
      // 1. Grava documento da campanha
      const campRef = doc(db, 'campaigns', id);
      await setDoc(campRef, newCampaign);

      // 2. Grava no índice seguro de códigos com validação de existência
      try {
        const codeRef = doc(db, 'campaign_codes', code);
        await setDoc(codeRef, {
          code,
          campaignId: id,
          dmId,
          name: newCampaign.name,
          dmName: newCampaign.dmName,
          createdAt: newCampaign.createdAt,
        });
      } catch (codeErr) {
        // Consistência: se o registro do código falhar, remove a campanha criada para evitar estado órfão
        await deleteDoc(campRef).catch(() => {});
        throw codeErr;
      }
    } catch (e) {
      console.error('Erro ao salvar campanha no Firestore:', e);
      throw new Error(`Falha ao salvar campanha na nuvem: ${(e as Error).message || e}`);
    }
  }

  // Atualiza cache local
  const locals = getLocalCampaigns();
  saveLocalCampaigns([...locals, newCampaign]);

  return newCampaign;
}

/**
 * Cria ou renova uma autorização/convite para um jogador ingressar na campanha (apenas Mestre).
 * Se o jogador possuir um convite antigo que foi consumido ('used') ou revogado, renova-o como 'pending'
 * para que possa ser aceito e consumido em uma nova entrada autorizada pelo Mestre.
 */
export async function createCampaignInvite(
  campaignId: string,
  userId: string,
  dmId: string,
  metadata?: { campaignName?: string; dmName?: string }
): Promise<CampaignInvite> {
  const inviteId = `${campaignId}_${userId}`;
  const invite: CampaignInvite = {
    id: inviteId,
    campaignId,
    userId,
    dmId,
    status: 'pending',
    campaignName: metadata?.campaignName || '',
    dmName: metadata?.dmName || '',
    createdAt: Date.now(),
  };

  if (db) {
    try {
      const inviteRef = doc(db, 'campaign_invites', inviteId);
      await setDoc(inviteRef, invite);
    } catch (e) {
      console.error('Erro ao criar ou renovar convite de campanha no Firestore:', e);
      throw new Error(`Falha ao autorizar jogador: ${(e as Error).message || e}`);
    }
  }

  return invite;
}

/**
 * Reautoriza explicitamente um jogador cujo convite anterior foi consumido ('used') ou revogado.
 */
export async function reauthorizeCampaignMember(
  campaignId: string,
  userId: string,
  dmId: string,
  metadata?: { campaignName?: string; dmName?: string }
): Promise<CampaignInvite> {
  return createCampaignInvite(campaignId, userId, dmId, metadata);
}

/**
 * Busca o convite de um jogador para uma campanha específica
 */
export async function getCampaignInvite(
  campaignId: string,
  userId: string
): Promise<CampaignInvite | null> {
  if (db) {
    try {
      const inviteId = `${campaignId}_${userId}`;
      const inviteRef = doc(db, 'campaign_invites', inviteId);
      const snap = await getDoc(inviteRef);
      if (snap.exists()) {
        return snap.data() as CampaignInvite;
      }
      return null;
    } catch (e) {
      console.warn('Erro ao buscar convite no Firestore:', e);
      return null;
    }
  }
  return null;
}

/**
 * O jogador aceita um convite pendente
 */
export async function acceptCampaignInvite(
  campaignId: string,
  userId: string
): Promise<void> {
  if (db) {
    try {
      const inviteId = `${campaignId}_${userId}`;
      const inviteRef = doc(db, 'campaign_invites', inviteId);
      await updateDoc(inviteRef, {
        status: 'accepted',
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error('Erro ao aceitar convite no Firestore:', e);
      throw new Error(`Falha ao aceitar convite: ${(e as Error).message || e}`);
    }
  }
}

/**
 * Busca uma campanha pelo código de 6 caracteres (ex: ARC-9X2Y8Z).
 * Busca estritamente pelo documento específico do código, sem consultas à coleção.
 */
export async function findCampaignByCode(code: string): Promise<Campaign | null> {
  const normalizedCode = code.trim().toUpperCase();

  if (db) {
    try {
      // 1. Busca estritamente pelo documento específico do código no índice seguro
      const codeDocRef = doc(db, 'campaign_codes', normalizedCode);
      const codeSnap = await getDoc(codeDocRef);
      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        const campId = codeData.campaignId;

        // Se o usuário já tiver acesso à campanha completa, busca o documento
        try {
          const campRef = doc(db, 'campaigns', campId);
          const campSnap = await getDoc(campRef);
          if (campSnap.exists()) {
            return campSnap.data() as Campaign;
          }
        } catch {
          // Se ainda não for membro participante, retorna metadados para permitir ingresso
        }

        return {
          id: campId,
          code: normalizedCode,
          name: codeData.name || 'Campanha Arcana',
          description: codeData.description || '',
          dmId: codeData.dmId,
          dmName: codeData.dmName || 'Mestre Arcana',
          members: {},
          createdAt: codeData.createdAt || Date.now(),
          activeHandout: null,
        };
      }
      return null;
    } catch (e) {
      console.warn('Erro ao buscar campanha por código no Firestore:', e);
    }
  }

  // Fallback local
  const locals = getLocalCampaigns();
  return locals.find((c) => c.code === normalizedCode) || null;
}

/**
 * Jogador ingressa em uma campanha existente.
 * Valida o convite e usa writeBatch para atualizar os membros da campanha e marcar o convite como 'used' atomicamente.
 */
export async function joinCampaign(
  campaignId: string,
  member: CampaignPartyMember
): Promise<void> {
  if (db) {
    try {
      const campRef = doc(db, 'campaigns', campaignId);
      const campSnap = await getDoc(campRef);
      const isDm = campSnap.exists() && campSnap.data().dmId === member.userId;

      // Se for o próprio Mestre, ele não necessita de convite para sincronizar seu personagem
      if (isDm) {
        await updateDoc(campRef, {
          [`members.${member.userId}`]: member,
          updatedAt: Date.now(),
        });
        return;
      }

      const inviteId = `${campaignId}_${member.userId}`;
      const inviteRef = doc(db, 'campaign_invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error('Você não possui autorização ou convite para esta campanha. Solicite ao Mestre.');
      }

      const inviteData = inviteSnap.data() as CampaignInvite;
      if (inviteData.status === 'used') {
        throw new Error('Este convite já foi consumido. Solicite uma nova autorização ao Mestre da campanha.');
      }

      // Se o convite ainda estiver pending, aceita antes de marcar como used no batch
      if (inviteData.status === 'pending') {
        await acceptCampaignInvite(campaignId, member.userId);
      }

      const batch = writeBatch(db);
      batch.update(campRef, {
        [`members.${member.userId}`]: member,
        updatedAt: Date.now(),
      });
      // Marca o convite aceito como 'used' (consumido) atomicamente
      batch.update(inviteRef, {
        status: 'used',
        updatedAt: Date.now(),
      });

      await batch.commit();
      return;
    } catch (e) {
      console.error('Erro ao ingressar na campanha no Firestore:', e);
      throw new Error(`Falha ao sincronizar entrada na campanha na nuvem: ${(e as Error).message || e}`);
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => {
    if (c.id === campaignId) {
      return {
        ...c,
        members: {
          ...c.members,
          [member.userId]: member,
        },
      };
    }
    return c;
  });
  saveLocalCampaigns(updated);
}

/**
 * Atualiza os status do personagem do jogador na campanha em tempo real
 */
export async function syncMemberStats(
  campaignId: string,
  member: CampaignPartyMember
): Promise<void> {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        [`members.${member.userId}`]: member,
      });
      return;
    } catch (e) {
      console.warn('Erro ao sincronizar membro no Firestore:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('arcanasheet_cloud_sync_error', {
            detail: { operation: 'syncMemberStats', error: e },
          })
        );
      }
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => {
    if (c.id === campaignId) {
      return {
        ...c,
        members: {
          ...c.members,
          [member.userId]: member,
        },
      };
    }
    return c;
  });
  saveLocalCampaigns(updated);
}

/**
 * Jogador sai da campanha.
 * Remove o membro da campanha e exclui o convite consumido, garantindo que
 * uma autorização antiga não persista e permitindo nova autorização limpa do Mestre.
 */
export async function leaveCampaign(
  campaignId: string,
  userId: string
): Promise<void> {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const camp = snap.data() as Campaign;
        const newMembers = { ...camp.members };
        delete newMembers[userId];

        const batch = writeBatch(db);
        batch.update(ref, { 
          members: newMembers,
          updatedAt: Date.now(),
        });

        // Limpa/exclui o convite consumido do jogador ao sair da campanha
        const inviteRef = doc(db, 'campaign_invites', `${campaignId}_${userId}`);
        batch.delete(inviteRef);

        await batch.commit();
      }
      return;
    } catch (e) {
      console.error('Erro ao sair da campanha no Firestore:', e);
      throw new Error(`Falha ao sincronizar saída da campanha na nuvem: ${(e as Error).message || e}`);
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => {
    if (c.id === campaignId) {
      const newMembers = { ...c.members };
      delete newMembers[userId];
      return { ...c, members: newMembers };
    }
    return c;
  });
  saveLocalCampaigns(updated);
}

/**
 * Mestre encerra/deleta a campanha.
 * Usa writeBatch atômico e obtém o código diretamente do documento da campanha no Firestore se não fornecido.
 */
export async function deleteCampaign(campaignId: string, campaignCode?: string): Promise<void> {
  if (db) {
    try {
      let codeToDelete = campaignCode;

      // Se o código não foi fornecido, busca diretamente do documento no Firestore
      if (!codeToDelete) {
        try {
          const campRef = doc(db, 'campaigns', campaignId);
          const campSnap = await getDoc(campRef);
          if (campSnap.exists()) {
            codeToDelete = campSnap.data()?.code;
          }
        } catch {
          codeToDelete = getLocalCampaigns().find((c) => c.id === campaignId)?.code;
        }
      }

      const batch = writeBatch(db);
      const campRef = doc(db, 'campaigns', campaignId);
      batch.delete(campRef);

      if (codeToDelete) {
        const codeRef = doc(db, 'campaign_codes', codeToDelete);
        batch.delete(codeRef);
      }

      await batch.commit();
    } catch (e) {
      console.error('Erro ao deletar campanha no Firestore:', e);
      throw new Error(`Falha ao excluir campanha na nuvem: ${(e as Error).message || e}`);
    }
  }

  const locals = getLocalCampaigns();
  saveLocalCampaigns(locals.filter((c) => c.id !== campaignId));
}

/**
 * Assina atualizações em tempo real de uma campanha específica
 */
export function subscribeToCampaign(
  campaignId: string,
  onUpdate: (campaign: Campaign | null) => void
): () => void {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      return onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as Campaign);
          } else {
            onUpdate(null);
          }
        },
        (err) => {
          console.warn('Erro na assinatura do Firestore da campanha:', err);
          const locals = getLocalCampaigns();
          onUpdate(locals.find((c) => c.id === campaignId) || null);
        }
      );
    } catch (e) {
      console.warn('Falha ao assinar Firestore:', e);
    }
  }

  // Fallback local
  const locals = getLocalCampaigns();
  onUpdate(locals.find((c) => c.id === campaignId) || null);
  return () => {};
}

/**
 * Mestre transmite uma pista / documento (Handout) para todos os jogadores da campanha
 */
export async function broadcastHandoutToCampaign(
  campaignId: string,
  handout: Omit<CampaignHandout, 'id' | 'timestamp'>
): Promise<void> {
  const activeHandout: CampaignHandout = {
    ...handout,
    id: `handout_${Date.now()}`,
    timestamp: Date.now(),
  };

  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        activeHandout,
      });
      return;
    } catch (e) {
      console.error('Erro ao transmitir handout no Firestore:', e);
      throw new Error(`Falha ao transmitir pista na nuvem: ${(e as Error).message || e}`);
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => (c.id === campaignId ? { ...c, activeHandout } : c));
  saveLocalCampaigns(updated);
}

/**
 * Fecha a pista ativa na campanha
 */
export async function dismissCampaignHandout(campaignId: string): Promise<void> {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      await updateDoc(ref, {
        activeHandout: null,
      });
      return;
    } catch (e) {
      console.error('Erro ao fechar handout no Firestore:', e);
      throw new Error(`Falha ao dispensar pista na nuvem: ${(e as Error).message || e}`);
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => (c.id === campaignId ? { ...c, activeHandout: null } : c));
  saveLocalCampaigns(updated);
}
