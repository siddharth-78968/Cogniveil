import { useEffect, useRef } from 'react';
import { saveSignal } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PassiveTracker = () => {
  const { user } = useAuth();
  const typingData = useRef({ keyTimes: [], backspaces: 0, totalKeys: 0 });
  const scrollData = useRef({ hesitations: 0, lastScrollTime: 0 });
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (!user || !user.consent_granted) {
      return;
    }
    const handleKeyDown = (e) => {
      const now = Date.now();
      typingData.current.keyTimes.push(now);
      typingData.current.totalKeys += 1;
      if (e.key === 'Backspace') {
        typingData.current.backspaces += 1;
      }
    };

    const handleScroll = () => {
      const now = Date.now();
      const timeSinceLastScroll = now - scrollData.current.lastScrollTime;
      if (timeSinceLastScroll > 2000 && scrollData.current.lastScrollTime !== 0) {
        scrollData.current.hesitations += 1;
      }
      scrollData.current.lastScrollTime = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(async () => {
      const keys = typingData.current.keyTimes;
      const totalKeys = typingData.current.totalKeys;
      const backspaces = typingData.current.backspaces;
      const sessionDuration = (Date.now() - sessionStart.current) / 1000;

      let avgTypingSpeed = 50;
      if (keys.length > 1) {
        const delays = [];
        for (let i = 1; i < keys.length; i++) {
          delays.push(keys[i] - keys[i - 1]);
        }
        const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
        avgTypingSpeed = Math.min(100, Math.max(0, 100 - (avgDelay / 10)));
      }

      const backspaceRate = totalKeys > 0 ? backspaces / totalKeys : 0;
      const scrollHesitation = scrollData.current.hesitations;

      try {
        await saveSignal({
          typing_speed: parseFloat(avgTypingSpeed.toFixed(2)),
          backspace_rate: parseFloat(backspaceRate.toFixed(2)),
          scroll_hesitation: parseFloat(scrollHesitation.toFixed(2)),
          session_duration: parseFloat(sessionDuration.toFixed(2)),
        });
      } catch (err) {
        console.log('Signal save skipped - not logged in yet');
      }

      typingData.current = { keyTimes: [], backspaces: 0, totalKeys: 0 };
      scrollData.current.hesitations = 0;
    }, 30000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [user]);

  return null;
};

export default PassiveTracker;