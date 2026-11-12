
import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from 'react-native';

import TimerScreen from './screens/TimerScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import WelcomeGuide from './components/WelcomeGuide';
import BottomNavigation from './components/BottomNavigation';

import type { TimerPlan } from './types/schedule';

import {
  getSessions,
  saveSession,
} from './services/analyticsService';

import type {
  StudySession,
} from './types/analytics';

export type SessionStatus =
  'ready' | 'running' | 'paused' | 'completed';

type Screen =
  'timer' | 'schedule' | 'analytics';

const GUIDE_KEY = 'studypulse-welcome-seen-v1';

export default function App() {
  const [activeScreen, setActiveScreen] =
    useState<Screen>('timer');

  const [activePlan, setActivePlan] =
    useState<TimerPlan | null>(null);

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>('ready');

  const [sessions, setSessions] =
    useState<StudySession[]>([]);

  const [showGuide, setShowGuide] =
    useState(false);

  // Restore analytics and show the first-time guide.
  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(err =>
        console.warn(
          'Unable to load analytics',
          err
        )
      );

    if (Platform.OS === 'web') {
      try {
        const seen = window.localStorage.getItem(
          GUIDE_KEY
        );

        if (seen !== 'yes') {
          setShowGuide(true);
        }
      } catch {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  }, []);

  // Close guide and remember that the user has seen it.
  function closeGuide() {
    setShowGuide(false);

    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(
          GUIDE_KEY,
          'yes'
        );
      } catch {
        // Storage might be unavailable.
      }
    }
  }

  // Launch a personalized study schedule.
  function startScheduledSession(
    plan: TimerPlan
  ) {
    if (
      activePlan?.id === plan.id &&
      sessionStatus !== 'completed'
    ) {
      setActiveScreen('timer');
      return;
    }

    setActivePlan(plan);
    setSessionStatus('ready');
    setActiveScreen('timer');
  }

  function exitScheduledSession() {
    setActivePlan(null);
    setSessionStatus('ready');
    setActiveScreen('timer');
  }

  // Save completed study and break intervals.
  const recordSession = useCallback(
    async (
      type: 'study' | 'break',
      durationSeconds: number
    ) => {
      const session: StudySession = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        durationMinutes: durationSeconds / 60,
        completedAt: new Date().toISOString(),
      };

      setSessions(previous => [
        ...previous,
        session,
      ]);

      try {
        await saveSession(session);
      } catch (err) {
        console.warn(
          'Unable to save analytics',
          err
        );
      }
    },
    []
  );

  return (
    <View style={styles.container}>

      {/* Timer stays mounted between tab switches */}
      <View
        style={[
          styles.screen,
          activeScreen !== 'timer' &&
            styles.hidden,
        ]}
      >
        <TimerScreen
          activePlan={activePlan}
          sessionStatus={sessionStatus}
          onStatusChange={setSessionStatus}
          onExitSchedule={exitScheduledSession}
          onSessionComplete={recordSession}
        />
      </View>

      {/* Schedule */}
      <View
        style={[
          styles.screen,
          activeScreen !== 'schedule' &&
            styles.hidden,
        ]}
      >
        <ScheduleScreen
          onStartSession={startScheduledSession}
          activePlanId={activePlan?.id ?? null}
          sessionStatus={sessionStatus}
        />
      </View>

      {/* Analytics */}
      <View
        style={[
          styles.screen,
          activeScreen !== 'analytics' &&
            styles.hidden,
        ]}
      >
        <AnalyticsScreen sessions={sessions} />
      </View>

      <BottomNavigation
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
      />

      {/* Help button */}
      <Pressable
        style={styles.helpButton}
        onPress={() => setShowGuide(true)}
        accessibilityRole="button"
        accessibilityLabel="Help and instructions"
      >
        <Text style={styles.helpText}>
          ? Help
        </Text>
      </Pressable>

      {/* First-time instructions */}
      <WelcomeGuide
        visible={showGuide}
        onClose={closeGuide}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8d2fb',
  },
  screen: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  helpButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc4ee',
    elevation: 3,
    zIndex: 10,
  },
  helpText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5147A6',
  },
});
