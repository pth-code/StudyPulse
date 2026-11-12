
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type BottomNavigationProps = {
  activeScreen: 'timer' | 'schedule' | 'analytics';
  onNavigate: (screen: 'timer' | 'schedule' | 'analytics') => void;
};

export default function BottomNavigation({
  activeScreen,
  onNavigate,
}: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.tab}
        onPress={() => onNavigate('timer')}
      >
        <Feather
          name="clock"
          size={22}
          color={activeScreen === 'timer' ? '#6C63FF' : '#888888'}
        />
        <Text style={[
          styles.tabText,
          activeScreen === 'timer' && styles.activeTab,
        ]}>
          Timer
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => onNavigate('schedule')}
      >
        <Feather
          name="calendar"
          size={22}
          color={activeScreen === 'schedule' ? '#6C63FF' : '#888888'}
        />
        <Text style={[
          styles.tabText,
          activeScreen === 'schedule' && styles.activeTab,
        ]}>
          Schedule
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => onNavigate('analytics')}
      >
        <Feather
          name="bar-chart-2"
          size={22}
          color={activeScreen === 'analytics' ? '#6C63FF' : '#888888'}
        />
        <Text style={[
          styles.tabText,
          activeScreen === 'analytics' && styles.activeTab,
        ]}>
          Analytics
        </Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E1F2',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  activeTab: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
});