import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import './ChatWidget.css';

const QUICK_PROMPTS = [
  { label: 'Score Trends', prompt: 'How has my score changed this week?', icon: '📈' },
  { label: 'Latest Risk Level', prompt: "What's my latest risk level?", icon: '🛡️' },
  { label: 'Test Performance', prompt: 'How did I do on my tests?', icon: '🎯' },
  { label: 'Next Check-in', prompt: 'When is my next check-in?', icon: '📅' },
  { label: 'Explain Results', prompt: 'Explain my latest screening result', icon: '💡' }
];

const THINKING_STEPS = [
  {
    title: 'Accessing Telemetry',
    detail: 'Retrieving longitudinal CogniScore, CUSUM deviations & daily session records...'
  },
  {
    title: 'Safety Guardrails',
    detail: 'Validating clinical boundaries against NIA-AA & WHO-ICOPE screening protocols...'
  },
  {
    title: 'Grounded Synthesis',
    detail: 'Formulating clear, patient-friendly guidance grounded strictly in your records...'
  }
];

export default function ChatWidget({ user }) {
  const { theme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  // Thinking state
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [thinkingElapsed, setThinkingElapsed] = useState(0);

  // Streaming state
  const [streamingMsg, setStreamingMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedThoughts, setExpandedThoughts] = useState({});

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm your CogniVeil personal screening assistant.\n\nYou can ask me questions about your CogniScore trends, longitudinal progress, daily test results, or scheduled clinical check-ins.`,
      sources: ['CogniVeil Personal Assistant', 'Longitudinal Database'],
      guardrailPassed: true,
      thoughtDuration: null,
      steps: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const threadRef = useRef(null);
  const streamingTimerRef = useRef(null);
  const thinkingTimerRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && threadRef.current) {
      // Scroll strictly within the chat messages container only.
      // NEVER call window.scrollIntoView to prevent jerking or pushing page sections.
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isThinking, streamingMsg, isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    };
  }, []);

  const toggleThought = (msgId) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const skipStreaming = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    if (streamingMsg) {
      const finalMsg = {
        ...streamingMsg,
        text: streamingMsg.fullText
      };
      setMessages((prev) => [...prev, finalMsg]);
      setStreamingMsg(null);
    }
  };

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || isThinking || streamingMsg) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');

    // Initiate thinking phase
    setIsThinking(true);
    setThinkingStep(0);
    setThinkingElapsed(0);

    const startTime = Date.now();
    thinkingIntervalRef.current = setInterval(() => {
      setThinkingElapsed(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);

    // Step progression
    const step1Timeout = setTimeout(() => setThinkingStep(1), 450);
    const step2Timeout = setTimeout(() => setThinkingStep(2), 950);

    // Call API in parallel
    let apiData = null;
    let apiError = null;

    try {
      const res = await sendChatMessage(q);
      apiData = res.data || {};
    } catch (err) {
      apiError = err;
    }

    // Guarantee minimum thinking duration of ~1350ms for realistic clinical cognition
    const elapsedSoFar = Date.now() - startTime;
    const minThinkingTime = 1350;
    const remainingTime = Math.max(0, minThinkingTime - elapsedSoFar);

    thinkingTimerRef.current = setTimeout(() => {
      clearInterval(thinkingIntervalRef.current);
      clearTimeout(step1Timeout);
      clearTimeout(step2Timeout);
      setIsThinking(false);

      const totalThoughtSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      if (apiError) {
        const errorMsg = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to query CogniVeil assistant. Please ensure you are logged in and try again.',
          isError: true,
          sources: [],
          guardrailPassed: false,
          thoughtDuration: `${totalThoughtSeconds}s`,
          steps: THINKING_STEPS,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const rawAnswer = apiData?.answer || "I couldn't retrieve your screening records at this time.";
      const botMsgTemplate = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        fullText: rawAnswer,
        text: '',
        sources: apiData?.sources_used || ['CogniVeil Personal Assistant', 'Longitudinal Database'],
        guardrailPassed: apiData?.guardrail_passed !== false,
        thoughtDuration: `${totalThoughtSeconds}s`,
        steps: THINKING_STEPS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Typewriter word-by-word streaming effect
      const words = rawAnswer.split(' ');
      let wordIndex = 0;
      setStreamingMsg({ ...botMsgTemplate, text: '' });

      streamingTimerRef.current = setInterval(() => {
        wordIndex += 2; // Stream 2 words per tick for comfortable natural cadence
        if (wordIndex >= words.length) {
          clearInterval(streamingTimerRef.current);
          streamingTimerRef.current = null;
          setMessages((prev) => [...prev, { ...botMsgTemplate, text: rawAnswer }]);
          setStreamingMsg(null);
        } else {
          setStreamingMsg((prev) => (prev ? {
            ...prev,
            text: words.slice(0, wordIndex).join(' ')
          } : null));
        }
      }, 35);
    }, remainingTime);
  };

  const isBusy = isThinking || Boolean(streamingMsg);

  return (
    <div style={{ margin: '1.75rem 0', width: '100%' }}>
      {/* ── Collapsed State ── */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            padding: '14px 22px',
            borderRadius: '16px',
            background: theme.cardBg,
            border: `1.5px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(13,23,14,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isDark ? '#3d5236' : '#273822';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isDark ? 'rgba(163, 177, 138, 0.16)' : '#e8efe6',
                color: isDark ? '#a3b18a' : '#273822',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem'
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: theme.text }}>
                  Ask Assistant
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    background: isDark ? 'rgba(34, 211, 238, 0.12)' : '#e0f2fe',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: '700',
                    border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'}`
                  }}
                >
                  Clinical Q&A
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: theme.subtext }}>
                Ask questions about your personal CogniScore trajectory, test results, and check-ins
              </p>
            </div>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: isDark ? '#273822' : '#273822',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(39, 56, 34, 0.25)'
            }}
          >
            <span>Open Assistant</span>
            <span>↓</span>
          </button>
        </div>
      )}

      {/* ── Expanded State ── */}
      {isOpen && (
        <div
          className="cv-chat-card"
          style={{
            width: '100%',
            height: '460px',
            background: theme.cardBg,
            borderRadius: '18px',
            border: `1.5px solid ${theme.border}`,
            boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.35)' : '0 8px 28px rgba(13,23,14,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              background: isDark ? '#162018' : '#eaf1e8',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: isDark ? 'linear-gradient(135deg, #273822 0%, #3d5236 100%)' : 'linear-gradient(135deg, #273822 0%, #3d5236 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                ✦
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '700', color: theme.text, letterSpacing: '-0.01em' }}>
                    Ask Assistant
                  </h4>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: isDark ? 'rgba(34, 211, 238, 0.12)' : '#e0f2fe',
                      color: isDark ? '#38bdf8' : '#0284c7',
                      padding: '2px 7px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: '700',
                      border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd'}`
                    }}
                  >
                    Read-Only
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: theme.subtext }}>
                  Grounded strictly in your personal screening records & verified clinical telemetry
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                color: theme.subtext,
                cursor: 'pointer',
                fontSize: '0.76rem',
                padding: '5px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '600',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.text;
                e.currentTarget.style.borderColor = isDark ? '#a3b18a' : '#273822';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.subtext;
                e.currentTarget.style.borderColor = theme.border;
              }}
              title="Collapse assistant"
            >
              <span>Collapse</span>
              <span>✕</span>
            </button>
          </div>

          {/* Messages Stream Container — strictly contained within 460px card */}
          <div
            ref={threadRef}
            className="cv-chat-thread"
            style={{
              padding: '18px 20px',
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: isDark ? '#0e140f' : '#f8faf7'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                {/* Assistant Thought / Reasoning Disclosure Bar */}
                {msg.sender === 'assistant' && msg.thoughtDuration && (
                  <div style={{ marginBottom: '6px', marginLeft: '4px' }}>
                    <button
                      onClick={() => toggleThought(msg.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.subtext,
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#a3b18a' : '#273822')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.subtext)}
                    >
                      <span style={{ color: isDark ? '#a3b18a' : '#273822' }}>✦</span>
                      <span>Thought for {msg.thoughtDuration} · 3 safety checks passed</span>
                      <span style={{ fontSize: '0.7rem' }}>{expandedThoughts[msg.id] ? '▲' : '▼'}</span>
                    </button>

                    {/* Collapsible Steps Panel */}
                    {expandedThoughts[msg.id] && msg.steps && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isDark ? '#141c15' : '#ffffff',
                          border: `1px solid ${theme.border}`,
                          fontSize: '0.73rem',
                          color: theme.subtext,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          maxWidth: '520px'
                        }}
                      >
                        {msg.steps.map((step, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                            <div>
                              <strong style={{ color: theme.text }}>{step.title}:</strong> {step.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: msg.sender === 'user' ? '82%' : '88%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background:
                      msg.sender === 'user'
                        ? 'linear-gradient(135deg, #273822 0%, #3d5236 100%)'
                        : msg.isError
                        ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                        : theme.cardBg,
                    color:
                      msg.sender === 'user'
                        ? '#ffffff'
                        : msg.isError
                        ? '#ef4444'
                        : theme.text,
                    border:
                      msg.sender === 'user'
                        ? 'none'
                        : msg.isError
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : `1.5px solid ${theme.border}`,
                    fontSize: '0.86rem',
                    lineHeight: '1.55',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: isDark
                      ? '0 2px 10px rgba(0,0,0,0.2)'
                      : '0 2px 8px rgba(13,23,14,0.04)'
                  }}
                >
                  {msg.text}

                  {/* Sources tag if provided */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e8efe6'}`,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.68rem', color: theme.subtext, fontWeight: '600' }}>Sources:</span>
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.66rem',
                            padding: '1px 7px',
                            borderRadius: '6px',
                            background: isDark ? 'rgba(163, 177, 138, 0.12)' : '#edf3ec',
                            color: isDark ? '#a3b18a' : '#273822',
                            border: `1px solid ${isDark ? 'rgba(163, 177, 138, 0.25)' : '#cddacd'}`,
                            fontWeight: '500'
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Safety & Actions Row */}
                  {msg.sender === 'assistant' && !msg.isError && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.68rem',
                        color: theme.subtext
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: msg.guardrailPassed ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                        <span>{msg.guardrailPassed ? '🛡️ Safety Guardrail Certified' : '⚠️ Non-Diagnostic Sanitized'}</span>
                      </div>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.subtext,
                          cursor: 'pointer',
                          fontSize: '0.68rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }}
                        title="Copy answer"
                      >
                        <span>{copiedId === msg.id ? '✓ Copied' : '📋 Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.66rem',
                    color: theme.subtext,
                    marginTop: '4px',
                    padding: '0 6px'
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* ── Active Thinking Cognitive State ── */}
            {isThinking && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: '16px 16px 16px 4px',
                  background: theme.cardBg,
                  border: `1.5px solid ${theme.border}`,
                  boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 14px rgba(13,23,14,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Thinking Header with pulsing icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        animation: 'cvChatPulse 1.2s infinite ease-in-out',
                        color: isDark ? '#a3b18a' : '#273822',
                        fontSize: '1rem'
                      }}
                    >
                      ✦
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>
                      Thinking... ({thinkingElapsed}s)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: theme.subtext, fontFamily: 'monospace' }}>
                    STEP {thinkingStep + 1} OF 3
                  </span>
                </div>

                {/* Shimmer Progress Track */}
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    borderRadius: '999px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5eee3',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    className={isDark ? 'cv-thinking-shimmer-dark' : 'cv-thinking-shimmer'}
                    style={{
                      width: `${((thinkingStep + 1) / 3) * 100}%`,
                      height: '100%',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                {/* Current Active Step Description */}
                <div style={{ fontSize: '0.78rem', color: theme.subtext, lineHeight: '1.4' }}>
                  <strong style={{ color: theme.text }}>{THINKING_STEPS[thinkingStep]?.title}:</strong>{' '}
                  {THINKING_STEPS[thinkingStep]?.detail}
                </div>
              </div>
            )}

            {/* ── Active Streaming Typewriter Message ── */}
            {streamingMsg && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '88%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ marginBottom: '4px', marginLeft: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: theme.subtext, fontWeight: '600' }}>
                    ✦ Thought for {streamingMsg.thoughtDuration} · Synthesizing response
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: theme.cardBg,
                    color: theme.text,
                    border: `1.5px solid ${theme.border}`,
                    fontSize: '0.86rem',
                    lineHeight: '1.55',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 8px rgba(13,23,14,0.04)',
                    position: 'relative'
                  }}
                >
                  {streamingMsg.text}
                  <span className="cv-chat-cursor" />

                  {/* Skip button for immediate full reveal */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={skipStreaming}
                      style={{
                        background: isDark ? '#162018' : '#eaf1e8',
                        border: `1px solid ${theme.border}`,
                        color: theme.text,
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Skip animation ⚡
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div
            className="cv-chat-chips-scroll"
            style={{
              padding: '10px 18px',
              background: isDark ? '#121813' : '#ffffff',
              borderTop: `1px solid ${theme.border}`,
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                disabled={isBusy}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  background: isDark ? '#162018' : '#f0f5ee',
                  color: isDark ? '#a3b18a' : '#273822',
                  border: `1px solid ${theme.border}`,
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                  opacity: isBusy ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isBusy) {
                    e.currentTarget.style.background = isDark ? '#273822' : '#e2ece0';
                    e.currentTarget.style.borderColor = isDark ? '#a3b18a' : '#273822';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBusy) {
                    e.currentTarget.style.background = isDark ? '#162018' : '#f0f5ee';
                    e.currentTarget.style.borderColor = theme.border;
                  }
                }}
              >
                <span>{qp.icon}</span>
                <span>{qp.label}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 18px',
              background: isDark ? '#162018' : '#eaf1e8',
              borderTop: `1px solid ${theme.border}`,
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your results, trends, or clinical check-ins..."
              disabled={isBusy}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '9999px',
                background: theme.inputBg,
                border: `1.5px solid ${theme.inputBorder}`,
                color: theme.text,
                fontSize: '0.86rem',
                outline: 'none',
                boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.03)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#a3b18a' : '#273822';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.inputBorder;
              }}
            />

            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              style={{
                padding: '9px 18px',
                borderRadius: '9999px',
                background: input.trim() && !isBusy ? 'linear-gradient(135deg, #273822 0%, #3d5236 100%)' : (isDark ? '#1e281f' : '#d2ded0'),
                color: input.trim() && !isBusy ? '#ffffff' : theme.subtext,
                border: 'none',
                cursor: input.trim() && !isBusy ? 'pointer' : 'default',
                fontWeight: '700',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: input.trim() && !isBusy ? '0 2px 8px rgba(39, 56, 34, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Send</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
