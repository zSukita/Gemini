import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

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

/* ─── Parallax on mouse move ─── */
function useParallax() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      const s = smoothRef.current;
      const m = mouseRef.current;
      s.x += (m.x - s.x) * 0.06;
      s.y += (m.y - s.y) * 0.06;

      // background moves slightly opposite to cursor (parallax depth)
      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${s.x * -18}px, ${s.y * -12}px) scale(1.08)`;
      }
      // panel tilts very subtly
      if (panelRef.current) {
        panelRef.current.style.transform = `perspective(1000px) rotateY(${s.x * 2}deg) rotateX(${-s.y * 1.5}deg)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { bgRef, panelRef };
}

/* ─── Floating magic particles canvas ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const COLORS: [number, number, number][] = [
      [147, 51, 234], [59, 130, 246], [212, 175, 55], [180, 60, 255], [100, 200, 255],
    ];
    const RUNES = ['✦', '✧', 'ᚱ', 'ᚦ', 'ᛗ', '◆', '◇'];

    type P = {
      x: number; y: number; vx: number; vy: number; r: number;
      color: [number,number,number]; life: number; maxLife: number;
      wobble: number; wobbleSpeed: number; isRune: boolean; rune: string; alpha: number;
    };

    const mk = (): P => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * canvas.width, y: canvas.height + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.5, vy: -(Math.random() * 0.9 + 0.2),
        r: Math.random() * 2 + 0.5, color,
        life: 0, maxLife: Math.random() * 300 + 150,
        wobble: Math.random() * Math.PI * 2, wobbleSpeed: (Math.random() - 0.5) * 0.03,
        isRune: Math.random() < 0.15,
        rune: RUNES[Math.floor(Math.random() * RUNES.length)],
        alpha: Math.random() * 0.7 + 0.2,
      };
    };

    const particles: P[] = Array.from({ length: 65 }, mk);
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.life++;
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.25;
        p.y += p.vy;
        const lr = p.life / p.maxLife;
        let a = p.alpha;
        if (lr < 0.1) a *= lr / 0.1;
        if (lr > 0.7) a *= 1 - (lr - 0.7) / 0.3;
        const [r, g, b] = p.color;
        if (p.isRune) {
          ctx.save(); ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.font = `${p.r * 7}px serif`; ctx.textAlign = 'center';
          ctx.fillText(p.rune, p.x, p.y); ctx.restore();
        } else {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grd.addColorStop(0, `rgba(${r},${g},${b},${a})`);
          grd.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.35})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();
        }
        if (p.life >= p.maxLife || p.y < -50) particles[i] = mk();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[2] pointer-events-none" style={{ width: '100%', height: '100%' }}/>;
}

/* ─── Main component ─── */
export function LoginScreen({
  onLogin, onSignup, onGoogleLogin, onResetPassword,
  isFirebaseConfigured = true, error, loading, clearError,
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
  const { bgRef, panelRef } = useParallax();

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab); setLocalError(null); setResetSent(false);
    setShowResetForm(false); clearError();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalError(null);
    if (!email.trim()) { setLocalError('Informe seu email.'); return; }
    if (!password) { setLocalError('Informe sua senha.'); return; }
    await onLogin(email.trim(), password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalError(null);
    if (!displayName.trim()) { setLocalError('Escolha um nome de aventureiro.'); return; }
    if (!email.trim()) { setLocalError('Informe seu email.'); return; }
    if (password.length < 6) { setLocalError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setLocalError('As senhas não coincidem.'); return; }
    await onSignup(email.trim(), password, displayName.trim());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalError(null);
    if (!resetEmail.trim()) { setLocalError('Informe o email da sua conta.'); return; }
    const ok = await onResetPassword(resetEmail.trim());
    if (ok) setResetSent(true);
  };

  const displayError = localError || error;

  /* shared input style */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 40px',
    background: 'rgba(5, 2, 20, 0.75)',
    border: '1px solid rgba(100, 75, 25, 0.55)',
    borderRadius: 6, color: '#e2d5b0',
    fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
    outline: 'none', transition: 'all 0.3s',
    backdropFilter: 'blur(4px)',
  };

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center">

      <style>{`
        @keyframes compassSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes runeGlow { from{box-shadow:0 0 4px 1px rgba(212,175,55,0.25)} to{box-shadow:0 0 14px 5px rgba(212,175,55,0.75)} }
        @keyframes shimmerBtn { from{left:-110%} to{left:110%} }
        @keyframes panelGlow { from{box-shadow:0 0 60px rgba(70,30,170,0.18),0 8px 50px rgba(0,0,0,0.95)} to{box-shadow:0 0 90px rgba(100,50,220,0.28),0 8px 50px rgba(0,0,0,0.95)} }
        .magic-input:focus { border-color: rgba(147,51,234,0.7) !important; box-shadow: 0 0 0 2px rgba(147,51,234,0.18) !important; background: rgba(8,3,30,0.88) !important; }
        .tab-btn { transition: all 0.3s; }
        .tab-btn:hover:not(.active) { color: rgba(200,165,80,0.9) !important; background: rgba(212,175,55,0.04) !important; }
        .btn-google:hover { border-color: rgba(147,51,234,0.45) !important; background: rgba(10,5,30,0.9) !important; }
        .btn-entrar:hover { background: linear-gradient(135deg, #7c3aed 0%, #9333ea 52%, #6366f1 100%) !important; box-shadow: 0 6px 30px rgba(147,51,234,0.65), 0 0 60px rgba(79,70,229,0.28) !important; transform: translateY(-1px) !important; }
        .btn-entrar:active { transform: translateY(0) !important; }
      `}</style>

      {/* ── REAL PHOTO BACKGROUND ── */}
      <div
        ref={bgRef}
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'scale(1.08)',
          willChange: 'transform',
        }}
      />
      {/* Dark overlay to deepen the scene */}
      <div className="fixed inset-0 z-[1]" style={{
        background: 'linear-gradient(to bottom, rgba(2,0,12,0.35) 0%, rgba(5,1,20,0.25) 50%, rgba(2,0,12,0.5) 100%)'
      }}/>

      {/* ── Magic particles ── */}
      <ParticleCanvas />

      {/* ══════════════════════════════════════════
          MAIN UI
      ══════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">

        {/* ── Logo ── */}
        <div className="text-center mb-5 select-none">
          {/* Spinning compass rose */}
          <div style={{ display: 'inline-block', animation: 'compassSpin 30s linear infinite', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))', marginBottom: 2 }}>
            <svg width="42" height="42" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="19" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1"/>
              <circle cx="21" cy="21" r="2.8" fill="#d4af37"/>
              <polygon points="21,3 24,15 21,17 18,15" fill="#d4af37"/>
              <polygon points="21,39 24,27 21,25 18,27" fill="rgba(212,175,55,0.5)"/>
              <polygon points="3,21 15,18 17,21 15,24" fill="rgba(212,175,55,0.5)"/>
              <polygon points="39,21 27,18 25,21 27,24" fill="#d4af37"/>
              <polygon points="6.5,6.5 14,14 12,16 10,10" fill="rgba(212,175,55,0.35)"/>
              <polygon points="35.5,6.5 28,14 30,16 32,10" fill="rgba(212,175,55,0.35)"/>
              <polygon points="6.5,35.5 14,28 12,26 10,32" fill="rgba(212,175,55,0.35)"/>
              <polygon points="35.5,35.5 28,28 30,26 32,32" fill="rgba(212,175,55,0.35)"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: '"Cinzel Decorative", "Cinzel", serif',
            fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #9a7018 0%, #d4af37 28%, #fde68a 52%, #d4af37 72%, #8a5808 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 12px rgba(212,175,55,0.5)) drop-shadow(0 0 30px rgba(212,175,55,0.2))',
            lineHeight: 1.05, letterSpacing: '0.02em',
          }}>ArcanaSheet</h1>
          <p style={{
            fontFamily: '"Cinzel", serif', fontSize: '0.66rem', letterSpacing: '0.32em',
            color: 'rgba(200,160,70,0.85)', textTransform: 'uppercase', marginTop: 5,
            textShadow: '0 0 20px rgba(212,175,55,0.4)',
          }}>Sua Jornada Começa Aqui</p>
        </div>

        {/* ── Login Panel ── */}
        <div style={{ width: 'min(420px, calc(100vw - 24px))', position: 'relative' }}>

          {/* corner accents */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} style={{
              position: 'absolute', width: 22, height: 22,
              borderColor: 'rgba(190,140,35,0.7)', borderStyle: 'solid',
              borderWidth: c==='tl'?'2px 0 0 2px':c==='tr'?'2px 2px 0 0':c==='bl'?'0 0 2px 2px':'0 2px 2px 0',
              top: c.startsWith('t') ? -1 : undefined,
              bottom: c.startsWith('b') ? -1 : undefined,
              left: c.endsWith('l') ? -1 : undefined,
              right: c.endsWith('r') ? -1 : undefined,
              zIndex: 3,
            }}/>
          ))}
          {/* diamond top */}
          <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', width:14, height:14, background:'linear-gradient(135deg,#d4af37,#fbbf24)', clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', boxShadow:'0 0 16px 4px rgba(212,175,55,0.65)', zIndex:3 }}/>
          {/* diamond bottom */}
          <div style={{ position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', width:14, height:14, background:'linear-gradient(135deg,#d4af37,#fbbf24)', clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', boxShadow:'0 0 16px 4px rgba(212,175,55,0.65)', zIndex:3 }}/>

          <div
            ref={panelRef}
            style={{
              background: 'rgba(3, 1, 14, 0.88)',
              border: '1px solid rgba(160,110,22,0.5)',
              borderRadius: 4,
              overflow: 'hidden',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              animation: 'panelGlow 3.5s ease-in-out infinite alternate',
              willChange: 'transform',
            }}
          >
            {/* Firebase warning */}
            {!isFirebaseConfigured && (
              <div style={{ padding: '10px 16px', background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.22)', display:'flex', gap:8, alignItems:'flex-start' }}>
                <AlertCircle size={14} style={{ color:'#fbbf24', marginTop:2, flexShrink:0 }}/>
                <div style={{ fontSize:'0.72rem', fontFamily:'Inter,sans-serif' }}>
                  <strong style={{ color:'#fde68a', display:'block', marginBottom:2 }}>Firebase não configurado</strong>
                  <span style={{ color:'rgba(200,170,110,0.8)' }}>Adicione as credenciais no <code style={{ background:'#080214', padding:'0 3px', borderRadius:2 }}>.env</code> para habilitar o login.</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid rgba(110,70,14,0.42)', background:'rgba(0,0,0,0.3)' }}>
              {(['login','signup'] as AuthTab[]).map(t2 => (
                <button
                  key={t2}
                  onClick={() => switchTab(t2)}
                  className={`tab-btn${tab===t2?' active':''}`}
                  style={{
                    flex:1, padding:'13px 12px',
                    fontFamily:'"Cinzel",serif', fontSize:'0.73rem',
                    fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
                    cursor:'pointer', border:'none',
                    background: tab===t2 ? 'rgba(212,175,55,0.07)' : 'transparent',
                    color: tab===t2 ? '#fbbf24' : 'rgba(135,105,45,0.65)',
                    position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}
                >
                  {t2==='login' ? '⚔' : '✦'} {t2==='login' ? 'Entrar' : 'Criar Conta'}
                  {tab===t2 && (
                    <span style={{ position:'absolute', bottom:0, left:'8%', right:'8%', height:2, background:'linear-gradient(to right,transparent,#fbbf24,transparent)' }}/>
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <div style={{ padding:'22px 26px 18px' }}>

              {displayError && (
                <div style={{ marginBottom:14, padding:'10px 12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:4, display:'flex', gap:8, alignItems:'flex-start' }}>
                  <AlertCircle size={14} style={{ color:'#f87171', marginTop:1, flexShrink:0 }}/>
                  <p style={{ color:'#fca5a5', fontSize:'0.82rem', fontFamily:'Inter,sans-serif' }}>{displayError}</p>
                </div>
              )}

              {/* ── RESET PASSWORD ── */}
              {showResetForm ? (
                <form onSubmit={handleResetPassword} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <p style={{ color:'rgba(210,185,140,0.8)', fontSize:'0.82rem', fontFamily:'Inter', marginBottom:4 }}>
                    Informe seu email para receber o link de redefinição.
                  </p>
                  {resetSent && (
                    <div style={{ padding:'10px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.28)', borderRadius:4, display:'flex', gap:8 }}>
                      <CheckCircle size={14} style={{ color:'#34d399', marginTop:1 }}/>
                      <p style={{ color:'#6ee7b7', fontSize:'0.82rem', fontFamily:'Inter' }}>Email enviado! Verifique sua caixa de entrada.</p>
                    </div>
                  )}
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>✉</span>
                    <input type="email" placeholder="Seu email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} className="magic-input" style={inputStyle}/>
                  </div>
                  <button type="submit" disabled={loading} className="btn-entrar" style={btnStyle(loading)}>
                    {loading ? <Loader2 size={15} className="animate-spin"/> : <span style={{ letterSpacing:'0.18em' }}>Enviar Link</span>}
                  </button>
                  <button type="button" onClick={()=>{setShowResetForm(false);setLocalError(null);clearError();}} style={backLinkStyle}>
                    ← Voltar ao login
                  </button>
                </form>

              ) : tab === 'login' ? (
                /* ── LOGIN ── */
                <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>✉</span>
                    <input type="email" placeholder="E-mail ou usuário" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="magic-input" style={inputStyle}/>
                  </div>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>🔒</span>
                    <input type={showPassword?'text':'password'} placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" className="magic-input" style={{ ...inputStyle, paddingRight:40 }}/>
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} style={eyeStyle}>
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <button type="button"
                    onClick={()=>{setShowResetForm(true);setResetEmail(email);setLocalError(null);clearError();}}
                    style={backLinkStyle}
                  >
                    Esqueci minha senha
                  </button>
                  <button type="submit" disabled={loading} className="btn-entrar" style={btnStyle(loading)}>
                    {loading
                      ? <Loader2 size={15} className="animate-spin"/>
                      : <><span style={{ letterSpacing:'0.2em' }}>ENTRAR</span><span style={{ fontSize:'1rem' }}>→</span></>
                    }
                  </button>
                  <Divider/>
                  <GoogleBtn onClick={onGoogleLogin} disabled={loading} label="Entrar com Google"/>
                </form>

              ) : (
                /* ── SIGNUP ── */
                <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:11 }}>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>⚔</span>
                    <input type="text" placeholder="Nome do Aventureiro" value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" className="magic-input" style={inputStyle}/>
                  </div>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>✉</span>
                    <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="magic-input" style={inputStyle}/>
                  </div>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>🔒</span>
                    <input type={showPassword?'text':'password'} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="magic-input" style={{ ...inputStyle, paddingRight:40 }}/>
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} style={eyeStyle}>
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <div style={{ position:'relative' }}>
                    <span style={iconStyle}>🔒</span>
                    <input type={showConfirm?'text':'password'} placeholder="Confirmar Senha" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" className="magic-input" style={{ ...inputStyle, paddingRight:40 }}/>
                    <button type="button" onClick={()=>setShowConfirm(v=>!v)} style={eyeStyle}>
                      {showConfirm ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="btn-entrar" style={{ ...btnStyle(loading), marginTop:2 }}>
                    {loading
                      ? <Loader2 size={15} className="animate-spin"/>
                      : <><span style={{ letterSpacing:'0.2em' }}>CRIAR CONTA</span><span style={{ fontSize:'1rem' }}>→</span></>
                    }
                  </button>
                  <Divider/>
                  <GoogleBtn onClick={onGoogleLogin} disabled={loading} label="Registrar com Google"/>
                </form>
              )}
            </div>

            {/* Features bar */}
            <div style={{ padding:'12px 24px', borderTop:'1px solid rgba(90,60,10,0.3)', display:'flex', justifyContent:'center', alignItems:'center', gap:6, background:'rgba(0,0,0,0.25)' }}>
              {['Personagens','Campanhas','Histórias'].map((label, i) => (
                <span key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'"Cinzel",serif', fontSize:'0.58rem', letterSpacing:'0.18em', color:'rgba(115,88,32,0.62)', textTransform:'uppercase' }}>{label}</span>
                  {i < 2 && <span style={{ display:'inline-block', width:4, height:4, background:'#d4af37', borderRadius:'50%', animation:'runeGlow 2.2s ease-in-out infinite alternate' }}/>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p style={{ marginTop:18, fontSize:'0.62rem', color:'rgba(80,60,28,0.55)', fontFamily:'Inter,sans-serif', textAlign:'center' }}>
          ArcanaSheet — Seus dados protegidos pelo Google Firebase
        </p>
      </div>
    </div>
  );
}

/* ─── Shared micro-styles ─── */
const iconStyle: React.CSSProperties = {
  position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
  color:'rgba(150,120,55,0.55)', fontSize:13, pointerEvents:'none',
};

const eyeStyle: React.CSSProperties = {
  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
  background:'none', border:'none', cursor:'pointer',
  color:'rgba(150,120,55,0.5)', padding:4, transition:'color 0.2s',
};

const backLinkStyle: React.CSSProperties = {
  background:'none', border:'none', cursor:'pointer',
  color:'rgba(140,110,45,0.6)', fontSize:'0.7rem',
  fontFamily:'"Cinzel",serif', letterSpacing:'0.06em',
  textAlign:'right', alignSelf:'flex-end', transition:'color 0.2s',
  textDecoration:'underline', textDecorationColor:'transparent',
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width:'100%', padding:'13px 16px',
    background: disabled ? 'rgba(109,33,168,0.4)' : 'linear-gradient(135deg,#6b21a8 0%,#7c3aed 52%,#4f46e5 100%)',
    border:'1px solid rgba(147,51,234,0.5)', borderRadius:4,
    color:'#e8d8ff', fontFamily:'"Cinzel",serif',
    fontSize:'0.82rem', fontWeight:700, letterSpacing:'0.22em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    position:'relative', overflow:'hidden',
    boxShadow: disabled ? 'none' : '0 4px 24px rgba(109,33,168,0.55),0 0 44px rgba(79,70,229,0.2)',
    transition:'all 0.3s',
  };
}

function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'1px 0' }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,rgba(110,78,18,0.4),transparent)' }}/>
      <span style={{ fontFamily:'"Cinzel",serif', fontSize:'0.6rem', letterSpacing:'0.14em', color:'rgba(110,85,28,0.55)', textTransform:'uppercase' }}>ou</span>
      <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,rgba(110,78,18,0.4),transparent)' }}/>
    </div>
  );
}

function GoogleBtn({ onClick, disabled, label }: { onClick:()=>void; disabled:boolean; label:string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn-google" style={{
      width:'100%', padding:'11px 16px',
      background:'rgba(6,3,20,0.72)', border:'1px solid rgba(95,65,14,0.45)',
      borderRadius:4, color:'rgba(195,165,92,0.82)',
      fontFamily:'Inter,sans-serif', fontSize:'0.82rem', fontWeight:500,
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      transition:'all 0.3s', opacity: disabled ? 0.5 : 1,
    }}>
      <svg width="17" height="17" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}
