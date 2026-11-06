import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function AnalyticsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Study Analytics</Text>
      <Text style={styles.subtitle}>
        Track your study progress and habits
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
            <Text style={styles.statValue}>12.5h</Text>
            <Text style={styles.statLabel}>Study Time</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Sessions Completed</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Breaks Taken</Text>
        </View>

        <View style={styles.statCard}>
            <Text style={styles.statValue}>5 days</Text>
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