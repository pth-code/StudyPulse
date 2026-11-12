
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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
  isWebBluetoothConnected,
} from '../services/webBluetooth';

type Mode = 'study' | 'break';

type SessionStatus =
  'ready' | 'running' | 'paused' | 'completed';

type Reminder =
  'BREAK_START' | 'BREAK_END' | 'SESSION_DONE';

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

  // Manual timer settings
  const [studyMinutes, setStudyMinutes] =
    useState(25);

  const [breakMinutes, setBreakMinutes] =
    useState(5);

  const [mode, setMode] =
    useState<Mode>('study');

  const [secondsLeft, setSecondsLeft] =
    useState(25 * 60);

  const [isRunning, setIsRunning] =
    useState(false);

  // Scheduled timer state
  const [blockIndex, setBlockIndex] =
    useState(0);

  const [planFinished, setPlanFinished] =
    useState(false);

  // Bluetooth state
  const [
    bluetoothStatus,
    setBluetoothStatus,
  ] = useState<
    'Disconnected' | 'Connecting' | 'Connected'
  >('Disconnected');

  const [bluetoothMessage, setBluetoothMessage] =
    useState('');

  const deadline = useRef<number | null>(null);

  // Prevent the same block from completing twice.
  const transitionLock = useRef(false);

  const currentBlock =
    activePlan?.blocks[blockIndex] ?? null;

  // Load a new personalized schedule.
  useEffect(() => {
    deadline.current = null;
    transitionLock.current = false;

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

    // Reset only when the active plan changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan]);

  // Connect to StudyBand
  async function connectBracelet() {
    try {
      setBluetoothStatus('Connecting');

      const deviceName =
        await connectWebBluetooth();

      setBluetoothStatus('Connected');
      setBluetoothMessage(
        `Connected to ${deviceName}!`
      );
    } catch (err) {
      setBluetoothStatus('Disconnected');

      setBluetoothMessage(
        err instanceof Error
          ? err.message
          : 'Failed to connect to StudyBand.'
      );
    }
  }

  function disconnectBracelet() {
    disconnectWebBluetooth();

    setBluetoothStatus('Disconnected');
    setBluetoothMessage(
      'Bracelet disconnected.'
    );
  }

  // Send the correct reminder type.
  const sendReminder = useCallback(
    (reminder: Reminder) => {
      const label =
        reminder === 'BREAK_START'
          ? 'Break starting: double pulse'
          : reminder === 'BREAK_END'
            ? 'Break ending: triple pulse'
            : 'Session complete: long pulse';

      if (!isWebBluetoothConnected()) {
        setBluetoothStatus('Disconnected');
        setBluetoothMessage(
          `${label}. Connect bracelet for vibration.`
        );
        return;
      }

      sendWebCommand(reminder)
        .then(() => {
          setBluetoothMessage(
            `${label} sent!`
          );
        })
        .catch(err => {
          setBluetoothStatus('Disconnected');

          setBluetoothMessage(
            `${label} failed: ${
              err instanceof Error
                ? err.message
                : 'Bluetooth error'
            }`
          );
        });
    },
    []
  );

  // Keep countdown aligned with real time.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (deadline.current === null) return;

      const remaining = Math.max(
        0,
        Math.ceil(
          (deadline.current - Date.now()) / 1000
        )
      );

      setSecondsLeft(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle every timer transition.
  useEffect(() => {
    if (
      !isRunning ||
      secondsLeft !== 0 ||
      transitionLock.current
    ) {
      return;
    }

    transitionLock.current = true;

    // Personalized scheduled session
    if (activePlan) {
      const finishedBlock =
        activePlan.blocks[blockIndex];

      if (finishedBlock) {
        onSessionComplete(
          finishedBlock.type === 'study'
            ? 'study'
            : 'break',
          finishedBlock.durationSeconds
        );
      }

      const nextIndex = blockIndex + 1;
      const nextBlock =
        activePlan.blocks[nextIndex];

      if (nextBlock) {
        const finishedWasBreak =
          finishedBlock?.type !== 'study';

        const nextIsBreak =
          nextBlock.type !== 'study';

        if (
          nextIsBreak &&
          !finishedWasBreak
        ) {
          sendReminder('BREAK_START');
        } else if (
          !nextIsBreak &&
          finishedWasBreak
        ) {
          sendReminder('BREAK_END');
        }

        // Automatically start the next block.
        setBlockIndex(nextIndex);

        setSecondsLeft(
          nextBlock.durationSeconds
        );

        deadline.current =
          Date.now() +
          nextBlock.durationSeconds * 1000;

        transitionLock.current = false;
      } else {
        // Entire scheduled session completed.
        sendReminder('SESSION_DONE');

        deadline.current = null;
        setIsRunning(false);
        setPlanFinished(true);

        onStatusChange('completed');
      }

      return;
    }

    // Manual timer: record completed interval.
    onSessionComplete(
      mode,
      (mode === 'study'
        ? studyMinutes
        : breakMinutes) * 60
    );

    // Study -> Break or Break -> Study
    const nextMode: Mode =
      mode === 'study'
        ? 'break'
        : 'study';

    sendReminder(
      nextMode === 'break'
        ? 'BREAK_START'
        : 'BREAK_END'
    );

    const nextDuration =
      (nextMode === 'study'
        ? studyMinutes
        : breakMinutes) * 60;

    setMode(nextMode);
    setSecondsLeft(nextDuration);

    // Auto-start the next countdown.
    deadline.current =
      Date.now() + nextDuration * 1000;

    transitionLock.current = false;
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
    sendReminder,
  ]);

  // Start / Pause / Resume
  async function toggleTimer() {
    if (
      planFinished ||
      (activePlan && !currentBlock)
    ) {
      return;
    }

    if (isRunning) {
      // Pause timer
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
          'Timer paused; bracelet disconnected.'
        );
      }
    } else {
      if (secondsLeft <= 0) return;

      // Start or resume countdown.
      transitionLock.current = false;

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
          'Timer started; bracelet disconnected.'
        );
      }
    }
  }

  // Reset timer
  async function resetTimer() {
    deadline.current = null;
    transitionLock.current = false;
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
        'Timer reset; bracelet disconnected.'
      );
    }
  }

  // Leave scheduled mode
  function exitSchedule() {
    deadline.current = null;
    setIsRunning(false);

    sendWebCommand('STOP').catch(() => {});

    onExitSchedule();
  }

  // Change manual timer durations
  function adjustDuration(
    target: Mode,
    change: number
  ) {
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

  function formatTime(total: number): string {
    return (
      String(Math.floor(total / 60)).padStart(2, '0') +
      ':' +
      String(total % 60).padStart(2, '0')
    );
  }

  const timerLabel = activePlan
    ? planFinished
      ? 'Session Complete!'
      : currentBlock?.label ?? 'Ready'
    : mode === 'study'
      ? 'Focus Time'
      : 'Break Time';

  const timerButtonLabel = isRunning
    ? 'Pause'
    : sessionStatus === 'paused' && activePlan
      ? 'Resume'
      : 'Start';

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

      <Text style={styles.mode}>
        {timerLabel}
      </Text>

      <Text style={styles.timer}>
        {formatTime(secondsLeft)}
      </Text>

      {activePlan && (
        <Text style={styles.subtitle}>
          {planFinished
            ? 'All scheduled activities complete!'
            : `Block ${blockIndex + 1} of ${activePlan.blocks.length}`}
        </Text>
      )}

      <View style={styles.row}>
        <Pressable
          style={styles.button}
          onPress={toggleTimer}
          disabled={planFinished}
        >
          <Text style={styles.buttonText}>
            {planFinished
              ? 'Completed ✓'
              : timerButtonLabel}
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
          disabled={
            bluetoothStatus === 'Connecting'
          }
        >
          <Text style={styles.buttonText}>
            {bluetoothStatus === 'Connecting'
              ? 'Connecting...'
              : 'Connect Bracelet'}
          </Text>
        </Pressable>
      )}

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
              <Text style={styles.buttonText}>
                −
              </Text>
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
              <Text style={styles.buttonText}>
                +
              </Text>
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
              <Text style={styles.buttonText}>
                −
              </Text>
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
              <Text style={styles.buttonText}>
                +
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.note}>
        Developed by the StudyPulse Team
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
