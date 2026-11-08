
export type Activity = {
  id: string;
  date: string;        // YYYY-MM-DD
  type: 'study' | 'break';
  title: string;
  description: string;
  startTime: string;   // HH:MM (24-hour)
  duration: number;    // minutes
};

export type PlanBlock = {
  type: 'study' | 'auto-break' | 'personal-break';
  label: string;
  durationSeconds: number;
};

export type TimerPlan = {
  id: string;
  title: string;
  blocks: PlanBlock[];
};
