import { useState, useEffect, useCallback } from 'react';
import type { BattleMapConfig, MapToken, FogShape, PeerUser } from '../types/vtt';
import type { Encounter } from '../types/combat';
import type { Character } from '../types/dnd5e';
import { DEFAULT_MAP_PRESETS, type DefaultMapPreset } from '../data/defaultMaps';
import { SRD_CLASSES } from '../data/srdClasses';
import { snapCoordinateToGrid } from '../utils/mapRenderer';

const STORAGE_KEY_MAP = 'arcanasheet_battlemap_config';
const STORAGE_KEY_TOKENS = 'arcanasheet_battlemap_tokens';

/**
 * Valida e recupera com segurança as configurações do mapa de batalha salvas ou recebidas.
 */
export function sanitizeBattleMapConfig(raw: unknown): BattleMapConfig {
  const preset = DEFAULT_MAP_PRESETS[0];
  if (!raw || typeof raw !== 'object') {
    return {
      id: preset.id,
      title: preset.title,
      imageUrl: preset.imageUrl,
      gridSize: preset.gridSize,
      gridColor: '#ffffff',
      gridOpacity: 0.15,
      showGrid: true,
      snapToGrid: true,
      width: preset.width,
      height: preset.height,
      fogOfWarEnabled: false,
      revealedShapes: [],
    };
  }

  const obj = raw as Partial<BattleMapConfig>;
  const width =
    typeof obj.width === 'number' && Number.isFinite(obj.width)
      ? Math.max(200, Math.min(10000, Math.round(obj.width)))
      : preset.width;
  const height =
    typeof obj.height === 'number' && Number.isFinite(obj.height)
      ? Math.max(200, Math.min(10000, Math.round(obj.height)))
      : preset.height;
  const gridSize =
    typeof obj.gridSize === 'number' && Number.isFinite(obj.gridSize)
      ? Math.max(15, Math.min(250, Math.round(obj.gridSize)))
      : preset.gridSize;

  const validShapes: FogShape[] = [];
  if (Array.isArray(obj.revealedShapes)) {
    for (const s of obj.revealedShapes.slice(0, 200)) {
      if (!s || typeof s !== 'object') continue;
      const shape = s as Partial<FogShape>;
      if (typeof shape.id !== 'string') continue;
      validShapes.push({
        id: shape.id.slice(0, 50),
        x:
          typeof shape.x === 'number' && Number.isFinite(shape.x)
            ? Math.max(0, Math.min(width, Math.round(shape.x)))
            : 0,
        y:
          typeof shape.y === 'number' && Number.isFinite(shape.y)
            ? Math.max(0, Math.min(height, Math.round(shape.y)))
            : 0,
        width:
          typeof shape.width === 'number' && Number.isFinite(shape.width)
            ? Math.max(0, Math.min(width, Math.round(shape.width)))
            : 50,
        height:
          typeof shape.height === 'number' && Number.isFinite(shape.height)
            ? Math.max(0, Math.min(height, Math.round(shape.height)))
            : 50,
        type: shape.type === 'circle' ? 'circle' : 'rect',
        isRevealed: Boolean(shape.isRevealed),
      });
    }
  }

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.slice(0, 50) : preset.id,
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.slice(0, 100) : preset.title,
    imageUrl:
      typeof obj.imageUrl === 'string' && obj.imageUrl.trim()
        ? obj.imageUrl.slice(0, 10000)
        : preset.imageUrl,
    gridSize,
    gridColor: typeof obj.gridColor === 'string' ? obj.gridColor.slice(0, 30) : '#ffffff',
    gridOpacity:
      typeof obj.gridOpacity === 'number' && Number.isFinite(obj.gridOpacity)
        ? Math.max(0, Math.min(1, obj.gridOpacity))
        : 0.15,
    showGrid: typeof obj.showGrid === 'boolean' ? obj.showGrid : true,
    snapToGrid: typeof obj.snapToGrid === 'boolean' ? obj.snapToGrid : true,
    width,
    height,
    fogOfWarEnabled: Boolean(obj.fogOfWarEnabled),
    revealedShapes: validShapes,
    ambientLight:
      obj.ambientLight === 'day' || obj.ambientLight === 'dusk' || obj.ambientLight === 'night'
        ? obj.ambientLight
        : undefined,
  };
}

