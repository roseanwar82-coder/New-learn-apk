/**
 * Day keys are 'YYYY-MM-DD' strings in the user's LOCAL calendar.
 * Pass the timezone offset explicitly so logic is deterministic and testable.
 */
export type DayKey = string;

const MS_PER_DAY = 86_400_000;

/** tzOffsetMin: minutes ahead of UTC (IST = 330). */
export function toDayKey(ts: number, tzOffsetMin: number): DayKey {
  return new Date(ts + tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

/** Day key using the device's current timezone (handles DST per date). */
export function deviceDayKey(ts: number = Date.now()): DayKey {
  return toDayKey(ts, -new Date(ts).getTimezoneOffset());
}

function dayNumber(day: DayKey): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

/** Whole days from b to a (a - b). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round(dayNumber(a) - dayNumber(b));
}

export function addDays(day: DayKey, n: number): DayKey {
  return new Date((dayNumber(day) + n) * MS_PER_DAY).toISOString().slice(0, 10);
}
