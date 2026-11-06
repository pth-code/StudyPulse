
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import TimerScreen from './screens/TimerScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import BottomNavigation from './components/BottomNavigation';

type Screen = 'timer' | 'schedule';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('timer');

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {activeScreen === 'timer' ? (
          <TimerScreen />
        ) : (
          <ScheduleScreen />
        )}
      </View>

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
});
