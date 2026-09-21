import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage } from './auth';

describe('getAuthErrorMessage', () => {
  it('traduz erros conhecidos do Firebase Auth para português', () => {
    expect(getAuthErrorMessage('auth/email-already-in-use')).toBe('Este email já está cadastrado.');
    expect(getAuthErrorMessage('auth/invalid-email')).toBe('Email inválido.');
    expect(getAuthErrorMessage('auth/wrong-password')).toBe('Senha incorreta.');
    expect(getAuthErrorMessage('auth/weak-password')).toBe('A senha deve ter pelo menos 6 caracteres.');
    expect(getAuthErrorMessage('auth/user-not-found')).toBe('Nenhuma conta encontrada com este email.');
    expect(getAuthErrorMessage('auth/invalid-credential')).toBe('Email ou senha incorretos.');
    expect(getAuthErrorMessage('auth/popup-closed-by-user')).toBe('Login cancelado.');
    expect(getAuthErrorMessage('auth/network-request-failed')).toBe('Erro de conexão. Verifique sua internet.');
  });

  it('retorna mensagem genérica para erros desconhecidos', () => {
    expect(getAuthErrorMessage('auth/some-weird-error')).toBe('Ocorreu um erro. Tente novamente.');
    expect(getAuthErrorMessage('')).toBe('Ocorreu um erro. Tente novamente.');
  });
});
