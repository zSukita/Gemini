import { useState, useEffect } from 'react';
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
} from '../firebase/characterSync';

const STORAGE_KEY_ACTIVE = 'arcanasheet_active_character_id';
const STORAGE_KEY_CHARACTERS = 'arcanasheet_characters_list';

export function useCharacter(userId?: string | null) {
  const [isCloudLoaded, setIsCloudLoaded] = useState<boolean>(!userId);
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const storageKey = userId ? `arcanasheet_characters_${userId}` : STORAGE_KEY_CHARACTERS;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler personagens do localStorage', e);
    }
    return [createBlankCharacter()];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    try {
      const activeKey = userId ? `arcanasheet_active_${userId}` : STORAGE_KEY_ACTIVE;
      const savedId = localStorage.getItem(activeKey);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return characters[0]?.id || '';
  });

  const activeCharacter: Character =
    characters.find((c) => c.id === activeId) || characters[0] || createBlankCharacter();

  // Carregar personagens da nuvem quando o usuário faz login
  useEffect(() => {
    if (!userId) {
      setIsCloudLoaded(true);
      return;
    }

    setIsCloudLoaded(false);
    let isMounted = true;
    const userStorageKey = `arcanasheet_characters_${userId}`;
    const userActiveKey = `arcanasheet_active_${userId}`;

    // Tenta carregar cache local específico deste usuário
    try {
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCharacters(parsed);
          const cachedActive = localStorage.getItem(userActiveKey);
          if (cachedActive) setActiveId(cachedActive);
        }
      }
    } catch {
      // ignore
    }

    // Carregar da nuvem (Firestore)
    loadCharactersFromCloud(userId)
      .then((cloudData) => {
        if (!isMounted) return;
        if (cloudData && cloudData.characters && cloudData.characters.length > 0) {
          setCharacters(cloudData.characters);
          if (cloudData.activeId) {
            setActiveId(cloudData.activeId);
          }
        } else {
          // Conta nova sem personagens na nuvem: inicia com ficha em branco para o jogador criar o personagem dele
          const blank = createBlankCharacter();
          setCharacters([blank]);
          setActiveId(blank.id);
          saveCharactersToCloud(userId, [blank], blank.id).catch((err) =>
            console.error('Erro ao salvar personagem em branco inicial:', err)
          );
        }
        setIsCloudLoaded(true);
      })
      .catch((err) => {
        console.error('Erro ao carregar personagens da nuvem:', err);
        if (isMounted) setIsCloudLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Salvar sempre que a lista de personagens mudar e avisar o Mestre
  useEffect(() => {
    try {
      const storageKey = userId ? `arcanasheet_characters_${userId}` : STORAGE_KEY_CHARACTERS;
      const activeKey = userId ? `arcanasheet_active_${userId}` : STORAGE_KEY_ACTIVE;

      localStorage.setItem(storageKey, JSON.stringify(characters));
      localStorage.setItem(activeKey, activeId);

      // Sincroniza com a nuvem (Firestore) com debounce se estiver logado
      if (userId) {
        syncOnChange(userId, characters, activeId);
      }

      // Transmite estado atualizado do jogador para o DM Screen
      if (activeCharacter) {
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
      console.error('Erro ao salvar no localStorage', e);
    }
  }, [characters, activeId, activeCharacter, userId]);

  // Ouvir alterações vindas do Painel do Mestre (ex: Mestre aplicou dano ou cura no combate)
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'DM_COMBATANT_UPDATE' && msg.payload) {
        const payload = msg.payload as {
          playerId?: string;
          currentHp?: number;
          maxHp?: number;
          tempHp?: number;
        };

        if (payload.playerId && payload.playerId === activeId) {
          setCharacters((prev) =>
            prev.map((c) => {
              if (c.id === activeId) {
                return {
                  ...c,
                  currentHp: payload.currentHp !== undefined ? payload.currentHp : c.currentHp,
                  tempHp: payload.tempHp !== undefined ? payload.tempHp : c.tempHp,
                };
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
    if (amount <= 0) return;
    updateCharacter((prev) => {
      let remainingDamage = amount;
      let newTempHp = prev.tempHp;

      if (newTempHp > 0) {
        if (newTempHp >= remainingDamage) {
          newTempHp -= remainingDamage;
          remainingDamage = 0;
        } else {
          remainingDamage -= newTempHp;
          newTempHp = 0;
        }
      }

      const newCurrentHp = Math.max(0, prev.currentHp - remainingDamage);

      return {
        ...prev,
        tempHp: newTempHp,
        currentHp: newCurrentHp,
      };
    });
  };

  // Aplicar cura
  const applyHealing = (amount: number) => {
    if (amount <= 0) return;
    updateCharacter((prev) => ({
      ...prev,
      currentHp: Math.min(prev.maxHp, prev.currentHp + amount),
    }));
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
    if (activeCharacter.hitDice.current <= 0) return null;

    const sides = parseInt(activeCharacter.hitDice.dieType.replace('d', ''), 10) || 8;
    const dieRoll = rollDie(sides);
    const conMod = getAbilityModifier(activeCharacter.abilities.con.score);
    const totalHealed = Math.max(1, dieRoll + conMod);

    updateCharacter((prev) => ({
      ...prev,
      currentHp: Math.min(prev.maxHp, prev.currentHp + totalHealed),
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

      return {
        ...prev,
        currentHp: prev.maxHp,
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

  const useResourceCharge = (id: string, delta: number) => {
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
    try {
      const parsed = JSON.parse(jsonString) as Character;
      if (!parsed.name || !parsed.abilities) {
        throw new Error('Formato de ficha inválido');
      }
      parsed.id = `char-imported-${Date.now()}`;
      setCharacters((prev) => [...prev, parsed]);
      setActiveId(parsed.id);
      return true;
    } catch (e) {
      console.error('Falha ao importar personagem', e);
      return false;
    }
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
