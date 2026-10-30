import { useState, useEffect } from 'react';

export type Mode = 'study' | 'break';

export function useStudyTimer() {
  const [mode, setMode] = useState<Mode>('study');
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setSecondsLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
  };

  return {
    mode,
    secondsLeft,
    isRunning,
    toggleTimer,
    resetTimer,
    changeMode,
  };
}