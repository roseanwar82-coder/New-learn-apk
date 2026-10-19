import { Profile, SessionOutcome, applySession } from '../gamification/profile';
import type { HistoryEntry } from '../session/history';

export interface FinishedSource {
  /** Returns the finished-session JSON once, then null (FocusOverlay.consumeFinishedSession). */
  consumeFinishedSession(): string | null;
}

interface FinishedPayload {
  focusedMs: number;
  completed: boolean;
  endedAt: number;
  blockAttempts: number;
}

function parse(raw: string): FinishedPayload | null {
  try {
    const o = JSON.parse(raw);
    if (
      typeof o?.focusedMs !== 'number' ||
      typeof o?.endedAt !== 'number' ||
      typeof o?.completed !== 'boolean' ||
      o.focusedMs < 0
    ) {
      return null;
    }
    const attempts = typeof o.blockAttempts === 'number' && o.blockAttempts >= 0 ? Math.floor(o.blockAttempts) : 0;
    return { focusedMs: o.focusedMs, completed: o.completed, endedAt: o.endedAt, blockAttempts: attempts };
  } catch {
    return null;
  }
}

export type SyncedSession = SessionOutcome & { entry: HistoryEntry };

/**
 * Call on app start, on foreground, and when the overlay emits completed/aborted.
 * The native side hands over each finished session once, so no session is applied twice.
 */
export function syncFinishedSession(
  source: FinishedSource,
  profile: Profile,
  tzOffsetMin: number,
): SyncedSession | null {
  const raw = source.consumeFinishedSession();
  if (!raw) return null;
  const p = parse(raw);
  if (!p) return null;
  const outcome = applySession(
    profile,
    { focusedMs: p.focusedMs, completed: p.completed, blockAttempts: p.blockAttempts, endedAt: p.endedAt },
    tzOffsetMin,
  );
  return {
    ...outcome,
    entry: {
      endedAt: p.endedAt,
      focusedMs: p.focusedMs,
      completed: p.completed,
      xp: outcome.xpEarned,
      blockAttempts: p.blockAttempts,
    },
  };
}
