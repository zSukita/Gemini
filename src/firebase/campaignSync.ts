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

function generateCampaignCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
    } catch (e) {
      console.warn('Erro ao salvar campanha no Firestore, usando fallback local:', e);
    }
  }

  // Atualiza cache local
  const locals = getLocalCampaigns();
  saveLocalCampaigns([...locals, newCampaign]);

  return newCampaign;
}

/**
 * Busca uma campanha pelo código de 6 caracteres (ex: ARC-9X2Y)
 */
export async function findCampaignByCode(code: string): Promise<Campaign | null> {
  const normalizedCode = code.trim().toUpperCase();

  if (db) {
    try {
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
      console.warn('Erro ao ingressar no Firestore, usando fallback local:', e);
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
      console.warn('Erro ao sair da campanha no Firestore:', e);
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
export async function deleteCampaign(campaignId: string): Promise<void> {
  if (db) {
    try {
      const ref = doc(db, 'campaigns', campaignId);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Erro ao deletar campanha no Firestore:', e);
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
      console.warn('Erro ao transmitir handout no Firestore:', e);
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
      console.warn('Erro ao fechar handout no Firestore:', e);
    }
  }

  const locals = getLocalCampaigns();
  const updated = locals.map((c) => (c.id === campaignId ? { ...c, activeHandout: null } : c));
  saveLocalCampaigns(updated);
}
