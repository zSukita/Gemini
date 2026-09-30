// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacter } from './useCharacter';
import * as characterSync from '../firebase/characterSync';

vi.mock('../firebase/characterSync', () => ({
  loadCharactersFromCloud: vi.fn().mockResolvedValue(null),
  saveCharactersToCloud: vi.fn().mockResolvedValue(undefined),
  syncOnChange: vi.fn(),
  cancelPendingSync: vi.fn(),
}));

describe('useCharacter hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inicializa com um personagem padrão quando localStorage está vazio', () => {
    const { result } = renderHook(() => useCharacter());

    expect(result.current.character).toBeDefined();
    expect(result.current.charactersList.length).toBeGreaterThanOrEqual(1);
    expect(result.current.activeId).toBe(result.current.character.id);
  });

  it('permite atualizar atributos base do personagem', () => {
    const { result } = renderHook(() => useCharacter());

    act(() => {
      result.current.updateAbility('str', { score: 18 });
    });

    expect(result.current.character.abilities.str.score).toBe(18);
  });

  it('aplica dano consumindo pontos de vida temporários primeiro', () => {
    const { result } = renderHook(() => useCharacter());

    act(() => {
      result.current.updateCharacter({
        currentHp: 20,
        maxHp: 20,
        tempHp: 5,
      });
    });

    // Dano de 8: 5 tempHp + 3 no currentHp -> sobra 17 currentHp e 0 tempHp
    act(() => {
      result.current.applyDamage(8);
    });

    expect(result.current.character.tempHp).toBe(0);
    expect(result.current.character.currentHp).toBe(17);
  });

  it('aplica cura sem ultrapassar o valor máximo de HP', () => {
    const { result } = renderHook(() => useCharacter());

    act(() => {
      result.current.updateCharacter({
        currentHp: 10,
        maxHp: 25,
        tempHp: 0,
      });
    });

    act(() => {
      result.current.applyHealing(20);
    });

    expect(result.current.character.currentHp).toBe(25);
  });

  it('adiciona e remove itens do inventário', () => {
    const { result } = renderHook(() => useCharacter());

    act(() => {
      result.current.addInventoryItem({
        name: 'Poção de Cura',
        quantity: 3,
        weight: 0.5,
        notes: 'Cura 2d4+2',
      });
    });

    const item = result.current.character.inventory.find((i) => i.name === 'Poção de Cura');
    expect(item).toBeDefined();
    expect(item?.quantity).toBe(3);

    if (item) {
      act(() => {
        result.current.deleteInventoryItem(item.id);
      });
      expect(result.current.character.inventory.some((i) => i.id === item.id)).toBe(false);
    }
  });

  it('executa descanso longo restaurando HP máximo e removendo tempHp', () => {
    const { result } = renderHook(() => useCharacter());

    act(() => {
      result.current.updateCharacter({
        currentHp: 5,
        maxHp: 30,
        tempHp: 10,
      });
    });

    act(() => {
      result.current.performLongRest();
    });

    expect(result.current.character.currentHp).toBe(30);
    expect(result.current.character.tempHp).toBe(0);
  });

  // =========================================================================
  // Testes de Isolamento de Contas e Robustez (Prioridade 1)
  // =========================================================================

  it('impede que o estado de uma conta seja salvo em outra durante troca rápida de contas', async () => {
    const aliceChar = { id: 'char-alice-1', name: 'Alice Aventureira', abilities: { str: { score: 14 } } };
    const bobChar = { id: 'char-bob-1', name: 'Bob Conjurador', abilities: { int: { score: 18 } } };

    // Simula Alice com dados na nuvem
    vi.mocked(characterSync.loadCharactersFromCloud).mockImplementation(async (uid: string) => {
      if (uid === 'alice') return { characters: [aliceChar as any], activeId: 'char-alice-1' };
      if (uid === 'bob') return { characters: [bobChar as any], activeId: 'char-bob-1' };
      return null;
    });

    const { result, rerender } = renderHook(({ userId }) => useCharacter(userId), {
      initialProps: { userId: 'alice' },
    });

    // Aguarda resolução da nuvem para Alice
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.character.name).toBe('Alice Aventureira');

    // Troca rápida para Bob
    rerender({ userId: 'bob' });

    // Durante a transição, isCloudLoaded deve ser false
    expect(result.current.isCloudLoaded).toBe(false);

    // Cancela syncs da conta anterior
    expect(characterSync.cancelPendingSync).toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isCloudLoaded).toBe(true);
    expect(result.current.character.name).toBe('Bob Conjurador');

    // Verifica que os dados salvos em bob não contêm Alice
    const bobStored = localStorage.getItem('arcanasheet_characters_bob');
    if (bobStored) {
      const parsed = JSON.parse(bobStored);
      expect(parsed[0].name).not.toBe('Alice Aventureira');
    }
  });

  it('ignora resposta de carregamento lento do Firestore se o usuário já trocou para outra conta', async () => {
    let resolveAlice: any;
    const alicePromise = new Promise<{ characters: any[]; activeId: string }>((resolve) => {
      resolveAlice = resolve;
    });

    vi.mocked(characterSync.loadCharactersFromCloud).mockImplementation(async (uid: string) => {
      if (uid === 'slow-alice') return alicePromise;
      if (uid === 'fast-bob') {
        return {
          characters: [{ id: 'char-bob-99', name: 'Bob Rápido' } as any],
          activeId: 'char-bob-99',
        };
      }
      return null;
    });

    const { result, rerender } = renderHook(({ userId }) => useCharacter(userId), {
      initialProps: { userId: 'slow-alice' },
    });

    // Troca imediatamente para Bob antes de Alice responder
    rerender({ userId: 'fast-bob' });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.character.name).toBe('Bob Rápido');

    // Agora a resposta lenta de Alice finalmente chega
    await act(async () => {
      resolveAlice({
        characters: [{ id: 'char-alice-late', name: 'Alice Atrasada' }],
        activeId: 'char-alice-late',
      });
      await Promise.resolve();
    });

    // Bob NÃO foi sobrescrito pela resposta atrasada de Alice!
    expect(result.current.character.name).toBe('Bob Rápido');
  });

  it('cancela salvamentos pendentes no logout e não escreve na nuvem para usuário deslogado', async () => {
    const { result, rerender } = renderHook(({ userId }: { userId: string | null }) => useCharacter(userId), {
      initialProps: { userId: 'active-user' as string | null },
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Simula logout
    rerender({ userId: null });

    expect(characterSync.cancelPendingSync).toHaveBeenCalled();

    // Atualiza estado como visitante/deslogado
    act(() => {
      result.current.updateCharacter({ name: 'Visitante Deslogado' });
    });

    // syncOnChange não deve ter sido chamado para o usuário anterior nem com null
    const syncCalls = vi.mocked(characterSync.syncOnChange).mock.calls;
    const invalidCalls = syncCalls.filter(([uid]) => !uid);
    expect(invalidCalls).toHaveLength(0);
  });

  it('recupera graciosamente quando o cache local estiver corrompido com JSON inválido', () => {
    localStorage.setItem('arcanasheet_characters_corrupted_user', '{invalid_json@@@!!!');

    const { result } = renderHook(() => useCharacter('corrupted_user'));

    // Não deve travar nem jogar exceção
    expect(result.current.character).toBeDefined();
    expect(result.current.charactersList).toHaveLength(1);
    expect(result.current.character.abilities.str.score).toBe(10);
  });

  it('lida com falha de rede na nuvem caindo para o cache local ou ficha em branco sem quebrar o app', async () => {
    vi.mocked(characterSync.loadCharactersFromCloud).mockRejectedValue(new Error('Network offline 503'));

    const { result } = renderHook(() => useCharacter('offline-user'));

    await act(async () => {
      await Promise.resolve();
    });

    // isCloudLoaded deve ser true indicando conclusão do ciclo de carregamento
    expect(result.current.isCloudLoaded).toBe(true);
    expect(result.current.character).toBeDefined();
  });
});
