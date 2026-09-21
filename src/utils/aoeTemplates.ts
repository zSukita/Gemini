import type { SpellAoETemplate, AoEShapeType } from '../types/vtt';

export interface AoEPreset {
  id: string;
  name: string;
  type: AoEShapeType;
  sizeMeters: number;
  color: string;
  defaultAngle?: number;
}

export const AOE_PRESETS: AoEPreset[] = [
  {
    id: 'fireball',
    name: 'Bola de Fogo (Raio 6m / 20ft)',
    type: 'circle',
    sizeMeters: 6,
    color: '#ef4444',
  },
  {
    id: 'burning-hands',
    name: 'Mãos Flamejantes (Cone 4,5m / 15ft)',
    type: 'cone',
    sizeMeters: 4.5,
    color: '#f97316',
    defaultAngle: 0,
  },
  {
    id: 'dragon-breath',
    name: 'Sopro de Dragão (Cone 9m / 30ft)',
    type: 'cone',
    sizeMeters: 9,
    color: '#dc2626',
    defaultAngle: 0,
  },
  {
    id: 'lightning-bolt',
    name: 'Relâmpago (Linha 18m / 60ft)',
    type: 'line',
    sizeMeters: 18,
    color: '#06b6d4',
    defaultAngle: 0,
  },
  {
    id: 'fog-cloud',
    name: 'Névoa Obscurecente (Círculo 6m / 20ft)',
    type: 'circle',
    sizeMeters: 6,
    color: '#94a3b8',
  },
  {
    id: 'cloud-of-daggers',
    name: 'Nuvem de Adagas (Cubo 1,5m / 5ft)',
    type: 'cube',
    sizeMeters: 1.5,
    color: '#a855f7',
  },
  {
    id: 'mass-cure',
    name: 'Cura em Massa (Raio 9m / 30ft)',
    type: 'circle',
    sizeMeters: 9,
    color: '#10b981',
  },
  {
    id: 'darkness',
    name: 'Escuridão Mágica (Raio 4,5m / 15ft)',
    type: 'circle',
    sizeMeters: 4.5,
    color: '#334155',
  },
];

/**
 * Converte distância em metros para pixels no grid do mapa.
 * No D&D 5e, 1 quadrado (gridSize) = 1,5 metros (5 pés).
 */
export function metersToPixels(meters: number, gridSize: number): number {
  return (meters / 1.5) * gridSize;
}

/**
 * Gera o caminho SVG para um cone partindo do ponto (x, y) na direção do ângulo (em graus).
 * No D&D 5e oficial, a largura da base do cone é igual ao seu comprimento (ângulo ~53.13 graus).
 */
export function generateConePath(
  startX: number,
  startY: number,
  lengthPx: number,
  angleDeg: number
): string {
  const halfAngleRad = (53.13 / 2) * (Math.PI / 180);
  const centerAngleRad = (angleDeg * Math.PI) / 180;

  const leftAngleRad = centerAngleRad - halfAngleRad;
  const rightAngleRad = centerAngleRad + halfAngleRad;

  const x1 = startX + lengthPx * Math.cos(leftAngleRad);
  const y1 = startY + lengthPx * Math.sin(leftAngleRad);

  const x2 = startX + lengthPx * Math.cos(rightAngleRad);
  const y2 = startY + lengthPx * Math.sin(rightAngleRad);

  return `M ${startX} ${startY} L ${x1} ${y1} A ${lengthPx} ${lengthPx} 0 0 1 ${x2} ${y2} Z`;
}

/**
 * Cria uma nova instância de modelo AoE com valores padrão
 */
export function createAoETemplate(
  preset: AoEPreset,
  x: number,
  y: number,
  angle = 0
): SpellAoETemplate {
  return {
    id: `aoe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: preset.type,
    x,
    y,
    sizeMeters: preset.sizeMeters,
    angle: preset.defaultAngle !== undefined ? preset.defaultAngle : angle,
    color: preset.color,
    label: preset.name,
  };
}
