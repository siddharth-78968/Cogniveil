import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  saveTestResult, 
  calculateScore,
  startAssessmentSession,
  getAssessmentSession,
  submitAssessmentTest,
  pauseAssessmentSession,
  resumeAssessmentSession,
  cancelAssessmentSession
} from '../utils/api';
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
    instructions: 'You will see a 4×4 grid with 6 illuminated cells. Memorize their spatial locations. When recall begins, tap all 6 locations from memory before the timer runs out.',
    timeLimit: 30, // seconds for recall phase
    memorizeLimit: 8, // seconds for memorize phase
    duration: '~1.5 min', 
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
    instructions: 'You will see a sequence of numbers. Retain the numbers in your memory, then type them in the exact same order before the timer expires.',
    timeLimit: 20, // seconds per sequence
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
    instructions: 'Memorize 5 clinical target words. Next, you will perform a brief mental calculation to clear working memory cache, followed by delayed retrieval of the words.',
    memorizeLimit: 10,
    distractLimit: 8,
    timeLimit: 35, // seconds for delayed recall
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
    instructions: 'Tap the button matching the VISUAL INK COLOR of the word. Suppress the automatic urge to read the word text.',
    timeLimit: 30, // seconds for 8 trials
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
    instructions: 'Part A: Connect numbers in numerical order (1 to 8). Part B: Alternate between numbers and letters (1 to A, 2 to B, 3 to C, 4 to D) as quickly and accurately as possible.',
    timeLimit: 60, // seconds Part A (Part B is 90)
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
    instructions: 'A high-contrast sensory target will illuminate after a randomized interval. Tap the sensor instantaneously upon illumination across 5 reflex trials.',
    timeLimit: 25,
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

// ── Top Automated HUD Component with Authoritative Timer ─────────────────────
const AutoRunnerHUD = ({ 
  testIndex, 
  totalTests, 
  testName, 
  timeRemaining, 
  isPaused,
  onPause, 
  onExit 
}) => {
  const formatTime = (secs) => {
    if (secs == null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isWarning = timeRemaining != null && timeRemaining <= 10 && timeRemaining > 5;
  const isDanger = timeRemaining != null && timeRemaining <= 5;

  return (
    <div className="cv-auto-runner-hud">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="cv-auto-progress-pills">
          {Array.from({ length: totalTests }).map((_, i) => (
            <div 
              key={i} 
              className={`cv-auto-pill ${i < testIndex ? 'completed' : i === testIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.06em', color: '#a3b18a', textTransform: 'uppercase', display: 'block' }}>
            COGNITIVE SCREENING · {testIndex + 1} OF {totalTests}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff' }}>
            {testName}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {timeRemaining != null && (
          <div className={`cv-auto-timer-badge ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}>
            <span className="cv-auto-timer-label">TIME REMAINING</span>
            <span className="cv-auto-timer-val">{formatTime(timeRemaining)}</span>
          </div>
        )}

        <button 
          onClick={onPause} 
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(163, 177, 138, 0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button 
          onClick={onExit} 
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#f87171',
            padding: '0.45rem 0.85rem',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ✕ Exit
        </button>
      </div>
    </div>
  );
};

// ── Pre-Test Instructions & Animated 3-2-1 Countdown ─────────────────────────
const PreTestInstructionStage = ({ test, onStart }) => {
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1 | 'START'

  const handleBeginCountdown = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 3) {
      const t = setTimeout(() => setCountdown(2), 900);
      return () => clearTimeout(t);
    }
    if (countdown === 2) {
      const t = setTimeout(() => setCountdown(1), 900);
      return () => clearTimeout(t);
    }
    if (countdown === 1) {
      const t = setTimeout(() => setCountdown('START'), 900);
      return () => clearTimeout(t);
    }
    if (countdown === 'START') {
      const t = setTimeout(() => onStart(), 600);
      return () => clearTimeout(t);
    }
  }, [countdown, onStart]);

  if (countdown !== null) {
    return (
      <div className="cv-countdown-box">
        <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a3b18a' }}>
          READY FOR {test.name.toUpperCase()}?
        </span>
        <div className="cv-countdown-num">
          {countdown}
        </div>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
          The assessment will begin automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="cv-auto-instruction-card">
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        backgroundColor: 'rgba(163, 177, 138, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a3b18a'
      }}>
        {renderTestIcon(test.iconType)}
      </div>

      <div>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', color: '#a3b18a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
          STANDARDIZED PROTOCOL · {test.domain}
        </span>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#ffffff' }}>
          {test.name}
        </h2>
        <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
          {test.instructions}
        </p>
      </div>

      <div style={{
        padding: '0.6rem 1.2rem',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.78rem',
        color: '#94a3b8'
      }}>
        ⏱️ Allocated Timing: <strong>{test.timeLimit}s countdown</strong> · Zero clinician intervention required
      </div>

      <button
        className="cv-action-btn cv-tactile-btn"
        style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)', minWidth: '220px' }}
        onClick={handleBeginCountdown}
      >
        <span>Ready — Begin Test</span>
        <span>→</span>
      </button>
    </div>
  );
};

