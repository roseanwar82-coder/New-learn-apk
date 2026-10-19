import { createProfile } from '../../gamification/profile';
import { syncFinishedSession } from '../syncFinishedSession';

const MIN = 60_000;
const IST = 330;
const endedAt = Date.UTC(2026, 9, 18, 10, 0);

function source(raw: string | null) {
  let pending = raw;
  return {
    consumeFinishedSession() {
      const v = pending;
      pending = null; // mirrors native: handed over once
      return v;
    },
  };
}

describe('syncFinishedSession', () => {
  it('returns null when nothing finished', () => {
    expect(syncFinishedSession(source(null), createProfile(), IST)).toBeNull();
  });

  it('applies a completed session to the profile', () => {
    const raw = JSON.stringify({ focusedMs: 25 * MIN, completed: true, endedAt });
    const r = syncFinishedSession(source(raw), createProfile(), IST)!;
    expect(r.xpEarned).toBe(250);
    expect(r.profile.streak.current).toBe(1);
    expect(r.profile.stats.sessionsCompleted).toBe(1);
  });

  it('applies a stopped-early session without counting it as completed', () => {
    const raw = JSON.stringify({ focusedMs: 12 * MIN, completed: false, endedAt });
    const r = syncFinishedSession(source(raw), createProfile(), IST)!;
    expect(r.xpEarned).toBe(120);
    expect(r.profile.stats.sessionsCompleted).toBe(0);
  });

  it('passes blocked-app attempts through to stats and history', () => {
    const clean = JSON.stringify({ focusedMs: 25 * MIN, completed: true, endedAt, blockAttempts: 0 });
    const dirty = JSON.stringify({ focusedMs: 25 * MIN, completed: true, endedAt, blockAttempts: 3 });
    const a = syncFinishedSession(source(clean), createProfile(), IST)!;
    const b = syncFinishedSession(source(dirty), createProfile(), IST)!;
    expect(a.profile.stats.cleanSessions).toBe(1);
    expect(b.profile.stats.cleanSessions).toBe(0);
    expect(b.entry).toEqual({ endedAt, focusedMs: 25 * MIN, completed: true, xp: 250, blockAttempts: 3 });
  });

  it('treats a missing or invalid blockAttempts as zero', () => {
    const raw = JSON.stringify({ focusedMs: 25 * MIN, completed: true, endedAt, blockAttempts: -4 });
    expect(syncFinishedSession(source(raw), createProfile(), IST)!.entry.blockAttempts).toBe(0);
  });

  it('never applies the same session twice', () => {
    const src = source(JSON.stringify({ focusedMs: 25 * MIN, completed: true, endedAt }));
    expect(syncFinishedSession(src, createProfile(), IST)).not.toBeNull();
    expect(syncFinishedSession(src, createProfile(), IST)).toBeNull();
  });

  it('ignores malformed payloads', () => {
    expect(syncFinishedSession(source('not json'), createProfile(), IST)).toBeNull();
    expect(syncFinishedSession(source('{"focusedMs":"x"}'), createProfile(), IST)).toBeNull();
    expect(
      syncFinishedSession(source(JSON.stringify({ focusedMs: -5, completed: true, endedAt })), createProfile(), IST),
    ).toBeNull();
  });
});
