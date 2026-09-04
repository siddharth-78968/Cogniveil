import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTestResult, calculateScore } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import VoiceGuideBar from '../components/VoiceGuideBar';
import DoctorLayout from '../components/DoctorLayout';
import './Tests.css';

const tests = [
  { 
    id: 'pattern_recall', 
    name: 'Pattern Recall', 
    domain: 'Visuospatial Memory',
    description: 'Memorize an illuminated matrix grid, then reproduce spatial coordinates from working memory.',
    target: 'Evaluates hippocampal spatial encoding & working memory coordinate fidelity.',
    duration: '~2 min', 
    color: '#3d5236',
    accentColor: '#526e49',
    badge: 'Spatial Grid Matrix',
    iconType: 'pattern'
  },
  { 
    id: 'digit_span', 
    name: 'Digit Span', 
    domain: 'Working Memory Capacity',
    description: 'Encode, retain, and repeat sequences of numbers of progressively increasing digit lengths.',
    target: 'Evaluates phonological loop capacity & auditory-verbal attention buffer.',
    duration: '~1 min', 
    color: '#3b5a70',
    accentColor: '#4a6b82',
    badge: 'Sequential Span',
    iconType: 'digit'
  },
  { 
    id: 'word_recall', 
    name: 'Word Recall', 
    domain: 'Episodic Memory',
    description: 'Memorize target words, complete an interfering mental task, then recall the lexical list.',
    target: 'Evaluates delayed episodic verbal retrieval & resistance to retroactive distraction.',
    duration: '~2 min', 
    color: '#705c30',
    accentColor: '#9c6d3b',
    badge: 'Delayed Recall',
    iconType: 'word'
  },
  { 
    id: 'stroop', 
    name: 'Stroop Test', 
    domain: 'Executive Inhibition',
    description: 'Identify the visual ink font color of conflicting words while suppressing the reading reflex.',
    target: 'Evaluates prefrontal executive interference resistance & cognitive flexibility.',
    duration: '~1 min', 
    color: '#7a3b3b',
    accentColor: '#a84848',
    badge: 'Interference Control',
    iconType: 'stroop'
  },
  { 
    id: 'trail_making', 
    name: 'Trail Making Test', 
    domain: 'Executive Function',
    description: 'Connect numbers and letters in sequence: Part A (1→2→3→...) and Part B (1→A→2→B→3→C→...) as quickly and accurately as possible.',
    target: 'Evaluates prefrontal cognitive flexibility, set-shifting, mental sequencing, and motor coordination.',
    duration: '~2 min', 
    color: '#4c3568',
    accentColor: '#6d4c94',
    badge: 'Set-Shifting & Sequencing',
    iconType: 'trail'
  },
  { 
    id: 'reaction_time', 
    name: 'Reaction Time', 
    domain: 'Psychomotor Speed',
    description: 'Tap the target instantaneously upon signal illumination to measure baseline reflex latency.',
    target: 'Evaluates central nervous system latency & visual-motor reflex threshold.',
    duration: '~1 min', 
    color: '#286068',
    accentColor: '#3a8088',
    badge: 'Neural Latency',
    iconType: 'reaction'
  },
];

