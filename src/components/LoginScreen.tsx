import { useState, useEffect, useRef, useCallback } from 'react';
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

/* ─── tiny hook: parallax mouse tracking ─── */
function useParallax() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      s.x += (m.x - s.x) * 0.07;
      s.y += (m.y - s.y) * 0.07;

      const strengths: Record<string, number> = {
        bg: 10, mid: 22, crystal: 36, candles: 18, circle: 14,
      };
      Object.entries(layerRefs.current).forEach(([key, el]) => {
        if (!el) return;
        const str = strengths[key] ?? 20;
        el.style.transform = `translate(${s.x * str}px, ${s.y * str}px)`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const setLayerRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    layerRefs.current[key] = el;
  }, []);

  return setLayerRef;
}

/* ─── canvas particle system ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS: [number, number, number][] = [
      [147, 51, 234], [59, 130, 246], [212, 175, 55], [180, 60, 255], [100, 180, 255],
    ];
    const RUNES = ['✦', '✧', '◆', '◇', 'ᚱ', 'ᚦ', 'ᛗ'];

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      r: number; color: [number,number,number];
      life: number; maxLife: number;
      wobble: number; wobbleSpeed: number;
      isRune: boolean; rune: string; alpha: number;
    };

    const mkParticle = (): Particle => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 1.0 + 0.25),
        r: Math.random() * 2.2 + 0.5,
        color,
        life: 0,
        maxLife: Math.random() * 280 + 140,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: (Math.random() - 0.5) * 0.03,
        isRune: Math.random() < 0.14,
        rune: RUNES[Math.floor(Math.random() * RUNES.length)],
        alpha: Math.random() * 0.65 + 0.2,
      };
    };

    /* stars */
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.65,
      r: Math.random() * 1.4 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.004,
    }));

    const particles: Particle[] = Array.from({ length: 75 }, mkParticle);
    let t = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* background gradient */
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, '#020010');
      bg.addColorStop(0.45, '#06011a');
      bg.addColorStop(1, '#0e0430');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      /* stars */
      stars.forEach(s => {
        const a = 0.2 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,160,255,${a})`;
        ctx.fill();
      });

      /* particles */
      particles.forEach((p, i) => {
        p.life++;
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.28;
        p.y += p.vy;

        const lr = p.life / p.maxLife;
        let alpha = p.alpha;
        if (lr < 0.1) alpha *= lr / 0.1;
        if (lr > 0.7) alpha *= 1 - (lr - 0.7) / 0.3;

        const [r, g, b] = p.color;
        if (p.isRune) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.font = `${p.r * 6}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.rune, p.x, p.y);
          ctx.restore();
        } else {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
          grd.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
          grd.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        if (p.life >= p.maxLife || p.y < -60) particles[i] = mkParticle();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/* ─── Crystal Orb SVG ─── */
function CrystalOrb() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        right: '8%',
        top: '50%',
        transform: 'translateY(-52%)',
        animation: 'orbFloat 5s ease-in-out infinite alternate',
        filter: 'drop-shadow(0 0 32px rgba(80,60,255,0.85)) drop-shadow(0 0 64px rgba(40,20,200,0.45))',
        zIndex: 5,
      }}
    >
      <svg width="140" height="175" viewBox="0 0 160 200">
        <defs>
          <radialGradient id="cg1" cx="35%" cy="28%" r="65%">
            <stop offset="0%" stopColor="#b8d4ff" stopOpacity="0.95"/>
            <stop offset="15%" stopColor="#8090ff" stopOpacity="0.9"/>
            <stop offset="42%" stopColor="#4040d0" stopOpacity="0.95"/>
            <stop offset="72%" stopColor="#1a0a80"/>
            <stop offset="100%" stopColor="#080430"/>
          </radialGradient>
          <radialGradient id="cs1" cx="28%" cy="22%" r="36%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
          <filter id="cglow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* body */}
        <polygon points="80,8 145,55 145,145 80,192 15,145 15,55" fill="url(#cg1)" filter="url(#cglow)"/>
        {/* facets */}
        <polygon points="80,8 145,55 80,80" fill="rgba(120,160,255,0.28)"/>
        <polygon points="80,8 15,55 80,80"  fill="rgba(60,80,200,0.18)"/>
        <polygon points="15,55 80,80 15,145" fill="rgba(20,20,120,0.28)"/>
        <polygon points="145,55 80,80 145,145" fill="rgba(80,100,220,0.22)"/>
        <polygon points="15,145 80,80 80,192" fill="rgba(10,5,60,0.38)"/>
        <polygon points="145,145 80,80 80,192" fill="rgba(20,10,90,0.32)"/>
        {/* shine */}
        <polygon points="80,8 145,55 80,80" fill="url(#cs1)" opacity="0.85"/>
        <ellipse cx="58" cy="45" rx="17" ry="23" fill="rgba(255,255,255,0.18)" transform="rotate(-15,58,45)"/>
        {/* interior sparkles */}
        <circle cx="95" cy="85" r="2.5" fill="rgba(160,200,255,0.8)"/>
        <circle cx="70" cy="112" r="1.8" fill="rgba(120,180,255,0.6)"/>
        <circle cx="108" cy="118" r="2" fill="rgba(100,150,255,0.65)"/>
        {/* animated pulse */}
        <ellipse cx="80" cy="100" rx="45" ry="60" fill="rgba(80,120,255,0.08)">
          <animate attributeName="rx" values="45;52;45" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="60;68;60" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        {/* stand */}
        <rect x="68" y="188" width="24" height="10" rx="3" fill="#1a0a60" stroke="#3a1a90" strokeWidth="1"/>
        <rect x="56" y="196" width="48" height="7" rx="2" fill="#120840" stroke="#2a1070" strokeWidth="1"/>
      </svg>
      {/* ground glow */}
      <div style={{
        position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 22,
        background: 'radial-gradient(ellipse, rgba(80,40,255,0.55) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(6px)',
        animation: 'glowPulse 2.8s ease-in-out infinite alternate',
      }}/>
    </div>
  );
}

