import { useState, useRef, useEffect, useCallback } from 'react';
import { sendWebCommand } from '../services/webBluetooth';

export type Mode = 'study' | 'break';

export function useStudyTimer() {
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<Mode>('study');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [bluetoothStatus, setBluetoothStatus] = useState<
    'Disconnected' | 'Connecting' | 'Connected'
  >('Disconnected');
  const [bluetoothMessage, setBluetoothMessage] = useState('');

  const deadline = useRef<number | null>(null);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (deadline.current === null) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Session completion effect
  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;

    setIsRunning(false);
    deadline.current = null;

    console.log('Session complete!');

    if (mode === 'study') {
      setMode('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode('study');
      setSecondsLeft(studyMinutes * 60);
    }
  }, [secondsLeft, isRunning, mode, studyMinutes, breakMinutes]);

  const toggleTimer = async () => {
    if (isRunning) {
      if (deadline.current !== null) {
        setSecondsLeft(Math.max(
          0,
          Math.ceil((deadline.current - Date.now()) / 1000)
        ));
      }
      deadline.current = null;
      setIsRunning(false);
      try {
        await sendWebCommand('PAUSE');
      } catch (error) {
        setBluetoothMessage('Bracelet not connected. Timer paused anyway.');
      }
    } else {
      deadline.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
      try {
        await sendWebCommand('START');
      } catch (error) {
        setBluetoothMessage('Bracelet not connected. Timer started anyway.');
      }
    }
  };

  const resetTimer = async () => {
    setIsRunning(false);
    deadline.current = null;
    setSecondsLeft(
      (mode === 'study' ? studyMinutes : breakMinutes) * 60
    );
    try {
      await sendWebCommand('STOP');
    } catch (error) {
      setBluetoothMessage('Bracelet not connected. Timer reset anyway.');
    }
  };

  const adjustDuration = (target: Mode, change: number) => {
    if (isRunning) return;

    if (target === 'study') {
      const updated = Math.max(1, studyMinutes + change);
      setStudyMinutes(updated);
      if (mode === 'study') setSecondsLeft(updated * 60);
    } else {
      const updated = Math.max(1, breakMinutes + change);
      setBreakMinutes(updated);
      if (mode === 'break') setSecondsLeft(updated * 60);
    }
  };

  const formatTime = (total: number) => {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return (
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0')
    );
  };

  return {
    studyMinutes,
    breakMinutes,
    mode,
    secondsLeft,
    isRunning,
    bluetoothStatus,
    setBluetoothStatus,
    bluetoothMessage,
    setBluetoothMessage,
    toggleTimer,
    resetTimer,
    adjustDuration,
    formatTime,
  };
}