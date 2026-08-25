import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/* ── Constants ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Home',         id: 'home' },
  { label: 'Product',      id: 'product' },
  { label: 'Case Studies', id: 'case-studies' },
  { label: 'Contact',      id: 'contact' },
];

const STATS = [
  { icon: '<', target: 120,   suffix: 'ms', decimals: 0, label: 'Inference Time',     dur: 1500, startDelay: 480  },
  { icon: '%', target: 99.99, suffix: '%',  decimals: 2, label: 'Platform Uptime',    dur: 1580, startDelay: 570  },
  { icon: '*', target: 24,    suffix: '/7', decimals: 0, label: 'Autonomous Runtime', dur: 1660, startDelay: 660  },
  { icon: '#', target: 2.4,   suffix: 'M',  decimals: 1, label: 'Context Windows',    dur: 1740, startDelay: 750  },
];

const LEVELS = [
  { num: '01', title: 'Passive Screening',   color: '#00d4aa', icon: 'fa-chart-line',
    desc: 'Continuous background monitoring through behavioural patterns, typing rhythm, and daily app interactions. Zero active effort required from the user.' },
  { num: '02', title: 'Deep Assessment',     color: '#a78bfa', icon: 'fa-brain',
    desc: 'Daily 3-minute cognitive tests measuring memory, attention span, and language processing with clinically validated assessment tools.' },
  { num: '03', title: 'MRI Deep Learning',   color: '#f59e0b', icon: 'fa-microscope',
    desc: 'Upload brain MRI scans and have our ResNet-based model identify hippocampal atrophy markers — an early biomarker for Alzheimer\'s.' },
];

const IMPACT = [
  { num: '25.5M', label: 'Projected dementia cases in India by 2050' },
  { num: '5–10',  label: 'Years earlier detection is now possible with AI screening' },
  { num: '90%',   label: 'Of dementia cases go undetected until late stages' },
  { num: '3 min', label: 'Daily check-in is all it takes to monitor cognition' },
];

const TEAM = [
  { name: 'Mohammed Sham Saleem', initials: 'MS', gradient: 'linear-gradient(135deg,#00d4aa,#0089b3)', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
  { name: 'Riya Mehta',           initials: 'RM', gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
  { name: 'Siddharth Khathuria',  initials: 'SK', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
  { name: 'Vandhana Marichamy',   initials: 'VM', gradient: 'linear-gradient(135deg,#ec4899,#a78bfa)', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
  { name: 'Subhalakshmi',         initials: 'SL', gradient: 'linear-gradient(135deg,#34d399,#059669)', linkedin: 'https://linkedin.com/', github: 'https://github.com/' },
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ── StatCounter ────────────────────────────────────────────── */
function StatCounter({ item, startCounting }) {
  const [display, setDisplay] = useState(`${(0).toFixed(item.decimals)}${item.suffix}`);
  useEffect(() => {
    if (!startCounting) return;
    let frameId;
    const timeout = setTimeout(() => {
      let t0 = null;
      const step = (now) => {
        if (!t0) t0 = now;
        const p = Math.min((now - t0) / item.dur, 1);
        setDisplay(`${(easeOutCubic(p) * item.target).toFixed(item.decimals)}${item.suffix}`);
        if (p < 1) frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
    }, item.startDelay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frameId); };
  }, [startCounting, item]);
  return <span className="lstat-val">{display}</span>;
}

