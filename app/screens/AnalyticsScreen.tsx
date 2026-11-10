import React from 'react';
import type { StudySession } from '../types/analytics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

type Props = {
  sessions: StudySession[];
};

export default function AnalyticsScreen({ sessions }: Props) {
  const studySessions = sessions.filter(
    session => session.type === 'study'
  );

  const breakSessions = sessions.filter(
    session => session.type === 'break'
  );

  const totalStudyMinutes = studySessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  );

  const totalBreaks = breakSessions.length;

  const completedSessions = studySessions.length;

  // Calculate consecutive study days
  const studyDays = new Set(
    studySessions.map(session =>
      new Date(session.completedAt).toLocaleDateString()
    )
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 366; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    if (studyDays.has(date.toLocaleDateString())) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Study Analytics</Text>
      <Text style={styles.subtitle}>
        Track your study progress and habits
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(totalStudyMinutes)} min
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {completedSessions}
            </Text>
            <Text style={styles.statLabel}>Sessions Completed</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalBreaks}
            </Text>
            <Text style={styles.statLabel}>Breaks Taken</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {streak} days
            </Text>
            <Text style={styles.statLabel}>Study Streak</Text>
        </View>
     </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#d8d2fb',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#777777',
  },
  statsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 16,
  marginTop: 28,
},
statCard: {
  width: '47%',
  backgroundColor: '#FFFFFF',
  padding: 18,
  borderRadius: 16,
},

statValue: {
  fontSize: 26,
  fontWeight: 'bold',
  color: '#6C63FF',
},

statLabel: {
  fontSize: 13,
  color: '#777777',
  marginTop: 6,
},
});