import { useState, useEffect, useRef } from 'react';
import type {
  Character,
  AbilityKey,
  SkillKey,
  SkillProficiency,
  WeaponAttack,
  InventoryItem,
  Spell,
  CharacterFeature,
  CharacterResource,
} from '../types/dnd5e';
import { createBlankCharacter } from '../utils/defaultCharacter';
import { getAbilityModifier } from '../utils/calculations';
import { rollDie } from '../utils/diceRoller';

import { broadcastSyncMessage, subscribeToSync } from '../utils/syncChannel';
import {
  loadCharactersFromCloud,
  saveCharactersToCloud,
  syncOnChange,
  cancelPendingSync,
} from '../firebase/characterSync';
import { safeSetItem, safeSetJson, safeGetItem } from '../utils/safeStorage';
import {
  getUserStorageKey,
  migrateLegacyKeysToUser,
  BASE_STORAGE_KEYS,
} from '../utils/accountStorage';
import { sanitizeCharacter, parseAndValidateCharacterJson } from '../utils/characterSanitizer';
import { applyCharacterDamage, applyCharacterHealing, isCharacterDead } from '../utils/deathSaves';

export function useCharacter(userId?: string | null) {
  const [isCloudLoaded, setIsCloudLoaded] = useState<boolean>(!userId);
  const loadedUserIdRef = useRef<string | null>(userId || null);
  const loadRequestIdRef = useRef<number>(0);

  // Inicializa estado lendo cache local sanitizado do usuário ou convidado
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const storageKey = getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, userId);
      const saved = safeGetItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => sanitizeCharacter(c));
        }
      }
    } catch (e) {
      console.error('Erro ao ler personagens do localStorage', e);
    }
    return [createBlankCharacter()];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    try {
      const activeKey = getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CHARACTER, userId);
      const savedId = safeGetItem(activeKey);
      if (savedId && characters.some((c) => c.id === savedId)) return savedId;
    } catch {
      // ignore
    }
    return characters[0]?.id || '';
  });

  const activeCharacter: Character =
    characters.find((c) => c.id === activeId) || characters[0] || createBlankCharacter();

  // Carregar personagens da nuvem quando o usuário faz login ou troca de conta
  useEffect(() => {
    // 1. Cancela timers e sincronizações pendentes da conta anterior
    cancelPendingSync();

    // 2. Incrementa requestId para invalidar respostas assíncronas anteriores (race conditions)
    const currentRequestId = ++loadRequestIdRef.current;

    if (!userId) {
      // Modo Convidado / Logout
      setIsCloudLoaded(false);
      const guestKey = BASE_STORAGE_KEYS.CHARACTERS;
      const guestActiveKey = BASE_STORAGE_KEYS.ACTIVE_CHARACTER;
      try {
        const raw = safeGetItem(guestKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = parsed.map((c) => sanitizeCharacter(c));
            setCharacters(sanitized);
            const savedActive = safeGetItem(guestActiveKey);
            setActiveId(
              savedActive && sanitized.some((c) => c.id === savedActive)
                ? savedActive
                : sanitized[0].id
            );
            loadedUserIdRef.current = null;
            setIsCloudLoaded(true);
            return;
          }
        }
      } catch {
        // fallback
      }
      const blank = createBlankCharacter();
      setCharacters([blank]);
      setActiveId(blank.id);
      loadedUserIdRef.current = null;
      setIsCloudLoaded(true);
      return;
    }

    // Usuário autenticado
    setIsCloudLoaded(false);

    // 3. Executa migração segura das chaves legadas se for a primeira vez deste usuário
    migrateLegacyKeysToUser(userId);

    const userStorageKey = getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, userId);
    const userActiveKey = getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CHARACTER, userId);

    let localCachedCharacters: Character[] | null = null;
    let localCachedActiveId: string | null = null;

    // Tenta carregar cache local específico deste usuário
    try {
      const cached = safeGetItem(userStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localCachedCharacters = parsed.map((c) => sanitizeCharacter(c));
          localCachedActiveId = safeGetItem(userActiveKey);
          setCharacters(localCachedCharacters);
          if (localCachedActiveId && localCachedCharacters.some((c) => c.id === localCachedActiveId)) {
            setActiveId(localCachedActiveId);
          } else {
            setActiveId(localCachedCharacters[0].id);
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Carregar da nuvem (Firestore)
    loadCharactersFromCloud(userId)
      .then((cloudData) => {
        // Ignora resposta se o usuário já trocou de conta ou se outro request foi iniciado
        if (loadRequestIdRef.current !== currentRequestId) return;

        if (cloudData && cloudData.characters && cloudData.characters.length > 0) {
          setCharacters(cloudData.characters);
          if (cloudData.activeId && cloudData.characters.some((c) => c.id === cloudData.activeId)) {
            setActiveId(cloudData.activeId);
          } else {
            setActiveId(cloudData.characters[0].id);
          }
        } else if (localCachedCharacters && localCachedCharacters.length > 0) {
          // Nuvem vazia mas cache local existia: preserva cache local e espelha para nuvem
          saveCharactersToCloud(userId, localCachedCharacters, localCachedActiveId || localCachedCharacters[0].id).catch(
            (err) => console.error('Erro ao sincronizar cache local inicial para nuvem:', err)
          );
        } else {
          // Conta nova sem personagens na nuvem nem cache: cria ficha em branco
          const blank = createBlankCharacter();
          setCharacters([blank]);
          setActiveId(blank.id);
          saveCharactersToCloud(userId, [blank], blank.id).catch((err) =>
            console.error('Erro ao salvar personagem em branco inicial:', err)
          );
        }

        loadedUserIdRef.current = userId;
        setIsCloudLoaded(true);
      })
      .catch((err) => {
        console.error('Erro ao carregar personagens da nuvem:', err);
        if (loadRequestIdRef.current !== currentRequestId) return;
        // Falha de rede: se tinha cache local, mantém; senão usa padrão
        loadedUserIdRef.current = userId;
        setIsCloudLoaded(true);
      });

    return () => {
      cancelPendingSync(userId);
    };
  }, [userId]);

  // Salvar sempre que a lista de personagens mudar, com proteção estrita contra salvamento em conta errada
  useEffect(() => {
    // CRÍTICO: Não persista dados no cache ou Firestore até que o carregamento da conta atual tenha terminado!
    if (!isCloudLoaded) return;

    // Garante que o estado de personagens atual corresponde exatamente à conta em foco
    const expectedUserId = userId || null;
    if (loadedUserIdRef.current !== expectedUserId) return;

    try {
      const storageKey = getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, userId);
      const activeKey = getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CHARACTER, userId);

      safeSetJson(storageKey, characters);
      safeSetItem(activeKey, activeId);

      // Sincroniza com a nuvem (Firestore) com debounce por usuário
      if (userId) {
        syncOnChange(userId, characters, activeId);
      }

      // Transmite estado atualizado do jogador para o DM Screen somente se conta carregada
      if (activeCharacter && activeCharacter.id) {
        broadcastSyncMessage({
          type: 'PLAYER_UPDATE',
          payload: {
            playerId: activeCharacter.id,
            name: activeCharacter.name,
            currentHp: activeCharacter.currentHp,
            maxHp: activeCharacter.maxHp,
            tempHp: activeCharacter.tempHp,
            armorClass: activeCharacter.armorClass,
          },
        });
      }
    } catch (e) {
      console.error('Erro ao salvar personagens no localStorage:', e);
    }
  }, [characters, activeId, activeCharacter, userId, isCloudLoaded]);

  // Ouvir alterações vindas do Painel do Mestre (ex: Mestre aplicou dano ou cura no combate)
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'DM_COMBATANT_UPDATE' && msg.payload) {
        const payload = msg.payload as {
          playerId?: string;
          currentHp?: number;
          maxHp?: number;
          tempHp?: number;
          damageAmount?: number;
          criticalDamage?: boolean;
          healingAmount?: number;
          restoreHp?: boolean;
        };

        if (payload.playerId && payload.playerId === activeId) {
          setCharacters((prev) =>
            prev.map((c) => {
              if (c.id === activeId) {
                if (payload.restoreHp) return { ...c, currentHp: payload.currentHp ?? c.currentHp, tempHp: payload.tempHp ?? c.tempHp };
                if (payload.damageAmount !== undefined) return applyCharacterDamage(c, payload.damageAmount, payload.criticalDamage);
                if (payload.healingAmount !== undefined) return applyCharacterHealing(c, payload.healingAmount);
                return { ...c, currentHp: payload.currentHp ?? c.currentHp, tempHp: payload.tempHp ?? c.tempHp };
              }
              return c;
            })
          );
        }
      }
    });

    return unsubscribe;
  }, [activeId]);

  // Atualizador genérico do personagem ativo
  const updateCharacter = (updater: Partial<Character> | ((prev: Character) => Character)) => {
    setCharacters((prevList) =>
      prevList.map((c) => {
        if (c.id === activeId) {
          if (typeof updater === 'function') {
            return updater(c);
          }
          return { ...c, ...updater };
        }
        return c;
      })
    );
  };

  // Atualizar atributo (score e/ou proficiência no teste de resistência)
  const updateAbility = (
    key: AbilityKey,
    updates: { score?: number; saveProficient?: boolean }
  ) => {
    updateCharacter((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [key]: {
          ...prev.abilities[key],
          ...updates,
        },
      },
    }));
  };

  // Alternar proficiência de perícia: none -> proficient -> expertise -> none
  const cycleSkillProficiency = (skillKey: SkillKey) => {
    updateCharacter((prev) => {
      const current = prev.skills[skillKey]?.proficiency || 'none';
      let next: SkillProficiency = 'none';
      if (current === 'none') next = 'proficient';
      else if (current === 'proficient') next = 'expertise';
      else next = 'none';

      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillKey]: {
            ...prev.skills[skillKey],
            proficiency: next,
          },
        },
      };
    });
  };

  // Aplicar dano (absorvido primeiro pelo HP temporário)
  const applyDamage = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateCharacter((prev) => applyCharacterDamage(prev, amount));
  };

  // Aplicar cura
  const applyHealing = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateCharacter((prev) => applyCharacterHealing(prev, amount));
  };

  // Definir HP Temporário
  const setTempHp = (amount: number) => {
    updateCharacter({ tempHp: Math.max(0, amount) });
  };

  // Alternar Salvaguardas contra a Morte (Death Saves)
  const toggleDeathSaveSuccess = (index: number) => {
    updateCharacter((prev) => {
      const current = prev.deathSaves.successes;
      const next = current === index + 1 ? index : index + 1;
      return {
        ...prev,
        deathSaves: {
          ...prev.deathSaves,
          successes: Math.max(0, Math.min(3, next)),
        },
      };
    });
  };

  const toggleDeathSaveFailure = (index: number) => {
    updateCharacter((prev) => {
      const current = prev.deathSaves.failures;
      const next = current === index + 1 ? index : index + 1;
      return {
        ...prev,
        deathSaves: {
          ...prev.deathSaves,
          failures: Math.max(0, Math.min(3, next)),
        },
      };
    });
  };

  // Descanso Curto (Short Rest): pode gastar 1 dado de vida para curar
  const spendHitDie = (): { dieRoll: number; conMod: number; totalHealed: number } | null => {
    if (isCharacterDead(activeCharacter) || activeCharacter.hitDice.current <= 0) return null;

    const sides = parseInt(activeCharacter.hitDice.dieType.replace('d', ''), 10) || 8;
    const dieRoll = rollDie(sides);
    const conMod = getAbilityModifier(activeCharacter.abilities.con.score);
    const totalHealed = Math.max(1, dieRoll + conMod);

    updateCharacter((prev) => ({
      ...applyCharacterHealing(prev, totalHealed),
      hitDice: {
        ...prev.hitDice,
        current: Math.max(0, prev.hitDice.current - 1),
      },
    }));

    return { dieRoll, conMod, totalHealed };
  };

  // Descanso Longo (Long Rest): Recupera todo o HP, metade dos dados de vida (mín 1), zera slots gastos, death saves e recursos
  const performLongRest = () => {
    updateCharacter((prev) => {
      // Descanso não ressuscita; uma magia/efeito de retorno precisa fazê-lo explicitamente.
      if (isCharacterDead(prev)) return prev;
      const regainedHitDice = Math.max(1, Math.floor(prev.hitDice.total / 2));
      const newHitDiceCount = Math.min(prev.hitDice.total, prev.hitDice.current + regainedHitDice);

      const resetSlots = prev.spellcasting.slots.map((slot) => ({
        ...slot,
        used: 0,
      }));

      const resetResources = (prev.resources || []).map((res) => {
        if (res.resetOn === 'short' || res.resetOn === 'long') {
          return { ...res, current: res.max };
        }
        return res;
      });

      const healed = applyCharacterHealing(prev, prev.maxHp);
      return {
        ...healed,
        currentHp: healed.currentHp,
        tempHp: 0,
        hitDice: {
          ...prev.hitDice,
          current: newHitDiceCount,
        },
        deathSaves: {
          successes: 0,
          failures: 0,
        },
        spellcasting: {
          ...prev.spellcasting,
          slots: resetSlots,
        },
        resources: resetResources,
      };
    });
  };

  // Finalizar Descanso Curto (reseta recursos que recarregam em descanso curto)
  const completeShortRest = () => {
    updateCharacter((prev) => ({
      ...prev,
      resources: (prev.resources || []).map((res) =>
        res.resetOn === 'short' ? { ...res, current: res.max } : res
      ),
    }));
  };

  // Gerenciamento de Recursos de Classe
  const addResource = (res: Omit<CharacterResource, 'id'>) => {
    const newRes: CharacterResource = {
      ...res,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    updateCharacter((prev) => ({
      ...prev,
      resources: [...(prev.resources || []), newRes],
    }));
  };

  const updateResource = (id: string, updates: Partial<CharacterResource>) => {
    updateCharacter((prev) => ({
      ...prev,
      resources: (prev.resources || []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const deleteResource = (id: string) => {
    updateCharacter((prev) => ({
      ...prev,
      resources: (prev.resources || []).filter((r) => r.id !== id),
    }));
  };

  const consumeResourceCharge = (id: string, delta: number) => {
    updateCharacter((prev) => ({
      ...prev,
      resources: (prev.resources || []).map((r) => {
        if (r.id === id) {
          const nextVal = Math.max(0, Math.min(r.max, r.current + delta));
          return { ...r, current: nextVal };
        }
        return r;
      }),
    }));
  };
  const useResourceCharge = consumeResourceCharge;

  // Gerenciamento de Ataques / Armas
  const addAttack = (attack: Omit<WeaponAttack, 'id'>) => {
    const newAttack: WeaponAttack = {
      ...attack,
      id: `atk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    updateCharacter((prev) => ({
      ...prev,
      attacks: [...prev.attacks, newAttack],
    }));
  };

  const updateAttack = (id: string, updates: Partial<WeaponAttack>) => {
    updateCharacter((prev) => ({
      ...prev,
      attacks: prev.attacks.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const deleteAttack = (id: string) => {
    updateCharacter((prev) => ({
      ...prev,
      attacks: prev.attacks.filter((a) => a.id !== id),
    }));
  };

  // Gerenciamento de Inventário
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    updateCharacter((prev) => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
    }));
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    updateCharacter((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const deleteInventoryItem = (id: string) => {
    updateCharacter((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((item) => item.id !== id),
    }));
  };

  // Gerenciamento de Magias & Espaços de Magia
  const toggleSpellSlotUsed = (level: number, slotIndex: number) => {
    updateCharacter((prev) => {
      const slots = prev.spellcasting.slots.map((s) => {
        if (s.level === level) {
          const currentUsed = s.used;
          const newUsed = slotIndex < currentUsed ? slotIndex : slotIndex + 1;
          return { ...s, used: Math.max(0, Math.min(s.max, newUsed)) };
        }
        return s;
      });
      return {
        ...prev,
        spellcasting: {
          ...prev.spellcasting,
          slots,
        },
      };
    });
  };

  const updateSpellSlotMax = (level: number, max: number) => {
    updateCharacter((prev) => {
      const slots = prev.spellcasting.slots.map((s) =>
        s.level === level ? { ...s, max: Math.max(0, max), used: Math.min(s.used, max) } : s
      );
      return {
        ...prev,
        spellcasting: { ...prev.spellcasting, slots },
      };
    });
  };

  const addSpell = (spell: Omit<Spell, 'id'>) => {
    const newSpell: Spell = {
      ...spell,
      id: `spell-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    updateCharacter((prev) => ({
      ...prev,
      spellcasting: {
        ...prev.spellcasting,
        spells: [...prev.spellcasting.spells, newSpell],
      },
    }));
  };

  const updateSpell = (id: string, updates: Partial<Spell>) => {
    updateCharacter((prev) => ({
      ...prev,
      spellcasting: {
        ...prev.spellcasting,
        spells: prev.spellcasting.spells.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      },
    }));
  };

  const deleteSpell = (id: string) => {
    updateCharacter((prev) => ({
      ...prev,
      spellcasting: {
        ...prev.spellcasting,
        spells: prev.spellcasting.spells.filter((s) => s.id !== id),
      },
    }));
  };

  // Gerenciamento de Características (Features)
  const addFeature = (feat: Omit<CharacterFeature, 'id'>) => {
    const newFeat: CharacterFeature = {
      ...feat,
      id: `feat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    updateCharacter((prev) => ({
      ...prev,
      features: [...prev.features, newFeat],
    }));
  };

  const deleteFeature = (id: string) => {
    updateCharacter((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }));
  };

  // Gerenciamento de Múltiplos Personagens
  const createNewCharacter = (name?: string) => {
    const fresh = createBlankCharacter();
    if (name) fresh.name = name;
    setCharacters((prev) => [...prev, fresh]);
    setActiveId(fresh.id);
  };

  const addCreatedCharacter = (character: Character) => {
    setCharacters((prev) => {
      if (prev.length === 1 && !prev[0].name) {
        return [character];
      }
      return [...prev, character];
    });
    setActiveId(character.id);
  };

  const deleteActiveCharacter = () => {
    if (characters.length <= 1) {
      // Se for o único, reseta para uma ficha em branco
      const fresh = createBlankCharacter();
      setCharacters([fresh]);
      setActiveId(fresh.id);
      return;
    }
    const remaining = characters.filter((c) => c.id !== activeId);
    setCharacters(remaining);
    setActiveId(remaining[0].id);
  };

  const importCharacter = (jsonString: string): boolean => {
    const result = parseAndValidateCharacterJson(jsonString);
    if (!result.success || !result.character) {
      console.error('[useCharacter] Falha ao importar personagem:', result.error);
      return false;
    }
    const imported: Character = {
      ...result.character,
      id: `char-imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setCharacters((prev) => [...prev, imported]);
    setActiveId(imported.id);
    return true;
  };

  const exportActiveCharacter = (): string => {
    return JSON.stringify(activeCharacter, null, 2);
  };

  return {
    character: activeCharacter,
    charactersList: characters,
    isCloudLoaded,
    activeId,
    setActiveId,
    updateCharacter,
    updateAbility,
    cycleSkillProficiency,
    applyDamage,
    applyHealing,
    setTempHp,
    toggleDeathSaveSuccess,
    toggleDeathSaveFailure,
    spendHitDie,
    performLongRest,
    completeShortRest,
    addResource,
    updateResource,
    deleteResource,
    consumeResourceCharge,
    useResourceCharge,
    addAttack,
    updateAttack,
    deleteAttack,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    toggleSpellSlotUsed,
    updateSpellSlotMax,
    addSpell,
    updateSpell,
    deleteSpell,
    addFeature,
    deleteFeature,
    createNewCharacter,
    addCreatedCharacter,
    deleteActiveCharacter,
    importCharacter,
    exportActiveCharacter,
  };
}
