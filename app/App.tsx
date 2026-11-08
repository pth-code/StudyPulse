
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import TimerScreen from './screens/TimerScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import BottomNavigation from './components/BottomNavigation';
import type { TimerPlan } from './types/schedule';

export type SessionStatus =
  'ready' | 'running' | 'paused' | 'completed';

type Screen = 'timer' | 'schedule' | 'analytics';

export default function App() {
  const [activeScreen, setActiveScreen] =
    useState<Screen>('timer');

  const [activePlan, setActivePlan] =
    useState<TimerPlan | null>(null);

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>('ready');

  function startScheduledSession(plan: TimerPlan) {
    // Return to an existing active session without restarting.
    if (
      activePlan?.id === plan.id &&
      sessionStatus !== 'completed'
    ) {
      setActiveScreen('timer');
      return;
    }

    // Load a new session.
    setActivePlan(plan);
    setSessionStatus('ready');
    setActiveScreen('timer');
  }

  function exitScheduledSession() {
    setActivePlan(null);
    setSessionStatus('ready');
    setActiveScreen('timer');
  }

  return (
    <View style={styles.container}>

      {/* Keep Timer mounted when switching tabs. */}
      <View
        style={[
          styles.screen,
          activeScreen !== 'timer' && styles.hidden,
        ]}
      >
        <TimerScreen
          activePlan={activePlan}
          sessionStatus={sessionStatus}
          onStatusChange={setSessionStatus}
          onExitSchedule={exitScheduledSession}
        />
      </View>

      {/* Schedule page */}
      <View
        style={[
          styles.screen,
          activeScreen !== 'schedule' && styles.hidden,
        ]}
      >
        <ScheduleScreen
          onStartSession={startScheduledSession}
          activePlanId={activePlan?.id ?? null}
          sessionStatus={sessionStatus}
        />
      </View>

      {/* Analytics placeholder */}
      {activeScreen === 'analytics' && (
        <View style={styles.screen}>
          <Text style={styles.placeholder}>
            Analytics coming soon!
          </Text>
        </View>
      )}

      {/* Existing navigation bar */}
      <BottomNavigation
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
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
  placeholder: {
    padding: 30,
    fontSize: 22,
    color: '#45418E',
  },
});
