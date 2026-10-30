import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions, SafeAreaView, StatusBar } from 'react-native';
import { useStudyTimer } from './hooks/useStudyTimer';

export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const {
    mode,
    secondsLeft,
    isRunning,
    toggleTimer,
    resetTimer,
    changeMode,
  } = useStudyTimer();

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isStudy = mode === 'study';
  const themeColor = isStudy ? '#4F46E5' : '#059669';
  const backgroundColor = isStudy ? '#EEF2FF' : '#ECFDF5';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.card, isMobile ? styles.cardMobile : styles.cardDesktop]}>
        
        <Text style={styles.title}>StudyPulse</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isStudy && { backgroundColor: '#4F46E5' }]}
            onPress={() => changeMode('study')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isStudy && styles.activeTabText]}>Study Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isStudy && { backgroundColor: '#059669' }]}
            onPress={() => changeMode('break')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isStudy && styles.activeTabText]}>Break Mode</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.timerCircle, { borderColor: themeColor }]}>
          <Text style={[styles.timerText, { color: themeColor }]}>
            {formatTime(secondsLeft)}
          </Text>
          <Text style={styles.modeLabel}>
            {isStudy ? 'Focus Time' : 'Rest & Recharge'}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: themeColor }]}
            onPress={toggleTimer}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resetTimer}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4, width: '100%' },
  cardDesktop: { maxWidth: 480 },
  cardMobile: { maxWidth: '100%', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 24 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 32, width: '100%' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  timerCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 36 },
  timerText: { fontSize: 52, fontWeight: '700' },
  modeLabel: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 12, width: '100%' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F3F4F6' },
  secondaryButtonText: { color: '#4B5563', fontSize: 16, fontWeight: '600' },
});
