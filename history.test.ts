import { HistoryEntry, pushHistory } from '../history';

const e = (n: number): HistoryEntry => ({ endedAt: n, focusedMs: n, completed: true, xp: n, blockAttempts: 0 });

describe('pushHistory', () => {
  it('puts the newest first without mutating', () => {
    const base = [e(1)];
    const next = pushHistory(base, e(2));
    expect(next.map((x) => x.endedAt)).toEqual([2, 1]);
    expect(base).toHaveLength(1);
  });

  it('caps the length, dropping the oldest', () => {
    let h: HistoryEntry[] = [];
    for (let i = 1; i <= 5; i++) h = pushHistory(h, e(i), 3);
    expect(h.map((x) => x.endedAt)).toEqual([5, 4, 3]);
  });
});
