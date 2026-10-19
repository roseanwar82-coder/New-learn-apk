import { addDays, diffDays, toDayKey } from '../dayKey';

describe('dayKey', () => {
  it('uses the local calendar day for the given offset (IST)', () => {
    // 2026-10-18 20:00 UTC is already 01:30 on the 19th in IST
    const ts = Date.UTC(2026, 9, 18, 20, 0);
    expect(toDayKey(ts, 0)).toBe('2026-10-18');
    expect(toDayKey(ts, 330)).toBe('2026-10-19');
  });

  it('computes day differences across month and year boundaries', () => {
    expect(diffDays('2026-11-01', '2026-10-31')).toBe(1);
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1);
    expect(diffDays('2026-10-01', '2026-10-04')).toBe(-3);
  });

  it('adds days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
