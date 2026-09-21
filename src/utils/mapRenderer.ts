/**
 * Arredonda uma coordenada para o quadrado mais próximo da grade
 */
export function snapCoordinateToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

/**
 * Calcula a distância em metros e quadrados entre dois pontos do mapa
 * Padrão D&D 5e: 1 quadrado = 1,5 metros (5 pés)
 */
export function calculateMapDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  gridSize: number
): { squares: number; meters: number; feet: number } {
  const dx = Math.abs(x2 - x1) / gridSize;
  const dy = Math.abs(y2 - y1) / gridSize;

  // Regra padrão D&D 5e (distância euclidiana arredondada ou regra 5-10-5)
  const euclideanSquares = Math.sqrt(dx * dx + dy * dy);
  const squares = Math.round(euclideanSquares * 10) / 10;
  const meters = Math.round(squares * 1.5 * 10) / 10;
  const feet = Math.round(squares * 5);

  return { squares, meters, feet };
}
