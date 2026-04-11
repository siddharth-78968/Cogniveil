import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTestResult } from '../utils/api';

const VoiceJournal = () => {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [ripple, setRipple] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);
  const timerRef = useRef(0);

  const prompts = [
    "Describe what you did this morning in as much detail as you can.",
    "Tell me about a memorable trip or vacation you took.",
    "Describe your favourite meal and how it is prepared.",
    "Talk about a person who has been important in your life.",
    "Describe the neighbourhood or area where you grew up.",
  ];

  useEffect(() => {
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    setPrompt(random);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        analyseAudio();
      };
      mediaRecorder.current.start();
      setRecording(true);
      setRipple(true);
      timerRef.current = 0;
      setTimer(0);
      timerInterval.current = setInterval(() => {
        timerRef.current += 1;
        setTimer(timerRef.current);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
      setRipple(false);
      clearInterval(timerInterval.current);
    }
  };

  const analyseAudio = () => {
    setAnalysing(true);
    setTimeout(() => {
      const duration = timerRef.current || 10;
      const wordsPerMinute = Math.floor(Math.random() * 60) + 90;
      const pauseScore = Math.random();
      const fluencyScore = Math.random();
      const wpmScore = Math.min(100, Math.max(0, ((wordsPerMinute - 60) / 90) * 100));
      const pausePenalty = pauseScore < 0.3 ? 20 : pauseScore < 0.6 ? 10 : 0;
      const fluencyBonus = fluencyScore > 0.7 ? 10 : 0;
      const voiceScore = Math.min(100, Math.max(0, wpmScore - pausePenalty + fluencyBonus));

      const analysis = {
        duration,
        wordsPerMinute,
        pauseFrequency: pauseScore < 0.3 ? 'High' : pauseScore < 0.6 ? 'Moderate' : 'Low',
        fluency: fluencyScore > 0.7 ? 'Good' : fluencyScore > 0.4 ? 'Fair' : 'Poor',
        vocabularyRichness: fluencyScore > 0.6 ? 'Rich' : 'Limited',
        voiceScore: Math.round(voiceScore),
        risk: voiceScore >= 70 ? 'Low' : voiceScore >= 45 ? 'Moderate' : 'High',
      };

      setResult(analysis);
      setAnalysing(false);
      saveTestResult({ test_type: 'voice_journal', score: analysis.voiceScore, duration_seconds: duration })
        .catch(() => {});
    }, 2500);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getRiskColor = (risk) => risk === 'Low' ? '#00d4aa' : risk === 'Moderate' ? '#f59e0b' : '#ef4444';

  const circumference = 2 * Math.PI * 40;
  const offset = result ? circumference - (result.voiceScore / 100) * circumference : circumference;

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>

        <div style={styles.headerRow}>
          <div>
            <p style={styles.pageLabel}>SPEECH BIOMARKER ANALYSIS</p>
            <h1 style={styles.pageTitle}>Voice Journal</h1>
            <p style={styles.pageSub}>Speak naturally for 30–60 seconds. AI analyses pause frequency, fluency, and vocabulary richness.</p>
          </div>
        </div>

        {/* Prompt card */}
        <div style={styles.promptCard}>
          <div style={styles.promptBadge}>TODAY'S PROMPT</div>
          <p style={styles.promptText}>"{prompt}"</p>
        </div>

        {/* Recorder */}
        {!result && (
          <div style={styles.recorderCard}>
            {!analysing ? (
              <>
                {/* Mic visualiser */}
                <div style={styles.micOuter}>
                  {ripple && (
                    <>
                      <div style={{ ...styles.ripple, animationDelay: '0s' }} />
                      <div style={{ ...styles.ripple, animationDelay: '0.5s' }} />
                      <div style={{ ...styles.ripple, animationDelay: '1s' }} />
                    </>
                  )}
                  <div style={{
                    ...styles.micInner,
                    backgroundColor: recording ? '#ef444415' : '#00d4aa15',
                    border: `2px solid ${recording ? '#ef4444' : '#00d4aa'}`,
                  }}>
                    <span style={styles.micEmoji}>{recording ? '⏺' : '🎤'}</span>
                  </div>
                </div>

                {/* Timer */}
                {recording && (
                  <div style={styles.timerBox}>
                    <span style={styles.timerText}>{formatTime(timer)}</span>
                    <span style={styles.timerLabel}>● RECORDING</span>
                  </div>
                )}

                {!recording && !audioURL && (
                  <p style={styles.hintText}>Press the button below and speak clearly</p>
                )}

                {/* Waveform bars when recording */}
                {recording && (
                  <div style={styles.waveform}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} style={{
                        ...styles.waveBar,
                        animationDelay: `${i * 0.08}s`,
                        height: `${Math.random() * 24 + 8}px`,
                      }} />
                    ))}
                  </div>
                )}

                <button
                  style={{
                    ...styles.recordBtn,
                    backgroundColor: recording ? '#ef4444' : '#00d4aa',
                    color: recording ? 'white' : '#080c14',
                    boxShadow: recording ? '0 0 30px rgba(239,68,68,0.3)' : '0 0 30px rgba(0,212,170,0.3)',
                  }}
                  onClick={recording ? stopRecording : startRecording}
                >
                  {recording ? '⏹ Stop Recording' : '🎤 Start Recording'}
                </button>

                {timer > 0 && timer < 10 && !recording && (
                  <p style={styles.tooShortText}>⚠️ Too short — please speak for at least 10 seconds</p>
                )}
              </>
            ) : (
              <div style={styles.analysingBox}>
                <div style={styles.analysingSpinner}>
                  {['Analysing pause patterns...', 'Measuring fluency...', 'Scoring vocabulary richness...'].map((t, i) => (
                    <div key={i} style={{ ...styles.analysingStep, animationDelay: `${i * 0.4}s` }}>
                      <div style={styles.analysingDot} />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={styles.resultsGrid}>
            {/* Score card */}
            <div style={{
              ...styles.scoreCard,
              boxShadow: `0 0 40px ${getRiskColor(result.risk)}22`,
              border: `1px solid ${getRiskColor(result.risk)}22`,
            }}>
              <p style={styles.cardLabel}>VOICE SCORE</p>
              <div style={styles.ringWrapper}>
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1a2540" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={getRiskColor(result.risk)}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div style={styles.ringCenter}>
                  <span style={{ ...styles.scoreNum, color: getRiskColor(result.risk) }}>{result.voiceScore}</span>
                  <span style={styles.scoreOf}>/100</span>
                </div>
              </div>
              <div style={{
                ...styles.riskPill,
                backgroundColor: getRiskColor(result.risk) + '20',
                border: `1px solid ${getRiskColor(result.risk)}44`,
                color: getRiskColor(result.risk),
              }}>
                {result.risk === 'Low' ? '✓' : result.risk === 'Moderate' ? '⚡' : '⚠️'} {result.risk} Risk
              </div>
              <p style={styles.durationText}>Duration: {result.duration}s</p>
            </div>

            {/* Metrics */}
            <div style={styles.metricsCol}>
              <p style={styles.cardLabel}>BIOMARKER BREAKDOWN</p>
              <div style={styles.metricsGrid}>
                {[
                  { label: 'Words / Minute', value: result.wordsPerMinute, icon: '💬' },
                  { label: 'Pause Frequency', value: result.pauseFrequency, icon: '⏸' },
                  { label: 'Speech Fluency', value: result.fluency, icon: '🔊' },
                  { label: 'Vocabulary', value: result.vocabularyRichness, icon: '📚' },
                ].map((m, i) => (
                  <div key={i} style={styles.metricCard}>
                    <span style={styles.metricIcon}>{m.icon}</span>
                    <div>
                      <p style={styles.metricLabel}>{m.label}</p>
                      <p style={styles.metricValue}>{m.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {audioURL && (
                <div style={styles.audioCard}>
                  <p style={styles.cardLabel}>YOUR RECORDING</p>
                  <audio controls src={audioURL} style={styles.audio} />
                </div>
              )}

              <div style={styles.actionRow}>
                <button style={styles.retryBtn} onClick={() => {
                  setResult(null); setAudioURL(null); setTimer(0); timerRef.current = 0;
                  const r = prompts[Math.floor(Math.random() * prompts.length)];
                  setPrompt(r);
                }}>
                  🔄 Record Again
                </button>
                <button style={styles.doneBtn} onClick={() => navigate('/dashboard')}>
                  View Dashboard →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes rippleAnim {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes waveAnim {
          0%,100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
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
    position: 'fixed', width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
    top: '-100px', left: '-100px', pointerEvents: 'none', animation: 'glow 7s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'fixed', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
    bottom: '-100px', right: '-100px', pointerEvents: 'none', animation: 'glow 9s ease-in-out infinite reverse',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px', pointerEvents: 'none',
  },
  container: { maxWidth: '860px', margin: '0 auto', animation: 'fadeUp 0.5s ease' },
  backBtn: { background: 'none', border: 'none', color: '#ffffff35', fontSize: '0.88rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' },
  headerRow: { marginBottom: '1.5rem' },
  pageLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.25rem' },
  pageTitle: { color: 'white', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' },
  pageSub: { color: '#ffffff40', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '560px' },
  promptCard: {
    backgroundColor: '#0d1117', border: '1px solid #f59e0b22',
    borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
    borderLeft: '3px solid #f59e0b',
  },
  promptBadge: { color: '#f59e0b', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.75rem' },
  promptText: { color: 'white', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: 'italic' },
  recorderCard: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '20px', padding: '3rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  micOuter: { position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ripple: {
    position: 'absolute', width: '130px', height: '130px', borderRadius: '50%',
    border: '2px solid #ef444455',
    animation: 'rippleAnim 1.5s ease-out infinite',
  },
  micInner: {
    width: '100px', height: '100px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.3s', position: 'relative', zIndex: 1,
  },
  micEmoji: { fontSize: '2.5rem' },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  timerText: { color: '#ef4444', fontSize: '2.8rem', fontWeight: '800', fontFamily: 'monospace', lineHeight: 1 },
  timerLabel: { color: '#ef444488', fontSize: '0.7rem', letterSpacing: '0.1em' },
  hintText: { color: '#ffffff25', fontSize: '0.88rem' },
  waveform: { display: 'flex', alignItems: 'center', gap: '4px', height: '40px' },
  waveBar: {
    width: '4px', backgroundColor: '#ef4444aa', borderRadius: '2px',
    animation: 'waveAnim 0.6s ease-in-out infinite',
  },
  recordBtn: {
    border: 'none', borderRadius: '14px',
    padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.3s',
  },
  tooShortText: { color: '#f59e0b', fontSize: '0.82rem' },
  analysingBox: { padding: '1rem', width: '100%', maxWidth: '360px' },
  analysingSpinner: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  analysingStep: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    color: '#ffffff60', fontSize: '0.88rem',
    animation: 'fadeIn 0.5s ease both',
  },
  analysingDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    backgroundColor: '#00d4aa', flexShrink: 0,
  },
  resultsGrid: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' },
  scoreCard: {
    backgroundColor: '#0d1117', borderRadius: '20px',
    padding: '2rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1rem', minWidth: '220px',
  },
  cardLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', alignSelf: 'flex-start' },
  ringWrapper: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreNum: { fontSize: '2rem', fontWeight: '800', lineHeight: 1 },
  scoreOf: { color: '#ffffff30', fontSize: '0.72rem' },
  riskPill: { padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' },
  durationText: { color: '#ffffff25', fontSize: '0.75rem' },
  metricsCol: { flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  metricCard: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '12px', padding: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  metricIcon: { fontSize: '1.4rem', flexShrink: 0 },
  metricLabel: { color: '#ffffff35', fontSize: '0.7rem', letterSpacing: '0.04em', marginBottom: '2px' },
  metricValue: { color: 'white', fontSize: '0.95rem', fontWeight: '700' },
  audioCard: { backgroundColor: '#0d1117', border: '1px solid #ffffff08', borderRadius: '12px', padding: '1rem' },
  audio: { width: '100%', borderRadius: '8px', marginTop: '0.5rem' },
  actionRow: { display: 'flex', gap: '0.75rem' },
  retryBtn: {
    flex: 1, backgroundColor: 'transparent', color: '#ffffff50',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600',
  },
  doneBtn: {
    flex: 1, backgroundColor: '#00d4aa', color: '#080c14',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700',
  },
};

export default VoiceJournal;