/* ─── Magic Circle ─── */
function MagicCircle() {
  return (
    <div className="absolute pointer-events-none" style={{ bottom: '2%', left: '50%', transform: 'translateX(-50%)', zIndex: 3, opacity: 0.55 }}>
      <svg style={{ animation: 'rotCircle 22s linear infinite', display: 'block' }} width="480" height="480" viewBox="0 0 480 480">
        <circle cx="240" cy="240" r="224" fill="none" stroke="rgba(80,40,200,0.3)" strokeWidth="1.5" strokeDasharray="8,12"/>
        <circle cx="240" cy="240" r="195" fill="none" stroke="rgba(60,30,160,0.2)" strokeWidth="0.8"/>
        <text x="240" y="26" textAnchor="middle" fontSize="18" fill="rgba(100,60,220,0.65)" fontFamily="serif">ᚦ</text>
        <text x="240" y="466" textAnchor="middle" fontSize="18" fill="rgba(100,60,220,0.65)" fontFamily="serif">ᚱ</text>
        <text x="22" y="248" textAnchor="middle" fontSize="18" fill="rgba(100,60,220,0.65)" fontFamily="serif">ᛗ</text>
        <text x="458" y="248" textAnchor="middle" fontSize="18" fill="rgba(100,60,220,0.65)" fontFamily="serif">ᚨ</text>
        <polygon points="240,70 278,185 400,185 305,255 340,375 240,300 140,375 175,255 80,185 202,185"
          fill="none" stroke="rgba(80,40,180,0.2)" strokeWidth="1"/>
      </svg>
      <svg style={{ animation: 'rotCircle 15s linear infinite reverse', position: 'absolute', top: 44, left: 44 }} width="392" height="392" viewBox="0 0 392 392">
        <circle cx="196" cy="196" r="178" fill="none" stroke="rgba(60,30,160,0.28)" strokeWidth="1" strokeDasharray="4,8"/>
        <circle cx="196" cy="4" r="3.5" fill="rgba(80,40,220,0.7)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="388" cy="196" r="3.5" fill="rgba(80,40,220,0.7)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="4" cy="196" r="3.5" fill="rgba(80,40,220,0.7)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="196" cy="388" r="3.5" fill="rgba(80,40,220,0.7)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
}

/* ─── Candle ─── */
function Candle({ height = 60, delay = 0 }: { height?: number; delay?: number }) {
  return (
    <div className="relative inline-flex flex-col items-center">
      {/* flame */}
      <div style={{
        width: 9, height: 16, marginBottom: -1,
        background: 'radial-gradient(ellipse at 50% 80%, #ffffffaa 0%, #fbbf24 38%, #f97316 68%, transparent 100%)',
        borderRadius: '50% 50% 30% 30%',
        filter: 'blur(0.4px)',
        boxShadow: '0 0 10px 4px rgba(251,191,36,0.55), 0 0 22px 7px rgba(249,115,22,0.25)',
        animation: `flameDance 0.75s ease-in-out ${delay}s infinite alternate`,
      }}/>
      {/* body */}
      <div style={{
        width: 12, height,
        background: 'linear-gradient(to right, #c8c4b0, #f0ebe0, #b8b4a0)',
        borderRadius: 2,
      }}/>
      {/* glow on surface */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 64, height: 64,
        background: 'radial-gradient(circle, rgba(251,191,36,0.28) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(8px)',
        pointerEvents: 'none',
      }}/>
    </div>
  );
}

