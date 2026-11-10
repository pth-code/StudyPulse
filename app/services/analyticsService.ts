import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StudySession } from '../types/analytics';

const STORAGE_KEY = 'studypulse_sessions';

export async function getSessions(): Promise<StudySession[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

export async function saveSession(
  session: StudySession
): Promise<void> {
  try {
    const sessions = await getSessions();

    sessions.push(session);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessions)
    );
  } catch (error) {
    console.error('Error saving session:', error);
  }
}