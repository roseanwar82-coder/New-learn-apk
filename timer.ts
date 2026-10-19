/**
 * Pure timer state machine. All time values are MONOTONIC milliseconds supplied
 * by the caller (Android: SystemClock.elapsedRealtime(), which keeps counting in
 * deep sleep and ignores wall-clock changes). State is plain JSON so the native
 * foreground service can persist it and JS can rehydrate after the app is killed.
 */
export type TimerStatus = 'running' | 'paused' | 'completed' | 'aborted';

export interface TimerState {
  status: TimerStatus;
  /** Planned focus length including extensions. */
  plannedMs: number;
  /** Focus time banked from finished running segments. */
  bankedMs: number;
  /** Monotonic timestamp when the current running segment began. */
  segmentStart: number | null;
  /** Monotonic timestamp when the current pause began. */
  pausedAt: number | null;
  pauseCount: number;
  totalPausedMs: number;
  /** Last monotonic timestamp observed; used to detect clock resets (reboot). */
  lastSeen: number;
  /** A pause longer than this aborts the session. */
  maxPauseMs: number;
}

export const DEFAULT_MAX_PAUSE_MS = 5 * 60_000;

export function startTimer(
  plannedMs: number,
  now: number,
  opts: { maxPauseMs?: number } = {},
): TimerState {
  if (!(plannedMs > 0)) throw new Error('plannedMs must be > 0');
  return {
    status: 'running',
    plannedMs,
    bankedMs: 0,
    segmentStart: now,
    pausedAt: null,
    pauseCount: 0,
    totalPausedMs: 0,
    lastSeen: now,
    maxPauseMs: opts.maxPauseMs ?? DEFAULT_MAX_PAUSE_MS,
  };
}

/**
 * If the monotonic clock went backwards (device rebooted), keep what was
 * banked up to lastSeen and restart the segment from `now`. Time lost while
 * the device was off is not counted.
 */
function normalize(s: TimerState, now: number): TimerState {
  if (now >= s.lastSeen) return { ...s, lastSeen: now };
  if (s.status === 'running' && s.segmentStart !== null) {
    return {
      ...s,
      bankedMs: s.bankedMs + Math.max(0, s.lastSeen - s.segmentStart),
      segmentStart: now,
      lastSeen: now,
    };
  }
  if (s.status === 'paused') return { ...s, pausedAt: now, lastSeen: now };
  return { ...s, lastSeen: now };
}

export function focusedMs(s: TimerState, now: number): number {
  let total = s.bankedMs;
  if (s.status === 'running' && s.segmentStart !== null) {
    total += Math.max(0, now - s.segmentStart);
  }
  return Math.min(total, s.plannedMs);
}

export function remainingMs(s: TimerState, now: number): number {
  if (s.status === 'completed') return 0;
  return Math.max(0, s.plannedMs - focusedMs(s, now));
}

/** Advance state: completes the session or aborts an over-long pause. Idempotent. */
export function tick(input: TimerState, now: number): TimerState {
  if (input.status === 'completed' || input.status === 'aborted') return input;
  const s = normalize(input, now);

  if (s.status === 'running' && focusedMs(s, now) >= s.plannedMs) {
    return { ...s, status: 'completed', bankedMs: s.plannedMs, segmentStart: null };
  }
  if (s.status === 'paused' && s.pausedAt !== null && now - s.pausedAt > s.maxPauseMs) {
    return {
      ...s,
      status: 'aborted',
      totalPausedMs: s.totalPausedMs + (now - s.pausedAt),
      pausedAt: null,
    };
  }
  return s;
}

export function pause(input: TimerState, now: number): TimerState {
  const s = tick(input, now);
  if (s.status !== 'running') return s;
  return {
    ...s,
    status: 'paused',
    bankedMs: focusedMs(s, now),
    segmentStart: null,
    pausedAt: now,
    pauseCount: s.pauseCount + 1,
  };
}

export function resume(input: TimerState, now: number): TimerState {
  const s = tick(input, now);
  if (s.status !== 'paused' || s.pausedAt === null) return s;
  return {
    ...s,
    status: 'running',
    segmentStart: now,
    totalPausedMs: s.totalPausedMs + (now - s.pausedAt),
    pausedAt: null,
  };
}

export function extend(input: TimerState, addMs: number, now: number): TimerState {
  if (!(addMs > 0)) return input;
  const s = tick(input, now);
  if (s.status !== 'running' && s.status !== 'paused') return s;
  return { ...s, plannedMs: s.plannedMs + addMs };
}

/** User stops early. Focus time so far is kept for XP and streak purposes. */
export function stop(input: TimerState, now: number): TimerState {
  const s = tick(input, now);
  if (s.status === 'completed' || s.status === 'aborted') return s;
  return {
    ...s,
    status: 'aborted',
    bankedMs: focusedMs(s, now),
    segmentStart: null,
    totalPausedMs:
      s.totalPausedMs + (s.status === 'paused' && s.pausedAt !== null ? now - s.pausedAt : 0),
    pausedAt: null,
  };
}

export function isFinished(s: TimerState): boolean {
  return s.status === 'completed' || s.status === 'aborted';
}
