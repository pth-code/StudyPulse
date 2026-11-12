import React from 'react';
import type { StudySession } from '../types/analytics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

type Props = {
  sessions: StudySession[];
};

export default function AnalyticsScreen({ sessions }: Props) {
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);

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

  const highestStudyMinutes = Math.max(
  ...weeklyStudyData.map(day => day.minutes),
  0
);

const maxStudyMinutes = Math.max(
  10,
  Math.ceil(highestStudyMinutes / 10) * 10
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
      Study minutes per day
    </Text>

    <View style={styles.chart}>
      <View style={styles.yAxis}>
        {[maxStudyMinutes, maxStudyMinutes * 0.75, maxStudyMinutes * 0.5, maxStudyMinutes * 0.25, 0].map((value, index) => (
          <Text key={index} style={styles.axisLabel}>
            {Math.round(value)}
          </Text>
        ))}
      </View>

      <View style={styles.graphArea}>
        {[0, 25, 50, 75, 100].map(value => (
          <View
            key={value}
            style={[styles.gridLine, { bottom: `${value}%` }]}
          />
        ))}

        <View style={styles.bars}>
    {weeklyStudyData.map(item => (
      <View key={item.day} style={styles.barColumn}>
        <Pressable
          style={styles.barPressable}
          onHoverIn={() => setSelectedDay(item.day)}
          onHoverOut={() => setSelectedDay(null)}
          onPress={() =>
            setSelectedDay(
              selectedDay === item.day ? null : item.day
            )
          }
        >
          {selectedDay === item.day && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {item.minutes} min
              </Text>
            </View>
          )}

          <View
            style={[
              styles.bar,
              {
                height: `${(item.minutes / maxStudyMinutes) * 100}%`,
              },
            ]}
          />
        </Pressable>

        <Text style={styles.dayLabel}>{item.day}</Text>
      </View>
    ))}
        </View>
      </View>
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
  height: 220,
  marginTop: 24,
},

yAxis: {
  height: 180,
  justifyContent: 'space-between',
  paddingRight: 10,
},

axisLabel: {
  fontSize: 10,
  color: '#888888',
  textAlign: 'right',
  width: 28,
},

graphArea: {
  flex: 1,
  height: 180,
  position: 'relative',
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderColor: '#BBBBBB',
},

gridLine: {
  position: 'absolute',
  left: 0,
  right: 0,
  borderTopWidth: 1,
  borderColor: '#E8E5F2',
},

bars: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'flex-end',
  height: '100%',
  paddingHorizontal: 6,
},

barColumn: {
  flex: 1,
  height: '100%',
  justifyContent: 'flex-end',
  alignItems: 'center',
},

bar: {
  width: '55%',
  maxWidth: 28,
  backgroundColor: '#8B75D7',
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
},

dayLabel: {
  position: 'absolute',
  top: 188,
  fontSize: 11,
  color: '#777777',
},

barPressable: {
  width: '100%',
  flex: 1,
  justifyContent: 'flex-end',
  alignItems: 'center',
},

tooltip: {
  position: 'absolute',
  bottom: '100%',
  backgroundColor: '#45418E',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  marginBottom: 6,
  zIndex: 10,
},

tooltipText: {
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: 'bold',
},
});