import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyseVoice, calculateScore } from '../utils/api';
import VoiceGuideBar from '../components/VoiceGuideBar';
import DoctorLayout from '../components/DoctorLayout';

const VoiceJournal = () => {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [ripple, setRipple] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [langInfo, setLangInfo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [simulateMic, setSimulateMic] = useState(false);

  // Clinician Inspection State
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [clinicianVoiceData, setClinicianVoiceData] = useState(null);
  const [loadingClinician, setLoadingClinician] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isClinician = currentUser?.is_caregiver === true;

  useEffect(() => {
    if (isClinician) {
      fetchClinicianVoiceData();
    }
  }, [isClinician]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchClinicianVoiceData = async () => {
    try {
      setLoadingClinician(true);
      const { getClinicianPatients } = await import('../utils/api');
      const res = await getClinicianPatients();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
        const pId = res.data[0].id;
        setSelectedPatientId(pId);
        loadPatientVoice(pId);
      }
    } catch (err) {
      console.log('Error loading clinician voice patients:', err.message);
    } finally {
      setLoadingClinician(false);
    }
  };

  const loadPatientVoice = async (patientId) => {
    try {
      setSelectedPatientId(patientId);
      setLoadingClinician(true);
      const { getClinicianPatientVoice } = await import('../utils/api');
      const res = await getClinicianPatientVoice(patientId);
      setClinicianVoiceData(res.data);
    } catch (err) {
      console.log('Error loading patient voice:', err.message);
    } finally {
      setLoadingClinician(false);
    }
  };

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);
  const timerRef = useRef(0);
  const speechRecognition = useRef(null);
  const transcriptRef = useRef('');
  const analyser = useRef(null);
  const audioContext = useRef(null);
  const meterInterval = useRef(null);
  const rmsSamples = useRef([]);

const prompts = useMemo(() => [
  "Describe what you did this morning in as much detail as you can.",
  "Tell me about a memorable trip or vacation you took.",
  "Describe your favourite meal and how it is prepared.",
  "Talk about a person who has been important in your life.",
  "Describe the neighbourhood or area where you grew up.",
], []);
  useEffect(() => {
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    setPrompt(random);
  }, [prompts]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      mediaRecorder.current = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : undefined);
      audioChunks.current = [];
      rmsSamples.current = [];
      transcriptRef.current = '';
      setTranscript('');
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext.current = new AudioContextClass();
        const source = audioContext.current.createMediaStreamSource(stream);
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 2048;
        source.connect(analyser.current);
        const samples = new Uint8Array(analyser.current.fftSize);
        meterInterval.current = setInterval(() => {
          analyser.current.getByteTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, value) => sum + Math.pow((value - 128) / 128, 2), 0) / samples.length);
          rmsSamples.current.push(rms);
        }, 100);
      }
      mediaRecorder.current.ondataavailable = (e) => { audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        analyseAudio(audioBlob);
      };
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Recognition) {
        speechRecognition.current = new Recognition();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = false;
        speechRecognition.current.lang = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', bn: 'bn-IN', es: 'es-ES' }[selectedLang] || 'en-IN';
        speechRecognition.current.onresult = (event) => {
          let text = transcriptRef.current;
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            if (event.results[i].isFinal) text += `${event.results[i][0].transcript} `;
          }
          transcriptRef.current = text.trim();
          setTranscript(transcriptRef.current);
        };
        speechRecognition.current.start();
      }
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
      if (speechRecognition.current) speechRecognition.current.stop();
      if (meterInterval.current) clearInterval(meterInterval.current);
      if (audioContext.current) audioContext.current.close();
      setRecording(false);
      setRipple(false);
      clearInterval(timerInterval.current);
    }
  };

  const analyseAudio = async (audioBlob) => {
    setAnalysing(true);
    try {
      const duration = timerRef.current || 10;
      const samples = rmsSamples.current;
      const activityThreshold = Math.max(0.012, (samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)) * 0.55);
      const active = samples.map(value => value >= activityThreshold);
      let pauseCount = 0;
      let silenceFrames = 0;
      active.forEach(isActive => {
        if (isActive) silenceFrames = 0;
        else {
          silenceFrames += 1;
          if (silenceFrames === 5) pauseCount += 1; // 0.5 seconds at 100 ms sampling
        }
      });
      const features = {
        duration_seconds: duration,
        speech_activity_ratio: active.filter(Boolean).length / Math.max(active.length, 1),
        pause_count: pauseCount,
        mean_rms: samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1),
      };
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice-journal-${Date.now()}.webm`);
      formData.append('features_json', JSON.stringify(features));
      formData.append('transcript', transcriptRef.current);
      formData.append('language_hint', selectedLang);
      const response = await analyseVoice(formData);
      const analysis = response.data;
      if (analysis.transcript) setTranscript(analysis.transcript);
      setLangInfo({ detected_language: analysis.detected_language, whisper_mode: analysis.analysis_method });
      setResult({
        duration: analysis.duration_seconds,
        wordsPerMinute: analysis.words_per_minute ?? 'Unavailable',
        pauseFrequency: `${analysis.pause_rate_per_minute} / min`,
        fluency: `${Math.round(analysis.speech_activity_ratio * 100)}% active speech`,
        vocabularyRichness: analysis.vocabulary_richness === null ? 'Unavailable' : `${Math.round(analysis.vocabulary_richness * 100)}% unique`,
        voiceScore: analysis.voice_score,
        risk: analysis.risk_level,
        transcriptAvailable: analysis.transcript_available,
        transcriptionEngine: analysis.transcription?.engine || 'browser-speech-recognition',
      });
      // Refresh today's single session score so the voice task contributes to
      // the same longitudinal baseline record as today's cognitive tasks.
      await calculateScore().catch(() => {});
      setAnalysing(false);
    } catch (e) {
      console.error('Voice analysis error:', e);
      setAnalysing(false);
      alert('Voice analysis could not be completed. Please check the backend connection and try again.');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getRiskColor = (risk) => risk === 'Low' ? '#00d4aa' : risk === 'Moderate' ? '#f59e0b' : '#ef4444';

  const circumference = 2 * Math.PI * 40;
  const offset = result ? circumference - (result.voiceScore / 100) * circumference : circumference;

  // ── CLINICIAN VIEWPORT: Acoustic Voice Review ───────────────────────────
  if (isClinician && !simulateMic) {
    const profile = clinicianVoiceData?.acoustic_profile;
    return (
      <DoctorLayout activeTitle="Acoustic Voice Journal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F4C4A' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', color: '#287C78' }}>
                  CLINICIAN WORKSPACE · ACOUSTIC SPEECH TELEMETRY
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                Patient Acoustic Speech Biomarkers
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Analyze temporal speech hesitation, pause-to-speech ratio, articulation syllable cadence, and formant dispersion.
              </p>
            </div>

            <button
              onClick={() => setSimulateMic(true)}
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
              🎙️ Interactive Mic Test →
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
                onClick={() => loadPatientVoice(p.id)}
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

          {/* Acoustic Feature Grid */}
          {loadingClinician ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading speech acoustic biomarkers...</div>
          ) : profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b' }}>MEAN PAUSE DURATION</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: profile.mean_pause_duration_ms > 600 ? '#C94C4C' : '#1e293b' }}>
                    {profile.mean_pause_duration_ms} <span style={{ fontSize: '0.8rem' }}>ms</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Normative: &lt; 500 ms</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b' }}>PAUSE-TO-SPEECH RATIO</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: profile.pause_to_speech_ratio > 0.25 ? '#C94C4C' : '#1e293b' }}>
                    {Math.round(profile.pause_to_speech_ratio * 100)}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Normative: &lt; 20%</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b' }}>ARTICULATION RATE</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: profile.articulation_rate_syl_per_sec < 4.0 ? '#D97745' : '#1e293b' }}>
                    {profile.articulation_rate_syl_per_sec} <span style={{ fontSize: '0.8rem' }}>syl/sec</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Normative: &gt; 4.5 syl/sec</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b' }}>FORMANT DISPERSION (F1/F2)</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F4C4A' }}>
                    {profile.formant_dispersion_f1_f2_ratio}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Vocal tract vowel space ratio</span>
                </div>
              </div>

              {/* Longitudinal Audio Transcripts Table */}
              <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>
                  Recorded Speech Transcripts & Fluency Telemetry
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {profile.transcripts_history?.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#4338CA' }}>{t.date}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#E0FCFF', color: '#0F4C4A' }}>
                          Fluency Score: {t.fluency_score} / 100
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Prompt: "{t.prompt}"</p>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: 'italic', color: '#1e293b', backgroundColor: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #eef2f6' }}>
                        "{t.transcript}"
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.74rem', color: '#64748b' }}>
                        <span>⏱ Duration: {t.duration_seconds}s</span>
                        <span>⏸ Pauses: {t.pause_count} hesitations</span>
                        <span>📈 Mean Pause: {t.mean_pause_ms}ms</span>
                        <span>⚡ Cadence: {t.speech_rate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No voice records available for selected patient.</div>
          )}
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout activeTitle="Acoustic Voice Journal">
      <div style={styles.container}>
        {isClinician && (
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={() => setSimulateMic(false)}
              style={{ background: 'none', border: 'none', color: '#0F4C4A', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
            >
              ← Back to Patient Voice Biomarkers Review
            </button>
          </div>
        )}
        <div style={styles.headerRow}>
          <div>
            <p style={styles.pageLabel}>SPEECH BIOMARKER ANALYSIS</p>
            <h1 style={styles.pageTitle}>Voice Journal & Acoustic Screening</h1>
            <p style={styles.pageSub}>Speak naturally in your preferred language. AI automatically routes to multilingual Whisper model.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>SELECT LANGUAGE</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                color: '#4338CA',
                padding: '0.5rem 0.8rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
              <option value="ta">Tamil (ta)</option>
              <option value="te">Telugu (te)</option>
              <option value="es">Spanish (es)</option>
              <option value="mr">Marathi (mr)</option>
              <option value="bn">Bengali (bn)</option>
            </select>
            {langInfo && (
              <span style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: '600' }}>
                🌐 Routed to: {langInfo.whisper_mode}
              </span>
            )}
          </div>
        </div>

        <VoiceGuideBar scriptKey="voice_journal_intro" defaultLang={selectedLang} />

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
                  <p style={{ color: '#ffffff45', fontSize: '0.76rem', lineHeight: 1.5, marginTop: '0.75rem' }}>
                    {result.transcriptAvailable
                      ? `Transcript captured (${transcript.split(/\s+/).filter(Boolean).length} words) via ${result.transcriptionEngine}.`
                      : 'No browser transcript was available; the score uses measured speech activity and pauses only.'}
                  </p>
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
    </DoctorLayout>
  );
};

const styles = {
  container: { maxWidth: '850px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  pageLabel: { color: '#4338CA', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.25rem' },
  pageTitle: { color: '#1e293b', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' },
  pageSub: { color: '#64748b', fontSize: '0.88rem', lineHeight: '1.4', maxWidth: '560px', margin: 0 },
  promptCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
    borderLeft: '4px solid #4338CA',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  promptBadge: { color: '#4338CA', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.5rem' },
  promptText: { color: '#1e293b', fontSize: '1.1rem', lineHeight: '1.6', fontStyle: 'italic', fontWeight: '600', margin: 0 },
  recorderCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '3.5rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
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
    backgroundColor: '#f5f3ff', border: '2px solid #4338CA',
  },
  micEmoji: { fontSize: '2.5rem' },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  timerText: { color: '#ef4444', fontSize: '2.8rem', fontWeight: '800', fontFamily: 'monospace', lineHeight: 1 },
  timerLabel: { color: '#ef4444', fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: '800' },
  hintText: { color: '#64748b', fontSize: '0.88rem', fontWeight: '600' },
  waveform: { display: 'flex', alignItems: 'center', gap: '4px', height: '40px' },
  waveBar: {
    width: '4px', backgroundColor: '#4338CA', borderRadius: '2px',
    animation: 'waveAnim 0.6s ease-in-out infinite',
  },
  recordBtn: {
    border: 'none', borderRadius: '12px',
    padding: '0.9rem 2.5rem', fontSize: '0.95rem', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.3s',
  },
  tooShortText: { color: '#ef4444', fontSize: '0.82rem', fontWeight: '700' },
  analysingBox: { padding: '1rem', width: '100%', maxWidth: '360px' },
  analysingSpinner: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  analysingStep: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    color: '#475569', fontSize: '0.88rem', fontWeight: '600',
    animation: 'fadeIn 0.5s ease both',
  },
  analysingDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    backgroundColor: '#4338CA', flexShrink: 0,
  },
  resultsGrid: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' },
  scoreCard: {
    backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #eef2f6',
    padding: '2rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1rem', minWidth: '240px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  cardLabel: { color: '#94a3b8', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', alignSelf: 'flex-start' },
  ringWrapper: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreNum: { fontSize: '2.2rem', fontWeight: '800', lineHeight: 1 },
  scoreOf: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' },
  riskPill: { padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' },
  durationText: { color: '#94a3b8', fontSize: '0.75rem' },
  metricsCol: { flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  metricCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '14px', padding: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
  },
  metricIcon: { fontSize: '1.4rem', flexShrink: 0 },
  metricLabel: { color: '#64748b', fontSize: '0.72rem', fontWeight: '700', marginBottom: '2px' },
  metricValue: { color: '#1e293b', fontSize: '0.95rem', fontWeight: '800' },
  audioCard: { backgroundColor: '#ffffff', border: '1px solid #eef2f6', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)' },
  audio: { width: '100%', borderRadius: '8px', marginTop: '0.5rem' },
  actionRow: { display: 'flex', gap: '0.75rem' },
  retryBtn: {
    flex: 1, backgroundColor: '#ffffff', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700',
  },
  doneBtn: {
    flex: 1, backgroundColor: '#4338CA', color: '#ffffff',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
};

export default VoiceJournal;
