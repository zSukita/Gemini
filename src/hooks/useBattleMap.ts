import { useState, useEffect, useCallback } from 'react';
import type { BattleMapConfig, MapToken, FogShape, PeerUser } from '../types/vtt';
import type { Encounter } from '../types/combat';
import type { Character } from '../types/dnd5e';
import { DEFAULT_MAP_PRESETS, type DefaultMapPreset } from '../data/defaultMaps';
import { snapCoordinateToGrid } from '../utils/mapRenderer';

const STORAGE_KEY_MAP = 'arcanasheet_battlemap_config';
const STORAGE_KEY_TOKENS = 'arcanasheet_battlemap_tokens';

export function useBattleMap(
  encounter?: Encounter,
  character?: Character | null,
  connectedPeers?: PeerUser[]
) {
  const [mapConfig, setMapConfig] = useState<BattleMapConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAP);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const preset = DEFAULT_MAP_PRESETS[0];
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
  });

  const [tokens, setTokens] = useState<MapToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (saved) return JSON.parse(saved);
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

  // Salvar alterações locais
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(mapConfig));
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    } catch {
      // ignore
    }
  }, [mapConfig, tokens]);

  // Sincronizar tokens automaticamente com o Encontro de Combate
  useEffect(() => {
    if (!encounter) return;

    setTokens((prevTokens) => {
      const updated = [...prevTokens];

      // Atualiza HP, avatar e status dos tokens existentes com base no combatente
      encounter.combatants.forEach((c, index) => {
        const existingToken = updated.find(
          (t) => t.combatantId === c.id || t.name.toLowerCase() === c.name.toLowerCase()
        );

        const charAvatar = c.avatarUrl || c.monsterData?.avatarUrl;

        if (existingToken) {
          existingToken.name = c.name;
          existingToken.currentHp = c.currentHp;
          existingToken.maxHp = c.maxHp;
          if (!existingToken.combatantId) {
            existingToken.combatantId = c.id;
          }
          if (charAvatar && (!existingToken.avatarUrl || existingToken.avatarUrl !== charAvatar)) {
            existingToken.avatarUrl = charAvatar;
          }
        } else {
          // Cria novo token se ainda não existir no mapa
          const isPlayer = c.type === 'player';
          const size = c.monsterData?.size === 'Grande' ? 2 : c.monsterData?.size === 'Enorme' ? 3 : 1;
          const startX = isPlayer ? 100 : 350 + (index % 4) * 60;
          const startY = 150 + Math.floor(index / 4) * 60;

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
            type: c.type,
            conditions: c.conditions,
          });
        }
      });

      return updated;
    });
  }, [encounter]);

  // Sincronizar token do jogador local e de todos os participantes conectados na sala
  useEffect(() => {
    setTokens((prev) => {
      const updated = [...prev];

      // 1. Jogador Local
      if (character && character.name) {
        const localToken = updated.find(
          (t) => t.type === 'player' && t.name.toLowerCase() === (character.name || '').toLowerCase()
        );

        if (localToken) {
          if (character.avatarUrl && localToken.avatarUrl !== character.avatarUrl) {
            localToken.avatarUrl = character.avatarUrl;
          }
          localToken.currentHp = character.currentHp ?? localToken.currentHp;
          localToken.maxHp = character.maxHp ?? localToken.maxHp;
        } else {
          updated.push({
            id: `token-player-${character.id || 'local'}`,
            name: character.name,
            x: 100,
            y: 150,
            size: 1,
            color: '#10b981',
            avatarUrl: character.avatarUrl,
            currentHp: character.currentHp || 10,
            maxHp: character.maxHp || 10,
            type: 'player',
            conditions: character.activeConditions || [],
          });
        }
      }

      // 2. Colegas conectados na sala via P2P (connectedPeers)
      if (connectedPeers && connectedPeers.length > 0) {
        connectedPeers.forEach((peer, pIdx) => {
          if (character?.name && peer.name.toLowerCase() === character.name.toLowerCase()) return;

          const peerToken = updated.find(
            (t) => t.type === 'player' && t.name.toLowerCase() === peer.name.toLowerCase()
          );

          if (peerToken) {
            if (peer.avatarUrl && peerToken.avatarUrl !== peer.avatarUrl) {
              peerToken.avatarUrl = peer.avatarUrl;
            }
          } else {
            updated.push({
              id: `token-peer-${peer.peerId}`,
              name: peer.name,
              x: 100 + ((pIdx + 1) % 4) * 60,
              y: 150 + Math.floor((pIdx + 1) / 4) * 60,
              size: 1,
              color: '#06b6d4',
              avatarUrl: peer.avatarUrl,
              currentHp: peer.currentHp || 10,
              maxHp: peer.maxHp || 10,
              type: 'player',
              conditions: [],
            });
          }
        });
      }

      return updated;
    });
  }, [character?.id, character?.name, character?.avatarUrl, character?.currentHp, character?.maxHp, connectedPeers]);

  // Mover Token
  const moveToken = useCallback(
    (id: string, newX: number, newY: number) => {
      setTokens((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const finalX = mapConfig.snapToGrid ? snapCoordinateToGrid(newX, mapConfig.gridSize) : newX;
          const finalY = mapConfig.snapToGrid ? snapCoordinateToGrid(newY, mapConfig.gridSize) : newY;
          return { ...t, x: Math.max(0, finalX), y: Math.max(0, finalY) };
        })
      );
    },
    [mapConfig.snapToGrid, mapConfig.gridSize]
  );

  // Selecionar mapa predefinido
  const selectMapPreset = useCallback((preset: DefaultMapPreset) => {
    setMapConfig((prev) => ({
      ...prev,
      id: preset.id,
      title: preset.title,
      imageUrl: preset.imageUrl,
      gridSize: preset.gridSize,
      width: preset.width,
      height: preset.height,
    }));
  }, []);

  // Upload de mapa customizado
  const uploadCustomMap = useCallback((title: string, imageUrl: string, width: number, height: number) => {
    setMapConfig((prev) => ({
      ...prev,
      id: `map-custom-${Date.now()}`,
      title,
      imageUrl,
      width: width || 1200,
      height: height || 800,
    }));
  }, []);

  // Névoa de Guerra: Revelar ou Ocultar Área
  const addFogShape = useCallback((shape: Omit<FogShape, 'id'>) => {
    const newShape: FogShape = {
      ...shape,
      id: `fog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setMapConfig((prev) => ({
      ...prev,
      revealedShapes: [...prev.revealedShapes, newShape],
    }));
  }, []);

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
      setMapConfig((prev) =>
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      );
    },
    []
  );

  const addToken = useCallback((tokenData: Omit<MapToken, 'id'>) => {
    const newToken: MapToken = {
      ...tokenData,
      id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTokens((prev) => [...prev, newToken]);
    return newToken;
  }, []);

  const removeToken = useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToken = useCallback((id: string, updates: Partial<MapToken>) => {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
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
