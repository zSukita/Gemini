import { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  AlertCircle,
  Scroll,
  CheckCircle,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, displayName: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onResetPassword: (email: string) => Promise<boolean>;
  isFirebaseConfigured?: boolean;
  error: string | null;
  loading: boolean;
  clearError: () => void;
}

type AuthTab = 'login' | 'signup';

export function LoginScreen({
  onLogin,
  onSignup,
  onGoogleLogin,
  onResetPassword,
  isFirebaseConfigured = true,
  error,
  loading,
  clearError,
}: LoginScreenProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setLocalError(null);
    setResetSent(false);
    setShowResetForm(false);
    clearError();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError('Informe seu email.');
      return;
    }
    if (!password) {
      setLocalError('Informe sua senha.');
      return;
    }
    await onLogin(email.trim(), password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!displayName.trim()) {
      setLocalError('Escolha um nome de aventureiro.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Informe seu email.');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }
    await onSignup(email.trim(), password, displayName.trim());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!resetEmail.trim()) {
      setLocalError('Informe o email da sua conta.');
      return;
    }
    const success = await onResetPassword(resetEmail.trim());
    if (success) {
      setResetSent(true);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Fundo com efeitos mágicos */}
      <div className="absolute inset-0">
        {/* Gradientes ambiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-slate-950 to-indigo-950/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/3 rounded-full blur-3xl" />
        
        {/* Partículas estáticas decorativas */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
            style={{
              top: `${10 + (i * 17) % 80}%`,
              left: `${5 + (i * 23) % 90}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Scroll className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
              ArcanaSheet
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            VTT & Ficha de Personagem — D&D 5e
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl shadow-2xl shadow-amber-900/10 overflow-hidden">
          {!isFirebaseConfigured && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-300">Firebase ainda não configurado</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Para habilitar login e salvamento em nuvem, adicione as credenciais no arquivo <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">.env</code>. Você também pode jogar normalmente clicando em <strong className="text-slate-200">Modo Offline</strong> abaixo.
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${tab === 'login'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchTab('signup')}
              className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${tab === 'signup'
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              Criar Conta
            </button>
          </div>

          <div className="p-6">
            {/* Mensagem de erro */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{displayError}</p>
              </div>
            )}

            {/* Formulário de Redefinir Senha */}
            {showResetForm ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-slate-300 text-sm mb-4">
                  Informe seu email para receber um link de redefinição de senha.
                </p>

                {resetSent && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-emerald-300 text-sm">
                      Email enviado! Verifique sua caixa de entrada.
                    </p>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Seu email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Enviar Link
                </button>

                <button
                  type="button"
                  onClick={() => { setShowResetForm(false); setLocalError(null); clearError(); }}
                  className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Voltar ao login
                </button>
              </form>
            ) : tab === 'login' ? (
              /* ========== LOGIN ========== */
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Senha */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Esqueci minha senha */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowResetForm(true); setResetEmail(email); setLocalError(null); clearError(); }}
                    className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Entrar
                    </>
                  )}
                </button>

                {/* Separador */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">ou</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Login com Google */}
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 rounded-lg text-slate-200 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Entrar com Google
                </button>
              </form>
            ) : (
              /* ========== CRIAR CONTA ========== */
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Nome */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nome do Aventureiro"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Senha */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirmar Senha */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Botão Criar Conta */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Criar Conta
                    </>
                  )}
                </button>

                {/* Separador */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">ou</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Login com Google */}
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 rounded-lg text-slate-200 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Criar conta com Google
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          ArcanaSheet v1.0 — Seus dados são protegidos pelo Google Firebase
        </p>
      </div>
    </div>
  );
}
