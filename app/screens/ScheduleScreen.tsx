
import React, { useEffect, useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

import type {
  Activity,
  TimerPlan,
} from '../types/schedule';

import {
  generatePlan,
  timeToMinutes,
} from '../utils/generatePlan';

type SessionStatus =
  'ready' | 'running' | 'paused' | 'completed';

type Props = {
  onStartSession: (plan: TimerPlan) => void;
  activePlanId: string | null;
  sessionStatus: SessionStatus;
};

const STORAGE_KEY = 'studypulse-activities-v1';

// Convert a date into YYYY-MM-DD.
function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

// Find Monday of the selected week.
function weekStartOf(date: Date): Date {
  const result = new Date(date);

  result.setHours(12, 0, 0, 0);

  result.setDate(
    result.getDate() - (result.getDay() + 6) % 7
  );

  return result;
}

// Display times like 2:20 PM.
function formatClock(totalMinutes: number): string {
  const hours24 =
    Math.floor(totalMinutes / 60) % 24;

  const minutes = Math.floor(totalMinutes % 60);

  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return (
    `${hours12}:` +
    `${String(minutes).padStart(2, '0')} ${suffix}`
  );
}

// Convert a saved 24-hour time into a 12-hour time for the form.
function get12HourTime(time24: string): {
  time: string;
  period: 'AM' | 'PM';
} {
  const [hours, minutes] = time24.split(':').map(Number);

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return {
    time: `${hours12}:${String(minutes).padStart(2, '0')}`,
    period,
  };
}

// Convert the form's time and AM/PM into 24-hour format.
function get24HourTime(
  time: string,
  period: 'AM' | 'PM'
): string | null {
  const match = time.trim().match(/^(1[0-2]|0?[1-9]):([0-5]\d)$/);

  if (!match) return null;

  let hours = Number(match[1]);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

export default function ScheduleScreen({
  onStartSession,
  activePlanId,
  sessionStatus,
}: Props) {

  // Calendar state.
  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [weekStart, setWeekStart] =
    useState(weekStartOf(new Date()));

  // Saved activities.
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loaded, setLoaded] = useState(false);

  // Form state.
  const [showOptions, setShowOptions] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [type, setType] =
    useState<'study' | 'break'>('study');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('9:00');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [duration, setDuration] = useState('60');
  const [error, setError] = useState('');

  // Which session's generated schedule is being previewed?
  const [previewId, setPreviewId] =
    useState<string | null>(null);

  // Load previously saved activities.
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const saved =
          window.localStorage.getItem(STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setActivities(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not load activities:', e);
      }
    }

    setLoaded(true);
  }, []);

  // Save activities after changes.
  useEffect(() => {
    if (!loaded || Platform.OS !== 'web') return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(activities)
      );
    } catch (e) {
      console.warn('Could not save activities:', e);
    }
  }, [activities, loaded]);

  // Generate the seven days of the displayed week.
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);

        day.setDate(
          weekStart.getDate() + index
        );

        return day;
      }),
    [weekStart]
  );

  const selectedKey = dateKey(selectedDate);

  // Activities for the selected day.
  const shown = activities
    .filter(a => a.date === selectedKey)
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  // Generate the schedule preview automatically.
  const preview = useMemo(() => {
    if (!previewId) return null;

    const session = activities.find(
      a => a.id === previewId
    );

    if (!session || session.type !== 'study') {
      return null;
    }

    try {
      return {
        plan: generatePlan(session, activities),
        startMinute: timeToMinutes(session.startTime),
        error: '',
      };
    } catch (e) {
      return {
        plan: null,
        startMinute: 0,
        error:
          e instanceof Error
            ? e.message
            : 'Could not generate the schedule.',
      };
    }
  }, [previewId, activities]);

  // Change calendar weeks.
  function changeWeek(amount: number) {
    const next = new Date(weekStart);

    next.setDate(
      next.getDate() + amount * 7
    );

    setWeekStart(next);
    setSelectedDate(next);
    setShowForm(false);
    setPreviewId(null);
    setError('');
  }

  // Open the activity form for adding or editing.
  function openForm(
    kind: 'study' | 'break',
    activity?: Activity
  ) {
    setType(activity?.type ?? kind);
    setEditingId(activity?.id ?? null);
    setTitle(activity?.title ?? '');
    setDescription(activity?.description ?? '');
    const savedTime = get12HourTime(
      activity?.startTime ?? '09:00'
    );

    setStartTime(savedTime.time);
    setStartPeriod(savedTime.period);

    setDuration(
      String(
        activity?.duration ??
        (kind === 'study' ? 120 : 10)
      )
    );

    setError('');
    setShowOptions(false);
    setShowForm(true);
  }

  // Save a new or edited activity.
  function saveActivity() {
    const minutes = Number(duration);
    const startTime24 = get24HourTime(startTime, startPeriod);  

    if (
      !title.trim() ||
      !startTime24 ||
      !Number.isInteger(minutes) ||
      minutes <= 0
    ) {
      setError(
        'Enter a title, valid time (e.g. 2:30), and duration.'
      );
      return;
    }

    const start = timeToMinutes(startTime24);
    const end = start + minutes;

    if (end > 1440) {
      setError(
        'Activities must finish on the same day.'
      );
      return;
    }

    // Personal breaks can occur inside study sessions.
    // Only reject overlapping activities of the same type.
    const overlapping = activities.some(a => {
      if (
        a.id === editingId ||
        a.date !== selectedKey ||
        a.type !== type
      ) {
        return false;
      }

      const existingStart =
        timeToMinutes(a.startTime);

      const existingEnd =
        existingStart + a.duration;

      return (
        start < existingEnd &&
        end > existingStart
      );
    });

    if (overlapping) {
      setError(
        'This overlaps another activity of the same type.'
      );
      return;
    }

    const activity: Activity = {
      id:
        editingId ??
        `${Date.now()}-${Math.random()}`,
      date: selectedKey,
      type,
      title: title.trim(),
      description: description.trim(),
      startTime: startTime24,
      duration: minutes,
    };

    setActivities(previous =>
      editingId
        ? previous.map(a =>
            a.id === editingId ? activity : a
          )
        : [...previous, activity]
    );

    setShowForm(false);
    setError('');
  }

  // Delete an activity.
  function deleteActivity(id: string) {
    setActivities(previous =>
      previous.filter(a => a.id !== id)
    );

    if (previewId === id) {
      setPreviewId(null);
    }

    setError('');
  }

  // Load a generated schedule into the Timer screen.
  function startSession(session: Activity) {
    try {
      const plan = generatePlan(
        session,
        activities
      );

      setError('');
      onStartSession(plan);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not start this session.'
      );
    }
  }

  // Determine the correct button for a session.
  function sessionButtonLabel(
    sessionId: string
  ): string {
    if (activePlanId !== sessionId) {
      return 'Start Session →';
    }

    switch (sessionStatus) {
      case 'running':
        return 'View Session →';
      case 'paused':
        return 'Resume Session →';
      case 'completed':
        return 'Completed ✓';
      default:
        return 'Open Timer →';
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>
        StudyPulse
      </Text>

      <Text style={styles.subtitle}>
        Plan your study sessions.
      </Text>

      <Text style={styles.heading}>
        My Schedule
      </Text>

      {/* Week navigation */}
      <View style={styles.nav}>
        <Pressable
          onPress={() => changeWeek(-1)}
        >
          <Text style={styles.link}>
            ‹ Previous
          </Text>
        </Pressable>

        <Text style={styles.month}>
          {selectedDate.toLocaleDateString(
            'en-US',
            {
              month: 'long',
              year: 'numeric',
            }
          )}
        </Text>

        <Pressable
          onPress={() => changeWeek(1)}
        >
          <Text style={styles.link}>
            Next ›
          </Text>
        </Pressable>
      </View>

      {/* Days of the selected week */}
      <View style={styles.week}>
        {days.map(day => {
          const selected =
            dateKey(day) === selectedKey;

          return (
            <Pressable
              key={dateKey(day)}
              style={[
                styles.day,
                selected && styles.selectedDay,
              ]}
              onPress={() => {
                setSelectedDate(day);
                setShowForm(false);
                setPreviewId(null);
                setError('');
              }}
            >
              <Text
                style={[
                  styles.dayName,
                  selected && styles.white,
                ]}
              >
                {day.toLocaleDateString(
                  'en-US',
                  { weekday: 'short' }
                )}
              </Text>

              <Text
                style={[
                  styles.dayNumber,
                  selected && styles.white,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.heading}>
        Upcoming Activities
      </Text>

      {/* Empty state */}
      {shown.length === 0 && (
        <Text style={styles.subtitle}>
          Nothing scheduled for this day.
        </Text>
      )}

      {/* Activity cards */}
      {shown.map(activity => {
        const isActive =
          activePlanId === activity.id;

        const completed =
          isActive &&
          sessionStatus === 'completed';

        const showingPreview =
          previewId === activity.id;

        return (
          <View
            style={styles.session}
            key={activity.id}
          >
            <Text style={styles.sessionTime}>
              {formatClock(
                timeToMinutes(activity.startTime)
              )}
            </Text>

            <View style={styles.sessionContent}>

              <View style={styles.sessionTitleRow}>
                <Feather
                  name={activity.type === 'study' ? 'book-open' : 'coffee'}
                  size={18}
                  color="#6C63FF"
                />
                <Text style={styles.sessionTitle}>
                  {activity.title}
                </Text>
              </View>

              <Text style={styles.detail}>
                {activity.duration} minutes
              </Text>

              {!!activity.description && (
                <Text style={styles.detail}>
                  {activity.description}
                </Text>
              )}

              {/* Edit and delete */}
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    openForm(activity.type, activity)
                  }
                >
                  <Text style={styles.link}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    deleteActivity(activity.id)
                  }
                >
                  <Text style={styles.delete}>
                    Delete
                  </Text>
                </Pressable>
              </View>

              {/* Study-session controls */}
              {activity.type === 'study' && (
                <View style={styles.actions}>

                  <Pressable
                    onPress={() =>
                      setPreviewId(current =>
                        current === activity.id
                          ? null
                          : activity.id
                      )
                    }
                  >
                    <Text style={styles.link}>
                      {showingPreview
                        ? 'Hide Schedule'
                        : 'View Generated Schedule'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={completed}
                    onPress={() =>
                      startSession(activity)
                    }
                  >
                    <Text
                      style={[
                        styles.link,
                        completed && styles.completed,
                      ]}
                    >
                      {sessionButtonLabel(activity.id)}
                    </Text>
                  </Pressable>

                </View>
              )}

              {/* Generated schedule preview */}
              {activity.type === 'study' &&
                showingPreview &&
                preview && (
                <View style={styles.previewContainer}>

                  <Text style={styles.previewHeading}>
                    Generated Schedule
                  </Text>

                  {!!preview.error && (
                    <Text style={styles.error}>
                      {preview.error}
                    </Text>
                  )}

                  {preview.plan?.blocks.map(
                    (block, index) => {
                      const elapsedMinutes =
                        preview.plan!.blocks
                          .slice(0, index)
                          .reduce(
                            (sum, previous) =>
                              sum +
                              previous.durationSeconds / 60,
                            0
                          );

                      const from =
                        preview.startMinute +
                        elapsedMinutes;

                      const to =
                        from +
                        block.durationSeconds / 60;

                      const label =
                        block.type === 'study'
                          ? activity.title
                          : 'Small Break';

                      return (
                        <View
                          key={index}
                          style={styles.previewRow}
                        >
                          <Text style={styles.previewTime}>
                            {formatClock(from)}
                            {' – '}
                            {formatClock(to)}
                          </Text>

                          <Text style={styles.detail}>
                            {label} · {block.durationSeconds / 60} minutes
                          </Text>
                        </View>
                      );
                    }
                  )}

                </View>
              )}

            </View>
          </View>
        );
      })}

      {/* Validation errors */}
      {!!error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {/* Add activity button */}
      {!showForm && (
        <>
          <Pressable
            style={styles.button}
            onPress={() =>
              setShowOptions(!showOptions)
            }
          >
            <Text style={styles.buttonText}>
              + Add Activity
            </Text>
          </Pressable>

          {showOptions && (
            <View style={styles.card}>
              <Pressable
                onPress={() => openForm('study')}
              >
                <View style={styles.optionRow}>
                  <Feather name="book-open" size={18} color="#6C63FF" />
                  <Text style={styles.option}>Study Session</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => openForm('break')}
              >
                <View style={styles.optionRow}>
                  <Feather name="coffee" size={18} color="#6C63FF" />
                  <Text style={styles.option}>Personal Break</Text>
                </View>
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Add/edit activity form */}
      {showForm && (
        <View style={styles.card}>

          <Text style={styles.heading}>
            {editingId
              ? 'Edit Activity'
              : 'New Activity'}
          </Text>

          <Text style={styles.detail}>
            {type === 'study'
              ? 'Study session'
              : 'Personal break'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Title (e.g. Math homework)"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[
              styles.input,
              { minHeight: 75 },
            ]}
            placeholder="Description (optional)"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.detail}>
            Start time
          </Text>

          <View style={styles.timeInputRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="2:30"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
            />

            <Pressable
              style={[
                styles.periodButton,
                startPeriod === 'AM' && styles.selectedPeriod,
              ]}
              onPress={() => setStartPeriod('AM')}
            >
            <Text
              style={[
                styles.periodText,
                startPeriod === 'AM' && styles.selectedPeriodText,
              ]}
            >
              AM
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.periodButton,
              startPeriod === 'PM' && styles.selectedPeriod,
            ]}
            onPress={() => setStartPeriod('PM')}
          >
            <Text
              style={[
                styles.periodText,
                startPeriod === 'PM' && styles.selectedPeriodText,
              ]}
            >
              PM
            </Text>
          </Pressable>
        </View>

          <Text style={styles.detail}>
            Duration (minutes)
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="120"
            value={duration}
            onChangeText={setDuration}
          />

          <View style={styles.actions}>
            <Pressable
              style={styles.button}
              onPress={saveActivity}
            >
              <Text style={styles.buttonText}>
                Save
              </Text>
            </Pressable>

            <Pressable
              style={styles.button}
              onPress={() => {
                setShowForm(false);
                setError('');
              }}
            >
              <Text style={styles.buttonText}>
                Cancel
              </Text>
            </Pressable>
          </View>

        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#d8d2fb',
    padding: 24,
    paddingBottom: 70,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#45418E',
  },
  subtitle: {
    color: '#777',
    marginTop: 6,
    marginBottom: 25,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 16,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  month: {
    color: '#45418E',
    fontWeight: '600',
  },
  link: {
    color: '#6C63FF',
    fontWeight: 'bold',
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
  dayNumber: {
    fontSize: 16,
    color: '#45418E',
    fontWeight: 'bold',
    marginTop: 6,
  },
  white: {
    color: '#fff',
  },
  session: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  sessionTime: {
    color: '#6C63FF',
    fontWeight: 'bold',
    marginRight: 16,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#45418E',
  },
  detail: {
    color: '#777',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 15,
    alignItems: 'center',
  },
  delete: {
    color: '#C43D50',
    fontWeight: 'bold',
  },
  completed: {
    color: '#39865C',
  },
  error: {
    color: '#C43D50',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 12,
  },
  option: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#45418E',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 9,
    marginTop: 6,
  },
  previewContainer: {
    backgroundColor: '#F2F0FF',
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
  },
  previewHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#45418E',
    marginBottom: 10,
  },
  previewRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD8F4',
  },
  previewTime: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#45418E',
    fontWeight: '600',
  },

  sessionTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

optionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

previewLabelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

timeInputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

timeInput: {
  flex: 1,
},

periodButton: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 9,
  backgroundColor: '#fff',
},

selectedPeriod: {
  backgroundColor: '#6C63FF',
  borderColor: '#6C63FF',
},

periodText: {
  color: '#45418E',
  fontWeight: '600',
},

selectedPeriodText: {
  color: '#fff',
},
});
