import {
  extend,
  focusedMs,
  isFinished,
  pause,
  remainingMs,
  resume,
  startTimer,
  stop,
  tick,
} from '../timer';

const MIN = 60_000;

describe('timer', () => {
  it('counts down and completes exactly at the planned length', () => {
    let s = startTimer(25 * MIN, 1_000);
    expect(remainingMs(s, 1_000 + 10 * MIN)).toBe(15 * MIN);
    s = tick(s, 1_000 + 25 * MIN);
    expect(s.status).toBe('completed');
    expect(s.bankedMs).toBe(25 * MIN);
    expect(remainingMs(s, 1_000 + 40 * MIN)).toBe(0);
  });

  it('does not count paused time as focus', () => {
    let s = startTimer(25 * MIN, 0);
    s = pause(s, 10 * MIN);
    expect(s.status).toBe('paused');
    s = resume(s, 13 * MIN);
    expect(s.totalPausedMs).toBe(3 * MIN);
    expect(focusedMs(s, 18 * MIN)).toBe(15 * MIN);
    expect(tick(s, 28 * MIN).status).toBe('completed');
  });

  it('extends a running session', () => {
    let s = startTimer(25 * MIN, 0);
    s = extend(s, 5 * MIN, 20 * MIN);
    expect(s.plannedMs).toBe(30 * MIN);
    expect(tick(s, 25 * MIN).status).toBe('running');
    expect(tick(s, 30 * MIN).status).toBe('completed');
  });

  it('ignores invalid extensions and extensions on finished sessions', () => {
    const s = startTimer(MIN, 0);
    expect(extend(s, 0, 1)).toBe(s);
    const done = tick(s, MIN);
    expect(extend(done, 5 * MIN, MIN).plannedMs).toBe(MIN);
  });

  it('aborts when a pause exceeds the max pause length', () => {
    let s = startTimer(25 * MIN, 0, { maxPauseMs: 5 * MIN });
    s = pause(s, 10 * MIN);
    expect(tick(s, 14 * MIN).status).toBe('paused');
    const aborted = tick(s, 16 * MIN);
    expect(aborted.status).toBe('aborted');
    expect(aborted.bankedMs).toBe(10 * MIN);
  });

  it('stop keeps focus time earned so far', () => {
    let s = startTimer(25 * MIN, 0);
    s = stop(s, 7 * MIN);
    expect(s.status).toBe('aborted');
    expect(s.bankedMs).toBe(7 * MIN);
    expect(isFinished(s)).toBe(true);
  });

  it('stop while paused does not add paused time to focus', () => {
    let s = startTimer(25 * MIN, 0);
    s = pause(s, 5 * MIN);
    s = stop(s, 9 * MIN);
    expect(s.bankedMs).toBe(5 * MIN);
    expect(s.totalPausedMs).toBe(4 * MIN);
  });

  it('survives a monotonic clock reset (reboot) without negative time', () => {
    let s = startTimer(25 * MIN, 100 * MIN);
    s = tick(s, 110 * MIN); // 10 min focused
    // device reboots: monotonic clock restarts near zero
    s = tick(s, 2 * MIN);
    expect(s.bankedMs).toBe(10 * MIN);
    expect(focusedMs(s, 5 * MIN)).toBe(13 * MIN);
  });

  it('tick is idempotent on finished sessions', () => {
    const done = tick(startTimer(MIN, 0), MIN);
    expect(tick(done, 5 * MIN)).toBe(done);
  });

  it('rejects non-positive lengths', () => {
    expect(() => startTimer(0, 0)).toThrow();
  });

  it('round-trips through JSON (native persistence)', () => {
    const s = pause(startTimer(25 * MIN, 0), 4 * MIN);
    const revived = JSON.parse(JSON.stringify(s));
    expect(resume(revived, 6 * MIN).status).toBe('running');
  });
});
