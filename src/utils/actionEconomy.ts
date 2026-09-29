export type TurnActionType = 'ação' | 'ação bônus' | 'reação';

/** Classifica o tempo de conjuração para controle de uso durante o combate. */
export function classifyCastingTime(castingTime: string): TurnActionType | null {
  const normalized = (castingTime || '').toLocaleLowerCase('pt-BR');
  if (/ação\s*b[oô]nus|b[oô]nus action/.test(normalized)) return 'ação bônus';
  if (/reaç/.test(normalized)) return 'reação';
  if (/aç/.test(normalized)) return 'ação';
  return null;
}

export function makeTurnActionUseKey(encounterId: string, round: number, characterId: string, action: TurnActionType): string {
  return `${encounterId}:${round}:${characterId}:${action}`;
}
