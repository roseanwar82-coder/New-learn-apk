export interface HistoryEntry {
  endedAt: number;
  focusedMs: number;
  completed: boolean;
  xp: number;
  blockAttempts: number;
}

export const MAX_HISTORY = 100;

/** Newest first, capped. Returns a new array. */
export function pushHistory(history: readonly HistoryEntry[], entry: HistoryEntry, max = MAX_HISTORY): HistoryEntry[] {
  return [entry, ...history].slice(0, max);
}