/* ── StatsRow ───────────────────────────────────────────────── */
function StatsRow() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <div className="lstats-row" ref={ref}>
      {STATS.map((s) => (
        <div className="lstat-item" key={s.label}>
          <span className="lstat-icon">{s.icon}</span>
          <StatCounter item={s} startCounting={visible} />
          <span className="lstat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Landing ────────────────────────────────────────────────── */
const Landing = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Allow vertical scroll; block horizontal scroll while on landing page */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflowY = 'auto';
    html.style.overflowX = 'hidden';
    html.style.height    = 'auto';
    body.style.overflowY = 'auto';
    body.style.overflowX = 'hidden';
    body.style.height    = 'auto';
    return () => {
      html.style.overflowY = '';
      html.style.overflowX = '';
      html.style.height    = '';
      body.style.overflowY = '';
      body.style.overflowX = '';
      body.style.height    = '';
    };
  }, []);

  /* Navbar shrink on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Active section tracking */
  useEffect(() => {
    const sections = NAV_ITEMS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const ob = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveSection(visible[visible.length - 1].target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => ob.observe(s));
    return () => ob.disconnect();
  }, []);

  /* Close menu on Escape / resize */
  useEffect(() => {
    const onKey    = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onResize = () => { if (window.innerWidth > 720) setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="landing-page">

      {/* ══ Fixed video BG ══ */}
      <div className="lbg">
        <video className="lbg-video" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* ══ Fixed header ══ */}
      <header className={`lheader${scrolled ? ' lheader--scrolled' : ''}`}>

        {/* Logo — CV monogram */}
        <button className="llogo-btn" aria-label="CogniVeil home" onClick={() => scrollTo('home')}>
          <span className="llogo-text">CV</span>
        </button>

        {/* Desktop nav */}
        <nav className="lnav-pill" aria-label="Page sections">
          {NAV_ITEMS.map(({ label, id }) => (
            <button
              key={id}
              className={`lnav-link${activeSection === id ? ' active' : ''}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop Sign In */}
        <button className="lbtn-signin" onClick={() => navigate('/login')}>Sign in</button>

        {/* Mobile burger */}
        <button
          className="lburger-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((p) => !p)}
        >
          <span className="lbar" />
          <span className="lbar" />
          <span className="lbar" />
        </button>
      </header>

      {/* ══ Sections ══ */}
      <main className="lmain">

        {/* ── HOME ─────────────────────────────────────── */}
        <section id="home" className="lsection lsection-home">
          <div className="lhero">

            {/* Headline */}
            <h1 className="lheadline">
              <span className="line">CogniVeil</span>
              <span className="line">Catch dementia before</span>
              <span className="line">it catches you.</span>
            </h1>

            {/* Subhead */}
            <p className="lsubhead lanim" style={{ '--d': '0.28s' }}>
              CogniVeil uses passive AI monitoring and daily cognitive tests to detect
              early dementia signals — months before clinical symptoms appear.
              No clinic. No cost. Just 3 minutes a day.
            </p>

            {/* CTA */}
            <div className="lcta-wrap lanim" style={{ '--d': '0.4s' }}>
              <button className="lcta-btn" onClick={() => navigate('/register')}>Get Started Free →</button>
            </div>
          </div>

          {/* Stats */}
          <StatsRow />
        </section>

        {/* ── PRODUCT ──────────────────────────────────── */}
        <section id="product" className="lsection lsection-product">
          <div className="lsec-inner">
            <div className="lsec-badge">Product</div>
            <h2 className="lsec-title">Three levels of cognitive protection</h2>
            <p className="lsec-sub">
              CogniVeil is a modular, clinically-informed platform. Each level builds on the last —
              from invisible passive screening to deep-learning MRI analysis.
            </p>

            <div className="llevels-grid">
              {LEVELS.map((lv) => (
                <div className="llevel-card" key={lv.num} style={{ '--accent': lv.color }}>
                  <div className="llevel-num" style={{ color: lv.color }}>{lv.num}</div>
                  <div className="llevel-icon">
                    <i className={`fa-solid ${lv.icon}`} style={{ color: lv.color }} />
                  </div>
                  <h3 className="llevel-title">{lv.title}</h3>
                  <p className="llevel-desc">{lv.desc}</p>
                  <div className="llevel-glow" style={{ background: lv.color }} />
                </div>
              ))}
            </div>

            <div className="lfeature-pills">
              {['Voice Journal Analysis', 'Real-time Risk Score', 'Care Circle Alerts', 'HIPAA Compliant', 'Offline-capable'].map((f) => (
                <span key={f} className="lfeature-pill">{f}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CASE STUDIES ──────────────────────────────── */}
        <section id="case-studies" className="lsection lsection-cases">
          <div className="lsec-inner">
            <div className="lsec-badge">Why It Matters</div>
            <h2 className="lsec-title">The silent epidemic</h2>
            <p className="lsec-sub">
              Dementia is the fastest growing health crisis of our generation.
              Early detection is the single most effective intervention we have — and AI makes it accessible to everyone.
            </p>

            <div className="limpact-grid">
              {IMPACT.map((s) => (
                <div className="limpact-card" key={s.label}>
                  <div className="limpact-num">{s.num}</div>
                  <div className="limpact-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="lcase-quote">
              <blockquote>
                "A 5-year delay in Alzheimer's onset would reduce the prevalence of the disease
                by 57% — equivalent to eliminating all cases in a country the size of France."
              </blockquote>
              <cite>— The Lancet, 2020</cite>
            </div>

            <div className="lcase-timeline">
              {[
                { stage: 'Preclinical', time: '10–20 yrs before symptoms', note: 'CogniVeil detects here', highlight: true },
                { stage: 'Mild Cognitive Impairment', time: '2–5 yrs before symptoms', note: 'Intervention still effective' },
                { stage: 'Mild Dementia', time: 'Symptoms begin', note: 'Clinical detection usually here' },
                { stage: 'Late Stage', time: 'Advanced progression', note: 'Limited treatment options' },
              ].map((t, i) => (
                <div className={`ltimeline-step${t.highlight ? ' highlight' : ''}`} key={i}>
                  <div className="lstep-dot" />
                  <div>
                    <div className="lstep-stage">{t.stage}</div>
                    <div className="lstep-time">{t.time}</div>
                    {t.note && <div className="lstep-note">{t.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────── */}
        <section id="contact" className="lsection lsection-contact">
          <div className="lsec-inner">
            <div className="lsec-badge">The Team</div>
            <h2 className="lsec-title">Built by students, for humanity</h2>
            <p className="lsec-sub">
              We are a multidisciplinary team from the intersection of AI, medicine, and software engineering —
              united by the belief that early dementia detection should be accessible to everyone.
            </p>

            <div className="lteam-grid">
              {TEAM.map((member) => (
                <div className="lteam-card" key={member.name}>
                  <div className="lavatar-circle" style={{ background: member.gradient }}>
                    {member.initials}
                  </div>
                  <div className="lmember-name">{member.name}</div>
                  <div className="lmember-links">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="lmember-link" aria-label={`${member.name} LinkedIn`}>
                      <i className="fa-brands fa-linkedin" />
                    </a>
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="lmember-link" aria-label={`${member.name} GitHub`}>
                      <i className="fa-brands fa-github" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="lcontact-footer">
              <p>Have questions? Reach us at</p>
              <a href="mailto:team@cogniveil.ai" className="lcontact-email">team@cogniveil.ai</a>
              <div className="lcontact-cta">
                <button className="lcta-btn" onClick={() => navigate('/register')}>Start for free →</button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ══ Mobile menu overlay ══ */}
      {menuOpen && (
        <div
          className="lmobile-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
        >
          <div className="lmobile-menu">
            <nav className="lmobile-nav">
              {NAV_ITEMS.map(({ label, id }) => (
                <button
                  key={id}
                  className={`lmobile-link${activeSection === id ? ' active' : ''}`}
                  onClick={() => scrollTo(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <button className="lmobile-signin" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
              Sign in
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;