import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../utils/api';

const QUICK_PROMPTS = [
  "How has my score changed this week?",
  "When is my next check-in?",
  "Explain my latest screening result",
  "What are the clinical guidelines for screening?"
];

export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm your CogniVeil personal screening assistant.\n\nYou can ask me questions about your CogniScore trends, longitudinal progress (EWMA/CUSUM), scheduled clinical check-ins, or indexed screening guidelines.`,
      sources: ['CogniVeil Personal Assistant'],
      guardrailPassed: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(q);
      const data = res.data || {};
      const botMsg = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || "I couldn't retrieve your screening records at this time.",
        sources: data.sources_used || ['CogniVeil Database'],
        guardrailPassed: data.guardrail_passed !== false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "Unable to query CogniVeil assistant. Please ensure you are logged in and try again.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.92rem',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
        >
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span>Ask Assistant</span>
          <span
            style={{
              fontSize: '0.7rem',
              background: 'rgba(255,255,255,0.25)',
              padding: '2px 7px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Read-Only
          </span>
        </button>
      )}

      {/* Main Chat Assistant Modal Panel */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: 'calc(100vh - 100px)',
            background: 'var(--cv-surface, #101824)',
            borderRadius: '16px',
            border: '1px solid var(--cv-border, rgba(255, 255, 255, 0.12))',
            boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--cv-surface-elevated, #162436)',
              borderBottom: '1px solid var(--cv-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#fff'
                }}
              >
                🧠
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--cv-fog, #f1f5f9)' }}>
                  CogniVeil Assistant
                </h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--cv-fog-muted, #94a3b8)' }}>
                  Grounded in your screening records & guidelines
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cv-fog-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px',
                borderRadius: '6px',
                lineHeight: 1
              }}
              title="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Thread */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--cv-ink, #0a0f16)'
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
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background:
                      msg.sender === 'user'
                        ? 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)'
                        : msg.isError
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'var(--cv-surface-card, #121d2b)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--cv-fog, #f1f5f9)',
                    border:
                      msg.sender === 'user'
                        ? 'none'
                        : msg.isError
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid var(--cv-border, rgba(255, 255, 255, 0.08))',
                    fontSize: '0.84rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {msg.text}

                  {/* Sources tag if provided */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sources:</span>
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(34, 211, 238, 0.12)',
                            color: '#22d3ee',
                            border: '1px solid rgba(34, 211, 238, 0.25)'
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Safety badge */}
                  {msg.sender === 'assistant' && !msg.isError && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '0.66rem',
                        color: msg.guardrailPassed ? '#10b981' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{msg.guardrailPassed ? '🛡️ Safety Guardrail Certified' : '⚠️ Non-Diagnostic Sanitized'}</span>
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--cv-fog-subtle, #64748b)',
                    marginTop: '3px',
                    padding: '0 4px'
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'var(--cv-surface-card, #121d2b)',
                  border: '1px solid var(--cv-border, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--cv-fog-muted, #94a3b8)'
                }}
              >
                <span>Retrieving records & verifying guardrails</span>
                <span className="dot-flashing" style={{ display: 'inline-block' }}>...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--cv-surface, #101824)',
              borderTop: '1px solid var(--cv-border, rgba(255, 255, 255, 0.05))',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}
          >
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                disabled={loading}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'var(--cv-surface-elevated, #162436)',
                  color: 'var(--cv-fog-muted, #94a3b8)',
                  border: '1px solid var(--cv-border, rgba(255, 255, 255, 0.08))',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#22d3ee';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--cv-fog-muted, #94a3b8)';
                  e.currentTarget.style.borderColor = 'var(--cv-border, rgba(255, 255, 255, 0.08))';
                }}
              >
                {qp}
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
              padding: '10px 14px',
              background: 'var(--cv-surface-elevated, #162436)',
              borderTop: '1px solid var(--cv-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your results or trends..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--cv-ink, #0a0f16)',
                border: '1px solid var(--cv-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--cv-fog, #f1f5f9)',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: input.trim() ? 'linear-gradient(135deg, #0d9488, #06b6d4)' : 'rgba(255,255,255,0.1)',
                color: input.trim() ? '#ffffff' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                fontWeight: '600',
                fontSize: '0.82rem'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