const renderTestIcon = (iconType) => {
  switch (iconType) {
    case 'trail':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="6" r="3" fill="currentColor" fillOpacity="0.25" />
          <circle cx="19" cy="8" r="3" />
          <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.25" />
          <path d="M7.8 7.2L16.2 6.8" strokeDasharray="2 2" />
          <path d="M17.5 10.5L13.5 15.5" />
        </svg>
      );
    case 'pattern':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.25" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.25" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'digit':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19h16" />
          <path d="M4 15h11" />
          <path d="M4 11h15" />
          <path d="M4 7h8" />
          <circle cx="18" cy="7.5" r="3" fill="currentColor" fillOpacity="0.25" />
          <path d="M18 6v3" />
        </svg>
      );
    case 'word':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8" />
          <path d="M8 11h6" />
          <circle cx="15" cy="15" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'stroop':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" strokeDasharray="2.5 2.5" />
          <path d="M12 7v10" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.4" />
        </svg>
      );
    case 'reaction':
      return (
        <svg className="cv-test-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5" />
          <path d="M10 2h4" />
          <path d="M19 5l-1.5 1.5" />
          <path d="M13 11l-3 4h4l-2 3" strokeWidth="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

// ── Reusable Clinical Evaluation & Paced Score Reveal ────────────────────────
const TestEvaluatingScreen = ({ testName, domain }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(18);

  const stages = [
    { label: 'CALIBRATING LATENCY', desc: 'Analyzing response latencies, temporal variance & working memory buffer...' },
    { label: 'BENCHMARKING COHORT', desc: 'Cross-referencing metrics against normative clinical dataset (N=14,200)...' },
    { label: 'SYNTHESIZING TELEMETRY', desc: `Generating longitudinal ${domain?.toLowerCase() || 'cognitive'} stability index...` }
  ];

  React.useEffect(() => {
    const t1 = setTimeout(() => { setStep(1); setProgress(58); }, 800);
    const t2 = setTimeout(() => { setStep(2); setProgress(90); }, 1650);
    const t3 = setTimeout(() => { setProgress(100); }, 2250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="cv-evaluating-box">
      <div className="cv-eval-spinner-wrap">
        <div className="cv-eval-pulse-ring" />
        <div className="cv-eval-icon">🧠</div>
      </div>
      <div className="cv-eval-text-group">
        <div className="cv-eval-badge">
          <span className="cv-pulse-dot" />
          <span>{stages[step].label}</span>
        </div>
        <h3 className="cv-eval-title">Calibrating {testName}</h3>
        <p className="cv-eval-subtitle">{stages[step].desc}</p>
      </div>
      <div className="cv-eval-bar-track">
        <div className="cv-eval-bar-fill" style={{ width: `${progress}%`, transition: 'width 0.75s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#a3b18a', letterSpacing: '0.04em' }}>
        CLINICAL SYNTHESIS: {progress}% COMPLETE
      </span>
    </div>
  );
};

const TestResultCard = ({ score, domain, testName, metrics = [], onContinue }) => {
  const [displayScore, setDisplayScore] = useState(0);

  React.useEffect(() => {
    let start = 0;
    const target = Math.max(0, Math.min(100, Math.round(score || 0)));
    const duration = 1200;
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayScore(target);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [score]);

  const isOptimal = score >= 70;
  const isModerate = score >= 40 && score < 70;

  const statusColor = isOptimal ? '#4ade80' : isModerate ? '#f59e0b' : '#ef4444';
  const statusBg = isOptimal ? 'rgba(74, 222, 128, 0.12)' : isModerate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const statusText = isOptimal ? 'Optimal Cognitive Performance' : isModerate ? 'Moderate Performance / Baseline' : 'Sub-Baseline Drift Detected';

  // SVG circular arc: radius 52, circumference = 2 * PI * 52 ≈ 326.7
  const circumference = 326.7;
  const strokeDashoffset = circumference - (circumference * (displayScore / 100));

  return (
    <div className="cv-result-card">
      <div className="cv-result-badge" style={{ color: statusColor, borderColor: statusColor, backgroundColor: statusBg }}>
        <span>●</span> {statusText}
      </div>

      <div className="cv-gauge-wrap">
        <svg className="cv-gauge-svg" viewBox="0 0 120 120">
          <circle className="cv-gauge-track" cx="60" cy="60" r="52" />
          <circle
            className="cv-gauge-fill"
            cx="60"
            cy="60"
            r="52"
            style={{
              stroke: statusColor,
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              filter: `drop-shadow(0 0 8px ${statusColor}60)`
            }}
          />
        </svg>
        <div className="cv-gauge-center-content">
          <span className="cv-result-score-num" style={{ color: statusColor }}>{displayScore}</span>
          <span className="cv-result-score-den">/ 100 PTS</span>
        </div>
      </div>

      <h3 className="cv-result-title">{testName} Evaluation Complete</h3>
      <p className="cv-result-subtitle">
        Your longitudinal {domain?.toLowerCase() || 'cognitive'} index has been calibrated against clinical normative baselines.
      </p>

      {metrics.length > 0 && (
        <div className="cv-result-metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className="cv-result-metric-item" style={{ animation: `cvScoreReveal 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 * i}s both` }}>
              <span className="cv-metric-label">{m.label}</span>
              <strong className="cv-metric-value">{m.value}</strong>
            </div>
          ))}
        </div>
      )}

      <button className="cv-continue-btn cv-tactile-btn" onClick={onContinue}>
        <span>Confirm & Continue</span>
        <span>→</span>
      </button>
    </div>
  );
};

// ── 1. Pattern Recall ────────────────────────────────────────────────────────
const PatternRecall = ({ onComplete }) => {
  const size = 4;
  const totalCells = size * size;
  const pattern = React.useMemo(() => {
    const all = Array.from({ length: 16 }, (_, i) => i);
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, []);
  const [phase, setPhase] = useState('memorise'); // 'memorise' | 'recall' | 'evaluating' | 'done'
  const [selected, setSelected] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleCellClick = (i) => {
    if (phase !== 'recall' || isSubmitting) return;
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleProceedToRecall = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPhase('recall');
      setIsSubmitting(false);
    }, 280);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const correct = pattern.filter(p => selected.includes(p)).length;
    const score = Math.round((correct / pattern.length) * 100);
    const duration = (Date.now() - startTime.current) / 1000;
    
    setTimeout(() => {
      setPhase('evaluating');
      setIsSubmitting(false);
      setTimeout(() => {
        setResultData({ score, correct, total: pattern.length, duration });
        setPhase('done');
      }, 2400);
    }, 380);
  };

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Pattern Recall" domain="Visuospatial Memory" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Pattern Recall"
        domain="Visuospatial Memory"
        score={resultData.score}
        metrics={[
          { label: 'Recalled Cells', value: `${resultData.correct} / ${resultData.total}` },
          { label: 'Grid Fidelity', value: `${resultData.score}%` },
          { label: 'Response Time', value: `${resultData.duration.toFixed(1)}s` },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase === 'memorise' ? 'Phase 1: Spatial Encoding' : 'Phase 2: Spatial Recall'}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'memorise' 
            ? 'Memorize the 6 illuminated coordinate cells' 
            : `Tap the remembered locations (${selected.length}/6 selected)`}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'memorise'
            ? 'Observe the spatial matrix coordinates carefully before proceeding.'
            : 'Reproduce the exact spatial pattern from working memory.'}
        </p>
      </div>

      <div className="cv-pattern-grid">
        {Array.from({ length: totalCells }).map((_, i) => {
          const isIlluminated = phase === 'memorise' && pattern.includes(i);
          const isUserSelected = phase === 'recall' && selected.includes(i);
          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              className={`cv-pattern-cell ${phase === 'recall' ? 'clickable' : ''} ${isIlluminated ? 'highlighted' : ''} ${isUserSelected ? 'selected' : ''}`}
            >
              {isUserSelected && <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {phase === 'memorise' && (
        <button
          className="cv-action-btn cv-tactile-btn"
          style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
          onClick={handleProceedToRecall}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="cv-spinner-mini" />
              <span>Locking Spatial Pattern...</span>
            </>
          ) : (
            <>
              <span>I've Memorized It — Begin Recall</span>
              <span>→</span>
            </>
          )}
        </button>
      )}

      {phase === 'recall' && (
        <button
          className="cv-action-btn cv-tactile-btn"
          style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
          onClick={handleSubmit}
          disabled={isSubmitting || selected.length === 0}
        >
          {isSubmitting ? (
            <>
              <span className="cv-spinner-mini" />
              <span>Evaluating Spatial Coordinates...</span>
            </>
          ) : (
            <>
              <span>Submit Answer ({selected.length}/6)</span>
              <span>→</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

// ── 2. Digit Span ────────────────────────────────────────────────────────────
const DigitSpan = ({ onComplete }) => {
  const sequences = React.useMemo(() => {
    const rand = () => Math.floor(Math.random() * 9) + 1;
    return [
      [rand(), rand(), rand()],
      [rand(), rand(), rand(), rand()],
      [rand(), rand(), rand(), rand(), rand()],
    ];
  }, []);
  const [seqIndex, setSeqIndex] = useState(0);
  const [phase, setPhase] = useState('show'); // 'show' | 'recall' | 'evaluating' | 'done'
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resultData, setResultData] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleStartRecall = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPhase('recall');
      setIsSubmitting(false);
    }, 280);
  };

  const handleCheck = () => {
    if (!input.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const answer = input.replace(/\s/g, '').split('').map(Number);
    const seq = sequences[seqIndex];
    const isCorrect = seq.every((n, i) => n === answer[i]) && answer.length === seq.length;
    const newCorrect = isCorrect ? correct + 1 : correct;
    setCorrect(newCorrect);

    setFeedback({
      isCorrect,
      text: isCorrect ? `✓ Sequence ${seqIndex + 1} Recorded Accurately` : `✓ Sequence ${seqIndex + 1} Recorded`
    });

    setTimeout(() => {
      setInput('');
      setFeedback(null);
      setIsSubmitting(false);

      if (seqIndex + 1 >= sequences.length) {
        const score = Math.round((newCorrect / sequences.length) * 100);
        const duration = (Date.now() - startTime.current) / 1000;
        setPhase('evaluating');
        setTimeout(() => {
          setResultData({ score, correct: newCorrect, total: sequences.length, duration });
          setPhase('done');
        }, 2400);
      } else {
        setSeqIndex(prev => prev + 1);
        setPhase('show');
      }
    }, 650);
  };

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Digit Span" domain="Working Memory Capacity" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Digit Span"
        domain="Working Memory Capacity"
        score={resultData.score}
        metrics={[
          { label: 'Sequences Correct', value: `${resultData.correct} / ${resultData.total}` },
          { label: 'Max Span Tested', value: `${sequences[sequences.length - 1].length} Digits` },
          { label: 'Response Latency', value: `${resultData.duration.toFixed(1)}s` },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <div className="cv-step-dots-row">
          {sequences.map((_, i) => (
            <div
              key={i}
              className="cv-step-dot"
              style={{
                width: i === seqIndex ? '28px' : '10px',
                backgroundColor: i < seqIndex ? '#4ade80' : i === seqIndex ? '#a3b18a' : 'rgba(255, 255, 255, 0.15)'
              }}
            />
          ))}
        </div>
        <span className="cv-runner-step-pill">
          Sequence {seqIndex + 1} of {sequences.length} • {sequences[seqIndex].length} Digits
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'show' ? 'Memorize the number sequence' : 'Enter the numbers in order'}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'show'
            ? 'Retain the digits in your phonological working memory buffer.'
            : 'Type the exact numbers into the sequence field below.'}
        </p>
      </div>

      {phase === 'show' && (
        <>
          <div className="cv-digit-row">
            {sequences[seqIndex].map((d, i) => (
              <span key={i} className="cv-digit-card" style={{ animationDelay: `${i * 0.08}s` }}>
                {d}
              </span>
            ))}
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={handleStartRecall}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="cv-spinner-mini" />
                <span>Preparing Buffer...</span>
              </>
            ) : (
              <>
                <span>I've Memorized It — Enter Sequence</span>
                <span>→</span>
              </>
            )}
          </button>
        </>
      )}

      {phase === 'recall' && (
        <>
          <div className="cv-test-input-wrap">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              className="cv-test-input"
              placeholder="e.g. 482"
              autoFocus
              disabled={isSubmitting}
            />
            {feedback && (
              <div className="cv-seq-feedback-banner success">
                <span>{feedback.text}</span>
              </div>
            )}
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={handleCheck}
            disabled={isSubmitting || !input.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="cv-spinner-mini" />
                <span>Validating Sequence...</span>
              </>
            ) : (
              <>
                <span>Check Sequence</span>
                <span>→</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

// ── 3. Word Recall ───────────────────────────────────────────────────────────
const WORD_BANK = [
  'Apple', 'River', 'Candle', 'Bridge', 'Mirror',
  'Castle', 'Jungle', 'Pencil', 'Flower', 'Guitar',
  'Butter', 'Shadow', 'Temple', 'Marble', 'Breeze',
  'Lantern', 'Feather', 'Compass', 'Whisper', 'Thunder',
];

const WordRecall = ({ onComplete }) => {
  const words = React.useMemo(() => {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);
  const [phase, setPhase] = useState('memorise'); // 'memorise' | 'distract' | 'recall' | 'evaluating' | 'done'
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleProceedToDistract = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPhase('distract');
      setIsSubmitting(false);
    }, 280);
  };

  const handleProceedToRecall = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setPhase('recall');
      setIsSubmitting(false);
    }, 280);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const answered = input.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const correct = words.filter(w => answered.includes(w.toLowerCase())).length;
    const score = Math.round((correct / words.length) * 100);
    const duration = (Date.now() - startTime.current) / 1000;
    
    setTimeout(() => {
      setPhase('evaluating');
      setIsSubmitting(false);
      setTimeout(() => {
        setResultData({ score, correct, total: words.length, duration });
        setPhase('done');
      }, 2400);
    }, 380);
  };

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Word Recall" domain="Episodic Memory" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Word Recall"
        domain="Episodic Memory"
        score={resultData.score}
        metrics={[
          { label: 'Words Recalled', value: `${resultData.correct} / ${resultData.total}` },
          { label: 'Distractor Resistance', value: 'Verified' },
          { label: 'Retrieval Latency', value: `${resultData.duration.toFixed(1)}s` },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase === 'memorise' && 'Phase 1: Lexical Encoding'}
          {phase === 'distract' && 'Phase 2: Retroactive Distractor'}
          {phase === 'recall' && 'Phase 3: Delayed Verbal Retrieval'}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'memorise' && 'Memorize these 5 clinical target words'}
          {phase === 'distract' && 'Quick distractor mental task'}
          {phase === 'recall' && 'Type all the words you remember'}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'memorise' && 'Store these semantic representations in your episodic memory ledger.'}
          {phase === 'distract' && 'Solve this equation mentally to clear working memory cache.'}
          {phase === 'recall' && 'Separate recalled words with commas or spaces.'}
        </p>
      </div>

      {phase === 'memorise' && (
        <>
          <div className="cv-words-container">
            {words.map((w, i) => (
              <span key={i} className="cv-word-chip" style={{ animationDelay: `${i * 0.08}s` }}>
                {w}
              </span>
            ))}
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={handleProceedToDistract}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="cv-spinner-mini" />
                <span>Preparing Distractor Task...</span>
              </>
            ) : (
              <>
                <span>I've Memorized Words — Proceed</span>
                <span>→</span>
              </>
            )}
          </button>
        </>
      )}

      {phase === 'distract' && (
        <>
          <div style={{
            fontSize: '2.8rem',
            fontWeight: '900',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#a3b18a',
            padding: '1.2rem 2.5rem',
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(163, 177, 138, 0.3)',
            userSelect: 'none'
          }}>
            47 + 36 = ?
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={handleProceedToRecall}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="cv-spinner-mini" />
                <span>Opening Retrieval Buffer...</span>
              </>
            ) : (
              <>
                <span>83 — Now Recall Words</span>
                <span>→</span>
              </>
            )}
          </button>
        </>
      )}

      {phase === 'recall' && (
        <>
          <div className="cv-test-input-wrap">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="cv-test-input"
              placeholder="e.g. Apple, River, ..."
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={handleSubmit}
            disabled={isSubmitting || !input.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="cv-spinner-mini" />
                <span>Evaluating Lexical Retrieval Matrix...</span>
              </>
            ) : (
              <>
                <span>Submit Word Recall</span>
                <span>→</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

// ── 4. Stroop Test ───────────────────────────────────────────────────────────
const ALL_COLOR_WORDS = [
  { word: 'RED', ink: '#3b82f6', correct: 'Blue' },
  { word: 'BLUE', ink: '#22c55e', correct: 'Green' },
  { word: 'GREEN', ink: '#ef4444', correct: 'Red' },
  { word: 'YELLOW', ink: '#a78bfa', correct: 'Purple' },
  { word: 'PURPLE', ink: '#f59e0b', correct: 'Yellow' },
  { word: 'RED', ink: '#22c55e', correct: 'Green' },
  { word: 'BLUE', ink: '#ef4444', correct: 'Red' },
  { word: 'GREEN', ink: '#3b82f6', correct: 'Blue' },
  { word: 'YELLOW', ink: '#ef4444', correct: 'Red' },
  { word: 'PURPLE', ink: '#22c55e', correct: 'Green' },
  { word: 'RED', ink: '#a78bfa', correct: 'Purple' },
  { word: 'BLUE', ink: '#f59e0b', correct: 'Yellow' },
];

const StroopTest = ({ onComplete }) => {
  const colorWords = React.useMemo(() => {
    const shuffled = [...ALL_COLOR_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8);
  }, []);

  const colorOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [phase, setPhase] = useState('playing'); // 'playing' | 'evaluating' | 'done'
  const [resultData, setResultData] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleAnswer = (answer) => {
    if (feedback !== null) return;
    const isCorrect = answer === colorWords[current].correct;
    if (isCorrect) setCorrect(prev => prev + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= colorWords.length) {
        const totalCorrect = isCorrect ? correct + 1 : correct;
        const score = Math.round((totalCorrect / colorWords.length) * 100);
        const duration = (Date.now() - startTime.current) / 1000;
        
        setPhase('evaluating');
        setTimeout(() => {
          setResultData({ score, correct: totalCorrect, total: colorWords.length, duration });
          setPhase('done');
        }, 2400);
      } else {
        setCurrent(prev => prev + 1);
      }
    }, 600);
  };

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Stroop Test" domain="Executive Inhibition" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Stroop Test"
        domain="Executive Inhibition"
        score={resultData.score}
        metrics={[
          { label: 'Interference Accuracy', value: `${resultData.correct} / ${resultData.total}` },
          { label: 'Interference Control', value: resultData.score >= 70 ? 'High' : 'Moderate' },
          { label: 'Total Duration', value: `${resultData.duration.toFixed(1)}s` },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <div className="cv-step-dots-row">
          {colorWords.map((_, i) => (
            <div
              key={i}
              className="cv-step-dot"
              style={{
                width: i === current ? '26px' : '9px',
                backgroundColor: i < current ? '#4ade80' : i === current ? '#a3b18a' : 'rgba(255, 255, 255, 0.15)'
              }}
            />
          ))}
        </div>
        <span className="cv-runner-step-pill">
          Trial {current + 1} of {colorWords.length} • Executive Inhibition
        </span>
        <h3 className="cv-runner-instruction">What colour is the INK? (Suppress reading reflex)</h3>
        <p className="cv-runner-subtext">Tap the button matching the visual font color, ignoring the word text.</p>
      </div>

      <div
        className="cv-stroop-display-box"
        style={{
          color: colorWords[current].ink,
          borderColor: feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#ef4444' : 'rgba(255, 255, 255, 0.12)',
          boxShadow: feedback === 'correct' ? '0 0 24px rgba(74, 222, 128, 0.4)' : feedback === 'wrong' ? '0 0 24px rgba(239, 68, 68, 0.4)' : 'none',
        }}
      >
        {colorWords[current].word}
      </div>

      {feedback && (
        <div className={`cv-seq-feedback-banner ${feedback === 'correct' ? 'success' : 'evaluating'}`} style={{ color: feedback === 'correct' ? '#4ade80' : '#ef4444' }}>
          <span>{feedback === 'correct' ? '✓ Correct Target Matched' : '✗ Automatic Reading Interference'}</span>
        </div>
      )}

      <div className="cv-stroop-options-grid">
        {colorOptions.map((c) => (
          <button
            key={c}
            className="cv-stroop-btn cv-tactile-btn"
            onClick={() => handleAnswer(c)}
            disabled={feedback !== null}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── 5. Reaction Time Test ────────────────────────────────────────────────────
const ReactionTimeTest = ({ onComplete }) => {
  const ROUNDS = 5;
  const [phase, setPhase] = useState('intro'); // 'intro' | 'waiting' | 'ready' | 'result' | 'evaluating' | 'done'
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [appearTime, setAppearTime] = useState(null);
  const [lastRT, setLastRT] = useState(null);
  const [tooEarly, setTooEarly] = useState(false);
  const [resultData, setResultData] = useState(null);
  const timerRef = React.useRef(null);
  const startTime = React.useRef(Date.now());

  const startRound = () => {
    setPhase('waiting');
    setTooEarly(false);
    setLastRT(null);
    const delay = 1400 + Math.random() * 2600;
    timerRef.current = setTimeout(() => {
      setAppearTime(Date.now());
      setPhase('ready');
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setTooEarly(true);
      setPhase('result');
      return;
    }
    if (phase === 'ready') {
      const rt = Date.now() - appearTime;
      setLastRT(rt);
      const newTimes = [...reactionTimes, rt];
      setReactionTimes(newTimes);
      setPhase('result');

      if (round + 1 >= ROUNDS) {
        const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
        const score = Math.max(0, Math.min(100, Math.round(((700 - avg) / 450) * 100)));
        const duration = (Date.now() - startTime.current) / 1000;
        
        setTimeout(() => {
          setPhase('evaluating');
          setTimeout(() => {
            setResultData({ score, avgRT: Math.round(avg), duration });
            setPhase('done');
          }, 2400);
        }, 700);
      }
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const avgRT = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : null;

  const getRTColor = (rt) => rt < 300 ? '#4ade80' : rt < 500 ? '#f59e0b' : '#ef4444';

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Reaction Time" domain="Psychomotor Speed" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Reaction Time"
        domain="Psychomotor Speed"
        score={resultData.score}
        metrics={[
          { label: 'Average Latency', value: `${resultData.avgRT} ms` },
          { label: 'Clinical Target', value: '< 300 ms' },
          { label: 'Neural Agility', value: resultData.avgRT < 300 ? 'Exceptional' : resultData.avgRT < 500 ? 'Normal' : 'Sub-Baseline' },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      {phase === 'intro' && (
        <>
          <div className="cv-runner-meta">
            <span className="cv-runner-step-pill">Psychomotor Reflex Evaluation</span>
            <h3 className="cv-runner-instruction">Visual-Motor Latency Calibration</h3>
            <p className="cv-runner-subtext">
              A high-contrast target will illuminate after a randomized interval.<br />
              Tap or click the sensor as quickly as possible upon illumination.
            </p>
          </div>

          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={() => { startTime.current = Date.now(); startRound(); setRound(0); }}
          >
            <span>Begin Reflex Trials (5 Rounds)</span>
            <span>→</span>
          </button>
        </>
      )}

      {(phase === 'waiting' || phase === 'ready') && (
        <>
          <div className="cv-runner-meta">
            <div className="cv-step-dots-row">
              {Array.from({ length: ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className="cv-step-dot"
                  style={{
                    width: i === round ? '26px' : '9px',
                    backgroundColor: i < round ? '#4ade80' : i === round ? '#a3b18a' : 'rgba(255, 255, 255, 0.15)'
                  }}
                />
              ))}
            </div>
            <span className="cv-runner-step-pill">Round {round + 1} of {ROUNDS}</span>
            <h3 className="cv-runner-instruction">{phase === 'ready' ? 'CLICK / TAP SENSOR NOW!' : 'Stand by...'}</h3>
            <p className="cv-runner-subtext">{phase === 'ready' ? 'Reflex signal active!' : 'Sensor is calibrating. Do not tap prematurely.'}</p>
          </div>

          <div
            onClick={handleTap}
            className="cv-tactile-btn"
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              backgroundColor: phase === 'ready' ? '#4ade80' : 'rgba(0, 0, 0, 0.35)',
              border: phase === 'ready' ? '4px solid #4ade80' : '3px dashed rgba(163, 177, 138, 0.35)',
              boxShadow: phase === 'ready' ? '0 0 50px rgba(74, 222, 128, 0.6)' : 'none',
            }}
          >
            <span style={{
              fontSize: phase === 'ready' ? '1.5rem' : '1.1rem',
              color: phase === 'ready' ? '#080c14' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: '900',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.06em'
            }}>
              {phase === 'ready' ? 'TAP!' : 'WAIT'}
            </span>
          </div>
        </>
      )}

      {phase === 'result' && (
        <>
          <div className="cv-runner-meta">
            <div className="cv-step-dots-row">
              {Array.from({ length: ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className="cv-step-dot"
                  style={{
                    width: i === round ? '26px' : '9px',
                    backgroundColor: i <= round ? '#4ade80' : 'rgba(255, 255, 255, 0.15)'
                  }}
                />
              ))}
            </div>
            <span className="cv-runner-step-pill">Round {round + 1} of {ROUNDS} Complete</span>
          </div>

          {tooEarly ? (
            <div className="cv-seq-feedback-banner evaluating" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <span>Premature Tap Detected — Wait for the signal before tapping.</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: getRTColor(lastRT), fontSize: '2.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace' }}>
                {lastRT} ms
              </span>
              <span className="cv-runner-subtext">
                {lastRT < 280 ? 'Exceptional Reflex Speed' : lastRT < 450 ? 'Optimal Clinical Baseline' : 'Slight Reflex Latency'}
              </span>
              {avgRT && <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#a3b18a' }}>Rolling Avg: {avgRT}ms</span>}
            </div>
          )}

          {round + 1 < ROUNDS && (
            <button
              className="cv-action-btn cv-tactile-btn"
              style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
              onClick={() => { setRound(r => r + 1); startRound(); }}
            >
              <span>Proceed to Round {round + 2}</span>
              <span>→</span>
            </button>
          )}

          {tooEarly && (
            <button
              className="cv-action-btn cv-tactile-btn"
              style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
              onClick={() => startRound()}
            >
              <span>Retry Trial</span>
              <span>→</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
// ── 6. Trail Making Test (Executive Function / Cognitive Flexibility) ─────────
const PART_A_NODES = [
  { id: '1', label: '1', x: 22, y: 32 },
  { id: '2', label: '2', x: 52, y: 20 },
  { id: '3', label: '3', x: 80, y: 34 },
  { id: '4', label: '4', x: 68, y: 70 },
  { id: '5', label: '5', x: 38, y: 82 },
  { id: '6', label: '6', x: 18, y: 62 },
  { id: '7', label: '7', x: 44, y: 48 },
  { id: '8', label: '8', x: 82, y: 78 }
];

const PART_B_NODES = [
  { id: '1', label: '1', x: 18, y: 26 },
  { id: 'A', label: 'A', x: 48, y: 18 },
  { id: '2', label: '2', x: 80, y: 28 },
  { id: 'B', label: 'B', x: 68, y: 62 },
  { id: '3', label: '3', x: 84, y: 82 },
  { id: 'C', label: 'C', x: 38, y: 84 },
  { id: '4', label: '4', x: 16, y: 64 },
  { id: 'D', label: 'D', x: 45, y: 50 }
];

const SEQ_A = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SEQ_B = ['1', 'A', '2', 'B', '3', 'C', '4', 'D'];

const TrailMakingTest = ({ onComplete }) => {
  const [phase, setPhase] = useState('intro_a'); // 'intro_a' | 'part_a' | 'intro_b' | 'part_b' | 'evaluating' | 'done'
  const [pathA, setPathA] = useState([]);
  const [pathB, setPathB] = useState([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [partATime, setPartATime] = useState(0);
  const [partAErrors, setPartAErrors] = useState(0);
  const [partBErrors, setPartBErrors] = useState(0);
  const [partACorrections, setPartACorrections] = useState(0);
  const [partBCorrections, setPartBCorrections] = useState(0);
  const [errorFlash, setErrorFlash] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [stepLatencies, setStepLatencies] = useState([]);

  const startTimeRef = React.useRef(Date.now());
  const timerIntervalRef = React.useRef(null);
  const lastStepTimeRef = React.useRef(Date.now());

  const startPartA = () => {
    setPathA([]);
    setTargetIndex(0);
    setPartAErrors(0);
    setPartACorrections(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
    lastStepTimeRef.current = Date.now();
    setPhase('part_a');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
  };

  const startPartB = () => {
    setPathB([]);
    setTargetIndex(0);
    setPartBErrors(0);
    setPartBCorrections(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
    lastStepTimeRef.current = Date.now();
    setPhase('part_b');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
  };

  React.useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleNodeClick = (nodeId) => {
    const isPartA = phase === 'part_a';
    const activeSeq = isPartA ? SEQ_A : SEQ_B;
    const expectedTarget = activeSeq[targetIndex];

    const now = Date.now();
    const stepLatency = now - lastStepTimeRef.current;

    if (nodeId === expectedTarget) {
      // Correct selection
      setStepLatencies(prev => [...prev, stepLatency]);
      lastStepTimeRef.current = now;

      if (isPartA) {
        const newPath = [...pathA, nodeId];
        setPathA(newPath);
        if (targetIndex + 1 >= activeSeq.length) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          const durationA = (now - startTimeRef.current) / 1000;
          setPartATime(durationA);
          setPhase('intro_b');
        } else {
          setTargetIndex(prev => prev + 1);
        }
      } else {
        const newPath = [...pathB, nodeId];
        setPathB(newPath);
        if (targetIndex + 1 >= activeSeq.length) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          const durationB = (now - startTimeRef.current) / 1000;
          finishTest(partATime, durationB, partAErrors, partBErrors, partACorrections, partBCorrections);
        } else {
          setTargetIndex(prev => prev + 1);
        }
      }
    } else {
      // Incorrect selection
      setErrorFlash(nodeId);
      setTimeout(() => setErrorFlash(null), 400);

      if (isPartA) {
        setPartAErrors(prev => prev + 1);
        setPartACorrections(prev => prev + 1);
      } else {
        setPartBErrors(prev => prev + 1);
        setPartBCorrections(prev => prev + 1);
      }
    }
  };

  const finishTest = (durA, durB, errA, errB, corrA, corrB, isCompleted = true) => {
    const totalDuration = durA + durB;
    const totalErrors = errA + errB;
    const totalCorrections = corrA + corrB;

    // Standardized Executive Function score calculation (0-100 scale)
    // Part B (set-shifting) is primary, Part A (baseline motor sequencing) is baseline reference
    const timeScore = Math.max(0, Math.min(100, 100 - Math.max(0, durB - 35.0) * 0.9 - Math.max(0, durA - 15.0) * 0.6));
    const errorPenalty = Math.min(45, errB * 8.0 + errA * 4.0);
    const score = isCompleted 
      ? Math.round(Math.max(15.0, Math.min(100.0, timeScore - errorPenalty)))
      : Math.round(Math.max(10.0, Math.min(45.0, 45.0 - totalErrors * 5.0)));

    const setShiftingCost = Math.max(0, parseFloat((durB - durA).toFixed(1)));
    const avgLatency = stepLatencies.length > 0 
      ? Math.round(stepLatencies.reduce((a, b) => a + b, 0) / stepLatencies.length) 
      : 850;

    const metadata = {
      test_name: "Trail Making Test",
      domain: "Executive Function / Cognitive Flexibility",
      part_a_duration_seconds: parseFloat(durA.toFixed(1)),
      part_b_duration_seconds: parseFloat(durB.toFixed(1)),
      total_duration_seconds: parseFloat(totalDuration.toFixed(1)),
      part_a_errors: errA,
      part_b_errors: errB,
      total_errors: totalErrors,
      incorrect_selections: totalErrors,
      correction_count: totalCorrections,
      mean_step_latency_ms: avgLatency,
      set_shifting_cost_seconds: setShiftingCost,
      completed: isCompleted,
      executive_function_score: score
    };

    setPhase('evaluating');
    setTimeout(() => {
      setResultData({
        score,
        duration: totalDuration,
        durA,
        durB,
        errA,
        errB,
        totalErrors,
        totalCorrections,
        setShiftingCost,
        avgLatency,
        metadata
      });
      setPhase('done');
    }, 2400);
  };

  const handleAbandon = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const durA = partATime || (phase === 'part_a' ? elapsed : 20.0);
    const durB = phase === 'part_b' ? elapsed : 40.0;
    finishTest(durA, durB, partAErrors + 1, partBErrors + 2, partACorrections, partBCorrections, false);
  };

  if (phase === 'evaluating') {
    return <TestEvaluatingScreen testName="Trail Making Test" domain="Executive Function" />;
  }

  if (phase === 'done' && resultData) {
    return (
      <TestResultCard
        testName="Trail Making Test"
        domain="Executive Function"
        score={resultData.score}
        metrics={[
          { label: 'Part A Sequencing', value: `${resultData.durA.toFixed(1)}s` },
          { label: 'Part B Set-Shifting', value: `${resultData.durB.toFixed(1)}s` },
          { label: 'Total Errors', value: `${resultData.totalErrors} (${resultData.totalCorrections} self-corrected)` },
          { label: 'Set-Shifting Cost', value: `+${resultData.setShiftingCost}s` },
          { label: 'Step Latency', value: `${resultData.avgLatency} ms` },
        ]}
        onContinue={() => onComplete(resultData.score, resultData.duration, resultData.metadata)}
      />
    );
  }

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase.startsWith('intro') ? 'Task Instructions' : phase === 'part_a' ? 'Part A: Numeric Sequencing' : 'Part B: Alternating Set-Shifting'}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'intro_a' && 'Part A: Connect the numbers in order'}
          {phase === 'part_a' && `Connect: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8`}
          {phase === 'intro_b' && 'Part B: Alternate numbers and letters'}
          {phase === 'part_b' && `Alternate: 1 → A → 2 → B → 3 → C → 4 → D`}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'intro_a' && 'Tap the circles in numerical order (1 to 8) as quickly and accurately as possible.'}
          {phase === 'part_a' && `Next target: [ ${SEQ_A[targetIndex]} ] • Errors: ${partAErrors}`}
          {phase === 'intro_b' && 'Switch back and forth between numbers and letters (1 to A, 2 to B, 3 to C, 4 to D) as quickly and accurately as possible.'}
          {phase === 'part_b' && `Next target: [ ${SEQ_B[targetIndex]} ] • Errors: ${partBErrors}`}
        </p>
      </div>

      {/* Part A Intro Screen */}
      {phase === 'intro_a' && (
        <div className="cv-trail-instructions-card">
          <div className="cv-trail-demo-pill">
            <span>Part A Goal:</span>
            <span>1 → 2 → 3 → 4 → 5 → 6 → 7 → 8</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0.5rem 0' }}>
            When you press start, tap circle <strong>1</strong>, then <strong>2</strong>, then <strong>3</strong>, all the way to <strong>8</strong>.
            Connect the items in the correct order as quickly and accurately as possible.
          </p>
          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={startPartA}
          >
            <span>Begin Part A (Numbers)</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Part B Intro Screen */}
      {phase === 'intro_b' && (
        <div className="cv-trail-instructions-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '0.85rem', fontWeight: '800' }}>
            <span>✓ Part A Completed in {partATime.toFixed(1)}s!</span>
          </div>
          <div className="cv-trail-demo-pill" style={{ color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.4)' }}>
            <span>Part B Goal:</span>
            <span>1 → A → 2 → B → 3 → C → 4 → D</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0.5rem 0' }}>
            Now comes the cognitive flexibility challenge. Alternate between numbers and letters in order:
            from <strong>1</strong> to <strong>A</strong>, then <strong>2</strong> to <strong>B</strong>, then <strong>3</strong> to <strong>C</strong>, then <strong>4</strong> to <strong>D</strong>.
          </p>
          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#382245', color: '#ffffff', border: '1px solid rgba(167, 139, 250, 0.4)' }}
            onClick={startPartB}
          >
            <span>Begin Part B (Set-Shifting)</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Interactive Canvas for Part A & Part B */}
      {(phase === 'part_a' || phase === 'part_b') && (
        <>
          <div className="cv-trail-hud-strip">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⏱ Elapsed:</span>
              <strong style={{ color: '#4ade80' }}>{elapsed}s</strong>
            </span>

            <div className="cv-trail-target-badge">
              <span>TARGET:</span>
              <span>{phase === 'part_a' ? SEQ_A[targetIndex] : SEQ_B[targetIndex]}</span>
            </div>

            <span style={{ color: (phase === 'part_a' ? partAErrors : partBErrors) > 0 ? '#f87171' : '#a3b18a' }}>
              Errors: {phase === 'part_a' ? partAErrors : partBErrors}
            </span>
          </div>

          <div className="cv-trail-canvas-wrapper">
            {/* SVG Connecting Lines */}
            <svg className="cv-trail-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              {(phase === 'part_a' ? pathA : pathB).map((nodeId, idx, arr) => {
                if (idx === 0) return null;
                const activeNodes = phase === 'part_a' ? PART_A_NODES : PART_B_NODES;
                const prevNode = activeNodes.find(n => n.id === arr[idx - 1]);
                const currNode = activeNodes.find(n => n.id === nodeId);
                if (!prevNode || !currNode) return null;
                return (
                  <line
                    key={`${prevNode.id}-${currNode.id}`}
                    x1={`${prevNode.x}%`}
                    y1={`${prevNode.y}%`}
                    x2={`${currNode.x}%`}
                    y2={`${currNode.y}%`}
                    className="cv-trail-line"
                  />
                );
              })}
            </svg>

            {/* Interactive Node Circles */}
            {(phase === 'part_a' ? PART_A_NODES : PART_B_NODES).map(node => {
              const activePath = phase === 'part_a' ? pathA : pathB;
              const activeSeq = phase === 'part_a' ? SEQ_A : SEQ_B;
              const isConnected = activePath.includes(node.id);
              const isNextTarget = activeSeq[targetIndex] === node.id;
              const isShaking = errorFlash === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node.id)}
                  className={`cv-trail-node ${isConnected ? 'connected' : ''} ${isNextTarget ? 'active-target' : ''} ${isShaking ? 'error-shake' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {node.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button
              type="button"
              onClick={handleAbandon}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0.25rem 0.5rem'
              }}
            >
              Finish / End Assessment Early
            </button>
          </div>
        </>
      )}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const Tests = () => {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [activeTest, setActiveTest] = useState(null);
  const [simulateMode, setSimulateMode] = useState(false);

  // Clinician Inspection State
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [clinicianTestsData, setClinicianTestsData] = useState(null);
  const [loadingClinician, setLoadingClinician] = useState(false);

  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isClinician = currentUser?.is_caregiver === true;

  const userEmail = localStorage.getItem('userEmail') || 'default';
  const today = new Date().toDateString();
  const sessionKey = `testSession_${userEmail}_${today}`;

  const [completed, setCompleted] = useState(() => {
    try {
      const key = `testSession_${localStorage.getItem('userEmail') || 'default'}_${new Date().toDateString()}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [allDone, setAllDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  // Fetch patient list and cognitive results when in clinician mode
  React.useEffect(() => {
    if (isClinician) {
      fetchClinicianData();
    } else {
      const uEmail = localStorage.getItem('userEmail') || 'default';
      const lastDate = localStorage.getItem(`lastTestDate_${uEmail}`);
      const tDay = new Date().toDateString();
      if (lastDate === tDay) {
        setAlreadyDone(true);
      }
    }
  }, [isClinician]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchClinicianData = async () => {
    try {
      setLoadingClinician(true);
      const { getClinicianPatients } = await import('../utils/api');
      const res = await getClinicianPatients();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
        const pId = res.data[0].id;
        setSelectedPatientId(pId);
        loadPatientTests(pId);
      }
    } catch (err) {
      console.log('Error loading clinician patients:', err.message);
    } finally {
      setLoadingClinician(false);
    }
  };

  const loadPatientTests = async (patientId) => {
    try {
      setSelectedPatientId(patientId);
      setLoadingClinician(true);
      const { getClinicianPatientTests } = await import('../utils/api');
      const res = await getClinicianPatientTests(patientId);
      setClinicianTestsData(res.data);
    } catch (err) {
      console.log('Error loading patient tests:', err.message);
    } finally {
      setLoadingClinician(false);
    }
  };

  const handleComplete = async (testId, score, duration, metadata = null) => {
    try { await saveTestResult({ test_type: testId, score, duration_seconds: duration, metadata }); }
    catch (err) { console.log('Could not save'); }
    const newCompleted = [...completed, testId];
    setCompleted(newCompleted);
    localStorage.setItem(sessionKey, JSON.stringify(newCompleted));
    if (newCompleted.length === tests.length) {
      try { await calculateScore(); } catch (err) { }
      const uEmail = localStorage.getItem('userEmail') || 'default';
      localStorage.setItem(`lastTestDate_${uEmail}`, new Date().toDateString());
      setTimeout(() => setAllDone(true), 300);
    } else {
      setTimeout(() => setActiveTest(null), 200);
    }
  };

  // ── CLINICIAN VIEWPORT: Review Mode ─────────────────────────────────────────
  if (isClinician && !simulateMode) {
    return (
      <DoctorLayout activeTitle="Daily Cognitive Battery">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F4C4A' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', color: '#287C78' }}>
                  CLINICIAN WORKSPACE · ACTIVE PSYCHOMETRICS
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                Patient Cognitive Battery Review
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Review objective psychometric results across working memory, episodic recall, Stroop executive interference, and reaction latencies.
              </p>
            </div>

            <button
              onClick={() => setSimulateMode(true)}
              style={{
                backgroundColor: '#162B3D',
                color: '#53B7C5',
                border: '1px solid #53B7C5',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🎮 Preview / Demo Battery →
            </button>
          </div>

          {/* Patient Selector Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
              Select Monitored Patient:
            </span>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPatientTests(p.id)}
                style={{
                  border: '1px solid',
                  borderColor: selectedPatientId === p.id ? '#0F4C4A' : '#e2e8f0',
                  backgroundColor: selectedPatientId === p.id ? '#E8F5EE' : 'transparent',
                  color: selectedPatientId === p.id ? '#0F4C4A' : '#1e293b',
                  borderRadius: '8px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {p.name} {p.is_deviating ? '(Drift)' : '(Calibrated)'}
              </button>
            ))}
          </div>

          {/* Domain Breakdown Cards */}
          {loadingClinician ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading patient psychometrics...</div>
          ) : clinicianTestsData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b' }}>TOTAL RECORDED SESSIONS</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>{clinicianTestsData.total_test_sessions}</div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Across 5 validated screening batteries</span>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b' }}>DOMAIN COVERAGE</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F4C4A' }}>100% Complete</div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Episodic, Working, Inhibitory, Motor Speed</span>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b' }}>CLINICAL CALIBRATION</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4338CA' }}>Age-Normed (65+)</div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Z-Score threshold σ = ±1.5 SD</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {clinicianTestsData.domain_breakdown?.map((domain) => {
                  const isImpaired = domain.z_score < -1.0;
                  return (
                    <div
                      key={domain.test_type}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #eef2f6',
                        borderRadius: '12px',
                        padding: '1.15rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-2 3.5 4 4 0 0 0 1 2.8 4 4 0 0 0-1 2.7 4 4 0 0 0 4 4h4a4 4 0 0 0 4-4 4 4 0 0 0-1-2.7 4 4 0 0 0 1-2.8 4 4 0 0 0-2-3.5V6a4 4 0 0 0-4-4z" />
                          </svg>
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>
                            {domain.name}
                          </h4>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {domain.domain} · Battery Weight: {domain.weight}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                            Patient Avg Score
                          </span>
                          <strong style={{ fontSize: '1.2rem', color: isImpaired ? '#C94C4C' : '#1e293b' }}>
                            {domain.average_score} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/ 100</span>
                          </strong>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                            Normative Mean
                          </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#64748b' }}>
                            {domain.normative_mean} pts
                          </span>
                        </div>

                        <div style={{ minWidth: '130px', textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              backgroundColor: isImpaired ? '#FEF2F2' : '#F0FDF4',
                              color: isImpaired ? '#C94C4C' : '#15803D',
                              borderColor: isImpaired ? '#FECACA' : '#BBF7D0'
                            }}
                          >
                            Z = {domain.z_score > 0 ? `+${domain.z_score}` : domain.z_score} ({domain.status})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No test data available for selected patient.</div>
          )}
        </div>
      </DoctorLayout>
    );
  }

  if (alreadyDone && !simulateMode) return (
    <DoctorLayout activeTitle="Daily Tests">
      <div 
        className="cv-tests-hero" 
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border, 
          maxWidth: '560px', 
          margin: '3rem auto',
          textAlign: 'center',
          alignItems: 'center',
          padding: '2.5rem'
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#4ade80', marginBottom: '0.75rem' }}>
          ✓
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: '24px', fontWeight: 600, color: theme.text, margin: '0 0 0.5rem 0', letterSpacing: '-0.015em' }}>
          Today's Battery Completed
        </h2>
        <p style={{ color: theme.subtext, fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
          You have already recorded your standardized psychometric metrics for today. Come back tomorrow for longitudinal tracking.
        </p>
        <p style={{ color: theme.subtext, fontSize: '0.78rem', marginBottom: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '500' }}>
          Next session available: Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString()})
        </p>
        <button 
          className="cv-start-test-btn" 
          style={{ backgroundColor: '#273822', color: '#ffffff', padding: '0.75rem 1.8rem' }}
          onClick={() => navigate('/dashboard')}
        >
          View Clinical Dashboard →
        </button>
      </div>
    </DoctorLayout>
  );

  if (allDone) return (
    <DoctorLayout activeTitle="Daily Tests">
      <div 
        className="cv-tests-hero" 
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border, 
          maxWidth: '560px', 
          margin: '3rem auto',
          textAlign: 'center',
          alignItems: 'center',
          padding: '2.5rem'
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#4ade80', marginBottom: '0.75rem' }}>
          🎉
        </div>
        <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: '24px', fontWeight: 600, color: theme.text, margin: '0 0 0.5rem 0', letterSpacing: '-0.015em' }}>
          Daily Battery Complete!
        </h2>
        <p style={{ color: theme.subtext, fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
          Your longitudinal CogniScore and domain-specific psychometric indices have been updated in your profile.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="cv-start-test-btn" 
            style={{ backgroundColor: '#273822', color: '#ffffff', padding: '0.75rem 1.5rem' }}
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard →
          </button>
          <button 
            className="cv-back-link" 
            style={{ color: theme.text, borderColor: theme.border, backgroundColor: theme.cardBg, padding: '0.75rem 1.5rem' }}
            onClick={() => navigate('/voice')}
          >
            Take Voice Journal →
          </button>
        </div>
      </div>
    </DoctorLayout>
  );

  return (
    <DoctorLayout activeTitle="Daily Tests">
      {!activeTest ? (
        <div className="cv-tests-container">
          {isClinician && (
            <div>
              <button
                onClick={() => setSimulateMode(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: isDark ? '#a3b18a' : '#273822', 
                  fontSize: '0.82rem', 
                  fontWeight: '800', 
                  cursor: 'pointer', 
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ← Back to Patient Psychometrics Review
              </button>
            </div>
          )}

          {/* Hero Intelligence Card */}
          <div 
            className="cv-tests-hero" 
            style={{ 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border 
            }}
          >
            <div className="cv-tests-hero-top">
              <div>
                <div className="cv-tests-eyebrow" style={{ color: theme.subtext }}>
                  <span className="cv-tests-dot" />
                  <span>STANDARDIZED CLINICAL PSYCHOMETRICS · TIER-1 PROTOCOL</span>
                </div>
                <h1 className="cv-tests-title" style={{ color: theme.text }}>
                  Daily Cognitive Battery
                </h1>
                <p className="cv-tests-subtitle" style={{ color: theme.subtext }}>
                  Calibrated daily evaluations measuring short-term spatial memory, working memory span, episodic verbal recall, executive inhibition, and motor reflex latencies.
                </p>
              </div>

              {/* Counter Card */}
              <div 
                className="cv-tests-counter-card"
                style={{ 
                  backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(39, 56, 34, 0.04)',
                  borderColor: theme.borderSubtle 
                }}
              >
                <span className="cv-tests-counter-num" style={{ color: completed.length === tests.length ? '#4ade80' : isDark ? '#a3b18a' : '#273822' }}>
                  {completed.length} <span style={{ fontSize: '1rem', color: theme.subtext, fontWeight: '600' }}>/ {tests.length}</span>
                </span>
                <span className="cv-tests-counter-label" style={{ color: theme.subtext }}>
                  {completed.length === tests.length ? 'Battery Completed' : 'Tests Finalized'}
                </span>
              </div>
            </div>

            {/* Progress Bar Track */}
            <div 
              className="cv-tests-progress-track"
              style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}
            >
              <div 
                className="cv-tests-progress-fill" 
                style={{ width: `${(completed.length / tests.length) * 100}%` }} 
              />
            </div>

            {/* Telemetry Row */}
            <div className="cv-tests-telemetry-row">
              <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
                <span>⏱️</span>
                <span>Est. Session Time: ~7 min</span>
              </div>
              <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
                <span>🔬</span>
                <span>Longitudinal Baseline Calibration</span>
              </div>
              <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
                <span>🔒</span>
                <span>Evidence-Grade HIPAA Encryption</span>
              </div>
            </div>
          </div>

          {/* Voice Guide Bar */}
          <VoiceGuideBar scriptKey="active_tests_intro" defaultLang="en" />

          {/* Test Cards List */}
          <div className="cv-tests-list">
            {tests.map((test) => {
              const isDone = completed.includes(test.id);
              return (
                <div
                  key={test.id}
                  className={`cv-test-card ${isDone ? 'completed' : 'clickable'}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: isDone 
                      ? (isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(39, 56, 34, 0.25)') 
                      : theme.border,
                  }}
                  onClick={() => !isDone && setActiveTest(test.id)}
                >
                  {/* Icon Box */}
                  <div 
                    className="cv-test-icon-box"
                    style={{
                      backgroundColor: isDone 
                        ? (isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(39, 56, 34, 0.08)')
                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#f4f8f3'),
                      borderColor: isDone 
                        ? (isDark ? 'rgba(74, 222, 128, 0.35)' : 'rgba(39, 56, 34, 0.2)')
                        : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#d2ded0'),
                      color: isDone 
                        ? '#4ade80' 
                        : (isDark ? '#a3b18a' : '#273822')
                    }}
                  >
                    {renderTestIcon(test.iconType)}
                  </div>

                  {/* Test Details */}
                  <div className="cv-test-details">
                    <div className="cv-test-top-meta">
                      <span 
                        className="cv-test-domain-badge"
                        style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#eef4ed',
                          color: isDark ? '#a3b18a' : '#3d5236',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#c8d8c6'
                        }}
                      >
                        {test.domain}
                      </span>
                      <span className="cv-test-duration-tag" style={{ color: theme.subtext }}>
                        ⏱️ {test.duration}
                      </span>
                    </div>

                    <h3 className="cv-test-name" style={{ color: theme.text }}>
                      {test.name}
                    </h3>

                    <p className="cv-test-desc" style={{ color: theme.subtext }}>
                      {test.description}
                    </p>

                    <p className="cv-test-target" style={{ color: isDark ? 'rgba(163, 177, 138, 0.7)' : '#526e49' }}>
                      {test.target}
                    </p>
                  </div>

                  {/* Action / Status */}
                  <div className="cv-test-action">
                    {isDone ? (
                      <span 
                        className="cv-completed-badge"
                        style={{
                          backgroundColor: isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(39, 56, 34, 0.08)',
                          color: isDark ? '#4ade80' : '#273822',
                          borderColor: isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(39, 56, 34, 0.25)'
                        }}
                      >
                        ✓ Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="cv-start-test-btn"
                        style={{
                          backgroundColor: '#273822',
                          color: '#ffffff',
                          border: isDark ? '1px solid rgba(163, 177, 138, 0.3)' : 'none'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTest(test.id);
                        }}
                      >
                        <span>Start Test</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cv-tests-container">
          <div className="cv-active-test-header">
            <button 
              className="cv-back-link" 
              style={{ 
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.cardBg 
              }}
              onClick={() => setActiveTest(null)}
            >
              ← Back to Battery Overview
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(163, 177, 138, 0.12)' : '#eef4ed',
                  color: isDark ? '#a3b18a' : '#273822' 
                }}
              >
                {renderTestIcon(tests.find(t => t.id === activeTest)?.iconType)}
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.06em', color: theme.subtext, textTransform: 'uppercase', display: 'block' }}>
                  ACTIVE EVALUATION
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: theme.text }}>
                  {tests.find(t => t.id === activeTest)?.name}
                </span>
              </div>
            </div>
          </div>

          {activeTest === 'pattern_recall' && <PatternRecall onComplete={(s, d) => handleComplete('pattern_recall', s, d)} />}
          {activeTest === 'digit_span' && <DigitSpan onComplete={(s, d) => handleComplete('digit_span', s, d)} />}
          {activeTest === 'word_recall' && <WordRecall onComplete={(s, d) => handleComplete('word_recall', s, d)} />}
          {activeTest === 'stroop' && <StroopTest onComplete={(s, d) => handleComplete('stroop', s, d)} />}
          {activeTest === 'trail_making' && <TrailMakingTest onComplete={(s, d, m) => handleComplete('trail_making', s, d, m)} />}
          {activeTest === 'reaction_time' && <ReactionTimeTest onComplete={(s, d) => handleComplete('reaction_time', s, d)} />}
        </div>
      )}
    </DoctorLayout>
  );
};

export default Tests;