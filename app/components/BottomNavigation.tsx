import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

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
        <Text
          style={[
            styles.tabText,
            activeScreen === 'timer' && styles.activeTab,
          ]}
        >
          ⏱ Timer
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => onNavigate('schedule')}
      >
        <Text
          style={[
            styles.tabText,
            activeScreen === 'schedule' && styles.activeTab,
          ]}
        >
          📅 Schedule
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => onNavigate('analytics')}
      >
        <Text
          style={[
            styles.tabText,
            activeScreen === 'analytics' && styles.activeTab,
          ]}
        >
          📊 Analytics
        </Text>
</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E1F2',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  activeTab: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
});