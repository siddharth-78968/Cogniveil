import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTestResult, calculateScore } from '../utils/api';

const tests = [
  { id: 'pattern_recall', name: 'Pattern Recall', icon: '🔲', description: 'Memorise a grid pattern then reproduce it from memory', duration: '~2 min', color: '#00d4aa' },
  { id: 'digit_span', name: 'Digit Span', icon: '🔢', description: 'Remember and repeat sequences of numbers of increasing length', duration: '~1 min', color: '#a78bfa' },
  { id: 'word_recall', name: 'Word Recall', icon: '📝', description: 'Memorise a word list, complete a distractor task, then recall', duration: '~2 min', color: '#f59e0b' },
  { id: 'stroop', name: 'Stroop Test', icon: '🎨', description: 'Name the ink color of a word — not what the word says. Tests cognitive interference resistance.', duration: '~1 min', color: '#ef4444' },
  { id: 'reaction_time', name: 'Reaction Time', icon: '⚡', description: 'Tap the target as fast as possible when it appears. Measures neural processing speed — a validated dementia biomarker.', duration: '~1 min', color: '#06b6d4' },
];

const PatternRecall = ({ onComplete }) => {
  const size = 4;
  const totalCells = size * size;
  const pattern = React.useMemo(() => {
    const all = Array.from({ length: 16 }, (_, i) => i);
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, []);
  const [phase, setPhase] = useState('memorise');
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleCellClick = (i) => {
    if (phase !== 'recall') return;
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSubmit = () => {
    const correct = pattern.filter(p => selected.includes(p)).length;
    const score = Math.round((correct / pattern.length) * 100);
    const duration = (Date.now() - startTime.current) / 1000;
    setResult({ score, correct, total: pattern.length });
    onComplete(score, duration);
  };

  return (
    <div style={ts.testBox}>
      {phase === 'memorise' && (
        <>
          <p style={ts.instruction}>Memorise the highlighted cells</p>
          <div style={ts.grid}>
            {Array.from({ length: totalCells }).map((_, i) => (
              <div key={i} style={{
                ...ts.cell,
                backgroundColor: pattern.includes(i) ? '#00d4aa' : '#1a2540',
                boxShadow: pattern.includes(i) ? '0 0 14px rgba(0,212,170,0.5)' : 'none',
                border: `1px solid ${pattern.includes(i) ? '#00d4aa' : '#ffffff25'}`,
              }} />
            ))}
          </div>
          <button style={{ ...ts.actionBtn, backgroundColor: '#00d4aa', color: '#080c14' }} onClick={() => setPhase('recall')}>
            Ready — Test Me
          </button>
        </>
      )}
      {phase === 'recall' && !result && (
        <>
          <p style={ts.instruction}>Tap the cells you remember</p>
          <div style={ts.grid}>
            {Array.from({ length: totalCells }).map((_, i) => (
              <div key={i} onClick={() => handleCellClick(i)} style={{
                ...ts.cell,
                backgroundColor: selected.includes(i) ? '#00d4aa' : '#1a2540',
                boxShadow: selected.includes(i) ? '0 0 14px rgba(0,212,170,0.5)' : 'none',
                border: `1px solid ${selected.includes(i) ? '#00d4aa' : '#ffffff25'}`,
                cursor: 'pointer',
              }} />
            ))}
          </div>
          <button style={{ ...ts.actionBtn, backgroundColor: '#00d4aa', color: '#080c14' }} onClick={handleSubmit}>
            Submit Answer
          </button>
        </>
      )}
      {result && (
        <div style={ts.resultBox}>
          <span style={{ fontSize: '3rem' }}>{result.score >= 70 ? '🎉' : result.score >= 40 ? '👍' : '💪'}</span>
          <p style={{ ...ts.resultScore, color: result.score >= 70 ? '#00d4aa' : result.score >= 40 ? '#f59e0b' : '#ef4444' }}>
            {result.score}/100
          </p>
          <p style={ts.resultDetail}>Recalled {result.correct} of {result.total} cells correctly</p>
        </div>
      )}
    </div>
  );
};

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
  const [phase, setPhase] = useState('show');
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startTime = React.useRef(Date.now());

  const handleCheck = () => {
    const answer = input.replace(/\s/g, '').split('').map(Number);
    const seq = sequences[seqIndex];
    const isCorrect = seq.every((n, i) => n === answer[i]) && answer.length === seq.length;
    const newCorrect = isCorrect ? correct + 1 : correct;
    setCorrect(newCorrect);
    setInput('');
    if (seqIndex + 1 >= sequences.length) {
      const score = Math.round((newCorrect / sequences.length) * 100);
      const duration = (Date.now() - startTime.current) / 1000;
      setDone(true);
      onComplete(score, duration);
    } else {
      setSeqIndex(seqIndex + 1);
      setPhase('show');
    }
  };

  return (
    <div style={ts.testBox}>
      {!done && (
        <>
          <div style={ts.progressRow}>
            {sequences.map((_, i) => (
              <div key={i} style={{
                ...ts.progressDot,
                backgroundColor: i < seqIndex ? '#a78bfa' : i === seqIndex ? '#a78bfa88' : '#ffffff10',
              }} />
            ))}
          </div>
          <p style={ts.instruction}>Sequence {seqIndex + 1} of {sequences.length}</p>
          {phase === 'show' && (
            <>
              <div style={ts.digitRow}>
                {sequences[seqIndex].map((d, i) => (
                  <span key={i} style={ts.digit}>{d}</span>
                ))}
              </div>
              <button style={{ ...ts.actionBtn, backgroundColor: '#a78bfa', color: 'white' }} onClick={() => setPhase('recall')}>
                I've Got It
              </button>
            </>
          )}
          {phase === 'recall' && (
            <>
              <p style={{ color: '#ffffff50', fontSize: '0.9rem' }}>Type the numbers in order:</p>
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                style={ts.textInput} placeholder="e.g. 372" autoFocus
              />
              <button style={{ ...ts.actionBtn, backgroundColor: '#a78bfa', color: 'white' }} onClick={handleCheck}>
                Check →
              </button>
            </>
          )}
        </>
      )}
      {done && (
        <div style={ts.resultBox}>
          <span style={{ fontSize: '3rem' }}>{correct === sequences.length ? '🎉' : correct > 0 ? '👍' : '💪'}</span>
          <p style={{ ...ts.resultScore, color: '#a78bfa' }}>{Math.round((correct / sequences.length) * 100)}/100</p>
          <p style={ts.resultDetail}>Got {correct} of {sequences.length} sequences right</p>
        </div>
      )}
    </div>
  );
};

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
  const [phase, setPhase] = useState('memorise');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const startTime = React.useRef(Date.now());

  const handleSubmit = () => {
    const answered = input.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const correct = words.filter(w => answered.includes(w.toLowerCase())).length;
    const score = Math.round((correct / words.length) * 100);
    const duration = (Date.now() - startTime.current) / 1000;
    setResult({ score, correct, total: words.length });
    onComplete(score, duration);
  };

  return (
    <div style={ts.testBox}>
      {phase === 'memorise' && (
        <>
          <p style={ts.instruction}>Memorise these 5 words</p>
          <div style={ts.wordList}>
            {words.map((w, i) => (
              <span key={i} style={ts.wordChip}>{w}</span>
            ))}
          </div>
          <button style={{ ...ts.actionBtn, backgroundColor: '#f59e0b', color: '#080c14' }} onClick={() => setPhase('distract')}>
            Done — Next Step
          </button>
        </>
      )}
      {phase === 'distract' && (
        <>
          <p style={ts.instruction}>Quick distractor task:</p>
          <p style={{ color: '#f59e0b', fontSize: '2rem', fontWeight: '800', textAlign: 'center' }}>47 + 36 = ?</p>
          <p style={{ color: '#ffffff30', fontSize: '0.85rem', textAlign: 'center' }}>Answer mentally, then recall your words</p>
          <button style={{ ...ts.actionBtn, backgroundColor: '#f59e0b', color: '#080c14' }} onClick={() => setPhase('recall')}>
            83 — Now Recall Words
          </button>
        </>
      )}
      {phase === 'recall' && !result && (
        <>
          <p style={ts.instruction}>Type all the words you remember</p>
          <p style={{ color: '#ffffff30', fontSize: '0.82rem', textAlign: 'center' }}>Separate with commas or spaces</p>
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={ts.textInput} placeholder="Apple, River, ..." autoFocus
          />
          <button style={{ ...ts.actionBtn, backgroundColor: '#f59e0b', color: '#080c14' }} onClick={handleSubmit}>
            Submit Recall
          </button>
        </>
      )}
      {result && (
        <div style={ts.resultBox}>
          <span style={{ fontSize: '3rem' }}>{result.score >= 70 ? '🎉' : result.score >= 40 ? '👍' : '💪'}</span>
          <p style={{ ...ts.resultScore, color: '#f59e0b' }}>{result.score}/100</p>
          <p style={ts.resultDetail}>Recalled {result.correct} of {result.total} words</p>
        </div>
      )}
    </div>
  );
};

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
  const [done, setDone] = useState(false);
  const startTime = React.useRef(Date.now());

  const handleAnswer = (answer) => {
    const isCorrect = answer === colorWords[current].correct;
    if (isCorrect) setCorrect(prev => prev + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= colorWords.length) {
        const score = Math.round((isCorrect ? correct + 1 : correct) / colorWords.length * 100);
        const duration = (Date.now() - startTime.current) / 1000;
        setDone(true);
        onComplete(score, duration);
      } else {
        setCurrent(prev => prev + 1);
      }
    }, 600);
  };

  return (
    <div style={ts.testBox}>
      {!done && (
        <>
          <div style={ts.progressRow}>
            {colorWords.map((_, i) => (
              <div key={i} style={{
                ...ts.progressDot,
                backgroundColor: i < current ? '#ef4444' : i === current ? '#ef444488' : '#ffffff10',
              }} />
            ))}
          </div>
          <p style={ts.instruction}>What colour is the <strong>ink</strong>? (not the word)</p>
          <div style={{
            fontSize: '3.5rem', fontWeight: '900',
            color: colorWords[current].ink,
            letterSpacing: '0.1em', padding: '1.5rem 2rem',
            backgroundColor: '#1a2540', borderRadius: '16px',
            border: `2px solid ${feedback === 'correct' ? '#00d4aa' : feedback === 'wrong' ? '#ef4444' : '#ffffff10'}`,
            transition: 'border-color 0.2s', userSelect: 'none',
          }}>
            {colorWords[current].word}
          </div>
          {feedback && (
            <p style={{ color: feedback === 'correct' ? '#00d4aa' : '#ef4444', fontSize: '1rem', fontWeight: '700' }}>
              {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {colorOptions.map(opt => (
              <button key={opt} onClick={() => !feedback && handleAnswer(opt)} style={{
                backgroundColor: '#1a2540', border: '1px solid #ffffff20',
                borderRadius: '10px', padding: '0.6rem 1.2rem',
                color: 'white', fontSize: '0.95rem', fontWeight: '600',
                cursor: feedback ? 'default' : 'pointer',
                transition: 'all 0.15s', opacity: feedback ? 0.6 : 1,
              }}>
                {opt}
              </button>
            ))}
          </div>
          <p style={{ color: '#ffffff25', fontSize: '0.78rem' }}>{current + 1} of {colorWords.length}</p>
        </>
      )}
      {done && (
        <div style={ts.resultBox}>
          <span style={{ fontSize: '3rem' }}>{correct >= 6 ? '🎉' : correct >= 4 ? '👍' : '💪'}</span>
          <p style={{ ...ts.resultScore, color: '#ef4444' }}>{Math.round(correct / colorWords.length * 100)}/100</p>
          <p style={ts.resultDetail}>Got {correct} of {colorWords.length} ink colours correct</p>
        </div>
      )}
    </div>
  );
};

// ── Reaction Time Test ───────────────────────────────────────────────────────
const ReactionTimeTest = ({ onComplete }) => {
  const ROUNDS = 5;
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [appearTime, setAppearTime] = useState(null);
  const [lastRT, setLastRT] = useState(null);
  const [tooEarly, setTooEarly] = useState(false);
  const timerRef = React.useRef(null);
  const startTime = React.useRef(Date.now());

  const startRound = () => {
    setPhase('waiting');
    setTooEarly(false);
    setLastRT(null);
    const delay = 1500 + Math.random() * 3000;
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
          setPhase('done');
          onComplete(score, duration);
        }, 1500);
      }
    }
  };

  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const avgRT = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : null;

  const getRTColor = (rt) => rt < 300 ? '#00d4aa' : rt < 500 ? '#f59e0b' : '#ef4444';

  return (
    <div style={ts.testBox}>
      {phase === 'intro' && (
        <>
          <span style={{ fontSize: '3rem' }}>⚡</span>
          <p style={ts.instruction}>Reaction Time Test</p>
          <p style={{ color: '#ffffff50', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.6, maxWidth: '320px' }}>
            A glowing circle will appear after a random delay.<br />
            <strong style={{ color: '#06b6d4' }}>Tap it as fast as you can!</strong><br />
            Don't tap before it appears — wait for the signal.
          </p>
          <p style={{ color: '#ffffff25', fontSize: '0.8rem' }}>{ROUNDS} rounds total</p>
          <button
            style={{ ...ts.actionBtn, backgroundColor: '#06b6d4', color: '#080c14' }}
            onClick={() => { startTime.current = Date.now(); startRound(); setRound(0); }}
          >
            Start Test →
          </button>
        </>
      )}

      {(phase === 'waiting' || phase === 'ready') && (
        <>
          <div style={ts.progressRow}>
            {Array.from({ length: ROUNDS }).map((_, i) => (
              <div key={i} style={{
                ...ts.progressDot,
                backgroundColor: i < round ? '#06b6d4' : i === round ? '#06b6d488' : '#ffffff10',
              }} />
            ))}
          </div>
          <p style={{ color: '#ffffff40', fontSize: '0.82rem' }}>Round {round + 1} of {ROUNDS}</p>

          <div
            onClick={handleTap}
            style={{
              width: '180px', height: '180px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
              backgroundColor: phase === 'ready' ? '#06b6d4' : '#1a2540',
              border: phase === 'ready' ? '3px solid #06b6d4' : '3px solid #ffffff10',
              boxShadow: phase === 'ready' ? '0 0 60px rgba(6,182,212,0.6)' : 'none',
            }}
          >
            <span style={{
              fontSize: phase === 'ready' ? '3rem' : '1.5rem',
              color: phase === 'ready' ? '#080c14' : '#ffffff15',
              fontWeight: '900', transition: 'all 0.15s',
            }}>
              {phase === 'ready' ? '⚡' : '●'}
            </span>
          </div>

          <p style={{ color: phase === 'ready' ? '#06b6d4' : '#ffffff25', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' }}>
            {phase === 'ready' ? 'TAP NOW!' : 'Wait for it...'}
          </p>
        </>
      )}

      {phase === 'result' && (
        <>
          <div style={ts.progressRow}>
            {Array.from({ length: ROUNDS }).map((_, i) => (
              <div key={i} style={{
                ...ts.progressDot,
                backgroundColor: i <= round ? '#06b6d4' : '#ffffff10',
              }} />
            ))}
          </div>

          {tooEarly ? (
            <>
              <span style={{ fontSize: '2.5rem' }}>⚠️</span>
              <p style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: '700' }}>Too Early!</p>
              <p style={{ color: '#ffffff40', fontSize: '0.85rem' }}>Wait for the circle to light up before tapping.</p>
            </>
          ) : (
            <>
              <span style={{ fontSize: '2.5rem' }}>✓</span>
              <p style={{ color: getRTColor(lastRT), fontSize: '2rem', fontWeight: '800' }}>{lastRT} ms</p>
              <p style={{ color: '#ffffff40', fontSize: '0.85rem' }}>
                {lastRT < 250 ? 'Excellent!' : lastRT < 350 ? 'Great!' : lastRT < 500 ? 'Good' : 'Slow — try to focus'}
              </p>
              {avgRT && <p style={{ color: '#ffffff30', fontSize: '0.78rem' }}>Running avg: {avgRT}ms</p>}
            </>
          )}

          {round + 1 < ROUNDS && (
            <button
              style={{ ...ts.actionBtn, backgroundColor: '#06b6d4', color: '#080c14' }}
              onClick={() => { setRound(r => r + 1); startRound(); }}
            >
              Next Round →
            </button>
          )}
          {round + 1 >= ROUNDS && !tooEarly && (
            <p style={{ color: '#ffffff30', fontSize: '0.82rem' }}>Calculating score...</p>
          )}
          {tooEarly && (
            <button
              style={{ ...ts.actionBtn, backgroundColor: '#06b6d4', color: '#080c14' }}
              onClick={() => startRound()}
            >
              Retry Round →
            </button>
          )}
        </>
      )}

      {phase === 'done' && (
        <div style={ts.resultBox}>
          <span style={{ fontSize: '3rem' }}>{avgRT < 300 ? '🎉' : avgRT < 500 ? '👍' : '💪'}</span>
          <p style={{ ...ts.resultScore, color: '#06b6d4' }}>
            {Math.max(0, Math.min(100, Math.round(((700 - avgRT) / 450) * 100)))}/100
          </p>
          <p style={ts.resultDetail}>Average reaction time: {avgRT}ms</p>
          <p style={{ color: '#ffffff25', fontSize: '0.78rem' }}>
            {avgRT < 250 ? 'Exceptional neural speed' : avgRT < 350 ? 'Above average' : avgRT < 500 ? 'Normal range' : 'Consider more rest'}
          </p>
        </div>
      )}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const Tests = () => {
  const navigate = useNavigate();
  const [activeTest, setActiveTest] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  React.useEffect(() => {
    const userEmail = localStorage.getItem('userEmail') || 'default';
    const lastDate = localStorage.getItem(`lastTestDate_${userEmail}`);
    const today = new Date().toDateString();
    if (lastDate === today) {
      setAlreadyDone(true);
    }
  }, []);

  const handleComplete = async (testId, score, duration) => {
    try { await saveTestResult({ test_type: testId, score, duration_seconds: duration }); }
    catch (err) { console.log('Could not save'); }
    const newCompleted = [...completed, testId];
    setCompleted(newCompleted);
    if (newCompleted.length === tests.length) {
      try { await calculateScore(); } catch (err) { }
      const userEmail = localStorage.getItem('userEmail') || 'default';
      localStorage.setItem(`lastTestDate_${userEmail}`, new Date().toDateString());
      setTimeout(() => setAllDone(true), 2500);
    } else {
      setTimeout(() => setActiveTest(null), 2500);
    }
  };

  if (alreadyDone) return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGrid} />
      <div style={styles.doneScreen}>
        <span style={{ fontSize: '3rem' }}>✅</span>
        <h2 style={styles.doneTitle}>Tests Already Completed Today</h2>
        <p style={styles.doneSub}>You have already taken your daily tests. Come back tomorrow for a new session.</p>
        <p style={{ color: '#ffffff25', fontSize: '0.82rem' }}>
          Next available: Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString()})
        </p>
        <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
          View Dashboard →
        </button>
      </div>
    </div>
  );

  if (allDone) return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGrid} />
      <div style={styles.doneScreen}>
        <span style={{ fontSize: '4rem' }}>🎉</span>
        <h2 style={styles.doneTitle}>All Tests Complete!</h2>
        <p style={styles.doneSub}>Your CogniScore has been recalculated with today's results.</p>
        <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>View Dashboard →</button>
        <button style={styles.secondaryBtn} onClick={() => navigate('/voice')}>Take Voice Journal →</button>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGrid} />

      {!activeTest ? (
        <div style={styles.container}>
          <div style={styles.headerRow}>
            <div>
              <p style={styles.pageLabel}>DAILY ASSESSMENT</p>
              <h1 style={styles.pageTitle}>Cognitive Tests</h1>
              <p style={styles.pageSub}>Complete all 5 tests to update your CogniScore</p>
            </div>
            <div style={styles.progressCircle}>
              <span style={styles.progressNum}>{completed.length}</span>
              <span style={styles.progressDen}>/{tests.length}</span>
            </div>
          </div>

          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${(completed.length / tests.length) * 100}%` }} />
          </div>

          <div style={styles.testGrid}>
            {tests.map((test, i) => {
              const isDone = completed.includes(test.id);
              return (
                <div
                  key={test.id}
                  style={{
                    ...styles.testCard,
                    borderColor: isDone ? test.color + '44' : '#ffffff08',
                    opacity: isDone ? 0.7 : 1,
                    animationDelay: `${i * 0.1}s`,
                    cursor: isDone ? 'default' : 'pointer',
                  }}
                  onClick={() => !isDone && setActiveTest(test.id)}
                >
                  <div style={{ ...styles.testIconBox, backgroundColor: test.color + '15', border: `1px solid ${test.color}22` }}>
                    <span style={{ fontSize: '1.8rem' }}>{test.icon}</span>
                  </div>
                  <div style={styles.testInfo}>
                    <p style={{ ...styles.testName, color: isDone ? test.color : 'white' }}>{test.name}</p>
                    <p style={styles.testDesc}>{test.description}</p>
                    <p style={{ ...styles.testDuration, color: test.color }}>{test.duration}</p>
                  </div>
                  <div style={{
                    ...styles.testStatus,
                    backgroundColor: isDone ? test.color + '20' : '#ffffff08',
                    color: isDone ? test.color : '#ffffff40',
                    border: `1px solid ${isDone ? test.color + '33' : '#ffffff10'}`,
                  }}>
                    {isDone ? '✓ Done' : 'Start →'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={styles.container}>
          <button style={styles.backBtn} onClick={() => setActiveTest(null)}>← Back to Tests</button>
          <div style={styles.activeHeader}>
            <span style={{ fontSize: '2rem' }}>{tests.find(t => t.id === activeTest)?.icon}</span>
            <div>
              <p style={styles.pageLabel}>NOW TESTING</p>
              <h2 style={styles.activeTitle}>{tests.find(t => t.id === activeTest)?.name}</h2>
            </div>
          </div>
          {activeTest === 'pattern_recall' && <PatternRecall onComplete={(s, d) => handleComplete('pattern_recall', s, d)} />}
          {activeTest === 'digit_span' && <DigitSpan onComplete={(s, d) => handleComplete('digit_span', s, d)} />}
          {activeTest === 'word_recall' && <WordRecall onComplete={(s, d) => handleComplete('word_recall', s, d)} />}
          {activeTest === 'stroop' && <StroopTest onComplete={(s, d) => handleComplete('stroop', s, d)} />}
          {activeTest === 'reaction_time' && <ReactionTimeTest onComplete={(s, d) => handleComplete('reaction_time', s, d)} />}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        input:focus { outline: none !important; border-color: #00d4aa55 !important; box-shadow: 0 0 0 3px rgba(0,212,170,0.1) !important; }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh', backgroundColor: '#080c14',
    padding: '2rem', position: 'relative', overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  bgGlow1: {
    position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
    top: '-150px', right: '-100px', pointerEvents: 'none', animation: 'glow 7s ease-in-out infinite',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px', pointerEvents: 'none',
  },
  container: { maxWidth: '780px', margin: '0 auto', animation: 'fadeUp 0.5s ease' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.25rem' },
  pageTitle: { color: 'white', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' },
  pageSub: { color: '#ffffff40', fontSize: '0.9rem' },
  progressCircle: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff10',
    borderRadius: '14px', padding: '0.75rem 1.25rem',
    display: 'flex', alignItems: 'baseline', gap: '2px',
  },
  progressNum: { color: '#00d4aa', fontSize: '1.8rem', fontWeight: '800' },
  progressDen: { color: '#ffffff30', fontSize: '1rem' },
  progressBarOuter: { height: '4px', backgroundColor: '#ffffff08', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' },
  progressBarInner: { height: '100%', backgroundColor: '#00d4aa', borderRadius: '4px', transition: 'width 0.5s ease' },
  testGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  testCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '16px', padding: '1.5rem',
    display: 'flex', alignItems: 'center', gap: '1.25rem',
    transition: 'transform 0.15s, border-color 0.2s',
    animation: 'fadeUp 0.5s ease both',
  },
  testIconBox: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  testInfo: { flex: 1 },
  testName: { fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.25rem' },
  testDesc: { color: '#ffffff40', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.25rem' },
  testDuration: { fontSize: '0.75rem', fontWeight: '600' },
  testStatus: { padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' },
  backBtn: { background: 'none', border: 'none', color: '#ffffff40', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 },
  activeHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  activeTitle: { color: 'white', fontSize: '1.5rem', fontWeight: '800' },
  doneScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '80vh', gap: '1rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto',
  },
  doneTitle: { color: 'white', fontSize: '2rem', fontWeight: '800' },
  doneSub: { color: '#ffffff50', fontSize: '1rem', marginBottom: '0.5rem' },
  primaryBtn: { backgroundColor: '#00d4aa', color: '#080c14', border: 'none', borderRadius: '10px', padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', width: '100%', maxWidth: '300px' },
  secondaryBtn: { backgroundColor: 'transparent', color: '#a78bfa', border: '1px solid #a78bfa44', borderRadius: '10px', padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '300px' },
};

const ts = {
  testBox: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '20px', padding: '2.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
  },
  instruction: { color: 'white', fontSize: '1.1rem', fontWeight: '600', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 64px)', gap: '10px' },
  cell: { width: '64px', height: '64px', borderRadius: '10px', transition: 'all 0.2s' },
  actionBtn: { border: 'none', borderRadius: '12px', padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em' },
  progressRow: { display: 'flex', gap: '8px' },
  progressDot: { width: '32px', height: '4px', borderRadius: '2px', transition: 'background 0.3s' },
  digitRow: { display: 'flex', gap: '0.75rem' },
  digit: {
    fontSize: '2.5rem', color: '#a78bfa', fontWeight: '800',
    backgroundColor: '#1a2540', border: '1px solid #a78bfa33',
    padding: '0.5rem 1rem', borderRadius: '12px', minWidth: '60px', textAlign: 'center',
    boxShadow: '0 0 20px rgba(167,139,250,0.15)',
  },
  textInput: {
    backgroundColor: '#1a2540', border: '1px solid #ffffff20',
    borderRadius: '12px', padding: '0.85rem 1rem',
    color: 'white', fontSize: '1.2rem', width: '100%',
    outline: 'none', textAlign: 'center', boxSizing: 'border-box',
  },
  wordList: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' },
  wordChip: {
    backgroundColor: '#f59e0b15', color: '#f59e0b',
    border: '1px solid #f59e0b33',
    padding: '0.5rem 1.25rem', borderRadius: '20px',
    fontSize: '1.05rem', fontWeight: '600',
  },
  resultBox: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  resultScore: { fontSize: '2.5rem', fontWeight: '800' },
  resultDetail: { color: '#ffffff40', fontSize: '0.95rem' },
};

export default Tests;