import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pingBackend } from '../utils/api';

/* ============================================================
   Neural Network Canvas — brain hemisphere topology
   ============================================================ */
function useNeuralCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- Config ---
    const NODE_COUNT = 72;
    const EDGE_DIST = 185;
    const PULSE_INTERVAL = 1400; // ms between new pulses
    const TEAL = { r: 0, g: 212, b: 170 };
    const VIOLET = { r: 167, g: 139, b: 250 };

    let width, height;
    let animId;
    let nodes = [];
    let pulses = [];
    let lastPulse = 0;
    let mouse = { x: -9999, y: -9999 };

    // --- Resize ---
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // --- Mouse ---
    function onMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    window.addEventListener('mousemove', onMouseMove);

    // --- Node factory ---
    // Brain topology: two loose clusters (left/right hemispheres)
    function makeNode(i) {
      const hemisphere = Math.random() < 0.5 ? -1 : 1; // -1=left, 1=right
      const cx = width / 2 + hemisphere * (width * 0.18);
      const cy = height * 0.48;
      const spread = Math.min(width, height) * 0.32;

      const color = Math.random() < 0.6 ? TEAL : VIOLET;
      return {
        x: cx + (Math.random() - 0.5) * spread * 2,
        y: cy + (Math.random() - 0.5) * spread * 1.3,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 2.2 + Math.random() * 2.6,
        baseAlpha: 0.35 + Math.random() * 0.45,
        alpha: 0,
        pulseAlpha: 0,
        color,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.012,
      };
    }

    nodes = Array.from({ length: NODE_COUNT }, (_, i) => makeNode(i));

    // --- Pulse factory ---
    function spawnPulse(nodes) {
      // Pick a random edge (pair of close nodes)
      for (let attempt = 0; attempt < 40; attempt++) {
        const ai = Math.floor(Math.random() * nodes.length);
        const bi = Math.floor(Math.random() * nodes.length);
        if (ai === bi) continue;
        const a = nodes[ai], b = nodes[bi];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < EDGE_DIST) {
          pulses.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.007 });
          return;
        }
      }
    }

    // --- Draw ---
    function draw(now) {
      ctx.clearRect(0, 0, width, height);

      const t = now * 0.001;

      // Spawn pulses
      if (now - lastPulse > PULSE_INTERVAL) {
        spawnPulse(nodes);
        lastPulse = now;
        if (Math.random() < 0.4) spawnPulse(nodes); // occasional double
      }

      // Update + draw edges
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= EDGE_DIST) continue;

          const edgeAlpha = (1 - dist / EDGE_DIST) * 0.18;
          const ac = a.color, bc = b.color;
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(${ac.r},${ac.g},${ac.b},${edgeAlpha})`);
          grad.addColorStop(1, `rgba(${bc.r},${bc.g},${bc.b},${edgeAlpha})`);

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Update + draw pulses
      pulses = pulses.filter((p) => {
        p.t += p.speed;
        if (p.t > 1) {
          // Flash at destination
          p.b.pulseAlpha = 1;
          return false;
        }
        const px = p.a.x + (p.b.x - p.a.x) * p.t;
        const py = p.a.y + (p.b.y - p.a.y) * p.t;
        const c = p.a.color;

        // Glow dot
        const glowR = ctx.createRadialGradient(px, py, 0, px, py, 9);
        glowR.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.9)`);
        glowR.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.beginPath();
        ctx.fillStyle = glowR;
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Update + draw nodes
      for (const node of nodes) {
        // Breathing alpha
        node.alpha = node.baseAlpha + Math.sin(t * node.speed * 60 + node.phase) * 0.18;

        // Pulse flash decay
        if (node.pulseAlpha > 0) {
          node.pulseAlpha = Math.max(0, node.pulseAlpha - 0.025);
        }

        // Mouse attraction/repulsion
        const mdx = mouse.x - node.x;
        const mdy = mouse.y - node.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const ATTRACT_R = 140;
        if (mdist < ATTRACT_R && mdist > 1) {
          const force = (ATTRACT_R - mdist) / ATTRACT_R * 0.12;
          node.vx += (mdx / mdist) * force;
          node.vy += (mdy / mdist) * force;
        }

        // Velocity damping
        node.vx *= 0.985;
        node.vy *= 0.985;

        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Soft boundary wrap
        if (node.x < -60) node.x = width + 60;
        if (node.x > width + 60) node.x = -60;
        if (node.y < -60) node.y = height + 60;
        if (node.y > height + 60) node.y = -60;

        // Draw node
        const c = node.color;
        const totalAlpha = Math.min(1, node.alpha + node.pulseAlpha * 0.6);

        // Outer glow
        const glowSize = node.r * 3.5 + node.pulseAlpha * 8;
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${totalAlpha * 0.45})`);
        glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${totalAlpha})`;
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [canvasRef]);
}

