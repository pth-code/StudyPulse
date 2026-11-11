
import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

import type { TimerPlan } from '../types/schedule';

import {
  connectWebBluetooth,
  sendWebCommand,
  disconnectWebBluetooth,
} from '../services/webBluetooth';

type Mode = 'study' | 'break';

type SessionStatus =
  'ready' | 'running' | 'paused' | 'completed';

type Props = {
  activePlan: TimerPlan | null;
  sessionStatus: SessionStatus;
  onStatusChange: (status: SessionStatus) => void;
  onExitSchedule: () => void;
  onSessionComplete: (
    type: 'study' | 'break',
    durationSeconds: number
  ) => void;
};

export default function TimerScreen({
  activePlan,
  sessionStatus,
  onStatusChange,
  onExitSchedule,
  onSessionComplete,
}: Props) {

  // Manual timer settings.
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<Mode>('study');

  // Timer state.
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Scheduled session state.
  const [blockIndex, setBlockIndex] = useState(0);
  const [planFinished, setPlanFinished] = useState(false);

  // Bluetooth state.
  const [bluetoothStatus, setBluetoothStatus] = useState<
    'Disconnected' | 'Connecting' | 'Connected'
  >('Disconnected');

  const [bluetoothMessage, setBluetoothMessage] = useState('');

  const deadline = useRef<number | null>(null);

  const currentBlock =
    activePlan?.blocks[blockIndex] ?? null;

  // Load a new schedule or return to the manual timer.
  useEffect(() => {
    deadline.current = null;
    setIsRunning(false);
    setBlockIndex(0);
    setPlanFinished(false);

    if (activePlan) {
      setSecondsLeft(
        activePlan.blocks[0]?.durationSeconds ?? 0
      );
    } else {
      setMode('study');
      setSecondsLeft(studyMinutes * 60);
    }
  }, [activePlan]);

  // Connect to the Arduino.
  async function connectBracelet() {
    try {
      setBluetoothStatus('Connecting');

      const deviceName = await connectWebBluetooth();

      setBluetoothStatus('Connected');
      setBluetoothMessage(`Connected to ${deviceName}!`);
    } catch (error) {
      setBluetoothStatus('Disconnected');

      if (error instanceof Error) {
        setBluetoothMessage(error.message);
      } else {
        setBluetoothMessage(
          'Failed to connect to StudyBand.'
        );
      }
    }
  }

  function disconnectBracelet() {
    disconnectWebBluetooth();
    setBluetoothStatus('Disconnected');
    setBluetoothMessage('Bracelet disconnected.');
  }

  // Update the countdown four times per second.
  // Update the countdown four times per second.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (deadline.current === null) return;

      const remaining = Math.max(
        0,
        Math.ceil(
          (deadline.current - Date.now()) / 1000
        )
    ) ;

      setSecondsLeft(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle timer completion.
  useEffect(() => {
    if (!isRunning || secondsLeft !== 0) return;

    // Record the completed interval.
    if (activePlan) {
      const completedBlock = activePlan.blocks[blockIndex];

      if (completedBlock) {
        onSessionComplete(
          completedBlock.type === 'study' ? 'study' : 'break',
          completedBlock.durationSeconds
        );
      }
    } else {
      onSessionComplete(
        mode,
        (mode === 'study' ? studyMinutes : breakMinutes) * 60
      );
    }
    // Alert the bracelet at every block transition.
    sendWebCommand('VIBRATE')
      .then(() => {
        setBluetoothMessage('Reminder sent!');
      })
      .catch(() => {
        setBluetoothMessage(
          'Reminder reached. Bracelet not connected.'
        );
      });

    // Follow the generated schedule.
    if (activePlan) {
      const nextIndex = blockIndex + 1;
      const nextBlock = activePlan.blocks[nextIndex];

      if (nextBlock) {
        // Automatically start the next block.
        setBlockIndex(nextIndex);
        setSecondsLeft(nextBlock.durationSeconds);

        deadline.current =
          Date.now() + nextBlock.durationSeconds * 1000;
      } else {
        // All blocks are finished.
        deadline.current = null;
        setIsRunning(false);
        setPlanFinished(true);

        onStatusChange('completed');
      }

      return;
    }


  // Automatically transition between study and break.
  const nextMode =
    mode === 'study' ? 'break' : 'study';

  const nextDuration =
    nextMode === 'study'
      ? studyMinutes * 60
      : breakMinutes * 60;

  setMode(nextMode);
  setSecondsLeft(nextDuration);

  // Automatically start the next countdown.
  deadline.current =
    Date.now() + nextDuration * 1000;
  }, [
    secondsLeft,
    isRunning,
    activePlan,
    blockIndex,
    mode,
    studyMinutes,
    breakMinutes,
    onStatusChange,
    onSessionComplete,
  ]);

  // Start, pause, or resume the timer.
  async function toggleTimer() {
    if (
      planFinished ||
      (activePlan && (!currentBlock || secondsLeft <= 0))
    ) {
      return;
    }

    if (isRunning) {
      // Pause.
      if (deadline.current !== null) {
        setSecondsLeft(
          Math.max(
            0,
            Math.ceil(
              (deadline.current - Date.now()) / 1000
            )
          )
        );
      }

      deadline.current = null;
      setIsRunning(false);

      if (activePlan) {
        onStatusChange('paused');
      }

      try {
        await sendWebCommand('PAUSE');
      } catch {
        setBluetoothMessage(
          'Bracelet not connected. Timer paused anyway.'
        );
      }
    } else {
      // Start or resume.
      deadline.current =
        Date.now() + secondsLeft * 1000;

      setIsRunning(true);

      if (activePlan) {
        onStatusChange('running');
      }

      try {
        await sendWebCommand('START');
      } catch {
        setBluetoothMessage(
          'Bracelet not connected. Timer started anyway.'
        );
      }
    }
  }

  // Reset to the beginning of the current session.
  async function resetTimer() {
    deadline.current = null;
    setIsRunning(false);

    if (activePlan) {
      setBlockIndex(0);
      setPlanFinished(false);

      setSecondsLeft(
        activePlan.blocks[0]?.durationSeconds ?? 0
      );

      onStatusChange('ready');
    } else {
      setSecondsLeft(
        (mode === 'study'
          ? studyMinutes
          : breakMinutes) * 60
      );
    }

    try {
      await sendWebCommand('STOP');
    } catch {
      setBluetoothMessage(
        'Timer reset. Bracelet not connected.'
      );
    }
  }

  // Exit the scheduled session.
  function exitSchedule() {
    deadline.current = null;
    setIsRunning(false);

    // Don't block navigation if Bluetooth is disconnected.
    sendWebCommand('STOP').catch(() => {});

    onExitSchedule();
  }

  // Change manual study/break durations.
  function adjustDuration(target: Mode, change: number) {
    if (isRunning || activePlan) return;

    if (target === 'study') {
      const updated = Math.max(
        1,
        studyMinutes + change
      );

      setStudyMinutes(updated);

      if (mode === 'study') {
        setSecondsLeft(updated * 60);
      }
    } else {
      const updated = Math.max(
        1,
        breakMinutes + change
      );

      setBreakMinutes(updated);

      if (mode === 'break') {
        setSecondsLeft(updated * 60);
      }
    }
  }

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0')
    );
  }

  // Figure out the correct button label.
  const timerButtonLabel = isRunning
    ? 'Pause'
    : activePlan && sessionStatus === 'paused'
      ? 'Resume'
      : 'Start';

  const timerLabel = activePlan
    ? planFinished
      ? 'Session Complete!'
      : currentBlock?.label ?? 'Ready'
    : mode === 'study'
      ? 'Focus Time'
      : 'Break Time';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>
        StudyPulse
      </Text>

      <Text style={styles.subtitle}>
        Study smarter. Stay balanced.
      </Text>

      {/* Current session or block name */}
      <Text style={styles.mode}>
        {timerLabel}
      </Text>

      {/* Countdown */}
      <Text style={styles.timer}>
        {formatTime(secondsLeft)}
      </Text>

      {/* Scheduled session progress */}
      {activePlan && (
        <Text style={styles.subtitle}>
          {planFinished
            ? 'All scheduled activities complete!'
            : `Block ${blockIndex + 1} of ${activePlan.blocks.length}`}
        </Text>
      )}

      {/* Timer controls */}
      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPress={toggleTimer}
          disabled={planFinished}
        >
          <Text style={styles.buttonText}>
            {planFinished ? 'Completed ✓' : timerButtonLabel}
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={resetTimer}
        >
          <Text style={styles.buttonText}>
            Reset
          </Text>
        </Pressable>
      </View>

      {/* Exit scheduled mode */}
      {activePlan && (
        <Pressable
          style={styles.button}
          onPress={exitSchedule}
        >
          <Text style={styles.buttonText}>
            Exit Schedule
          </Text>
        </Pressable>
      )}

      {/* Bluetooth status */}
      <Text style={styles.mode}>
        {bluetoothStatus}
      </Text>

      <Text style={styles.subtitle}>
        {bluetoothMessage}
      </Text>

      {bluetoothStatus === 'Connected' ? (
        <Pressable
          style={styles.button}
          onPress={disconnectBracelet}
        >
          <Text style={styles.buttonText}>
            Disconnect Bracelet
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.button}
          onPress={connectBracelet}
          disabled={bluetoothStatus === 'Connecting'}
        >
          <Text style={styles.buttonText}>
            {bluetoothStatus === 'Connecting'
              ? 'Connecting...'
              : 'Connect Bracelet'}
          </Text>
        </Pressable>
      )}

      {/* Manual duration controls */}
      {!activePlan && (
        <>
          <Text style={styles.heading}>
            Study Duration
          </Text>

          <View style={styles.row}>
            <Pressable
              style={styles.smallButton}
              onPress={() =>
                adjustDuration('study', -1)
              }
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>

            <Text style={styles.duration}>
              {studyMinutes} min
            </Text>

            <Pressable
              style={styles.smallButton}
              onPress={() =>
                adjustDuration('study', 1)
              }
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.heading}>
            Break Duration
          </Text>

          <View style={styles.row}>
            <Pressable
              style={styles.smallButton}
              onPress={() =>
                adjustDuration('break', -1)
              }
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>

            <Text style={styles.duration}>
              {breakMinutes} min
            </Text>

            <Pressable
              style={styles.smallButton}
              onPress={() =>
                adjustDuration('break', 1)
              }
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.note}>
        PALLAVI ZITA SANJANA SAANVI
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#d8d2fb',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#d8d2fb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 40,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  mode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#45418E',
    marginTop: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  timer: {
    fontSize: 76,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 20,
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
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  smallButton: {
    backgroundColor: '#b6b1d5',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
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
