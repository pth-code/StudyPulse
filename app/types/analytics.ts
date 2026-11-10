export type StudySession = {
  id: string;
  type: 'study' | 'break';
  durationMinutes: number;
  completedAt: string;
};
