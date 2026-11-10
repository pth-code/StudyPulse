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

  const weeklyStudyData = Array.from({ length: 7 }, (_, index) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const minutes = studySessions
      .filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate.toDateString() === date.toDateString();
      })
      .reduce((total, session) => total + session.durationMinutes, 0);

    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      minutes,
    };
  });

  const maxStudyMinutes = Math.max(
    ...weeklyStudyData.map(day => day.minutes),
    60
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
    <View style={styles.chartCard}>
    <Text style={styles.chartTitle}>Weekly Study Activity</Text>
    <Text style={styles.chartSubtitle}>
      Your study time each day this week
    </Text>

    <View style={styles.chart}>
      {weeklyStudyData.map((item, index) => (
        <View key={item.day} style={styles.barColumn}>
          <Text style={styles.barLabel}>
            {Math.round(item.minutes)}m
          </Text>

          <View style={styles.barBackground}>
            <View
              style={[
                styles.bar,
                {
                  height: `${(item.minutes / maxStudyMinutes) * 100}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.dayLabel}>{item.day}</Text>
        </View>
      ))}
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

chartCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginTop: 24,
},

chartTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#45418E',
},

chartSubtitle: {
  fontSize: 13,
  color: '#888888',
  marginTop: 4,
},

chart: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  height: 180,
  marginTop: 24,
},

barColumn: {
  flex: 1,
  alignItems: 'center',
  height: '100%',
},

barLabel: {
  fontSize: 10,
  color: '#777777',
  marginBottom: 6,
},

barBackground: {
  flex: 1,
  width: 22,
  backgroundColor: '#F0EDFA',
  borderRadius: 8,
  justifyContent: 'flex-end',
  overflow: 'hidden',
},

bar: {
  width: '100%',
  backgroundColor: '#8B75D7',
  borderRadius: 8,
},

dayLabel: {
  fontSize: 11,
  color: '#777777',
  marginTop: 8,
},
});