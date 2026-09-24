// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacter } from './useCharacter';

vi.mock('../firebase/characterSync', () => ({
  loadCharactersFromCloud: vi.fn().mockResolvedValue([]),
  saveCharactersToCloud: vi.fn().mockResolvedValue(undefined),
  syncOnChange: vi.fn(),
}));

describe('useCharacter hook', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