/* ============================================================
   Login Component
   ============================================================ */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Ping backend on mount
  React.useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  // Neural network canvas
  useNeuralCanvas(canvasRef);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server at http://localhost:8000. Please ensure the Python backend is running.');
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Neural Network Canvas ── */}
      <canvas
        ref={canvasRef}
        style={styles.neuralCanvas}
        aria-hidden="true"
      />

      {/* ── Subtle dark vignette over canvas ── */}
      <div style={styles.vignette} />

      <div style={styles.wrapper}>
        {/* Left panel */}
        <div className="left-panel" style={styles.leftPanel}>
          <div style={styles.brandRow}>
            <span style={styles.brandIcon}>🧠</span>
            <span style={styles.brandName}>CogniVeil</span>
          </div>
          <h1 style={styles.tagline}>Early detection<br/>saves lives.</h1>
          <p style={styles.taglineSub}>
            AI-powered passive + active cognitive monitoring.{' '}
            Catch dementia signals months before clinical symptoms appear.
          </p>
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statNum}>25.5M</span>
              <span style={styles.statLabel}>projected dementia cases in India by 2050</span>
            </div>
            <div style={styles.statDivider}/>
            <div style={styles.statItem}>
              <span style={styles.statNum}>3 min</span>
              <span style={styles.statLabel}>daily check-in is all it takes</span>
            </div>
          </div>
          <div style={styles.levelPills}>
            {['Level 1: Passive Screening', 'Level 2: Deep Assessment', 'Level 3: MRI Deep Learning'].map((l, i) => (
              <div key={i} style={{
                ...styles.levelPill,
                opacity: 1 - i * 0.2,
                borderColor: i === 0 ? '#00d4aa55' : '#ffffff15',
                color: i === 0 ? '#00d4aa' : '#ffffff50',
              }}>
                <span style={{ color: i === 0 ? '#00d4aa' : '#ffffff30' }}>{'→'}</span> {l}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="form-panel" style={styles.formPanel}>
          <p style={styles.formLabel}>SIGN IN</p>
          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSub}>Continue monitoring your cognitive health</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.passWrapper}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: '3rem' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>Signing in...</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '400', opacity: 0.7 }}>
                    Server waking up — please wait ~30s ☕
                  </span>
                </span>
              ) : (
                <span>Sign In →</span>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}/>
            <span style={styles.dividerText}>demo accounts</span>
            <div style={styles.dividerLine}/>
          </div>

          <div style={styles.demoAccounts}>
            {[
              { label: 'Low Risk', email: 'arjun@demo.com', color: '#00d4aa' },
              { label: 'Moderate', email: 'meena@demo.com', color: '#f59e0b' },
              { label: 'High Risk', email: 'rajan@demo.com', color: '#ef4444' },
            ].map((d, i) => (
              <button
                key={i}
                style={{ ...styles.demoBtn, borderColor: d.color + '44', color: d.color }}
                onClick={() => { setEmail(d.email); setPassword('demo1234'); }}
              >
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{d.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>{d.email}</span>
              </button>
            ))}
          </div>

          <p style={styles.registerText}>
            New user?{' '}
            <Link to="/register" style={styles.registerLink}>Create account</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes neuralPulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1; }
        }
        input:focus {
          outline: none !important;
          border-color: #00d4aa55 !important;
          box-shadow: 0 0 0 3px rgba(0,212,170,0.1) !important;
        }
        @media (max-width: 640px) {
          .left-panel  { display: none !important; }
          .form-panel  { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080c14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  neuralCanvas: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  vignette: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(ellipse at center, transparent 30%, rgba(8,12,20,0.72) 100%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    minHeight: '600px',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #ffffff10',
    position: 'relative',
    zIndex: 2,
    animation: 'fadeUp 0.6s ease',
    flexWrap: 'wrap',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  leftPanel: {
    flex: 1,
    minWidth: '280px',
    backgroundColor: 'rgba(13,17,23,0.82)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    borderRight: '1px solid #ffffff08',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandIcon: { fontSize: '1.8rem' },
  brandName: {
    color: '#00d4aa',
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  tagline: {
    color: 'white',
    fontSize: '2.2rem',
    fontWeight: '800',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    marginTop: '0.5rem',
  },
  taglineSub: {
    color: '#ffffff50',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff05',
    borderRadius: '12px',
    border: '1px solid #ffffff08',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statNum: {
    color: '#00d4aa',
    fontSize: '1.4rem',
    fontWeight: '800',
  },
  statLabel: {
    color: '#ffffff40',
    fontSize: '0.75rem',
    lineHeight: 1.4,
    maxWidth: '120px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#ffffff10',
  },
  levelPills: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: 'auto',
  },
  levelPill: {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  formPanel: {
    width: '380px',
    backgroundColor: 'rgba(8,12,20,0.88)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '280px',
    flex: 1,
  },
  formLabel: {
    color: '#ffffff25',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.15em',
  },
  formTitle: {
    color: 'white',
    fontSize: '1.6rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    marginBottom: '0',
  },
  formSub: {
    color: '#ffffff35',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    color: '#ffffff50',
    fontSize: '0.78rem',
    fontWeight: '500',
    letterSpacing: '0.03em',
  },
  input: {
    backgroundColor: 'rgba(13,17,23,0.9)',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: 'white',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  passWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0',
  },
  errorBox: {
    backgroundColor: '#ef444415',
    border: '1px solid #ef444430',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    color: '#ef4444',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitBtn: {
    backgroundColor: '#00d4aa',
    color: '#080c14',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.25rem',
    letterSpacing: '0.02em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ffffff10',
  },
  dividerText: {
    color: '#ffffff25',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  demoAccounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  demoBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    transition: 'background 0.2s',
    textAlign: 'left',
  },
  registerText: {
    color: '#ffffff30',
    fontSize: '0.82rem',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  registerLink: {
    color: '#00d4aa',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;