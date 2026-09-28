import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  updateDoc,
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
 * Cria uma nova campanha no Firestore (ou localmente se offline)
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
      const ref = doc(db, 'campaigns', id);
      await setDoc(ref, newCampaign);

      // Registra no índice seguro de códigos para busca por outros jogadores
      const codeRef = doc(db, 'campaign_codes', code);
      await setDoc(codeRef, {
        code,
        campaignId: id,
        dmId,
        name: newCampaign.name,
        dmName: newCampaign.dmName,
        createdAt: newCampaign.createdAt,
      });
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
 * Busca uma campanha pelo código de 6 caracteres (ex: ARC-9X2Y8Z)
 */
export async function findCampaignByCode(code: string): Promise<Campaign | null> {
  const normalizedCode = code.trim().toUpperCase();

  if (db) {
    try {
      // 1. Tenta buscar no índice seguro de códigos
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

      // 2. Consulta fallback caso seja participante ou campanha legada
      const colRef = collection(db, 'campaigns');
      const q = query(colRef, where('code', '==', normalizedCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Campaign;
      }
    } catch (e) {
      console.warn('Erro ao buscar campanha por código no Firestore:', e);
    }
  }

  // Fallback local
  const locals = getLocalCampaigns();
  return locals.find((c) => c.code === normalizedCode) || null;
}

/**
 * Jogador ingressa em uma campanha existente
 */
export async function joinCampaign(
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
 * Jogador sai da campanha
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
        await updateDoc(ref, { members: newMembers });
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
 * Mestre encerra/deleta a campanha
 */
export async function deleteCampaign(campaignId: string, campaignCode?: string): Promise<void> {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      await deleteDoc(ref);

      // Remove também o código correspondente no índice público, se fornecido ou encontrado
      const codeToDelete = campaignCode || getLocalCampaigns().find((c) => c.id === campaignId)?.code;
      if (codeToDelete) {
        const codeRef = doc(db, 'campaign_codes', codeToDelete);
        await deleteDoc(codeRef).catch(() => {});
      }
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
