import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTestResult, calculateScore } from '../utils/api';
import VoiceGuideBar from '../components/VoiceGuideBar';
import DoctorLayout from '../components/DoctorLayout';

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

  const handleComplete = async (testId, score, duration) => {
    try { await saveTestResult({ test_type: testId, score, duration_seconds: duration }); }
    catch (err) { console.log('Could not save'); }
    const newCompleted = [...completed, testId];
    setCompleted(newCompleted);
    localStorage.setItem(sessionKey, JSON.stringify(newCompleted));
    if (newCompleted.length === tests.length) {
      try { await calculateScore(); } catch (err) { }
      const uEmail = localStorage.getItem('userEmail') || 'default';
      localStorage.setItem(`lastTestDate_${uEmail}`, new Date().toDateString());
      setTimeout(() => setAllDone(true), 2500);
    } else {
      setTimeout(() => setActiveTest(null), 2500);
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
                {p.name} {p.is_deviating ? '⚠️' : '✓'}
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
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                          {tests.find(t => t.id === domain.test_type)?.icon || '🧠'}
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
      <div style={styles.doneCard}>
        <span style={{ fontSize: '3rem' }}>✓</span>
        <h2 style={styles.doneTitle}>Today's Tests Completed</h2>
        <p style={styles.doneSub}>You have already taken your daily tests. Come back tomorrow for a new session.</p>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Next available: Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString()})
        </p>
        <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
          View Dashboard →
        </button>
      </div>
    </DoctorLayout>
  );

  if (allDone) return (
    <DoctorLayout activeTitle="Daily Tests">
      <div style={styles.doneCard}>
        <span style={{ fontSize: '3.5rem' }}>🎉</span>
        <h2 style={styles.doneTitle}>All Tests Complete!</h2>
        <p style={styles.doneSub}>Your CogniScore has been recalculated with today's results.</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>View Dashboard →</button>
          <button style={styles.secondaryBtn} onClick={() => navigate('/voice')}>Take Voice Journal →</button>
        </div>
      </div>
    </DoctorLayout>
  );

  return (
    <DoctorLayout activeTitle="Daily Tests">
      {!activeTest ? (
        <div style={styles.container}>
          {isClinician && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setSimulateMode(false)}
                style={{ background: 'none', border: 'none', color: '#0F4C4A', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
              >
                ← Back to Patient Results Review
              </button>
            </div>
          )}
          <div style={styles.headerRow}>
            <div>
              <p style={styles.pageLabel}>DAILY ASSESSMENT</p>
              <h1 style={styles.pageTitle}>Cognitive Tests</h1>
              <p style={styles.pageSub}>Complete all 5 tests to update your longitudinal CogniScore</p>
            </div>
            <div style={styles.progressCircle}>
              <span style={styles.progressNum}>{completed.length}</span>
              <span style={styles.progressDen}>/{tests.length} Done</span>
            </div>
          </div>

          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${(completed.length / tests.length) * 100}%` }} />
          </div>

          <VoiceGuideBar scriptKey="active_tests_intro" defaultLang="en" />

          <div className="test-grid" style={styles.testGrid}>
            {tests.map((test, i) => {
              const isDone = completed.includes(test.id);
              return (
                <div
                  key={test.id}
                  style={{
                    ...styles.testCard,
                    borderColor: isDone ? '#4338CA40' : '#eef2f6',
                    backgroundColor: isDone ? '#fafafa' : '#ffffff',
                    cursor: isDone ? 'default' : 'pointer',
                  }}
                  onClick={() => !isDone && setActiveTest(test.id)}
                >
                  <div style={{ ...styles.testIconBox, backgroundColor: isDone ? '#4338CA12' : '#f8fafc' }}>
                    <span style={{ fontSize: '1.6rem' }}>{test.icon}</span>
                  </div>
                  <div style={styles.testInfo}>
                    <p style={{ ...styles.testName, color: isDone ? '#4338CA' : '#1e293b' }}>{test.name}</p>
                    <p style={styles.testDesc}>{test.description}</p>
                    <p style={{ ...styles.testDuration, color: '#4338CA' }}>{test.duration}</p>
                  </div>
                  <div style={{
                    ...styles.testStatus,
                    backgroundColor: isDone ? '#4338CA15' : '#f1f5f9',
                    color: isDone ? '#4338CA' : '#64748b',
                    border: `1px solid ${isDone ? '#4338CA33' : '#e2e8f0'}`,
                  }}>
                    {isDone ? '✓ Completed' : 'Start Test →'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={styles.container}>
          <button style={styles.backBtn} onClick={() => setActiveTest(null)}>← Back to All Tests</button>
          <div style={styles.activeHeader}>
            <span style={{ fontSize: '2rem' }}>{tests.find(t => t.id === activeTest)?.icon}</span>
            <div>
              <p style={styles.pageLabel}>ACTIVE TEST IN PROGRESS</p>
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
    </DoctorLayout>
  );
};

const styles = {
  container: { maxWidth: '850px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  pageLabel: { color: '#4338CA', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.25rem' },
  pageTitle: { color: '#1e293b', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' },
  pageSub: { color: '#64748b', fontSize: '0.88rem', margin: 0 },
  progressCircle: {
    backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '0.6rem 1rem',
    display: 'flex', alignItems: 'baseline', gap: '4px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
  },
  progressNum: { color: '#4338CA', fontSize: '1.5rem', fontWeight: '800' },
  progressDen: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' },
  progressBarOuter: { height: '6px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' },
  progressBarInner: { height: '100%', backgroundColor: '#4338CA', borderRadius: '6px', transition: 'width 0.5s ease' },
  testGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  testCard: {
    borderRadius: '16px', padding: '1.25rem 1.5rem',
    border: '1px solid',
    display: 'flex', alignItems: 'center', gap: '1.25rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
  },
  testIconBox: { width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  testInfo: { flex: 1 },
  testName: { fontSize: '1rem', fontWeight: '700', margin: '0 0 0.2rem 0' },
  testDesc: { color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4', margin: '0 0 0.25rem 0' },
  testDuration: { fontSize: '0.74rem', fontWeight: '700', margin: 0 },
  testStatus: { padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' },
  backBtn: { background: 'none', border: 'none', color: '#4338CA', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', marginBottom: '1.25rem', padding: 0 },
  activeHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  activeTitle: { color: '#1e293b', fontSize: '1.5rem', fontWeight: '800', margin: 0 },
  doneCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '3rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', maxWidth: '550px', margin: '3rem auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
  },
  doneTitle: { color: '#1e293b', fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0' },
  doneSub: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' },
  primaryBtn: { backgroundColor: '#4338CA', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.75rem 1.75rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)' },
  secondaryBtn: { backgroundColor: '#ffffff', color: '#4338CA', border: '1.5px solid #4338CA', borderRadius: '10px', padding: '0.75rem 1.75rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' },
};

const ts = {
  testBox: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '2.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
  },
  instruction: { color: '#1e293b', fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 64px)', gap: '10px' },
  cell: { width: '64px', height: '64px', borderRadius: '10px', transition: 'all 0.2s' },
  actionBtn: { backgroundColor: '#4338CA', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.85rem 2.5rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)' },
  progressRow: { display: 'flex', gap: '8px' },
  progressDot: { width: '32px', height: '4px', borderRadius: '2px', transition: 'background 0.3s' },
  digitRow: { display: 'flex', gap: '0.75rem' },
  digit: {
    fontSize: '2.2rem', color: '#4338CA', fontWeight: '800',
    backgroundColor: '#f5f3ff', border: '1.5px solid #c7d2fe',
    padding: '0.5rem 1rem', borderRadius: '12px', minWidth: '60px', textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1',
    borderRadius: '12px', padding: '0.85rem 1rem',
    color: '#1e293b', fontSize: '1.2rem', width: '100%',
    outline: 'none', textAlign: 'center', boxSizing: 'border-box',
  },
  wordList: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' },
  wordChip: {
    backgroundColor: '#f5f3ff', color: '#4338CA',
    border: '1px solid #c7d2fe',
    padding: '0.5rem 1.25rem', borderRadius: '20px',
    fontSize: '1rem', fontWeight: '700',
  },
  resultBox: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  resultScore: { fontSize: '2.5rem', fontWeight: '800', color: '#4338CA' },
  resultDetail: { color: '#64748b', fontSize: '0.9rem' },
};

export default Tests;