// ── 1. Automated Pattern Recall ──────────────────────────────────────────────
const AutomatedPatternRecall = ({ test, onFinish, onTickTimer, isPaused }) => {
  const size = 4;
  const totalCells = size * size;
  const pattern = useMemo(() => {
    const all = Array.from({ length: 16 }, (_, i) => i);
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, []);

  const [phase, setPhase] = useState('memorise'); // 'memorise' | 'recall'
  const [selected, setSelected] = useState([]);
  const [memRemaining, setMemRemaining] = useState(test.memorizeLimit || 8);
  const [recallRemaining, setRecallRemaining] = useState(test.timeLimit || 30);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // Memorize Timer
  useEffect(() => {
    if (phase !== 'memorise' || isPaused) return;
    const targetEnd = Date.now() + memRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setMemRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setPhase('recall');
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, memRemaining, onTickTimer]);

  // Recall Timer
  useEffect(() => {
    if (phase !== 'recall' || isPaused) return;
    const targetEnd = Date.now() + recallRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setRecallRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        handleAutoSubmit(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, recallRemaining, onTickTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = (i) => {
    if (phase !== 'recall' || isPaused) return;
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleProceedToRecall = () => {
    setPhase('recall');
  };

  const handleAutoSubmit = useCallback((isTimeout = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const correct = pattern.filter(p => selected.includes(p)).length;
    const score = Math.round((correct / pattern.length) * 100);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const status = isTimeout ? (selected.length === 0 ? 'TIMEOUT' : 'COMPLETED') : 'COMPLETED';

    onFinish({
      test_type: 'pattern_recall',
      score,
      duration_seconds: duration,
      completion_status: status,
      raw_response: { selected, pattern, correct_count: correct },
      metadata: {
        recalled_cells: `${correct} / ${pattern.length}`,
        grid_fidelity: `${score}%`,
        is_timeout: isTimeout
      }
    });
  }, [pattern, selected, onFinish]);

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase === 'memorise' ? `Phase 1: Spatial Encoding (${memRemaining}s)` : `Phase 2: Spatial Recall (${recallRemaining}s)`}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'memorise' 
            ? 'Memorize the 6 illuminated coordinate cells' 
            : `Tap the remembered locations (${selected.length}/6 selected)`}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'memorise'
            ? 'System will advance to recall automatically in a few seconds.'
            : 'Select the 6 matrix coordinates before time expires.'}
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

      {phase === 'memorise' ? (
        <button
          className="cv-action-btn cv-tactile-btn"
          style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
          onClick={handleProceedToRecall}
        >
          <span>I've Memorized It — Begin Recall Immediately ({memRemaining}s)</span>
          <span>→</span>
        </button>
      ) : (
        <button
          className="cv-action-btn cv-tactile-btn"
          style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
          onClick={() => handleAutoSubmit(false)}
        >
          <span>Submit Answer ({selected.length}/6)</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};

// ── 2. Automated Digit Span ──────────────────────────────────────────────────
const AutomatedDigitSpan = ({ test, onFinish, onTickTimer, isPaused }) => {
  const sequences = useMemo(() => {
    const rand = () => Math.floor(Math.random() * 9) + 1;
    return [
      [rand(), rand(), rand()],
      [rand(), rand(), rand(), rand()],
      [rand(), rand(), rand(), rand(), rand()],
    ];
  }, []);

  const [seqIndex, setSeqIndex] = useState(0);
  const [phase, setPhase] = useState('show'); // 'show' | 'recall'
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [showRemaining, setShowRemaining] = useState(4);
  const [recallRemaining, setRecallRemaining] = useState(test.timeLimit || 20);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // Show Timer
  useEffect(() => {
    if (phase !== 'show' || isPaused) return;
    const targetEnd = Date.now() + showRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setShowRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setPhase('recall');
        setShowRemaining(4);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, showRemaining, onTickTimer]);

  // Recall Timer
  useEffect(() => {
    if (phase !== 'recall' || isPaused) return;
    const targetEnd = Date.now() + recallRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setRecallRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        handleCheck(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, recallRemaining, onTickTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheck = (isTimeout = false) => {
    const answer = input.replace(/\s/g, '').split('').map(Number);
    const seq = sequences[seqIndex];
    const isCorrect = !isTimeout && seq.every((n, i) => n === answer[i]) && answer.length === seq.length;
    const updatedCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(updatedCorrect);

    setInput('');
    if (seqIndex + 1 >= sequences.length) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const score = Math.round((updatedCorrect / sequences.length) * 100);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onFinish({
        test_type: 'digit_span',
        score,
        duration_seconds: duration,
        completion_status: 'COMPLETED',
        raw_response: { sequences, correct_count: updatedCorrect },
        metadata: {
          sequences_correct: `${updatedCorrect} / ${sequences.length}`,
          max_span: `${sequences[sequences.length - 1].length} Digits`
        }
      });
    } else {
      setSeqIndex(prev => prev + 1);
      setPhase('show');
      setShowRemaining(4);
      setRecallRemaining(test.timeLimit || 20);
    }
  };

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
            ? 'Retain the digits in your phonological buffer before recall begins.'
            : 'Type the exact numbers into the sequence field below.'}
        </p>
      </div>

      {phase === 'show' ? (
        <div className="cv-digit-row">
          {sequences[seqIndex].map((d, i) => (
            <span key={i} className="cv-digit-card" style={{ animationDelay: `${i * 0.08}s` }}>
              {d}
            </span>
          ))}
        </div>
      ) : (
        <div className="cv-test-input-wrap">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck(false)}
            className="cv-test-input"
            placeholder="e.g. 482"
            autoFocus
            disabled={isPaused}
          />
          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={() => handleCheck(false)}
          >
            <span>Submit Sequence</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ── 3. Automated Word Recall (Delayed Retrieval) ──────────────────────────────
const WORD_BANK = [
  'Apple', 'River', 'Candle', 'Bridge', 'Mirror',
  'Castle', 'Jungle', 'Pencil', 'Flower', 'Guitar',
  'Butter', 'Shadow', 'Temple', 'Marble', 'Breeze',
  'Lantern', 'Feather', 'Compass', 'Whisper', 'Thunder',
];

const AutomatedWordRecall = ({ test, onFinish, onTickTimer, isPaused }) => {
  const words = useMemo(() => {
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

  const [phase, setPhase] = useState('memorise'); // 'memorise' | 'distract' | 'recall'
  const [input, setInput] = useState('');
  const [memRemaining, setMemRemaining] = useState(test.memorizeLimit || 10);
  const [distractRemaining, setDistractRemaining] = useState(test.distractLimit || 8);
  const [recallRemaining, setRecallRemaining] = useState(test.timeLimit || 35);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // Memorize Phase Timer
  useEffect(() => {
    if (phase !== 'memorise' || isPaused) return;
    const targetEnd = Date.now() + memRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setMemRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setPhase('distract');
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, memRemaining, onTickTimer]);

  // Distract Phase Timer
  useEffect(() => {
    if (phase !== 'distract' || isPaused) return;
    const targetEnd = Date.now() + distractRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setDistractRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setPhase('recall');
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, distractRemaining, onTickTimer]);

  // Recall Phase Timer
  useEffect(() => {
    if (phase !== 'recall' || isPaused) return;
    const targetEnd = Date.now() + recallRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setRecallRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        handleSubmit(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, recallRemaining, onTickTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback((isTimeout = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const answered = input.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const correct = words.filter(w => answered.includes(w.toLowerCase())).length;
    const score = Math.round((correct / words.length) * 100);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    const status = isTimeout ? (answered.length === 0 ? 'TIMEOUT' : 'COMPLETED') : 'COMPLETED';

    onFinish({
      test_type: 'word_recall',
      score,
      duration_seconds: duration,
      completion_status: status,
      raw_response: { target_words: words, user_input: input, correct_count: correct },
      metadata: {
        words_recalled: `${correct} / ${words.length}`,
        distractor_completed: true,
        is_timeout: isTimeout
      }
    });
  }, [words, input, onFinish]);

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase === 'memorise' && `Phase 1: Lexical Encoding (${memRemaining}s)`}
          {phase === 'distract' && `Phase 2: Retroactive Distractor (${distractRemaining}s)`}
          {phase === 'recall' && `Phase 3: Delayed Verbal Retrieval (${recallRemaining}s)`}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'memorise' && 'Memorize these 5 clinical target words'}
          {phase === 'distract' && 'Quick distractor mental task'}
          {phase === 'recall' && 'Type all the words you remember'}
        </h3>
        <p className="cv-runner-subtext">
          {phase === 'memorise' && 'Store these semantic representations in your episodic memory ledger.'}
          {phase === 'distract' && 'Solve this equation mentally to clear working memory buffer.'}
          {phase === 'recall' && 'Separate recalled words with commas or spaces.'}
        </p>
      </div>

      {phase === 'memorise' && (
        <div className="cv-words-container">
          {words.map((w, i) => (
            <span key={i} className="cv-word-chip" style={{ animationDelay: `${i * 0.08}s` }}>
              {w}
            </span>
          ))}
        </div>
      )}

      {phase === 'distract' && (
        <div style={{
          fontSize: '2.8rem',
          fontWeight: '900',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#a3b18a',
          padding: '1.2rem 2.5rem',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '2px solid rgba(163, 177, 138, 0.3)',
          userSelect: 'none',
          textAlign: 'center'
        }}>
          47 + 36 = ?
        </div>
      )}

      {phase === 'recall' && (
        <div className="cv-test-input-wrap">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit(false)}
            className="cv-test-input"
            placeholder="e.g. Apple, River, ..."
            autoFocus
            disabled={isPaused}
          />
          <button
            className="cv-action-btn cv-tactile-btn"
            style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
            onClick={() => handleSubmit(false)}
          >
            <span>Submit Word Recall</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ── 4. Automated Stroop Test ─────────────────────────────────────────────────
const ALL_COLOR_WORDS = [
  { word: 'RED', ink: '#3b82f6', correct: 'Blue' },
  { word: 'BLUE', ink: '#22c55e', correct: 'Green' },
  { word: 'GREEN', ink: '#ef4444', correct: 'Red' },
  { word: 'YELLOW', ink: '#a78bfa', correct: 'Purple' },
  { word: 'PURPLE', ink: '#f59e0b', correct: 'Yellow' },
  { word: 'RED', ink: '#22c55e', correct: 'Green' },
  { word: 'BLUE', ink: '#ef4444', correct: 'Red' },
  { word: 'GREEN', ink: '#3b82f6', correct: 'Blue' },
];

const AutomatedStroop = ({ test, onFinish, onTickTimer, isPaused }) => {
  const colorWords = useMemo(() => {
    return [...ALL_COLOR_WORDS].sort(() => Math.random() - 0.5).slice(0, 8);
  }, []);

  const colorOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit || 30);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;
    const targetEnd = Date.now() + timeRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setTimeRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        finishStroop(correct, true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isPaused, timeRemaining, correct, onTickTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishStroop = useCallback((finalCorrect, isTimeout = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const score = Math.round((finalCorrect / colorWords.length) * 100);
    const duration = (Date.now() - startTimeRef.current) / 1000;
    onFinish({
      test_type: 'stroop',
      score,
      duration_seconds: duration,
      completion_status: isTimeout ? 'TIMEOUT' : 'COMPLETED',
      raw_response: { trials_count: colorWords.length, correct_count: finalCorrect },
      metadata: {
        interference_accuracy: `${finalCorrect} / ${colorWords.length}`,
        is_timeout: isTimeout
      }
    });
  }, [colorWords, onFinish]);

  const handleAnswer = (answer) => {
    if (feedback !== null || isPaused) return;
    const isCorrect = answer === colorWords[current].correct;
    const newCorrect = isCorrect ? correct + 1 : correct;
    setCorrect(newCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= colorWords.length) {
        finishStroop(newCorrect, false);
      } else {
        setCurrent(prev => prev + 1);
      }
    }, 450);
  };

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

      <div className="cv-stroop-options-grid">
        {colorOptions.map((c) => (
          <button
            key={c}
            className="cv-stroop-btn cv-tactile-btn"
            onClick={() => handleAnswer(c)}
            disabled={feedback !== null || isPaused}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── 5. Automated Trail Making Test (Set-Shifting) ─────────────────────────────
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

const AutomatedTrailMaking = ({ test, onFinish, onTickTimer, isPaused }) => {
  const [phase, setPhase] = useState('part_a'); // 'part_a' | 'part_b'
  const [pathA, setPathA] = useState([]);
  const [pathB, setPathB] = useState([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [partATime, setPartATime] = useState(0);
  const [partAErrors, setPartAErrors] = useState(0);
  const [partBErrors, setPartBErrors] = useState(0);
  const [errorFlash, setErrorFlash] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit || 60);

  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;
    const targetEnd = Date.now() + timeRemaining * 1000;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setTimeRemaining(rem);
      onTickTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (phase === 'part_a') {
          setPartATime(test.timeLimit || 60);
          setPhase('part_b');
          setTargetIndex(0);
          setTimeRemaining(90);
        } else {
          finishTrail(partATime, 90, partAErrors, partBErrors, true);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, isPaused, timeRemaining, partATime, partAErrors, partBErrors, test.timeLimit, onTickTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishTrail = useCallback((durA, durB, errA, errB, isTimeout = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const totalDuration = durA + durB;
    const totalErrors = errA + errB;

    const timeScore = Math.max(0, Math.min(100, 100 - Math.max(0, durB - 35.0) * 0.9 - Math.max(0, durA - 15.0) * 0.6));
    const errorPenalty = Math.min(45, errB * 8.0 + errA * 4.0);
    const score = !isTimeout
      ? Math.round(Math.max(15.0, Math.min(100.0, timeScore - errorPenalty)))
      : Math.round(Math.max(10.0, Math.min(45.0, 45.0 - totalErrors * 5.0)));

    onFinish({
      test_type: 'trail_making',
      score,
      duration_seconds: totalDuration,
      completion_status: isTimeout ? 'TIMEOUT' : 'COMPLETED',
      raw_response: { part_a_duration: durA, part_b_duration: durB, errors_a: errA, errors_b: errB },
      metadata: {
        part_a_time: `${durA.toFixed(1)}s`,
        part_b_time: `${durB.toFixed(1)}s`,
        total_errors: totalErrors,
        is_timeout: isTimeout
      }
    });
  }, [onFinish]);

  const handleNodeClick = (nodeId) => {
    if (isPaused) return;
    const isPartA = phase === 'part_a';
    const activeSeq = isPartA ? SEQ_A : SEQ_B;
    const expectedTarget = activeSeq[targetIndex];

    if (nodeId === expectedTarget) {
      if (isPartA) {
        const newPath = [...pathA, nodeId];
        setPathA(newPath);
        if (targetIndex + 1 >= activeSeq.length) {
          const durationA = (Date.now() - startTimeRef.current) / 1000;
          setPartATime(durationA);
          setPhase('part_b');
          setTargetIndex(0);
          setTimeRemaining(90);
        } else {
          setTargetIndex(prev => prev + 1);
        }
      } else {
        const newPath = [...pathB, nodeId];
        setPathB(newPath);
        if (targetIndex + 1 >= activeSeq.length) {
          const durationB = (Date.now() - startTimeRef.current) / 1000 - partATime;
          finishTrail(partATime, durationB, partAErrors, partBErrors, false);
        } else {
          setTargetIndex(prev => prev + 1);
        }
      }
    } else {
      setErrorFlash(nodeId);
      setTimeout(() => setErrorFlash(null), 400);
      if (isPartA) setPartAErrors(prev => prev + 1);
      else setPartBErrors(prev => prev + 1);
    }
  };

  return (
    <div className="cv-test-runner-box">
      <div className="cv-runner-meta">
        <span className="cv-runner-step-pill">
          {phase === 'part_a' ? 'Part A: Numeric Sequencing (1 to 8)' : 'Part B: Alternating Set-Shifting (1-A-2-B-3-C-4-D)'}
        </span>
        <h3 className="cv-runner-instruction">
          {phase === 'part_a' ? 'Connect: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8' : 'Alternate: 1 → A → 2 → B → 3 → C → 4 → D'}
        </h3>
        <p className="cv-runner-subtext">
          Target: <strong>[ {phase === 'part_a' ? SEQ_A[targetIndex] : SEQ_B[targetIndex]} ]</strong> · Errors: {phase === 'part_a' ? partAErrors : partBErrors}
        </p>
      </div>

      <div className="cv-trail-canvas-wrapper">
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
              disabled={isPaused}
            >
              {node.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── 6. Automated Reaction Time ───────────────────────────────────────────────
const AutomatedReactionTime = ({ test, onFinish, onTickTimer, isPaused }) => {
  const ROUNDS = 5;
  const [phase, setPhase] = useState('waiting'); // 'waiting' | 'ready' | 'result'
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [appearTime, setAppearTime] = useState(null);
  const [lastRT, setLastRT] = useState(null);
  const [tooEarly, setTooEarly] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const startNextRound = useCallback(() => {
    setPhase('waiting');
    setTooEarly(false);
    setLastRT(null);
    const delay = 1400 + Math.random() * 2400;
    timerRef.current = setTimeout(() => {
      setAppearTime(Date.now());
      setPhase('ready');
    }, delay);
  }, []);

  useEffect(() => {
    startNextRound();
    return () => clearTimeout(timerRef.current);
  }, [startNextRound]);

  const handleTap = () => {
    if (isPaused) return;
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setTooEarly(true);
      setPhase('result');
      setTimeout(() => startNextRound(), 1200);
      return;
    }
    if (phase === 'ready') {
      const rt = Date.now() - appearTime;
      setLastRT(rt);
      const updatedTimes = [...reactionTimes, rt];
      setReactionTimes(updatedTimes);
      setPhase('result');

      if (round + 1 >= ROUNDS) {
        if (finishedRef.current) return;
        finishedRef.current = true;
        const avg = updatedTimes.reduce((a, b) => a + b, 0) / updatedTimes.length;
        const score = Math.max(0, Math.min(100, Math.round(((700 - avg) / 450) * 100)));
        const duration = (Date.now() - startTimeRef.current) / 1000;
        onFinish({
          test_type: 'reaction_time',
          score,
          duration_seconds: duration,
          completion_status: 'COMPLETED',
          raw_response: { reaction_times: updatedTimes, mean_rt_ms: avg },
          metadata: {
            average_latency: `${Math.round(avg)} ms`,
            neural_agility: avg < 300 ? 'Exceptional' : avg < 500 ? 'Normal' : 'Sub-Baseline'
          }
        });
      } else {
        setRound(r => r + 1);
        setTimeout(() => startNextRound(), 800);
      }
    }
  };

  return (
    <div className="cv-test-runner-box">
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
        <h3 className="cv-runner-instruction">{phase === 'ready' ? 'CLICK / TAP SENSOR NOW!' : 'Stand by for stimulus...'}</h3>
        <p className="cv-runner-subtext">
          {phase === 'ready' ? 'Sensory signal active!' : tooEarly ? 'Premature tap detected! Stand by for next round...' : 'Sensor calibrating. Do not tap prematurely.'}
        </p>
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
          margin: '1.5rem auto',
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

      {lastRT && (
        <div style={{ textAlign: 'center', color: '#a3b18a', fontSize: '1.2rem', fontWeight: '800' }}>
          Latency: {lastRT} ms
        </div>
      )}
    </div>
  );
};

// ── Automated Workflow Engine ────────────────────────────────────────────────
const Tests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, isDark } = useTheme();

  const urlSessionId = searchParams.get('session_id');
  const urlPatientId = searchParams.get('patient_id');

  // Automated session state
  const [sessionUuid, setSessionUuid] = useState(urlSessionId || null);
  const [sessionState, setSessionState] = useState(null);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [workflowStage, setWorkflowStage] = useState('NOT_STARTED'); 
  // 'NOT_STARTED' | 'INSTRUCTIONS' | 'COUNTDOWN' | 'ACTIVE_TEST' | 'TRANSITION' | 'PAUSED' | 'COMPLETED'
  
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);

  // Clinician view state
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isClinician = currentUser?.is_caregiver === true || currentUser?.role === 'clinician';

  // Load existing session if URL provided
  useEffect(() => {
    if (urlSessionId) {
      loadSession(urlSessionId);
    }
  }, [urlSessionId]);

  const loadSession = async (uuid) => {
    try {
      const res = await getAssessmentSession(uuid);
      setSessionState(res.data);
      setSessionUuid(uuid);
      setActiveTestIndex(res.data.current_test_index || 0);
      if (res.data.is_completed) {
        setFinalSummary(res.data);
        setWorkflowStage('COMPLETED');
      } else {
        setWorkflowStage('INSTRUCTIONS');
      }
    } catch (err) {
      console.log('Error loading assessment session:', err.message);
    }
  };

  const handleStartWorkflow = async (patientId = null) => {
    try {
      const targetId = patientId || (urlPatientId ? parseInt(urlPatientId) : null);
      const res = await startAssessmentSession(targetId);
      setSessionUuid(res.data.session_uuid);
      setSessionState(res.data);
      setActiveTestIndex(0);
      setWorkflowStage('INSTRUCTIONS');
    } catch (err) {
      console.log('Error starting assessment session:', err.message);
      // Fallback local start
      setWorkflowStage('INSTRUCTIONS');
    }
  };

  const activeTestObj = tests[activeTestIndex] || tests[0];

  const handleTestFinish = async (resultPayload) => {
    try {
      if (sessionUuid) {
        const res = await submitAssessmentTest(sessionUuid, resultPayload);
        setSessionState(res.data);
        if (res.data.is_completed) {
          setFinalSummary(res.data);
          setWorkflowStage('COMPLETED');
          return;
        }
      } else {
        await saveTestResult(resultPayload);
      }
    } catch (err) {
      console.log('Could not submit automated test result:', err.message);
    }

    if (activeTestIndex + 1 >= tests.length) {
      try {
        const sc = await calculateScore();
        setFinalSummary(sc.data);
      } catch (err) {}
      setWorkflowStage('COMPLETED');
    } else {
      setWorkflowStage('TRANSITION');
    }
  };

  const handlePause = async () => {
    if (workflowStage === 'PAUSED') {
      if (sessionUuid) {
        try { await resumeAssessmentSession(sessionUuid); } catch {}
      }
      setWorkflowStage('ACTIVE_TEST');
    } else {
      if (sessionUuid) {
        try { await pauseAssessmentSession(sessionUuid); } catch {}
      }
      setWorkflowStage('PAUSED');
    }
  };

  const handleExit = async () => {
    if (sessionUuid) {
      try { await cancelAssessmentSession(sessionUuid); } catch {}
    }
    setShowExitModal(false);
    navigate(isClinician ? '/patients' : '/dashboard');
  };

  // Transition auto-advance timer
  useEffect(() => {
    if (workflowStage !== 'TRANSITION') return;
    const t = setTimeout(() => {
      setActiveTestIndex(prev => prev + 1);
      setWorkflowStage('INSTRUCTIONS');
    }, 3000);
    return () => clearTimeout(t);
  }, [workflowStage]);

  // ── 1. COMPLETED SUMMARY VIEWPORT ──────────────────────────────────────────
  if (workflowStage === 'COMPLETED') {
    const sc = finalSummary?.latest_score || {};
    const scoreVal = sc.score != null ? sc.score : (finalSummary?.score != null ? finalSummary.score : 'Unassessed');
    const eq = sc.evidence_quality || finalSummary?.evidence_quality || 'GOOD';
    const reason = sc.reason || finalSummary?.evidence_reason || 'Automated cognitive screening battery finalized.';

    return (
      <DoctorLayout activeTitle="Assessment Completed">
        <div className="cv-tests-hero" style={{ backgroundColor: theme.cardBg, borderColor: theme.border, maxWidth: '680px', margin: '2.5rem auto' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#4ade80' }}>
              ✓
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: theme.text }}>
              Cognitive Assessment Complete
            </h1>
            <p style={{ fontSize: '0.9rem', color: theme.subtext, margin: 0, maxWidth: '520px' }}>
              Standardized multi-domain screening telemetry has been calibrated and saved to the patient clinical record.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            margin: '1.5rem 0',
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8faf7',
            border: `1px solid ${theme.borderSubtle}`
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.06em', color: theme.subtext, textTransform: 'uppercase', display: 'block' }}>
                Overall CogniScore
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: theme.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {scoreVal} {typeof scoreVal === 'number' && <span style={{ fontSize: '1rem', color: theme.subtext }}>/ 100</span>}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#22c55e' }}>
                {sc.risk_level || 'Evaluated'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.06em', color: theme.subtext, textTransform: 'uppercase', display: 'block' }}>
                Evidence Quality
              </span>
              <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '6px', backgroundColor: eq === 'GOOD' ? '#16a34a' : '#d97706', color: '#ffffff', fontWeight: '800', fontSize: '0.85rem', marginTop: '6px' }}>
                {eq}
              </div>
              <p style={{ fontSize: '0.75rem', color: theme.subtext, margin: '6px 0 0 0' }}>
                {reason}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="cv-action-btn cv-tactile-btn"
              style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
              onClick={() => navigate(isClinician ? '/patients' : '/dashboard')}
            >
              <span>{isClinician ? 'Return to Clinician Directory' : 'View Clinical Dashboard'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  // ── 2. ACTIVE TEST RUNNER VIEWPORT ──────────────────────────────────────────
  if (workflowStage === 'INSTRUCTIONS' || workflowStage === 'ACTIVE_TEST' || workflowStage === 'TRANSITION' || workflowStage === 'PAUSED') {
    return (
      <DoctorLayout activeTitle={`Cognitive Screening · Test ${activeTestIndex + 1}`}>
        <div className="cv-tests-container">
          <AutoRunnerHUD
            testIndex={activeTestIndex}
            totalTests={tests.length}
            testName={activeTestObj.name}
            timeRemaining={workflowStage === 'ACTIVE_TEST' ? timeRemaining : null}
            isPaused={workflowStage === 'PAUSED'}
            onPause={handlePause}
            onExit={() => setShowExitModal(true)}
          />

          {workflowStage === 'INSTRUCTIONS' && (
            <PreTestInstructionStage
              test={activeTestObj}
              onStart={() => setWorkflowStage('ACTIVE_TEST')}
            />
          )}

          {workflowStage === 'TRANSITION' && (
            <div className="cv-auto-transition-card">
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                {activeTestObj.name} Completed!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                Responses securely stored. Advancing to next evaluation in 3 seconds...
              </p>
              <button
                className="cv-action-btn cv-tactile-btn"
                style={{ backgroundColor: '#273822', color: '#ffffff', border: '1px solid rgba(163, 177, 138, 0.4)' }}
                onClick={() => {
                  setActiveTestIndex(prev => prev + 1);
                  setWorkflowStage('INSTRUCTIONS');
                }}
              >
                <span>Proceed Now</span>
                <span>→</span>
              </button>
            </div>
          )}

          {workflowStage === 'ACTIVE_TEST' && (
            <>
              {activeTestObj.id === 'pattern_recall' && (
                <AutomatedPatternRecall
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
              {activeTestObj.id === 'digit_span' && (
                <AutomatedDigitSpan
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
              {activeTestObj.id === 'word_recall' && (
                <AutomatedWordRecall
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
              {activeTestObj.id === 'stroop' && (
                <AutomatedStroop
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
              {activeTestObj.id === 'trail_making' && (
                <AutomatedTrailMaking
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
              {activeTestObj.id === 'reaction_time' && (
                <AutomatedReactionTime
                  test={activeTestObj}
                  onFinish={handleTestFinish}
                  onTickTimer={setTimeRemaining}
                  isPaused={workflowStage === 'PAUSED'}
                />
              )}
            </>
          )}

          {/* Pause Modal */}
          {workflowStage === 'PAUSED' && (
            <div className="cv-modal-backdrop">
              <div className="cv-modal-card">
                <span style={{ fontSize: '2.5rem' }}>⏸️</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: theme.text }}>
                  Assessment Paused
                </h3>
                <p style={{ fontSize: '0.88rem', color: theme.subtext, margin: 0 }}>
                  The timer is currently suspended. You may take a brief break and resume whenever ready.
                </p>
                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                  <button
                    className="cv-action-btn cv-tactile-btn"
                    style={{ backgroundColor: '#273822', color: '#ffffff', flex: 1 }}
                    onClick={handlePause}
                  >
                    ▶ Resume Assessment
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowExitModal(true)}
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exit Confirmation Modal */}
          {showExitModal && (
            <div className="cv-modal-backdrop">
              <div className="cv-modal-card">
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#ef4444' }}>
                  Exit Cognitive Assessment?
                </h3>
                <p style={{ fontSize: '0.88rem', color: theme.subtext, margin: 0 }}>
                  Exiting will terminate the active screening session. Completed subtests will remain saved.
                </p>
                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                  <button
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${theme.borderSubtle}`,
                      color: theme.text,
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flex: 1
                    }}
                    onClick={() => setShowExitModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flex: 1
                    }}
                    onClick={handleExit}
                  >
                    Confirm Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DoctorLayout>
    );
  }

  // ── 3. PRE-SESSION BRIEFING / ENTRYPOINT ────────────────────────────────────
  return (
    <DoctorLayout activeTitle="Daily Cognitive Battery">
      <div className="cv-tests-container">
        <div className="cv-tests-hero" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <div className="cv-tests-hero-top">
            <div>
              <div className="cv-tests-eyebrow" style={{ color: theme.subtext }}>
                <span className="cv-tests-dot" />
                <span>STANDARDIZED CLINICAL PSYCHOMETRICS · AUTOMATED WORKFLOW</span>
              </div>
              <h1 className="cv-tests-title" style={{ color: theme.text }}>
                Automated Cognitive Screening Battery
              </h1>
              <p className="cv-tests-subtitle" style={{ color: theme.subtext }}>
                Self-administered, timed evaluation measuring visuospatial memory, working memory span, episodic verbal recall, executive inhibition, and motor reflex latencies.
              </p>
            </div>

            <button
              className="cv-start-test-btn cv-tactile-btn"
              style={{ backgroundColor: '#273822', color: '#ffffff', padding: '0.75rem 1.8rem', fontSize: '0.95rem' }}
              onClick={() => handleStartWorkflow()}
            >
              <span>⚡ Start Assessment Workflow</span>
              <span>→</span>
            </button>
          </div>

          <div className="cv-tests-telemetry-row">
            <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
              <span>⏱️</span>
              <span>Estimated Session Time: ~6 min</span>
            </div>
            <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
              <span>🧠</span>
              <span>6 Validated Cognitive Domains</span>
            </div>
            <div className="cv-tests-chip" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#eef4ed', color: theme.subtext }}>
              <span>🤖</span>
              <span>Fully Automated Administration & Scoring</span>
            </div>
          </div>
        </div>

        <VoiceGuideBar scriptKey="active_tests_intro" defaultLang="en" />

        <div className="cv-tests-list">
          {tests.map((test, i) => (
            <div
              key={test.id}
              className="cv-test-card"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border
              }}
            >
              <div className="cv-test-icon-box" style={{ color: isDark ? '#a3b18a' : '#273822' }}>
                {renderTestIcon(test.iconType)}
              </div>

              <div className="cv-test-details">
                <div className="cv-test-top-meta">
                  <span className="cv-test-domain-badge">
                    Subtest {i + 1} · {test.domain}
                  </span>
                  <span className="cv-test-duration-tag">
                    ⏱️ {test.duration}
                  </span>
                </div>
                <h3 className="cv-test-name" style={{ color: theme.text }}>
                  {test.name}
                </h3>
                <p className="cv-test-desc" style={{ color: theme.subtext }}>
                  {test.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Tests;