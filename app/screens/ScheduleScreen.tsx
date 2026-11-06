
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface Session{
  id: number;
  day: number;
  time: string;
  title: string;
  decription: string;
  completed: boolean;
}

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(4);
  const [showAddOptions, setShowAddOptions] = useState(false);

  const days = [
    { name: 'Mon', date: 2 },
    { name: 'Tue', date: 3 },
    { name: 'Wed', date: 4 },
    { name: 'Thu', date: 5 },
    { name: 'Fri', date: 6 },
    { name: 'Sat', date: 7 },
    { name: 'Sun', date: 8 },
  ]

  const [sessions, setSessions] = useState([
  {
    id: 1,
    day: 4,
    time: '9:00 AM',
    title: 'INFO 340',
    description: 'CSS Review · 45 minutes',
  },
  {
    id: 2,
    day: 4,
    time: '10:00 AM',
    title: 'INFO 370',
    description: 'Homework · 60 minutes',
  },
  ]);

  const toggleSessionCompletion = (id: number) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, completed: !session.completed } : session
  )
  );
  };

  const addActivity = (type: string) => {
  const duration =
    type === 'Short Break' ? 10 :
    type === 'Long Break' ? 30 : 45;

  // Find how many sessions are already scheduled for this day
  const daySessions = sessions.filter(
    (session) => session.day === selectedDay
  );

  // Assign the new activity a time
  const hour = 9 + daySessions.length;
  const displayHour = hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';

  const newActivity = {
    id: Date.now(),
    day: selectedDay,
    time: `${displayHour}:00 ${period}`,
    title: type,
    description: `${duration} minutes`,
  };

  // Add the new activity to the list
  setSessions([...sessions, newActivity]);

  // Close the options menu
  setShowAddOptions(false);
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>StudyPulse</Text>
      <Text style={styles.subtitle}>Plan your study sessions.</Text>

      <View style={styles.header}>
        <Text style={styles.heading}>My Schedule</Text>
        <Text style={styles.month}>November 2026</Text>
      </View>

      <View style={styles.week}>
        {days.map((day) => (
          <Pressable
            key={day.name}
            style={[
              styles.day,
              selectedDay === day.date && styles.selectedDay,
            ]}
            onPress={() => setSelectedDay(day.date)}
          >
            <Text style={styles.dayName}>{day.name}</Text>
            <Text
              style={[
                styles.dayDate,
                selectedDay === day.date && styles.selectedDayText,
              ]}
            >
              {day.date}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.heading}>Upcoming Sessions</Text>

      {sessions
  .filter((session) => session.day === selectedDay)
  .map((session) => (
    <View style={styles.session} key={session.id}>
      <Text style={styles.sessionTime}>{session.time}</Text>

      <View style={styles.sessionDetails}>
        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionDescription}>
          {session.description}
        </Text>
      </View>
    </View>
  ))}

    <Pressable
  style={styles.addButton}
  onPress={() => setShowAddOptions(!showAddOptions)}
>
  <Text style={styles.addButtonText}>
    + Add Activity
  </Text>
</Pressable>

{showAddOptions && (
  <View style={styles.addOptions}>
    <Pressable onPress={() => addActivity('Study Session')}>
      <Text>📚 Study Session</Text>
    </Pressable>

    <Pressable onPress={() => addActivity('Short Break')}>
      <Text>☕ Short Break</Text>
    </Pressable>

    <Pressable onPress={() => addActivity('Long Break')}>
      <Text>🌿 Long Break</Text>
    </Pressable>
  </View>
)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addOptions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 16,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#d8d2fb',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#45418E',
  },
  subtitle: {
    color: '#777',
    marginTop: 6,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 16,
  },
  month: {
    color: '#777',
    fontWeight: '600',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  day: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  selectedDay: {
    backgroundColor: '#6C63FF',
  },
  dayName: {
    fontSize: 12,
    color: '#777',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#45418E',
    marginTop: 6,
  },
  selectedDayText: {
    color: '#fff',
  },
  session: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  sessionTime: {
    color: '#6C63FF',
    fontWeight: 'bold',
    marginRight: 16,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#45418E',
  },
  sessionDescription: {
    color: '#777',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
