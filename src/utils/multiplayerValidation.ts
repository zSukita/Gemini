import type { MapToken, FogShape, BattleMapConfig } from '../types/vtt';

/**
 * Valida e sanitiza tokens recebidos via rede P2P.
 * Aplica controle estrito de permissões: jogadores (não-host) só podem mover seus próprios tokens.
 * Mensagens fora de ordem são descartadas se a versão do token for menor que a atual.
 */
export function validateRemoteTokens(
  incoming: unknown,
  currentTokens: MapToken[],
  senderName: string,
  isSenderHost: boolean,
  senderPeerId?: string
): MapToken[] {
  if (!Array.isArray(incoming)) {
    return currentTokens;
  }

  // Limite razoável de segurança para evitar sobrecarga de memória (DDoS/payloads anômalos)
  const safeIncoming = incoming.slice(0, 150);
  const currentMap = new Map<string, MapToken>(currentTokens.map((t) => [t.id, t]));
  const normalizedSenderName = (senderName || '').trim().toLowerCase();

  const validatedTokens: MapToken[] = [];

  for (const raw of safeIncoming) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<MapToken>;

    if (typeof item.id !== 'string' || !item.id.trim()) continue;
    const id = item.id.trim();

    const existing = currentMap.get(id);

    // Validação de tipos e campos básicos
    const name = typeof item.name === 'string' && item.name.trim() ? item.name.slice(0, 80).trim() : (existing?.name || 'Token');
    const size = typeof item.size === 'number' && [1, 2, 3, 4].includes(item.size) ? item.size : (existing?.size || 1);
    const color = typeof item.color === 'string' ? item.color.slice(0, 30) : (existing?.color || '#ffffff');
    const type: 'player' | 'monster' | 'npc' = item.type === 'player' || item.type === 'monster' || item.type === 'npc'
      ? item.type
      : (existing?.type || 'player');

    const incomingX = typeof item.x === 'number' && Number.isFinite(item.x) ? Math.round(item.x) : (existing?.x || 0);
    const incomingY = typeof item.y === 'number' && Number.isFinite(item.y) ? Math.round(item.y) : (existing?.y || 0);

    const currentHp = typeof item.currentHp === 'number' && Number.isFinite(item.currentHp) ? Math.round(item.currentHp) : (existing?.currentHp || 10);
    const maxHp = typeof item.maxHp === 'number' && Number.isFinite(item.maxHp) && item.maxHp > 0 ? Math.round(item.maxHp) : (existing?.maxHp || 10);
    const tempHp = typeof item.tempHp === 'number' && Number.isFinite(item.tempHp) && item.tempHp >= 0 ? Math.round(item.tempHp) : (existing?.tempHp || 0);

    const conditions = Array.isArray(item.conditions)
      ? item.conditions.filter((c) => typeof c === 'string').map((c) => (c as string).slice(0, 40))
      : (existing?.conditions || []);

    const ownerId = typeof item.ownerId === 'string' ? item.ownerId : existing?.ownerId;
    const combatantId = typeof item.combatantId === 'string' ? item.combatantId : existing?.combatantId;
    const avatarUrl = typeof item.avatarUrl === 'string' ? item.avatarUrl : existing?.avatarUrl;
    const hasTorch = Boolean(item.hasTorch ?? existing?.hasTorch);
    const incomingVersion = typeof item.version === 'number' && Number.isFinite(item.version) ? item.version : undefined;

    // Regra de Controle de Acesso:
    // Se o remetente for o Mestre (Host), ele tem autoridade total para mover qualquer token.
    // Se o remetente for um Jogador comum:
    // 1. Só pode mover tokens que pertençam a ele (ownerId coincidente ou nome coincidente).
    // 2. Não pode mover monstros, NPCs ou tokens de outros jogadores.
    let finalX = incomingX;
    let finalY = incomingY;

    if (!isSenderHost && existing) {
      const isOwner = (ownerId && senderPeerId && ownerId === senderPeerId) ||
        (existing.name.trim().toLowerCase() === normalizedSenderName);

      if (!isOwner || existing.type === 'monster') {
        // Ignora alteração de coordenadas não autorizada
        finalX = existing.x;
        finalY = existing.y;
      } else if (
        incomingVersion !== undefined &&
        existing.version !== undefined &&
        incomingVersion < existing.version
      ) {
        // Mensagem desordenada mais antiga: mantém a posição mais recente
        finalX = existing.x;
        finalY = existing.y;
      }
    }

    validatedTokens.push({
      id,
      combatantId,
      ownerId,
      name,
      x: finalX,
      y: finalY,
      size,
      color,
      avatarUrl,
      currentHp,
      maxHp,
      tempHp,
      type,
      conditions,
      hasTorch,
      version: Math.max(existing?.version || 0, incomingVersion || 0),
      updatedAt: Date.now(),
    });
  }

  return validatedTokens;
}

