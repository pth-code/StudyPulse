
import {
  Activity,
  PlanBlock,
  TimerPlan,
} from '../types/schedule';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function generatePlan(
  session: Activity,
  activities: Activity[]
): TimerPlan {
  if (session.type !== 'study') {
    throw new Error('Select a study session.');
  }

  const start = timeToMinutes(session.startTime);
  const end = start + session.duration;

  // Personal breaks within this study session.
  const breaks = activities
    .filter(a =>
      a.type === 'break' &&
      a.date === session.date &&
      timeToMinutes(a.startTime) < end &&
      timeToMinutes(a.startTime) + a.duration > start
    )
    .map(a => ({
      ...a,
      from: timeToMinutes(a.startTime),
      until: timeToMinutes(a.startTime) + a.duration,
    }))
    .sort((a, b) => a.from - b.from);

  // Reject overlapping personal breaks.
  for (let i = 0; i < breaks.length; i++) {
    const b = breaks[i];
    if (b.from < start || b.until > end) {
      throw new Error(
        `"${b.title}" must fit entirely inside the study session.`
      );
    }
    if (i > 0 && b.from < breaks[i - 1].until) {
      throw new Error('Personal breaks cannot overlap.');
    }
  }

  const blocks: PlanBlock[] = [];
  let current = start;
  let focused = 0;
  let breakIndex = 0;

  while (current < end) {
    const next = breaks[breakIndex];

    // Fixed personal breaks always take priority.
    if (next && current === next.from) {
      blocks.push({
        type: 'personal-break',
        label: next.title,
        durationSeconds: next.duration * 60,
      });
      current = next.until;
      focused = 0;
      breakIndex++;
      continue;
    }

    const nextFixedTime = next?.from ?? end;
    const available = Math.min(end, nextFixedTime) - current;

    if (available <= 0) {
      throw new Error('Invalid schedule.');
    }

    // A 2-minute rest after every 20 minutes of focus.
    if (focused >= 20 && available >= 2) {
      blocks.push({
        type: 'auto-break',
        label: 'Quick break',
        durationSeconds: 120,
      });
      current += 2;
      focused = 0;
      continue;
    }

    // Don't insert a tiny break just before a fixed activity.
    if (focused >= 20) focused = 0;

    const minutes = Math.min(20 - focused, available);

    blocks.push({
      type: 'study',
      label: session.title,
      durationSeconds: minutes * 60,
    });

    current += minutes;
    focused += minutes;
  }

  return {
    id: session.id,
    title: session.title,
    blocks,
  };
}
