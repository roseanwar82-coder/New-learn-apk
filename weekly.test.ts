import { formatHours, lastNDays, weekdayLabel } from '../weekly';

const MIN = 60_000;

describe('weekly stats', () => {
  it('labels weekdays', () => {
    expect(weekdayLabel('2026-10-18')).toBe('Sun');
    expect(weekdayLabel('2026-10-19')).toBe('Mon');
  });

  it('returns n days ending today, oldest first, with zeros for empty days', () => {
    const r = lastNDays({ '2026-10-18': 45 * MIN, '2026-10-16': 20 * MIN + 30_000 }, '2026-10-18', 7);
    expect(r).toHaveLength(7);
    expect(r[0].day).toBe('2026-10-12');
    expect(r[6]).toMatchObject({ day: '2026-10-18', minutes: 45, label: 'Sun' });
    expect(r[4]).toMatchObject({ day: '2026-10-16', minutes: 20 });
    expect(r[1].minutes).toBe(0);
  });

  it('crosses month boundaries', () => {
    const r = lastNDays({}, '2026-11-02', 4);
    expect(r.map((d) => d.day)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('formats durations', () => {
    expect(formatHours(0)).toBe('0m');
    expect(formatHours(45 * MIN)).toBe('45m');
    expect(formatHours(135 * MIN)).toBe('2h 15m');
  });
});
