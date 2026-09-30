import type { MapToken, FogShape, BattleMapConfig } from '../types/vtt';

/**
 * OPÇÕES DE VALIDAÇÃO DE TOKENS REMOTOS
 */
export interface ValidateRemoteTokensOptions {
  mapWidth?: number;
  mapHeight?: number;
  gridSize?: number;
  /**
   * Identificador de usuário autodeclarado pelo cliente em metadados.
   * Em redes P2P sem autoridade central, este valor NÃO é considerado prova
   * de identidade autenticada, a menos que acompanhado de `isSenderUserIdVerified: true`.
   */
  senderUserId?: string;
  /**
   * Indica se `senderUserId` foi verificado por uma fonte de autenticação confiável.
   * Se false ou undefined, `senderUserId` é rejeitado como prova de posse.
   */
  isSenderUserIdVerified?: boolean;
  isFullRoomSync?: boolean;
}

/**
 * Valida e sanitiza tokens recebidos via rede P2P.
 *
 * LIMITAÇÕES DE SEGURANÇA E DA AUTORIDADE P2P:
 * 1. Arquitetura Descentralizada (WebRTC / PeerJS):
 *    Em uma rede P2P direta sem autoridade centralizada, as conexões são intermediadas
 *    apenas por servidores de sinalização (signaling), sem inspeção ou assinatura de pacotes.
 *    O Host da sala é um cliente no navegador como qualquer outro.
 * 2. Identidade de Remetente (Transporte vs. Metadados):
 *    - `senderPeerId`: Verificado no nível de transporte WebRTC pelo ID da conexão de dados ativa.
 *      É o identificador primário confiável para autorizar ações durante a sessão.
 *    - `senderUserId`: Transmitido em metadados arbitrários de conexão. Trata-se de uma declaração
 *      do cliente, NÃO de identidade autenticada, a menos que validada por autoridade externa.
 *    - Tokens persistentes e reconexões: tokens vinculados a um ID de personagem não são
 *      automaticamente autorizados a um novo peer. Uma transferência exige autenticação
 *      externa ou uma concessão explícita por canal confiável; nome e metadados não bastam.
 * 3. Limite das Permissões Locais (Guardrails):
 *    As validações a seguir atuam como proteções essenciais de integridade contra erros de rede,
 *    mensagens fora de ordem, sobrecarga acidental e comportamento padrão da aplicação cliente.
 * 4. Requisitos para Autoridade Central (caso necessária no futuro):
 *    Se for indispensável garantir controle de acesso contra clientes modificados maliciosos,
 *    o sistema precisará de um backend autoritativo central (ex: Node/Go/Cloud Functions) com
 *    autenticação de sessão (JWT), resolução de ações no servidor (server-side state engine) e diffs canônicos.
 */