/**
 * Valida e recupera com segurança tokens de mapa salvos ou recebidos.
 */
export function sanitizeTokens(
  raw: unknown,
  limits?: { width?: number; height?: number; gridSize?: number }
): MapToken[] {
  if (!Array.isArray(raw)) return [];
  const width = limits?.width || 10000;
  const height = limits?.height || 10000;
  const gridSize = limits?.gridSize || 65;

  const validTokens: MapToken[] = [];
  for (const item of raw.slice(0, 200)) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Partial<MapToken>;
    if (typeof t.id !== 'string' || !t.id.trim()) continue;

    const size = typeof t.size === 'number' && [1, 2, 3, 4, 5].includes(t.size) ? t.size : 1;
    const tokenPixelSize = size * gridSize;
    const maxX = Math.max(0, width - tokenPixelSize);
    const maxY = Math.max(0, height - tokenPixelSize);

    const x =
      typeof t.x === 'number' && Number.isFinite(t.x)
        ? Math.max(0, Math.min(maxX, Math.round(t.x)))
        : 0;
    const y =
      typeof t.y === 'number' && Number.isFinite(t.y)
        ? Math.max(0, Math.min(maxY, Math.round(t.y)))
        : 0;

    validTokens.push({
      id: t.id.slice(0, 60),
      combatantId: typeof t.combatantId === 'string' ? t.combatantId.slice(0, 60) : undefined,
      ownerId: typeof t.ownerId === 'string' ? t.ownerId.slice(0, 60) : undefined,
      name: typeof t.name === 'string' && t.name.trim() ? t.name.slice(0, 80).trim() : 'Token',
      x,
      y,
      size,
      color: typeof t.color === 'string' ? t.color.slice(0, 30) : '#10b981',
      avatarUrl: typeof t.avatarUrl === 'string' ? t.avatarUrl.slice(0, 10000) : undefined,
      currentHp:
        typeof t.currentHp === 'number' && Number.isFinite(t.currentHp)
          ? Math.round(t.currentHp)
          : 10,
      maxHp:
        typeof t.maxHp === 'number' && Number.isFinite(t.maxHp) && t.maxHp > 0
          ? Math.round(t.maxHp)
          : 10,
      tempHp:
        typeof t.tempHp === 'number' && Number.isFinite(t.tempHp) && t.tempHp >= 0
          ? Math.round(t.tempHp)
          : 0,
      type: t.type === 'player' || t.type === 'monster' || t.type === 'npc' ? t.type : 'player',
      conditions: Array.isArray(t.conditions)
        ? t.conditions.filter((c) => typeof c === 'string').map((c) => (c as string).slice(0, 40))
        : [],
      hasTorch: Boolean(t.hasTorch),
      version: typeof t.version === 'number' && Number.isFinite(t.version) ? t.version : 1,
      updatedAt:
        typeof t.updatedAt === 'number' && Number.isFinite(t.updatedAt) ? t.updatedAt : Date.now(),
    });
  }
  return validTokens;
}

