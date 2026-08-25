import React, { useState, useEffect } from 'react';
import { SUPPORTED_TTS_LANGUAGES, speakInstruction, stopInstruction, isSpeaking } from '../utils/tts';

const VoiceGuideBar = ({ scriptKey, customText, defaultLang = 'en' }) => {
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      stopInstruction();
    };
  }, []);

  const handleTogglePlay = () => {
    if (playing || isSpeaking()) {
      stopInstruction();
      setPlaying(false);
    } else {
      setPlaying(true);
      speakInstruction(
        customText || scriptKey,
        selectedLang,
        () => setPlaying(true),
        () => setPlaying(false)
      );
    }
  };

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    if (playing) {
      stopInstruction();
      speakInstruction(
        customText || scriptKey,
        newLang,
        () => setPlaying(true),
        () => setPlaying(false)
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftGroup}>
        <span style={{ ...styles.speakerIcon, animation: playing ? 'pulseSpeaker 1s infinite' : 'none' }}>
          {playing ? '🔊' : '🔈'}
        </span>
        <div>
          <span style={styles.title}>Elderly Voice Guidance</span>
          <span style={styles.sub}>Listen to spoken instructions</span>
        </div>
      </div>

      <div style={styles.rightGroup}>
        <select
          value={selectedLang}
          onChange={handleLangChange}
          style={styles.langSelect}
        >
          {SUPPORTED_TTS_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleTogglePlay}
          style={{
            ...styles.actionBtn,
            backgroundColor: playing ? '#ef444425' : '#00d4aa25',
            borderColor: playing ? '#ef444466' : '#00d4aa66',
            color: playing ? '#ef4444' : '#00d4aa',
          }}
        >
          {playing ? '⏹ Stop Audio' : '▶ Play Instructions'}
        </button>
      </div>

      <style>{`
        @keyframes pulseSpeaker {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    backgroundColor: '#0d1117',
    border: '1px solid #ffffff12',
    borderRadius: '14px',
    padding: '0.65rem 1rem',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  speakerIcon: {
    fontSize: '1.3rem',
    display: 'inline-block',
  },
  title: {
    display: 'block',
    color: '#e2e8f0',
    fontSize: '0.82rem',
    fontWeight: '700',
  },
  sub: {
    display: 'block',
    color: '#64748b',
    fontSize: '0.72rem',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  langSelect: {
    backgroundColor: '#161b22',
    border: '1px solid #ffffff15',
    color: '#38bdf8',
    borderRadius: '8px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  actionBtn: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.35rem 0.8rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};

export default VoiceGuideBar;