/**
 * Valida formas de névoa recebidas pela rede.
 */
export function validateRemoteFog(
  incoming: unknown,
  mapWidth = 10000,
  mapHeight = 10000
): FogShape[] {
  if (!Array.isArray(incoming)) return [];

  const safeShapes = incoming.slice(0, 200);
  const validated: FogShape[] = [];

  for (const raw of safeShapes) {
    if (!raw || typeof raw !== 'object') continue;
    const shape = raw as Partial<FogShape>;
    if (typeof shape.id !== 'string') continue;

    const x = typeof shape.x === 'number' && Number.isFinite(shape.x) ? Math.max(0, Math.min(mapWidth, Math.round(shape.x))) : 0;
    const y = typeof shape.y === 'number' && Number.isFinite(shape.y) ? Math.max(0, Math.min(mapHeight, Math.round(shape.y))) : 0;
    const width = typeof shape.width === 'number' && Number.isFinite(shape.width) ? Math.max(0, Math.min(mapWidth, Math.round(shape.width))) : 50;
    const height = typeof shape.height === 'number' && Number.isFinite(shape.height) ? Math.max(0, Math.min(mapHeight, Math.round(shape.height))) : 50;
    const type = shape.type === 'circle' ? 'circle' : 'rect';
    const isRevealed = Boolean(shape.isRevealed);

    validated.push({
      id: shape.id.slice(0, 50),
      x,
      y,
      width,
      height,
      type,
      isRevealed,
    });
  }

  return validated;
}

/**
 * Valida configurações de mapa recebidas pela rede.
 */
export function validateRemoteMapConfig(incoming: unknown): Partial<BattleMapConfig> {
  if (!incoming || typeof incoming !== 'object') return {};
  const raw = incoming as Partial<BattleMapConfig>;

  const config: Partial<BattleMapConfig> = {};

  if (typeof raw.title === 'string') config.title = raw.title.slice(0, 100);
  if (typeof raw.imageUrl === 'string') config.imageUrl = raw.imageUrl.slice(0, 10000);
  if (typeof raw.width === 'number' && Number.isFinite(raw.width)) config.width = Math.max(200, Math.min(10000, Math.round(raw.width)));
  if (typeof raw.height === 'number' && Number.isFinite(raw.height)) config.height = Math.max(200, Math.min(10000, Math.round(raw.height)));
  if (typeof raw.gridSize === 'number' && Number.isFinite(raw.gridSize)) config.gridSize = Math.max(15, Math.min(250, Math.round(raw.gridSize)));
  if (typeof raw.gridColor === 'string') config.gridColor = raw.gridColor.slice(0, 30);
  if (typeof raw.gridOpacity === 'number' && Number.isFinite(raw.gridOpacity)) config.gridOpacity = Math.max(0, Math.min(1, raw.gridOpacity));
  if (typeof raw.showGrid === 'boolean') config.showGrid = raw.showGrid;
  if (typeof raw.snapToGrid === 'boolean') config.snapToGrid = raw.snapToGrid;
  if (typeof raw.fogOfWarEnabled === 'boolean') config.fogOfWarEnabled = raw.fogOfWarEnabled;
  if (raw.ambientLight === 'day' || raw.ambientLight === 'dusk' || raw.ambientLight === 'night') config.ambientLight = raw.ambientLight;

  return config;
}