/* ─── Main Component ─── */
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

  const setLayerRef = useParallax();

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
    if (!email.trim()) { setLocalError('Informe seu email.'); return; }
    if (!password)     { setLocalError('Informe sua senha.'); return; }
    await onLogin(email.trim(), password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!displayName.trim()) { setLocalError('Escolha um nome de aventureiro.'); return; }
    if (!email.trim())       { setLocalError('Informe seu email.'); return; }
    if (password.length < 6) { setLocalError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setLocalError('As senhas não coincidem.'); return; }
    await onSignup(email.trim(), password, displayName.trim());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!resetEmail.trim()) { setLocalError('Informe o email da sua conta.'); return; }
    const ok = await onResetPassword(resetEmail.trim());
    if (ok) setResetSent(true);
  };

  const displayError = localError || error;

  /* ─ shared input style ─ */
  const inputCls = `
    w-full pl-10 pr-4 py-3 rounded-sm text-sm outline-none transition-all
    bg-[rgba(8,4,28,0.82)] text-[#e2d5b0] placeholder-[rgba(150,120,60,0.45)]
    border border-[rgba(100,70,15,0.5)]
    focus:border-[rgba(147,51,234,0.7)] focus:ring-1 focus:ring-[rgba(147,51,234,0.3)]
    focus:bg-[rgba(12,5,35,0.92)]
    font-[Inter] italic
  `;

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center">

      {/* ── CSS keyframes injected via style tag ── */}
      <style>{`
        @keyframes orbFloat   { from{transform:translateY(-52%) translateY(0)}   to{transform:translateY(-52%) translateY(-18px) rotate(3deg)} }
        @keyframes glowPulse  { from{opacity:0.55;width:100px}  to{opacity:1;width:120px} }
        @keyframes rotCircle  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes flameDance { from{transform:scaleX(1) scaleY(1)} to{transform:scaleX(0.8) scaleY(1.12) translateX(1px)} }
        @keyframes compassSpin{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes runeGlow   { from{box-shadow:0 0 4px 1px rgba(212,175,55,0.25)} to{box-shadow:0 0 14px 5px rgba(212,175,55,0.8)} }
        @keyframes panelAura  { from{opacity:0.55;transform:scale(0.97)} to{opacity:1;transform:scale(1.03)} }
        @keyframes shimmer    { from{left:-110%} to{left:110%} }
      `}</style>

      {/* ── Canvas: stars + particles ── */}
      <ParticleCanvas />

      {/* ── Parallax layer: gothic architecture bg ── */}
      <div ref={setLayerRef('bg')} className="absolute inset-[-8%] w-[116%] h-[116%] pointer-events-none" style={{ zIndex: 1 }}>
        {/* ambient glow gradients */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 75% 55% at 50% 105%, #200a50 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 12% 50%, #0d0428 0%, transparent 50%), radial-gradient(ellipse 50% 70% at 88% 50%, #0d0428 0%, transparent 50%)'
        }}/>
        {/* Moon/portal glow at top */}
        <div className="absolute" style={{
          top: '-5%', left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(110,60,220,0.22) 0%, rgba(60,20,120,0.12) 40%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(22px)',
          animation: 'panelAura 4s ease-in-out infinite alternate',
        }}/>
        {/* Gothic arch SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" fill="none">
          {/* castle background */}
          <g opacity="0.48">
            <rect x="540" y="180" width="28" height="120" fill="#09051e"/>
            <polygon points="540,180 554,148 568,180" fill="#09051e"/>
            <rect x="610" y="158" width="42" height="142" fill="#09051e"/>
            <polygon points="610,158 631,122 652,158" fill="#09051e"/>
            <rect x="700" y="175" width="36" height="125" fill="#09051e"/>
            <polygon points="700,175 718,142 736,175" fill="#09051e"/>
            <rect x="770" y="190" width="28" height="110" fill="#09051e"/>
            <polygon points="770,190 784,160 798,190" fill="#09051e"/>
            <rect x="820" y="168" width="40" height="132" fill="#09051e"/>
            <polygon points="820,168 840,135 860,168" fill="#09051e"/>
            <rect x="872" y="185" width="26" height="115" fill="#09051e"/>
            <polygon points="872,185 885,158 898,185" fill="#09051e"/>
            {/* castle base */}
            <rect x="520" y="298" width="420" height="600" fill="#060118"/>
            {/* glowing windows */}
            <rect x="628" y="238" width="18" height="28" rx="9" fill="#380e8a" opacity="0.9"/>
            <rect x="718" y="220" width="20" height="32" rx="10" fill="#48189a" opacity="0.85"/>
            <rect x="778" y="235" width="18" height="28" rx="9" fill="#380e8a" opacity="0.8"/>
            <rect x="830" y="222" width="20" height="30" rx="10" fill="#48189a" opacity="0.85"/>
          </g>
          {/* Left arch column */}
          <path d="M0 900 L0 380 Q110 170 220 380 L220 900 Z" fill="#020010" opacity="0.96"/>
          <path d="M28 335 Q114 155 200 335" stroke="#280d5e" strokeWidth="2.5" fill="none" opacity="0.55"/>
          <ellipse cx="114" cy="255" rx="82" ry="105" fill="#1a0560" opacity="0.22" style={{ filter: 'blur(2px)' }}/>
          {/* Right arch column */}
          <path d="M1440 900 L1440 380 Q1330 170 1220 380 L1220 900 Z" fill="#020010" opacity="0.96"/>
          <path d="M1240 335 Q1326 155 1412 335" stroke="#280d5e" strokeWidth="2.5" fill="none" opacity="0.55"/>
          <ellipse cx="1326" cy="255" rx="82" ry="105" fill="#1a0560" opacity="0.22" style={{ filter: 'blur(2px)' }}/>
          {/* Floor */}
          <rect x="0" y="826" width="1440" height="74" fill="#02000c"/>
          <ellipse cx="720" cy="832" rx="420" ry="28" fill="#180058" opacity="0.5" style={{ filter: 'blur(2px)' }}/>
        </svg>
      </div>

      {/* ── Parallax: mid-ground props (books + scroll) ── */}
      <div ref={setLayerRef('mid')} className="absolute inset-[-8%] w-[116%] h-[116%] pointer-events-none" style={{ zIndex: 4 }}>
        {/* Books LEFT */}
        <div className="absolute" style={{ left: '3.5%', bottom: '13%' }}>
          <svg width="115" height="135" viewBox="0 0 115 135">
            <rect x="5" y="93" width="92" height="22" rx="2" fill="#0d1b3e" stroke="#1a3060" strokeWidth="1"/>
            <rect x="5" y="93" width="11" height="22" rx="1" fill="#1a3060"/>
            <rect x="8" y="67" width="86" height="27" rx="2" fill="#2a0a0a" stroke="#500a0a" strokeWidth="1"/>
            <rect x="8" y="67" width="11" height="27" rx="1" fill="#500a0a"/>
            <rect x="3" y="42" width="98" height="26" rx="2" fill="#1a1006" stroke="#3a2a10" strokeWidth="1"/>
            <rect x="3" y="42" width="13" height="26" rx="1" fill="#3a2a10"/>
            <rect x="16" y="22" width="62" height="22" rx="2" fill="#0a1a10" stroke="#1a3a1a" strokeWidth="1"/>
            <rect x="16" y="22" width="10" height="22" rx="1" fill="#1a3a1a"/>
            <rect x="68" y="18" width="4" height="18" fill="#8a2020"/>
          </svg>
          <div className="flex items-end gap-1.5 -mt-1">
            <Candle height={52} delay={0}/>
            <Candle height={38} delay={0.35}/>
          </div>
        </div>

        {/* Books RIGHT */}
        <div className="absolute" style={{ right: '3.5%', bottom: '14%' }}>
          <svg width="105" height="120" viewBox="0 0 105 120">
            <rect x="5" y="88" width="90" height="20" rx="2" fill="#1a0a25" stroke="#3a1a50" strokeWidth="1"/>
            <rect x="5" y="88" width="12" height="20" rx="1" fill="#3a1a50"/>
            <rect x="8" y="62" width="84" height="28" rx="2" fill="#251205" stroke="#4a2a10" strokeWidth="1"/>
            <rect x="8" y="62" width="12" height="28" rx="1" fill="#4a2a10"/>
            <rect x="0" y="40" width="98" height="24" rx="2" fill="#0d1a0d" stroke="#2a3a20" strokeWidth="1"/>
            <rect x="0" y="40" width="13" height="24" rx="1" fill="#2a3a20"/>
            {/* quill */}
            <line x1="72" y1="12" x2="42" y2="40" stroke="#c8b890" strokeWidth="1.5"/>
            <path d="M72 12 Q82 2 90 7 Q82 17 72 12" fill="#e8d8a0"/>
          </svg>
        </div>

        {/* Floating scroll top-right */}
        <div className="absolute" style={{ top: '7%', right: '22%', animation: 'flameDance 6s ease-in-out infinite alternate', transform: 'rotate(-10deg)' }}>
          <svg width="72" height="95" viewBox="0 0 72 95" opacity="0.65">
            <path d="M8 4 Q36 0 64 4 L68 91 Q36 96 4 91 Z" fill="#c4b488" stroke="#9a8050" strokeWidth="1"/>
            <line x1="13" y1="20" x2="59" y2="20" stroke="#7a5e30" strokeWidth="0.8" opacity="0.6"/>
            <line x1="13" y1="28" x2="59" y2="28" stroke="#7a5e30" strokeWidth="0.8" opacity="0.5"/>
            <line x1="13" y1="36" x2="52" y2="36" stroke="#7a5e30" strokeWidth="0.8" opacity="0.5"/>
            <line x1="13" y1="44" x2="56" y2="44" stroke="#7a5e30" strokeWidth="0.8" opacity="0.45"/>
            <text x="16" y="22" fontSize="5.5" fill="#5a3e18" opacity="0.7" fontFamily="serif">ᚱᚨᚾᛖ ᛗᚨᚷᛁᚲ</text>
            <text x="16" y="30" fontSize="5.5" fill="#5a3e18" opacity="0.55" fontFamily="serif">ᛁᚾᚲᚨᚾᛏᚨᛏᛁᛟ</text>
          </svg>
        </div>

        {/* Dice */}
        <div className="absolute" style={{ left: '19%', bottom: '10%' }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <polygon points="26,2 50,18 50,38 26,52 2,38 2,18" fill="#080820" stroke="#2a1a60" strokeWidth="1.5"/>
            <polygon points="26,2 50,18 26,14" fill="#100830" opacity="0.7"/>
            <text x="26" y="34" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#6a4aff" fontFamily="serif">20</text>
          </svg>
        </div>
        <div className="absolute" style={{ right: '24%', bottom: '9%', transform: 'rotate(22deg)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <rect x="2" y="2" width="32" height="32" rx="5" fill="#07031e" stroke="#180a4e" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2.8" fill="#4a2aff"/>
            <circle cx="26" cy="26" r="2.8" fill="#4a2aff"/>
            <circle cx="26" cy="10" r="2.8" fill="#4a2aff"/>
            <circle cx="10" cy="26" r="2.8" fill="#4a2aff"/>
            <circle cx="18" cy="18" r="2.8" fill="#4a2aff"/>
          </svg>
        </div>
      </div>

      {/* ── Parallax: crystal ── */}
      <div ref={setLayerRef('crystal')} className="absolute inset-[-8%] w-[116%] h-[116%] pointer-events-none" style={{ zIndex: 5 }}>
        <CrystalOrb />
      </div>

      {/* ── Parallax: magic circle ── */}
      <div ref={setLayerRef('circle')} className="absolute inset-[-8%] w-[116%] h-[116%] pointer-events-none" style={{ zIndex: 3 }}>
        <MagicCircle />
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN UI — Logo + Panel
      ══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center w-full px-4" style={{ pointerEvents: 'none' }}>

        {/* ── Logo ── */}
        <div className="text-center mb-5 select-none">
          {/* Compass rose */}
          <div style={{ display: 'inline-block', animation: 'compassSpin 30s linear infinite', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.55))', marginBottom: 4 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(212,175,55,0.38)" strokeWidth="1"/>
              <circle cx="20" cy="20" r="2.8" fill="#d4af37"/>
              <polygon points="20,3 23,16 20,18 17,16" fill="#d4af37"/>
              <polygon points="20,37 23,24 20,22 17,24" fill="rgba(212,175,55,0.5)"/>
              <polygon points="3,20 16,17 18,20 16,23" fill="rgba(212,175,55,0.5)"/>
              <polygon points="37,20 24,17 22,20 24,23" fill="#d4af37"/>
              <polygon points="6,6 15,15 13,17 11,11" fill="rgba(212,175,55,0.32)"/>
              <polygon points="34,6 25,15 27,17 29,11" fill="rgba(212,175,55,0.32)"/>
              <polygon points="6,34 15,25 13,23 11,29" fill="rgba(212,175,55,0.32)"/>
              <polygon points="34,34 25,25 27,23 29,29" fill="rgba(212,175,55,0.32)"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: '"Cinzel Decorative", serif',
            fontSize: 'clamp(1.9rem, 5vw, 3.4rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #9a7218 0%, #d4af37 30%, #fbbf24 52%, #d4af37 72%, #8a5a08 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.35))',
            lineHeight: 1.05,
            letterSpacing: '0.03em',
          }}>ArcanaSheet</h1>
          <p style={{
            fontFamily: '"Cinzel", serif',
            fontSize: '0.65rem',
            letterSpacing: '0.32em',
            color: 'rgba(170,130,50,0.75)',
            textTransform: 'uppercase',
            marginTop: 5,
          }}>Sua Jornada Começa Aqui</p>
        </div>

        {/* ── Login Panel ── */}
        <div className="relative" style={{ width: 'min(415px, calc(100vw - 28px))', pointerEvents: 'all' }}>
          {/* panel aura */}
          <div style={{
            position: 'absolute', inset: -36,
            background: 'radial-gradient(ellipse at center, rgba(80,40,180,0.14) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none', zIndex: -1,
            animation: 'panelAura 3.2s ease-in-out infinite alternate',
          }}/>

          {/* corner decorations */}
          {['tl','tr','bl','br'].map(c => (
            <div key={c} style={{
              position: 'absolute',
              width: 26, height: 26,
              borderColor: 'rgba(180,130,30,0.65)',
              borderStyle: 'solid',
              borderWidth: c==='tl'?'2px 0 0 2px':c==='tr'?'2px 2px 0 0':c==='bl'?'0 0 2px 2px':'0 2px 2px 0',
              top: c.startsWith('t') ? -1 : undefined,
              bottom: c.startsWith('b') ? -1 : undefined,
              left: c.endsWith('l') ? -1 : undefined,
              right: c.endsWith('r') ? -1 : undefined,
              zIndex: 2,
            }}/>
          ))}
          {/* diamond top */}
          <div style={{
            position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
            width: 16, height: 16,
            background: 'linear-gradient(135deg, #d4af37, #fbbf24)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 14px 4px rgba(212,175,55,0.55)', zIndex: 3,
          }}/>
          {/* diamond bottom */}
          <div style={{
            position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)',
            width: 16, height: 16,
            background: 'linear-gradient(135deg, #d4af37, #fbbf24)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 14px 4px rgba(212,175,55,0.55)', zIndex: 3,
          }}/>

          <div style={{
            background: 'rgba(4,1,16,0.93)',
            border: '1px solid rgba(155,105,18,0.42)',
            borderRadius: 4,
            overflow: 'hidden',
            backdropFilter: 'blur(22px)',
            boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 8px 48px rgba(0,0,0,0.92), inset 0 1px 0 rgba(212,175,55,0.08), 0 0 70px rgba(70,35,170,0.14)',
          }}>

            {/* Firebase warning */}
            {!isFirebaseConfigured && (
              <div style={{ padding: '10px 16px', background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.25)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ color: '#fbbf24', marginTop: 2, flexShrink: 0 }}/>
                <div style={{ fontSize: '0.72rem', color: '#fde68a', fontFamily: 'Inter, sans-serif' }}>
                  <strong style={{ display: 'block', marginBottom: 2 }}>Firebase não configurado</strong>
                  <span style={{ color: 'rgba(200,170,120,0.8)' }}>Adicione as credenciais no <code style={{ background: '#0a0520', padding: '0 3px', borderRadius: 2 }}>.env</code> para habilitar o login.</span>
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(100,65,12,0.38)', background: 'rgba(0,0,0,0.28)' }}>
              {(['login','signup'] as AuthTab[]).map(t2 => (
                <button
                  key={t2}
                  onClick={() => switchTab(t2)}
                  style={{
                    flex: 1,
                    padding: '13px 12px',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: 'none',
                    background: tab === t2 ? 'rgba(212,175,55,0.06)' : 'transparent',
                    color: tab === t2 ? '#fbbf24' : 'rgba(140,110,50,0.65)',
                    position: 'relative',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {t2 === 'login' ? '⚔' : '✦'} {t2 === 'login' ? 'Entrar' : 'Criar Conta'}
                  {tab === t2 && (
                    <span style={{
                      position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
                      background: 'linear-gradient(to right, transparent, #fbbf24, transparent)',
                    }}/>
                  )}
                </button>
              ))}
            </div>

            {/* ── Form body ── */}
            <div style={{ padding: '22px 26px 18px' }}>

              {/* Error message */}
              {displayError && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: 4, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertCircle size={14} style={{ color: '#f87171', marginTop: 1, flexShrink: 0 }}/>
                  <p style={{ color: '#fca5a5', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif' }}>{displayError}</p>
                </div>
              )}

              {/* ── RESET PASSWORD FORM ── */}
              {showResetForm ? (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ color: 'rgba(210,185,140,0.8)', fontSize: '0.82rem', fontFamily: 'Inter', marginBottom: 4 }}>
                    Informe seu email para receber o link de redefinição.
                  </p>
                  {resetSent && (
                    <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 4, display: 'flex', gap: 8 }}>
                      <CheckCircle size={14} style={{ color: '#34d399', marginTop: 1 }}/>
                      <p style={{ color: '#6ee7b7', fontSize: '0.82rem', fontFamily: 'Inter' }}>Email enviado! Verifique sua caixa de entrada.</p>
                    </div>
                  )}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>✉</span>
                    <input type="email" placeholder="Seu email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} className={inputCls} style={{ paddingLeft: 36 }}/>
                  </div>
                  <button type="submit" disabled={loading} style={btnPurpleStyle(loading)}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : 'Enviar Link'}
                  </button>
                  <button type="button" onClick={()=>{setShowResetForm(false);setLocalError(null);clearError();}}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(150,120,60,0.65)', fontSize: '0.78rem', fontFamily: '"Cinzel",serif', letterSpacing: '0.08em', textAlign: 'center' }}>
                    ← Voltar ao login
                  </button>
                </form>

              ) : tab === 'login' ? (
                /* ── LOGIN FORM ── */
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Email */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>✉</span>
                    <input type="email" placeholder="E-mail ou usuário" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className={inputCls} style={{ paddingLeft: 36 }}/>
                  </div>
                  {/* Password */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>🔒</span>
                    <input type={showPassword?'text':'password'} placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" className={inputCls} style={{ paddingLeft: 36, paddingRight: 40 }}/>
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(150,120,60,0.5)', padding: 4 }}>
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {/* Forgot password */}
                  <button type="button" onClick={()=>{setShowResetForm(true);setResetEmail(email);setLocalError(null);clearError();}}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(140,110,48,0.6)', fontSize: '0.7rem', fontFamily: '"Cinzel",serif', letterSpacing: '0.06em', textAlign: 'right', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'all 0.2s', alignSelf: 'flex-end', marginTop: -4 }}
                    onMouseEnter={e=>{(e.target as HTMLElement).style.color='rgba(212,175,55,0.8)';(e.target as HTMLElement).style.textDecorationColor='rgba(212,175,55,0.4)'}}
                    onMouseLeave={e=>{(e.target as HTMLElement).style.color='rgba(140,110,48,0.6)';(e.target as HTMLElement).style.textDecorationColor='transparent'}}>
                    Esqueci minha senha
                  </button>
                  {/* ENTRAR button */}
                  <button type="submit" disabled={loading} style={btnPurpleStyle(loading)}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <><span style={{ letterSpacing: '0.2em' }}>ENTRAR</span><span style={{ fontSize: '1rem' }}>→</span></>}
                  </button>
                  <Divider/>
                  <GoogleButton onClick={onGoogleLogin} disabled={loading} label="Entrar com Google"/>
                </form>

              ) : (
                /* ── SIGNUP FORM ── */
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {/* Name */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>⚔</span>
                    <input type="text" placeholder="Nome do Aventureiro" value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" className={inputCls} style={{ paddingLeft: 36 }}/>
                  </div>
                  {/* Email */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>✉</span>
                    <input type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className={inputCls} style={{ paddingLeft: 36 }}/>
                  </div>
                  {/* Password */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>🔒</span>
                    <input type={showPassword?'text':'password'} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className={inputCls} style={{ paddingLeft: 36, paddingRight: 40 }}/>
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(150,120,60,0.5)', padding: 4 }}>
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {/* Confirm */}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(150,120,60,0.55)', fontSize: 13 }}>🔒</span>
                    <input type={showConfirm?'text':'password'} placeholder="Confirmar Senha" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputCls} style={{ paddingLeft: 36, paddingRight: 40 }}/>
                    <button type="button" onClick={()=>setShowConfirm(v=>!v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(150,120,60,0.5)', padding: 4 }}>
                      {showConfirm ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {/* CRIAR CONTA button */}
                  <button type="submit" disabled={loading} style={{ ...btnPurpleStyle(loading), marginTop: 2 }}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <><span style={{ letterSpacing: '0.2em' }}>CRIAR CONTA</span><span style={{ fontSize: '1rem' }}>→</span></>}
                  </button>
                  <Divider/>
                  <GoogleButton onClick={onGoogleLogin} disabled={loading} label="Registrar com Google"/>
                </form>
              )}
            </div>

            {/* ── Features bar ── */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(90,60,10,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.22)' }}>
              {['Personagens', 'Campanhas', 'Histórias'].map((label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: '"Cinzel",serif', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'rgba(120,90,35,0.58)', textTransform: 'uppercase' }}>{label}</span>
                  {i < 2 && <RuneDot/>}
                </span>
              ))}
            </div>

          </div>
        </div>

        {/* footer */}
        <p style={{ marginTop: 20, fontSize: '0.65rem', color: 'rgba(80,60,30,0.5)', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          ArcanaSheet — Seus dados protegidos pelo Google Firebase
        </p>
      </div>
    </div>
  );
}

/* ── Small helper components ── */
function RuneDot() {
  return (
    <span style={{
      display: 'inline-block', width: 5, height: 5,
      background: '#d4af37', borderRadius: '50%',
      boxShadow: '0 0 7px 2px rgba(212,175,55,0.45)',
      animation: 'runeGlow 2.2s ease-in-out infinite alternate',
    }}/>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(110,75,18,0.38), transparent)' }}/>
      <span style={{ fontFamily: '"Cinzel",serif', fontSize: '0.62rem', letterSpacing: '0.14em', color: 'rgba(110,85,28,0.55)', textTransform: 'uppercase' }}>ou</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(110,75,18,0.38), transparent)' }}/>
    </div>
  );
}

function GoogleButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        width: '100%', padding: '11px 16px',
        background: 'rgba(8,4,28,0.65)',
        border: '1px solid rgba(95,65,12,0.42)',
        borderRadius: 4,
        color: 'rgba(195,165,95,0.8)',
        fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 0.3s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e=>{if(!disabled){(e.currentTarget as HTMLElement).style.borderColor='rgba(147,51,234,0.4)';(e.currentTarget as HTMLElement).style.background='rgba(12,6,35,0.9)';}}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(95,65,12,0.42)';(e.currentTarget as HTMLElement).style.background='rgba(8,4,28,0.65)';}}
    >
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

function btnPurpleStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '13px 16px',
    background: disabled ? 'rgba(109,33,168,0.4)' : 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 52%, #4f46e5 100%)',
    border: '1px solid rgba(147,51,234,0.48)',
    borderRadius: 4,
    color: '#e8d8ff',
    fontFamily: '"Cinzel", serif',
    fontSize: '0.82rem',
    fontWeight: 700,
    letterSpacing: '0.22em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    position: 'relative', overflow: 'hidden',
    boxShadow: disabled ? 'none' : '0 4px 24px rgba(109,33,168,0.52), 0 0 44px rgba(79,70,229,0.18)',
    transition: 'all 0.3s',
  };
}
