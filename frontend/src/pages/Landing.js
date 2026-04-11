import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
  style={styles.page}
  data-scroll={scrolled} // ✅ invisible usage (no UI impact)
>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />
      <div style={styles.bgGrid} />

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <span style={styles.heroBadgeDot} />
          Smart Horizon 2026 — HealthTech Track
        </div>

        <h1 style={styles.heroTitle}>
          Catch dementia<br />
          <span style={styles.heroHighlight}>before it catches you.</span>
        </h1>

        <p style={styles.heroSub}>
          CogniVeil uses passive AI monitoring and daily cognitive tests to detect
          early dementia signals — months before clinical symptoms appear.
          No clinic. No cost. Just 3 minutes a day.
        </p>

        <div style={styles.heroActions}>
          <button style={styles.primaryBtn} onClick={() => navigate('/register')}>
            Get Started Free →
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>

        <div style={styles.heroStats}>
          {[
            { num: '25.5M', label: 'projected dementia cases in India by 2050' },
            { num: '3 min', label: 'daily check-in is all it takes' },
            { num: '3-tier', label: 'screening to clinical referral pipeline' },
          ].map((s, i) => (
            <div key={i} style={styles.heroStat}>
              <span style={styles.heroStatNum}>{s.num}</span>
              <span style={styles.heroStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={styles.section}>
        <p style={styles.sectionLabel}>HOW IT WORKS</p>
        <h2 style={styles.sectionTitle}>Three levels of protection</h2>
        <p style={styles.sectionSub}>From passive screening to clinical referral — all in one platform.</p>

        <div style={styles.levelsGrid}>
          {[
            {
              level: 'Level 1',
              title: 'AI Screening',
              color: '#00d4aa',
              icon: '🧠',
              points: [
                'Passive monitoring of typing & scroll patterns',
                'Daily cognitive + memory tests',
                'Speech biomarker analysis via voice journal',
                'CogniScore calculated from all signals',
              ],
              tag: 'Always running',
            },
            {
              level: 'Level 2',
              title: 'Targeted Assessment',
              color: '#f59e0b',
              icon: '🔬',
              points: [
                'Triggered when CogniScore drops below 60',
                'Deeper memory and language evaluation',
                'Extended reaction time testing',
                'Detailed risk profiling',
              ],
              tag: 'Suggested when needed',
            },
            {
              level: 'Level 3',
              title: 'MRI Deep Learning',
              color: '#ef4444',
              icon: '🧠',
              points: [
              'Upload MRI brain scan for CNN analysis',
              'EfficientNet classifies: Non Demented, Very Mild, Mild, Moderate',
              'Final fusion: 0.2×L1 + 0.3×L2 + 0.5×L3',
              'Overall dementia risk output across all 3 levels',
                ],
              tag: 'High-risk validation only',
        },
          ].map((l, i) => (
            <div key={i} style={{
              ...styles.levelCard,
              borderColor: l.color + '33',
              boxShadow: `0 0 40px ${l.color}0a`,
            }}>
              <div style={styles.levelTop}>
                <span style={{ ...styles.levelBadge, backgroundColor: l.color + '20', color: l.color, border: `1px solid ${l.color}33` }}>
                  {l.level}
                </span>
                <span style={styles.levelIcon}>{l.icon}</span>
              </div>
              <h3 style={{ ...styles.levelTitle, color: l.color }}>{l.title}</h3>
              <ul style={styles.levelList}>
                {l.points.map((p, j) => (
                  <li key={j} style={styles.levelPoint}>
                    <span style={{ color: l.color, marginRight: '6px' }}>→</span>{p}
                  </li>
                ))}
              </ul>
              <div style={{ ...styles.levelTag, color: l.color + 'aa', borderColor: l.color + '22' }}>
                {l.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <p style={styles.sectionLabel}>WHAT MAKES US DIFFERENT</p>
        <h2 style={styles.sectionTitle}>Built for real people, not labs</h2>

        <div style={styles.featuresGrid}>
          {[
            { icon: '👁️', title: 'Passive monitoring', desc: 'Tracks typing rhythm, scroll hesitation and navigation patterns silently — zero effort from the user.', color: '#00d4aa' },
            { icon: '🧪', title: 'Active cognitive tests', desc: 'Pattern recall, digit span, and word recall tests — clinically grounded, gamified for daily use.', color: '#a78bfa' },
            { icon: '🎙️', title: 'Speech biomarker scan', desc: 'Voice journal analysed for pause frequency, fluency, and vocabulary richness — known dementia indicators.', color: '#f59e0b' },
            { icon: '📊', title: 'CogniScore', desc: 'A single fused risk score combining active tests (60%) and passive signals (40%). Final score fuses all 3 levels for maximum accuracy.', color: '#ef4444' },
            { icon: '🧠', title: 'MRI Deep Learning', desc: 'EfficientNet CNN classifies brain scans into Non Demented, Very Mild, Mild, and Moderate Dementia for high-risk validation.', color: '#a78bfa' },
            { icon: '💰', title: 'Truly low cost', desc: 'Free for end users. ₹800/month to deploy for thousands of patients. Compare to ₹8,000+ per MRI scan.', color: '#a78bfa' },
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: f.color + '15', border: `1px solid ${f.color}22` }}>
                <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
              </div>
              <h3 style={{ ...styles.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo profiles */}
      <section style={styles.section}>
        <p style={styles.sectionLabel}>LIVE DEMO</p>
        <h2 style={styles.sectionTitle}>See real patient journeys</h2>
        <p style={styles.sectionSub}>Login with any demo account to see CogniVeil in action.</p>

        <div style={styles.demoGrid}>
          {[
            { name: 'Arjun Sharma', age: 68, email: 'arjun@demo.com', score: 85, risk: 'Low', color: '#00d4aa', trend: '↑ Stable' },
            { name: 'Meena Krishnan', age: 72, email: 'meena@demo.com', score: 58, risk: 'Moderate', color: '#f59e0b', trend: '↓ Declining' },
            { name: 'Rajan Pillai', age: 78, email: 'rajan@demo.com', score: 31, risk: 'High', color: '#ef4444', trend: '↓ Critical' },
          ].map((p, i) => (
            <div key={i} style={{
              ...styles.demoCard,
              borderColor: p.color + '33',
            }}>
              <div style={styles.demoAvatar}>
                <span style={{ ...styles.demoAvatarText, color: p.color }}>{p.name[0]}</span>
              </div>
              <div style={styles.demoInfo}>
                <p style={styles.demoName}>{p.name}</p>
                <p style={styles.demoAge}>Age {p.age}</p>
              </div>
              <div style={styles.demoRight}>
                <span style={{ ...styles.demoScore, color: p.color }}>{p.score}</span>
                <span style={{ ...styles.demoRisk, color: p.color + 'aa' }}>{p.risk} Risk</span>
                <span style={{ ...styles.demoTrend, color: p.color + '88' }}>{p.trend}</span>
              </div>
              <button
                style={{ ...styles.demoBtn, borderColor: p.color + '44', color: p.color }}
                onClick={() => navigate('/login')}
              >
                View →
              </button>
            </div>
          ))}
        </div>
        <p style={styles.demoHint}>Password for all demo accounts: <span style={{ color: '#00d4aa', fontFamily: 'monospace' }}>demo1234</span></p>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Start monitoring today.</h2>
        <p style={styles.ctaSub}>Free. No clinic. No credit card. Just 3 minutes a day.</p>
        <button style={styles.ctaBtn} onClick={() => navigate('/register')}>
          Create Free Account →
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={styles.footerLogo}>🧠 CogniVeil</span>
        <span style={styles.footerText}>Built for Smart Horizon 2026 · HealthTech · NHCE Bengaluru</span>
        <span style={styles.footerDisclaimer}>Screening tool only — not a clinical diagnostic device</span>
      </footer>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#080c14',
    fontFamily: "'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'fixed', width: '700px', height: '700px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
    top: '-200px', left: '-200px', pointerEvents: 'none', animation: 'glow 8s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
    bottom: '-150px', right: '-150px', pointerEvents: 'none', animation: 'glow 10s ease-in-out infinite reverse',
  },
  bgGlow3: {
    position: 'fixed', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none', animation: 'glow 12s ease-in-out infinite',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px', pointerEvents: 'none',
  },
  hero: {
    maxWidth: '860px', margin: '0 auto',
    padding: '6rem 2rem 4rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', gap: '1.5rem',
    animation: 'fadeUp 0.7s ease',
    position: 'relative', zIndex: 1,
  },
  heroBadge: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: '#00d4aa15', border: '1px solid #00d4aa33',
    borderRadius: '20px', padding: '0.4rem 1rem',
    color: '#00d4aa', fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.05em',
  },
  heroBadgeDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    backgroundColor: '#00d4aa', display: 'inline-block',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  heroTitle: {
    color: 'white', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.03em',
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #00d4aa, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    color: '#ffffff50', fontSize: '1.05rem', lineHeight: 1.7,
    maxWidth: '620px',
  },
  heroActions: { display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  primaryBtn: {
    backgroundColor: '#00d4aa', color: '#080c14',
    border: 'none', borderRadius: '12px',
    padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '0.02em',
    boxShadow: '0 0 30px rgba(0,212,170,0.3)',
  },
  secondaryBtn: {
    backgroundColor: 'transparent', color: '#ffffff60',
    border: '1px solid #ffffff15', borderRadius: '12px',
    padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: '600',
    cursor: 'pointer',
  },
  heroStats: {
    display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center',
    borderTop: '1px solid #ffffff08', paddingTop: '2rem', marginTop: '0.5rem',
  },
  heroStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  heroStatNum: { color: '#00d4aa', fontSize: '1.6rem', fontWeight: '800' },
  heroStatLabel: { color: '#ffffff30', fontSize: '0.75rem', maxWidth: '140px', textAlign: 'center', lineHeight: 1.4 },
  section: {
    maxWidth: '1100px', margin: '0 auto',
    padding: '5rem 2rem',
    position: 'relative', zIndex: 1,
    animation: 'fadeUp 0.7s ease',
  },
  sectionLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.75rem' },
  sectionTitle: { color: 'white', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem' },
  sectionSub: { color: '#ffffff40', fontSize: '0.95rem', marginBottom: '3rem', maxWidth: '500px' },
  levelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' },
  levelCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  levelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  levelBadge: { padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' },
  levelIcon: { fontSize: '1.5rem' },
  levelTitle: { fontSize: '1.2rem', fontWeight: '800' },
  levelList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  levelPoint: { color: '#ffffff50', fontSize: '0.85rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start' },
  levelTag: {
    fontSize: '0.75rem', fontWeight: '600',
    border: '1px solid', borderRadius: '8px',
    padding: '0.4rem 0.8rem', marginTop: 'auto', alignSelf: 'flex-start',
  },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  featureCard: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '16px', padding: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
  },
  featureIconBox: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: '1rem', fontWeight: '700' },
  featureDesc: { color: '#ffffff35', fontSize: '0.85rem', lineHeight: 1.6 },
  demoGrid: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '700px' },
  demoCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '14px', padding: '1.25rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  demoAvatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    backgroundColor: '#ffffff08', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  demoAvatarText: { fontSize: '1.2rem', fontWeight: '800' },
  demoInfo: { flex: 1 },
  demoName: { color: 'white', fontSize: '0.95rem', fontWeight: '600', marginBottom: '2px' },
  demoAge: { color: '#ffffff35', fontSize: '0.78rem' },
  demoRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  demoScore: { fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 },
  demoRisk: { fontSize: '0.75rem', fontWeight: '600' },
  demoTrend: { fontSize: '0.72rem' },
  demoBtn: {
    backgroundColor: 'transparent', border: '1px solid',
    borderRadius: '8px', padding: '0.4rem 0.9rem',
    fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
    flexShrink: 0,
  },
  demoHint: { color: '#ffffff25', fontSize: '0.82rem', marginTop: '1rem' },
  cta: {
    textAlign: 'center', padding: '5rem 2rem',
    position: 'relative', zIndex: 1,
  },
  ctaTitle: { color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem' },
  ctaSub: { color: '#ffffff40', fontSize: '1rem', marginBottom: '2rem' },
  ctaBtn: {
    backgroundColor: '#00d4aa', color: '#080c14',
    border: 'none', borderRadius: '14px',
    padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: '700',
    cursor: 'pointer', boxShadow: '0 0 40px rgba(0,212,170,0.3)',
    letterSpacing: '0.02em',
  },
  footer: {
    borderTop: '1px solid #ffffff08', padding: '2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    position: 'relative', zIndex: 1,
  },
  footerLogo: { color: '#00d4aa', fontSize: '1rem', fontWeight: '800' },
  footerText: { color: '#ffffff25', fontSize: '0.8rem' },
  footerDisclaimer: { color: '#ffffff15', fontSize: '0.72rem' },
};

export default Landing;