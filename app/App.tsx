
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

type Mode = 'study' | 'break';

export default function App() {
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<Mode>('study');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const deadline = useRef<number | null>(null);

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

  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;

    setIsRunning(false);
    deadline.current = null;

    // Later, we'll send a vibration command to the ESP32.
    console.log('Session complete!');

    if (mode === 'study') {
      setMode('break');
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode('study');
      setSecondsLeft(studyMinutes * 60);
    }
  }, [secondsLeft, isRunning, mode, studyMinutes, breakMinutes]);

  function toggleTimer() {
    if (isRunning) {
      if (deadline.current !== null) {
        setSecondsLeft(Math.max(
          0,
          Math.ceil((deadline.current - Date.now()) / 1000)
        ));
      }
      deadline.current = null;
      setIsRunning(false);
    } else {
      deadline.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  }

  function resetTimer() {
    setIsRunning(false);
    deadline.current = null;
    setSecondsLeft(
      (mode === 'study' ? studyMinutes : breakMinutes) * 60
    );
  }

  function adjustDuration(target: Mode, change: number) {
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
  }

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return (
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0')
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StudyPulse</Text>
      <Text style={styles.subtitle}>
        Study smarter. Stay balanced.
      </Text>

      <Text style={styles.mode}>
        {mode === 'study' ? 'Focus Time' : 'Break Time'}
      </Text>

      <Text style={styles.timer}>
        {formatTime(secondsLeft)}
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={toggleTimer}>
          <Text style={styles.buttonText}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </Pressable>

        <Pressable style={styles.button} onPress={resetTimer}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Study Duration</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.smallButton}
          onPress={() => adjustDuration('study', -1)}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.duration}>{studyMinutes} min</Text>
        <Pressable
          style={styles.smallButton}
          onPress={() => adjustDuration('study', 1)}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Break Duration</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.smallButton}
          onPress={() => adjustDuration('break', -1)}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.duration}>{breakMinutes} min</Text>
        <Pressable
          style={styles.smallButton}
          onPress={() => adjustDuration('break', 1)}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        PALLAVI ZITA SANJANA SAANVI
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#45418E',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    marginBottom: 42,
  },
  mode: {
    fontSize: 20,
    color: '#555',
    marginBottom: 10,
  },
  timer: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  smallButton: {
    backgroundColor: '#8983D9',
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#45418E',
    marginTop: 14,
    marginBottom: 14,
  },
  duration: {
    fontSize: 18,
    minWidth: 65,
    textAlign: 'center',
  },
  note: {
    marginTop: 25,
    fontSize: 13,
    color: '#888',
  },
});
