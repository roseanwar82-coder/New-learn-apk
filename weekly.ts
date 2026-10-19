import { DayKey, addDays } from '../../core/dayKey';

export interface DayStat {
  day: DayKey;
  minutes: number;
  /** Mon, Tue, ... */
  label: string;
}

const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayLabel(day: DayKey): string {
  const [y, m, d] = day.split('-').map(Number);
  return NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Oldest to newest, ending on `today`. */
export function lastNDays(dailyFocusMs: Record<DayKey, number>, today: DayKey, n = 7): DayStat[] {
  const out: DayStat[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    out.push({ day, minutes: Math.floor((dailyFocusMs[day] ?? 0) / 60_000), label: weekdayLabel(day) });
  }
  return out;
}

export function formatHours(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
