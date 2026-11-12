import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Step = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    icon: 'school',
    title: 'Welcome to StudyPulse',
    body:
      'Study smarter, without constantly checking the clock. ' +
      'Your StudyBand bracelet gives you gentle reminders ' +
      'when it is time to switch activities.',
  },
  {
    icon: 'bluetooth',
    title: 'Connect Your Bracelet',
    body:
      'Power your StudyBand, open this site in desktop Chrome, ' +
      'and tap Connect Bracelet on the Timer tab. ' +
      'Choose StudyBand in the Bluetooth popup.',
  },
  {
    icon: 'event-note',
    title: 'Make a Study Plan',
    body:
      'On Schedule, add a study session and any personal breaks. ' +
      'Tap View Generated Schedule to see focus and break times, ' +
      'then Start Session.',
  },
  {
    icon: 'timer',
    title: 'Start Once, Then Focus',
    body:
      'StudyPulse automatically moves between focus and breaks. ' +
      'Two vibrations mean a break starts; three short vibrations ' +
      'mean study resumes. A long vibration means your ' +
      'scheduled session is complete.',
  },
  {
    icon: 'bar-chart',
    title: 'Track Your Progress',
    body:
      'Visit Analytics to see completed study and break intervals. ' +
      'You can reopen these instructions anytime with the Help button.',
  },
];

export default function WelcomeGuide({
  visible,
  onClose,
}: Props) {
  const [index, setIndex] = useState(0);

  const step = steps[index];

  function close() {
    setIndex(0);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.top}>
              <Text style={styles.brand}>
                StudyPulse · Quick Guide
              </Text>

              <Pressable onPress={close}>
                <Text style={styles.skip}>Skip ✕</Text>
              </Pressable>
            </View>

            <View style={styles.iconBadge}>
              <MaterialIcons
                name={step.icon}
                size={38}
                color="#5B4FD6"
              />
            </View>

            <Text style={styles.title}>
              {step.title}
            </Text>

            <Text style={styles.body}>
              {step.body}
            </Text>

            <Text style={styles.counter}>
              {index + 1} of {steps.length}
            </Text>

            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              {index > 0 ? (
                <Pressable
                  style={[styles.button, styles.back]}
                  onPress={() => setIndex(i => i - 1)}
                >
                  <Text style={styles.backText}>Back</Text>
                </Pressable>
              ) : (
                <View />
              )}

              <Pressable
                style={styles.button}
                onPress={() => {
                  if (index === steps.length - 1) {
                    close();
                  } else {
                    setIndex(i => i + 1);
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {index === steps.length - 1
                    ? 'Get Started'
                    : 'Next →'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27,22,62,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  top: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontWeight: '700',
    color: '#45418E',
    fontSize: 14,
  },
  skip: {
    color: '#7166B5',
    fontWeight: '600',
  },
  iconBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#F2EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 18,
  },
  title: {
    color: '#45418E',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: '#5B5776',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    minHeight: 120,
  },
  counter: {
    color: '#827A9A',
    fontSize: 12,
    marginTop: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8D2F0',
  },
  activeDot: {
    width: 22,
    backgroundColor: '#6C63FF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  back: {
    backgroundColor: '#EEEAFE',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backText: {
    color: '#5147A6',
    fontWeight: 'bold',
  },
});