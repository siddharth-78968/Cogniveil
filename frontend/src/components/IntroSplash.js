import React, { useState, useEffect, useCallback } from 'react';
import './IntroSplash.css';

const TOTAL_DURATION_SEC = 5.5;

const MILESTONES = [
  { id: 1, label: 'PASSIVE TELEMETRY' },
  { id: 2, label: 'ACOUSTIC BIOMARKERS' },
  { id: 3, label: '10-AGENT CLINICAL CORE' }
];

const IntroSplash = ({ isOpen, onClose, onComplete }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
      if (onComplete) onComplete();
    }, 550);
  }, [onClose, onComplete]);

  useEffect(() => {
    if (!isOpen) return;

    setIsClosing(false);
    setElapsed(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const current = (now - startTime) / 1000;
      setElapsed(current);

      if (current >= TOTAL_DURATION_SEC) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  const isReady = elapsed >= 3.6;
  const currentStep = elapsed < 1.4 ? 1 : elapsed < 2.8 ? 2 : 3;

  return (
    <div className={`intro-splash-screen ${isClosing ? 'closing' : ''}`}>
      {/* Top HUD Header */}
      <div className="intro-hud-header">
        <div className="intro-hud-left-title">
          <span>COGNIVEIL / CLINICAL SYSTEM</span>
        </div>

        <div className={`intro-hud-right-status ${isReady ? 'ready' : ''}`}>
          <span className="intro-status-pulse-dot" />
          <span>{isReady ? 'SYSTEM READY' : 'INITIALIZING'}</span>
        </div>
      </div>

      {/* Centerpiece Mechanical Assembly & Brand Typography */}
      <div className="intro-center-stage">
        {/* Animated Mechanical Linkage Arms & Sensor Apparatus */}
        <div className="intro-mechanism-box">
          <svg className="intro-mechanism-svg" viewBox="0 0 640 140" fill="none">
            {/* 1. Docking Expanding Shockwave Pulse */}
            <circle
              className="docking-shockwave"
              cx="320"
              cy="70"
              r="24"
              stroke="rgba(34, 211, 238, 0.6)"
              fill="none"
            />

            {/* 2. Left Mechanical Sliding Probe Arm */}
            <g className="mech-arm-left">
              {/* Outer Connecting Rods */}
              <line x1="20" y1="70" x2="200" y2="70" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="3" />
              <line x1="30" y1="62" x2="190" y2="62" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1.5" />
              <line x1="30" y1="78" x2="190" y2="78" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1.5" />

              {/* Energy stream pulse along the rod */}
              <line
                className="pulse-stream-left"
                x1="50"
                y1="70"
                x2="195"
                y2="70"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Left Joint Bearing Ring */}
              <circle cx="50" cy="70" r="14" fill="var(--cv-ink, #0a0f16)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2.5" />
              <circle cx="50" cy="70" r="5" fill="rgba(148, 163, 184, 0.5)" />

              {/* Left Rotating Sensor Gear Hub */}
              <g transform="translate(220, 70)">
                <circle cx="0" cy="0" r="28" fill="var(--cv-ink, #0a0f16)" stroke="rgba(34, 211, 238, 0.7)" strokeWidth="2" />
                <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Rotating Notches Group */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <line
                      key={`l-${deg}`}
                      x1="0"
                      y1="-28"
                      x2="0"
                      y2="-23"
                      stroke="rgba(34, 211, 238, 0.85)"
                      strokeWidth="2.5"
                      transform={`rotate(${deg})`}
                    />
                  ))}
                </g>
                <circle cx="0" cy="0" r="6" fill="#22d3ee" />
              </g>

              {/* Coupling Link to Center */}
              <line x1="248" y1="70" x2="278" y2="70" stroke="rgba(34, 211, 238, 0.55)" strokeWidth="2.5" />
            </g>

            {/* 3. Right Mechanical Sliding Probe Arm */}
            <g className="mech-arm-right">
              {/* Outer Connecting Rods */}
              <line x1="620" y1="70" x2="440" y2="70" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="3" />
              <line x1="610" y1="62" x2="450" y2="62" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1.5" />
              <line x1="610" y1="78" x2="450" y2="78" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1.5" />

              {/* Energy stream pulse along the rod */}
              <line
                className="pulse-stream-right"
                x1="590"
                y1="70"
                x2="445"
                y2="70"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Right Joint Bearing Ring */}
              <circle cx="590" cy="70" r="14" fill="var(--cv-ink, #0a0f16)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="2.5" />
              <circle cx="590" cy="70" r="5" fill="rgba(148, 163, 184, 0.5)" />

              {/* Right Rotating Sensor Gear Hub */}
              <g transform="translate(420, 70)">
                <circle cx="0" cy="0" r="28" fill="var(--cv-ink, #0a0f16)" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="2" />
                <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Rotating Notches Group (Counter-Clockwise) */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="-360"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <line
                      key={`r-${deg}`}
                      x1="0"
                      y1="-28"
                      x2="0"
                      y2="-23"
                      stroke="rgba(16, 185, 129, 0.85)"
                      strokeWidth="2.5"
                      transform={`rotate(${deg})`}
                    />
                  ))}
                </g>
                <circle cx="0" cy="0" r="6" fill="#10b981" />
              </g>

              {/* Coupling Link to Center */}
              <line x1="392" y1="70" x2="362" y2="70" stroke="rgba(16, 185, 129, 0.55)" strokeWidth="2.5" />
            </g>

            {/* 4. Central Diagnostic Focus Reticle [ ] */}
            <g className="intro-central-reticle">
              {/* Corner Brackets */}
              <path d="M 283 52 L 283 45 L 290 45" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 357 52 L 357 45 L 350 45" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 283 88 L 283 95 L 290 95" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 357 88 L 357 95 L 350 95" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />

              {/* Inner Focus Frame */}
              <rect x="288" y="47" width="64" height="46" rx="6" fill="rgba(34, 211, 238, 0.05)" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1.5" />

              {/* Dynamic Equalizer / Acoustic Signal Bars */}
              <g>
                <rect className="eq-bar eq-bar-1" x="303" y="62" width="3.5" height="16" rx="1.75" fill="#22d3ee" />
                <rect className="eq-bar eq-bar-2" x="311" y="55" width="3.5" height="30" rx="1.75" fill="#10b981" />
                <rect className="eq-bar eq-bar-3" x="319" y="49" width="3.5" height="42" rx="1.75" fill="#22d3ee" />
                <rect className="eq-bar eq-bar-4" x="327" y="56" width="3.5" height="28" rx="1.75" fill="#10b981" />
                <rect className="eq-bar eq-bar-5" x="335" y="63" width="3.5" height="14" rx="1.75" fill="#22d3ee" />
              </g>
            </g>
          </svg>
        </div>

        {/* Dynamic Brand Typography */}
        <div className="intro-brand-container">
          <div className="intro-kicker-title">
            Longitudinal Diagnostic Intelligence
          </div>

          <h1 className="intro-main-brand">
            <span>COGNI</span>
            <span className="intro-brand-highlight">VEIL</span>
          </h1>

          <div className="intro-sub-statement">
            Early detection. Grounded provenance. Defensible screening.
          </div>
        </div>
      </div>

      {/* Bottom HUD Footer */}
      <div className="intro-hud-footer">
        {/* Stepped Milestones */}
        <div className="intro-stepped-milestones">
          {MILESTONES.map((m) => {
            const isCompleted = isReady || currentStep > m.id;
            const isActive = !isReady && currentStep === m.id;
            return (
              <div
                key={m.id}
                className={`milestone-item ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}
              >
                <span className="milestone-bullet">{isCompleted ? '●' : '○'}</span>
                <span>{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* Minimalist Skip Button */}
        <button
          className="intro-skip-btn"
          onClick={handleClose}
          title="Skip intro and enter platform"
        >
          <span>Skip Intro</span>
          <span className="arrow">&rarr;</span>
        </button>
      </div>
    </div>
  );
};

export default IntroSplash;