export function useBattleMap(
  encounter?: Encounter,
  character?: Character | null,
  connectedPeers?: PeerUser[]
) {
  const [mapConfig, setMapConfig] = useState<BattleMapConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAP);
      if (saved) return sanitizeBattleMapConfig(JSON.parse(saved));
    } catch {
      // ignore
    }
    return sanitizeBattleMapConfig(null);
  });

  const [tokens, setTokens] = useState<MapToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (saved) return sanitizeTokens(JSON.parse(saved));
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<
    'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping'
  >('select');

  // Salvar alterações locais com debounce de 250ms para evitar sobrecarga de I/O em arrastos
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(mapConfig));
        localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
      } catch {
        // ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [mapConfig, tokens]);

  // Sincronizar tokens automaticamente com o Encontro de Combate
  useEffect(() => {
    if (!encounter) return;

    setTokens((prevTokens) => {
      // 1. Manter tokens manuais e tokens cujos combatentes ainda existem no combate
      const remainingTokens = prevTokens.filter((token) => {
        if (!token.combatantId) return true;
        return encounter.combatants.some((c) => c.id === token.combatantId);
      });

      // Rastrear quais IDs de combatentes já foram associados a um token
      const assignedCombatantIds = new Set<string>();

      // 2. Primeiro passo: associar tokens que já possuem combatantId exato
      remainingTokens.forEach((token) => {
        if (token.combatantId && encounter.combatants.some((c) => c.id === token.combatantId)) {
          assignedCombatantIds.add(token.combatantId);
        }
      });

      // 3. Atualizar tokens existentes (com vínculo por ID ou fallback seguro por nome sem duplicar)
      const updated = remainingTokens.map((token) => {
        let matchingCombatant = token.combatantId
          ? encounter.combatants.find((c) => c.id === token.combatantId)
          : undefined;

        // Fallback por nome caso combatantId ainda não estivesse setado
        if (!matchingCombatant) {
          matchingCombatant = encounter.combatants.find(
            (c) => !assignedCombatantIds.has(c.id) && token.name.toLowerCase() === c.name.toLowerCase()
          );
          if (matchingCombatant) {
            assignedCombatantIds.add(matchingCombatant.id);
          }
        }

        if (matchingCombatant) {
          let charAvatar = matchingCombatant.avatarUrl || matchingCombatant.monsterData?.avatarUrl;
          if (!charAvatar && matchingCombatant.type === 'player' && character) {
            const cls = SRD_CLASSES.find(
              (cl) => cl.name.toLowerCase() === (character.characterClass || '').toLowerCase()
            );
            charAvatar = cls?.avatarUrl;
          }
          return {
            ...token,
            combatantId: matchingCombatant.id,
            name: matchingCombatant.name,
            currentHp: matchingCombatant.currentHp,
            maxHp: matchingCombatant.maxHp,
            tempHp: matchingCombatant.tempHp ?? token.tempHp ?? 0,
            avatarUrl: charAvatar || token.avatarUrl,
            conditions: matchingCombatant.conditions || token.conditions,
          };
        }
        return token;
      });

      // 4. Insere novos combatentes que ainda não possuem token no mapa
      encounter.combatants.forEach((c, index) => {
        if (assignedCombatantIds.has(c.id)) return;
        const alreadyHasToken = updated.some((t) => t.combatantId === c.id);
        if (alreadyHasToken) {
          assignedCombatantIds.add(c.id);
          return;
        }

        assignedCombatantIds.add(c.id);

        let charAvatar = c.avatarUrl || c.monsterData?.avatarUrl;
        if (!charAvatar && c.type === 'player' && character) {
          const cls = SRD_CLASSES.find(
            (cl) => cl.name.toLowerCase() === (character.characterClass || '').toLowerCase()
          );
          charAvatar = cls?.avatarUrl;
        }

        const isPlayer = c.type === 'player';
        const size = c.monsterData?.size === 'Grande' ? 2 : c.monsterData?.size === 'Enorme' ? 3 : 1;
        const col = index % 4;
        const row = Math.floor(index / 4);

        const existingHero = updated.find((t) => t.type === 'player');
        const heroBaseX = existingHero ? existingHero.x : 420;
        const heroBaseY = existingHero ? existingHero.y : 240;

        const rawStartX = isPlayer
          ? existingHero
            ? heroBaseX + (col + 1) * 65
            : 420 + col * 65
          : 420 + col * 75;
        const rawStartY = isPlayer
          ? existingHero
            ? heroBaseY
            : 240 + row * 65
          : 160 + row * 75;

        const tokenPixelSize = size * mapConfig.gridSize;
        const maxX = Math.max(0, mapConfig.width - tokenPixelSize);
        const maxY = Math.max(0, mapConfig.height - tokenPixelSize);
        const startX = Math.min(maxX, Math.max(0, rawStartX));
        const startY = Math.min(maxY, Math.max(0, rawStartY));

        updated.push({
          id: `token-${c.id}`,
          combatantId: c.id,
          name: c.name,
          x: startX,
          y: startY,
          size,
          color: isPlayer ? '#10b981' : c.type === 'monster' ? '#f43f5e' : '#6366f1',
          avatarUrl: charAvatar,
          currentHp: c.currentHp,
          maxHp: c.maxHp,
          tempHp: c.tempHp ?? 0,
          type: c.type,
          conditions: c.conditions || [],
          version: 1,
          updatedAt: Date.now(),
        });
      });

      return updated;
    });
  }, [encounter, character, mapConfig.gridSize, mapConfig.width, mapConfig.height]);

  // Sincronizar token do jogador local e de todos os participantes conectados na sala
  useEffect(() => {
    setTokens((prev) => {
      let updated = [...prev];

      // 1. Jogador Local
      if (character && character.name) {
        const classObj = SRD_CLASSES.find(
          (cl) => cl.name.toLowerCase() === (character.characterClass || '').toLowerCase()
        );
        const effectiveAvatar = character.avatarUrl || classObj?.avatarUrl;

        // Encontrar se já existe token do jogador local (por combatantId/ownerId ou nome)
        const localIndex = updated.findIndex(
          (t) =>
            (character.id && (t.ownerId === character.id || t.combatantId === character.id)) ||
            (t.type === 'player' && t.name.toLowerCase() === (character.name || '').toLowerCase())
        );

        if (localIndex >= 0) {
          const t = updated[localIndex];
          updated[localIndex] = {
            ...t,
            ownerId: character.id || t.ownerId,
            avatarUrl: effectiveAvatar || t.avatarUrl,
            currentHp: character.currentHp ?? t.currentHp,
            maxHp: character.maxHp ?? t.maxHp,
            tempHp: character.tempHp ?? t.tempHp,
            conditions: character.activeConditions || t.conditions,
          };
        } else {
          const tokenPixelSize = mapConfig.gridSize;
          const startX = Math.min(Math.max(0, mapConfig.width - tokenPixelSize), 420);
          const startY = Math.min(Math.max(0, mapConfig.height - tokenPixelSize), 240);

          updated.push({
            id: `token-player-${character.id || 'local'}`,
            ownerId: character.id,
            name: character.name,
            x: startX,
            y: startY,
            size: 1,
            color: '#10b981',
            avatarUrl: effectiveAvatar,
            currentHp: character.currentHp || 10,
            maxHp: character.maxHp || 10,
            tempHp: character.tempHp || 0,
            type: 'player',
            conditions: character.activeConditions || [],
            version: 1,
            updatedAt: Date.now(),
          });
        }
      }

      // 2. Colegas conectados na sala via P2P (connectedPeers)
      // Remover tokens de peers desconectados (aqueles cujo id começa com "token-peer-" e o peerId não está mais em connectedPeers)
      const currentPeerIds = new Set((connectedPeers || []).map((p) => p.peerId));
      updated = updated.filter((t) => {
        if (t.id.startsWith('token-peer-')) {
          const peerId = t.id.replace('token-peer-', '');
          return currentPeerIds.has(peerId);
        }
        return true;
      });

      if (connectedPeers && connectedPeers.length > 0) {
        const localHero = updated.find(
          (t) => t.type === 'player' && t.name.toLowerCase() === (character?.name || '').toLowerCase()
        );
        const partyBaseX = localHero ? localHero.x : 420;
        const partyBaseY = localHero ? localHero.y : 240;

        connectedPeers.forEach((peer, pIdx) => {
          if (character?.name && peer.name.toLowerCase() === character.name.toLowerCase()) return;

          const peerIndex = updated.findIndex(
            (t) =>
              t.id === `token-peer-${peer.peerId}` ||
              (t.type === 'player' && t.name.toLowerCase() === peer.name.toLowerCase())
          );

          if (peerIndex >= 0) {
            const t = updated[peerIndex];
            updated[peerIndex] = {
              ...t,
              ownerId: peer.peerId,
              avatarUrl: peer.avatarUrl || t.avatarUrl,
              currentHp: peer.currentHp ?? t.currentHp,
              maxHp: peer.maxHp ?? t.maxHp,
            };
          } else {
            const tokenPixelSize = mapConfig.gridSize;
            const targetX = partyBaseX + ((pIdx + 1) % 4) * 65;
            const targetY = partyBaseY + Math.floor((pIdx + 1) / 4) * 65;
            const startX = Math.min(Math.max(0, mapConfig.width - tokenPixelSize), targetX);
            const startY = Math.min(Math.max(0, mapConfig.height - tokenPixelSize), targetY);

            updated.push({
              id: `token-peer-${peer.peerId}`,
              ownerId: peer.peerId,
              name: peer.name,
              x: startX,
              y: startY,
              size: 1,
              color: '#06b6d4',
              avatarUrl: peer.avatarUrl,
              currentHp: peer.currentHp || 10,
              maxHp: peer.maxHp || 10,
              tempHp: 0,
              type: 'player',
              conditions: [],
              version: 1,
              updatedAt: Date.now(),
            });
          }
        });
      }

      return updated;
    });
  }, [
    character?.id,
    character?.name,
    character?.characterClass,
    character?.avatarUrl,
    character?.currentHp,
    character?.maxHp,
    character?.tempHp,
    character?.activeConditions,
    connectedPeers,
    mapConfig.gridSize,
    mapConfig.width,
    mapConfig.height,
  ]);

  // Função auxiliar para manter tokens dentro dos limites após troca ou redimensionamento de mapa
  const clampTokensToDimensions = useCallback(
    (newWidth: number, newHeight: number, newGridSize: number) => {
      setTokens((prev) =>
        prev.map((t) => {
          const tokenPixelSize = (t.size || 1) * newGridSize;
          const maxX = Math.max(0, newWidth - tokenPixelSize);
          const maxY = Math.max(0, newHeight - tokenPixelSize);
          return {
            ...t,
            x: Math.min(maxX, Math.max(0, t.x)),
            y: Math.min(maxY, Math.max(0, t.y)),
          };
        })
      );
    },
    []
  );

  // Mover Token com snapping e clamping aos limites do mapa considerando o tamanho do token
  const moveToken = useCallback(
    (id: string, newX: number, newY: number) => {
      setTokens((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const tokenPixelSize = (t.size || 1) * mapConfig.gridSize;
          const maxX = Math.max(0, mapConfig.width - tokenPixelSize);
          const maxY = Math.max(0, mapConfig.height - tokenPixelSize);

          const snappedX = mapConfig.snapToGrid
            ? snapCoordinateToGrid(newX, mapConfig.gridSize)
            : newX;
          const snappedY = mapConfig.snapToGrid
            ? snapCoordinateToGrid(newY, mapConfig.gridSize)
            : newY;

          const clampedX = Math.min(maxX, Math.max(0, snappedX));
          const clampedY = Math.min(maxY, Math.max(0, snappedY));

          return {
            ...t,
            x: clampedX,
            y: clampedY,
            version: (t.version || 0) + 1,
            updatedAt: Date.now(),
          };
        })
      );
    },
    [mapConfig.snapToGrid, mapConfig.gridSize, mapConfig.width, mapConfig.height]
  );

  // Selecionar mapa predefinido preservando posições de tokens dentro dos novos limites
  const selectMapPreset = useCallback(
    (preset: DefaultMapPreset) => {
      setMapConfig((prev) => ({
        ...prev,
        id: preset.id,
        title: preset.title,
        imageUrl: preset.imageUrl,
        gridSize: preset.gridSize,
        width: preset.width,
        height: preset.height,
      }));
      clampTokensToDimensions(preset.width, preset.height, preset.gridSize);
    },
    [clampTokensToDimensions]
  );

  // Upload de mapa customizado preservando posições de tokens dentro dos novos limites
  const uploadCustomMap = useCallback(
    (title: string, imageUrl: string, width: number, height: number) => {
      const safeW = width || 1200;
      const safeH = height || 800;
      setMapConfig((prev) => ({
        ...prev,
        id: `map-custom-${Date.now()}`,
        title,
        imageUrl,
        width: safeW,
        height: safeH,
      }));
      clampTokensToDimensions(safeW, safeH, mapConfig.gridSize);
    },
    [clampTokensToDimensions, mapConfig.gridSize]
  );

  // Névoa de Guerra: Revelar ou Ocultar Área
  const addFogShape = useCallback(
    (shape: Omit<FogShape, 'id'>) => {
      const newShape: FogShape = {
        ...shape,
        x: Math.max(0, Math.min(mapConfig.width, shape.x)),
        y: Math.max(0, Math.min(mapConfig.height, shape.y)),
        width: Math.max(0, Math.min(mapConfig.width, shape.width)),
        height: Math.max(0, Math.min(mapConfig.height, shape.height)),
        id: `fog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setMapConfig((prev) => ({
        ...prev,
        revealedShapes: [...prev.revealedShapes, newShape].slice(-200),
      }));
    },
    [mapConfig.width, mapConfig.height]
  );

  const resetFog = useCallback(() => {
    setMapConfig((prev) => ({ ...prev, revealedShapes: [] }));
  }, []);

  const revealAllFog = useCallback(() => {
    setMapConfig((prev) => ({
      ...prev,
      revealedShapes: [
        {
          id: 'fog-all-revealed',
          x: 0,
          y: 0,
          width: prev.width,
          height: prev.height,
          type: 'rect',
          isRevealed: true,
        },
      ],
    }));
  }, []);

  const updateMapConfig = useCallback(
    (updater: Partial<BattleMapConfig> | ((prev: BattleMapConfig) => BattleMapConfig)) => {
      setMapConfig((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        return sanitizeBattleMapConfig(next);
      });
    },
    []
  );

  const addToken = useCallback(
    (tokenData: Omit<MapToken, 'id'>) => {
      const tokenPixelSize = (tokenData.size || 1) * mapConfig.gridSize;
      const maxX = Math.max(0, mapConfig.width - tokenPixelSize);
      const maxY = Math.max(0, mapConfig.height - tokenPixelSize);
      const clampedX = Math.min(maxX, Math.max(0, tokenData.x));
      const clampedY = Math.min(maxY, Math.max(0, tokenData.y));

      const newToken: MapToken = {
        ...tokenData,
        x: clampedX,
        y: clampedY,
        id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        version: 1,
        updatedAt: Date.now(),
      };
      setTokens((prev) => [...prev, newToken]);
      return newToken;
    },
    [mapConfig.gridSize, mapConfig.width, mapConfig.height]
  );

  const removeToken = useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToken = useCallback((id: string, updates: Partial<MapToken>) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.x !== undefined || updates.y !== undefined) {
          updated.version = (t.version || 0) + 1;
          updated.updatedAt = Date.now();
        }
        return updated;
      })
    );
  }, []);

  return {
    mapConfig,
    setMapConfig,
    updateMapConfig,
    tokens,
    setTokens,
    selectedTokenId,
    setSelectedTokenId,
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    setActiveTool,
    moveToken,
    addToken,
    removeToken,
    updateToken,
    selectMapPreset,
    uploadCustomMap,
    addFogShape,
    resetFog,
    revealAllFog,
  };
}