export function validateRemoteTokens(
  incoming: unknown,
  currentTokens: MapToken[],
  _senderName: string,
  isSenderHost: boolean,
  senderPeerId?: string,
  options?: ValidateRemoteTokensOptions
): MapToken[] {
  if (!Array.isArray(incoming)) {
    return currentTokens;
  }

  const mapWidth = options?.mapWidth && Number.isFinite(options.mapWidth) && options.mapWidth > 0
    ? options.mapWidth
    : 10000;
  const mapHeight = options?.mapHeight && Number.isFinite(options.mapHeight) && options.mapHeight > 0
    ? options.mapHeight
    : 10000;
  const gridSize = options?.gridSize && Number.isFinite(options.gridSize) && options.gridSize > 0
    ? options.gridSize
    : 50;

  // Limite razoável de segurança para evitar sobrecarga de memória (DDoS/payloads anômalos)
  const safeIncoming = incoming.slice(0, 150);

  // ── CASO 1: Sincronização Completa de Sala vinda do Host ──
  // Apenas o anfitrião legítimo pode sincronizar o estado integral da sala
  if (isSenderHost && options?.isFullRoomSync) {
    const fullTokens: MapToken[] = [];
    for (const raw of safeIncoming) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Partial<MapToken>;
      if (typeof item.id !== 'string' || !item.id.trim()) continue;

      const id = item.id.trim().slice(0, 80);
      const name = typeof item.name === 'string' && item.name.trim() ? item.name.slice(0, 80).trim() : 'Token';
      const size = typeof item.size === 'number' && [1, 2, 3, 4].includes(item.size) ? item.size : 1;
      const color = typeof item.color === 'string' ? item.color.slice(0, 30) : '#ffffff';
      const type: 'player' | 'monster' | 'npc' = item.type === 'player' || item.type === 'monster' || item.type === 'npc'
        ? item.type
        : 'player';

      const tokenPixelSize = size * gridSize;
      const maxX = Math.max(0, mapWidth - tokenPixelSize);
      const maxY = Math.max(0, mapHeight - tokenPixelSize);

      const rawX = typeof item.x === 'number' && Number.isFinite(item.x) ? Math.round(item.x) : 0;
      const rawY = typeof item.y === 'number' && Number.isFinite(item.y) ? Math.round(item.y) : 0;
      const x = Math.min(maxX, Math.max(0, rawX));
      const y = Math.min(maxY, Math.max(0, rawY));

      const currentHp = typeof item.currentHp === 'number' && Number.isFinite(item.currentHp) ? Math.round(item.currentHp) : 10;
      const maxHp = typeof item.maxHp === 'number' && Number.isFinite(item.maxHp) && item.maxHp > 0 ? Math.round(item.maxHp) : 10;
      const tempHp = typeof item.tempHp === 'number' && Number.isFinite(item.tempHp) && item.tempHp >= 0 ? Math.round(item.tempHp) : 0;

      const conditions = Array.isArray(item.conditions)
        ? item.conditions.filter((c) => typeof c === 'string').map((c) => (c as string).slice(0, 40))
        : [];

      const ownerId = typeof item.ownerId === 'string' && item.ownerId.trim() ? item.ownerId.trim().slice(0, 80) : undefined;
      const combatantId = typeof item.combatantId === 'string' && item.combatantId.trim() ? item.combatantId.trim().slice(0, 80) : undefined;
      const avatarUrl = typeof item.avatarUrl === 'string' ? item.avatarUrl.slice(0, 10000) : undefined;
      const hasTorch = Boolean(item.hasTorch);
      const version = typeof item.version === 'number' && Number.isFinite(item.version) && item.version > 0
        ? Math.floor(item.version)
        : 1;

      fullTokens.push({
        id,
        name,
        size,
        color,
        type,
        x,
        y,
        currentHp,
        maxHp,
        tempHp,
        conditions,
        ownerId,
        combatantId,
        avatarUrl,
        hasTorch,
        version,
        updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      });
    }
    return fullTokens;
  }

  // ── CASO 2: Mensagem Parcial de Movimento (TOKEN_MOVE) ──
  // GARANTIA: Tokens já existentes na mesa NÃO são removidos por mensagens parciais!
  // Clonamos o mapa do estado atual para preservar todos os tokens existentes.
  const tokenMap = new Map<string, MapToken>(currentTokens.map((t) => [t.id, { ...t }]));

  // Processamento para mensagens enviadas por JOGADORES (não-host)
  if (!isSenderHost) {
    for (const raw of safeIncoming) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Partial<MapToken>;

      // 1. Rejeitar IDs inválidos ou ausentes
      if (typeof item.id !== 'string' || !item.id.trim()) continue;
      const id = item.id.trim();

      const existing = tokenMap.get(id);
      // 2. Rejeitar tokens desconhecidos: Jogador NUNCA pode criar tokens
      if (!existing) {
        continue;
      }

      // 3. Autenticação e autorização estrita de posse do token:
      // O jogador deve possuir o token comprovado pelo seu identificador confiável de remetente na sessão:
      // a) senderPeerId: Identificador real da conexão WebRTC verificado pelo transporte durante a sessão ativa;
      // b) isSenderUserIdVerified: Aceita senderUserId SOMENTE se verificado por fonte confiável/autenticada;
      // NUNCA aceitar nome de exibição ou senderUserId não autenticado como autorização de posse.
      const isDirectPeerOwner = Boolean(
        existing.ownerId && senderPeerId && existing.ownerId === senderPeerId
      );
      const isVerifiedUserOwner = Boolean(
        options?.isSenderUserIdVerified &&
        options?.senderUserId &&
        existing.ownerId &&
        existing.ownerId === options.senderUserId
      );
      const hasDirectOwnerMatch = isDirectPeerOwner || isVerifiedUserOwner;

      // Jogadores não podem mover monstros, NPCs ou tokens que não lhes pertençam
      if (!hasDirectOwnerMatch || existing.type === 'monster' || existing.type === 'npc') {
        continue;
      }

      // 4. Verificação de versão: Descarta mensagens fora de ordem, defasadas ou repetidas
      if (typeof item.version !== 'number' || !Number.isFinite(item.version)) {
        continue;
      }
      const incomingVersion = Math.floor(item.version);
      if (incomingVersion <= (existing.version || 0)) {
        // Mensagem defasada ou repetida: descartada
        continue;
      }

      // 5. Validação de coordenadas: Rejeitar valores não finitos ou ausentes
      if (typeof item.x !== 'number' || !Number.isFinite(item.x) || typeof item.y !== 'number' || !Number.isFinite(item.y)) {
        continue;
      }

      // 6. Verificação de limites do mapa: Rejeitar coordenadas fora do tabuleiro
      const tokenPixelSize = (existing.size || 1) * gridSize;
      const maxX = Math.max(0, mapWidth - tokenPixelSize);
      const maxY = Math.max(0, mapHeight - tokenPixelSize);

      if (item.x < 0 || item.y < 0 || item.x > maxX || item.y > maxY) {
        continue;
      }

      // 7. Aplicação autorizada de alteração:
      // O jogador tem autorização EXCLUSIVA para atualizar a POSIÇÃO e metadados de ordenação (versão/timestamp).
      // TODOS os campos protegidos (nome, tipo, proprietário, combatantId, PV, condições, avatar, tamanho, etc.)
      // são PRESERVADOS incondicionalmente a partir de existing.
      existing.x = Math.round(item.x);
      existing.y = Math.round(item.y);
      existing.version = incomingVersion;
      existing.updatedAt = typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt)
        ? item.updatedAt
        : Date.now();
    }

    // Retorna a lista completa atualizada preservando a ordem original dos tokens existentes
    return currentTokens.map((t) => tokenMap.get(t.id) || t);
  }

  // Processamento para mensagens parciais enviadas pelo HOST (Mestre)
  // O Host tem autoridade para mover qualquer token ou adicionar novos tokens ao mapa
  const newlyAddedByHost: MapToken[] = [];

  for (const raw of safeIncoming) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<MapToken>;
    if (typeof item.id !== 'string' || !item.id.trim()) continue;

    const id = item.id.trim();
    const existing = tokenMap.get(id);

    const incomingVersion = typeof item.version === 'number' && Number.isFinite(item.version)
      ? Math.floor(item.version)
      : undefined;

    // Se o token já existe na mesa:
    if (existing) {
      if (incomingVersion !== undefined && existing.version !== undefined && incomingVersion < existing.version) {
        // Mensagem desordenada mais antiga: mantém versão mais recente
        continue;
      }

      const size = typeof item.size === 'number' && [1, 2, 3, 4].includes(item.size) ? item.size : existing.size;
      const tokenPixelSize = size * gridSize;
      const maxX = Math.max(0, mapWidth - tokenPixelSize);
      const maxY = Math.max(0, mapHeight - tokenPixelSize);

      const rawX = typeof item.x === 'number' && Number.isFinite(item.x) ? Math.round(item.x) : existing.x;
      const rawY = typeof item.y === 'number' && Number.isFinite(item.y) ? Math.round(item.y) : existing.y;

      existing.x = Math.min(maxX, Math.max(0, rawX));
      existing.y = Math.min(maxY, Math.max(0, rawY));
      existing.size = size;

      if (typeof item.name === 'string' && item.name.trim()) existing.name = item.name.slice(0, 80).trim();
      if (typeof item.color === 'string') existing.color = item.color.slice(0, 30);
      if (item.type === 'player' || item.type === 'monster' || item.type === 'npc') existing.type = item.type;
      if (typeof item.currentHp === 'number' && Number.isFinite(item.currentHp)) existing.currentHp = Math.round(item.currentHp);
      if (typeof item.maxHp === 'number' && Number.isFinite(item.maxHp) && item.maxHp > 0) existing.maxHp = Math.round(item.maxHp);
      if (typeof item.tempHp === 'number' && Number.isFinite(item.tempHp) && item.tempHp >= 0) existing.tempHp = Math.round(item.tempHp);
      if (Array.isArray(item.conditions)) {
        existing.conditions = item.conditions.filter((c) => typeof c === 'string').map((c) => (c as string).slice(0, 40));
      }
      if (typeof item.ownerId === 'string') existing.ownerId = item.ownerId.slice(0, 80);
      if (typeof item.combatantId === 'string') existing.combatantId = item.combatantId.slice(0, 80);
      if (typeof item.avatarUrl === 'string') existing.avatarUrl = item.avatarUrl.slice(0, 10000);
      if (item.hasTorch !== undefined) existing.hasTorch = Boolean(item.hasTorch);

      existing.version = Math.max(existing.version || 0, incomingVersion || (existing.version || 0) + 1);
      existing.updatedAt = typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now();
    } else {
      // Novo token criado pelo Host
      const size = typeof item.size === 'number' && [1, 2, 3, 4].includes(item.size) ? item.size : 1;
      const tokenPixelSize = size * gridSize;
      const maxX = Math.max(0, mapWidth - tokenPixelSize);
      const maxY = Math.max(0, mapHeight - tokenPixelSize);

      const rawX = typeof item.x === 'number' && Number.isFinite(item.x) ? Math.round(item.x) : 0;
      const rawY = typeof item.y === 'number' && Number.isFinite(item.y) ? Math.round(item.y) : 0;

      const newToken: MapToken = {
        id,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.slice(0, 80).trim() : 'Token',
        size,
        color: typeof item.color === 'string' ? item.color.slice(0, 30) : '#ffffff',
        type: item.type === 'player' || item.type === 'monster' || item.type === 'npc' ? item.type : 'player',
        x: Math.min(maxX, Math.max(0, rawX)),
        y: Math.min(maxY, Math.max(0, rawY)),
        currentHp: typeof item.currentHp === 'number' && Number.isFinite(item.currentHp) ? Math.round(item.currentHp) : 10,
        maxHp: typeof item.maxHp === 'number' && Number.isFinite(item.maxHp) && item.maxHp > 0 ? Math.round(item.maxHp) : 10,
        tempHp: typeof item.tempHp === 'number' && Number.isFinite(item.tempHp) && item.tempHp >= 0 ? Math.round(item.tempHp) : 0,
        conditions: Array.isArray(item.conditions) ? item.conditions.filter((c) => typeof c === 'string').map((c) => (c as string).slice(0, 40)) : [],
        ownerId: typeof item.ownerId === 'string' ? item.ownerId.slice(0, 80) : undefined,
        combatantId: typeof item.combatantId === 'string' ? item.combatantId.slice(0, 80) : undefined,
        avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl.slice(0, 10000) : undefined,
        hasTorch: Boolean(item.hasTorch),
        version: incomingVersion && incomingVersion > 0 ? incomingVersion : 1,
        updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      };
      tokenMap.set(id, newToken);
      newlyAddedByHost.push(newToken);
    }
  }

  return [...currentTokens.map((t) => tokenMap.get(t.id) || t), ...newlyAddedByHost];
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
