/** Pure game logic: generation and scoring. UI lives in ./ui. All scores are 0..1. */

export type GameId =
  | 'focus-hold'
  | 'pattern-memory'
  | 'distraction-filter'
  | 'breathing-tap'
  | 'reaction-noise';

export interface GameMeta {
  id: GameId;
  title: string;
  blurb: string;
  duration: string;
  instructions: string;
}

export const GAMES: GameMeta[] = [
  {
    id: 'focus-hold',
    title: 'Focus Hold',
    blurb: 'Hold steady while the orb pulses.',
    duration: '~1 min',
    instructions:
      'Press and hold the orb. Keep holding until the ring fills. Three rounds, each longer than the last. Letting go early ends the round.',
  },
  {
    id: 'pattern-memory',
    title: 'Pattern Memory',
    blurb: 'Watch the tiles, repeat the sequence.',
    duration: '1-2 min',
    instructions:
      'Tiles light up in order. Tap them back in the same order. The sequence grows each round. Three mistakes end the game.',
  },
  {
    id: 'distraction-filter',
    title: 'Distraction Filter',
    blurb: 'Tap circles only. Ignore the squares.',
    duration: '1 min',
    instructions:
      'Shapes flash one at a time. Tap only the circles. Tapping a square costs points. Stay sharp for 60 seconds.',
  },
  {
    id: 'breathing-tap',
    title: 'Breathing + Tap',
    blurb: 'Breathe with the ring, tap at the peak.',
    duration: '~1 min',
    instructions:
      'The ring grows as you breathe in and shrinks as you breathe out. Tap the button at the top of every inhale.',
  },
  {
    id: 'reaction-noise',
    title: 'Reaction under Noise',
    blurb: 'Spot the green dot in the clutter.',
    duration: '1-2 min',
    instructions:
      'Colored dots flicker as noise. When the big green circle appears, tap it as fast as you can. Tapping early counts against you.',
  },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export function scoreLabel(score01: number): string {
  if (score01 >= 0.85) return 'Excellent';
  if (score01 >= 0.65) return 'Great';
  if (score01 >= 0.4) return 'Good';
  return 'Keep practicing';
}

// ── Focus Hold ──────────────────────────────────────────────
export const FOCUS_HOLD_TARGETS = [10_000, 20_000, 30_000];

/** heldMs[i] is how long round i was held (capped at its target). */
export function focusHoldScore(heldMs: number[], targets: number[] = FOCUS_HOLD_TARGETS): number {
  const total = targets.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let got = 0;
  for (let i = 0; i < targets.length; i++) {
    got += Math.min(Math.max(0, heldMs[i] ?? 0), targets[i]);
  }
  return clamp01(got / total);
}

// ── Pattern Memory ──────────────────────────────────────────
export const PATTERN_START_LENGTH = 3;
export const PATTERN_MAX_ROUNDS = 8;

export function makeSequence(length: number, cells = 9, rng: () => number = Math.random): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let next = Math.floor(rng() * cells) % cells;
    // avoid the same cell twice in a row so the pattern is always visible
    if (i > 0 && cells > 1 && next === seq[i - 1]) next = (next + 1) % cells;
    seq.push(next);
  }
  return seq;
}

export type TapResult = 'correct' | 'complete' | 'wrong';

/** index = how many taps the player has already made correctly. */
export function checkTap(seq: number[], index: number, cell: number): TapResult {
  if (seq[index] !== cell) return 'wrong';
  return index === seq.length - 1 ? 'complete' : 'correct';
}

export function patternScore(completedRounds: number, maxRounds = PATTERN_MAX_ROUNDS): number {
  return clamp01(completedRounds / maxRounds);
}

// ── Distraction Filter ──────────────────────────────────────
export type Stimulus = 'target' | 'decoy';

export function makeStimuli(count: number, targetRatio = 0.4, rng: () => number = Math.random): Stimulus[] {
  const out: Stimulus[] = [];
  for (let i = 0; i < count; i++) out.push(rng() < targetRatio ? 'target' : 'decoy');
  return out;
}

export function filterScore(targetsShown: number, hits: number, decoysShown: number, falseTaps: number): number {
  if (targetsShown <= 0) return 0;
  const hitRate = Math.min(1, hits / targetsShown);
  const falseRate = decoysShown > 0 ? Math.min(1, falseTaps / decoysShown) : 0;
  return clamp01(hitRate - 0.5 * falseRate);
}

// ── Breathing + Tap ─────────────────────────────────────────
export const BREATH_INHALE_MS = 4000;
export const BREATH_CYCLE_MS = 8000;
export const BREATH_CYCLES = 8;

/** Times (ms from start) of each inhale peak. */
export function peakTimes(cycles = BREATH_CYCLES): number[] {
  return Array.from({ length: cycles }, (_, i) => BREATH_INHALE_MS + i * BREATH_CYCLE_MS);
}

/** 1 for taps within 150ms of the peak, falling linearly to 0 at 1000ms off. */
export function tapOffsetScore(offsetMs: number): number {
  const off = Math.abs(offsetMs);
  if (off <= 150) return 1;
  if (off >= 1000) return 0;
  return 1 - (off - 150) / 850;
}

/** Match a tap to the nearest unused peak within 2s; null if none. */
export function matchTapToPeak(
  tapMs: number,
  peaks: number[],
  used: ReadonlySet<number>,
): { index: number; offset: number } | null {
  let best: { index: number; offset: number } | null = null;
  for (let i = 0; i < peaks.length; i++) {
    if (used.has(i)) continue;
    const offset = tapMs - peaks[i];
    if (Math.abs(offset) > 2000) continue;
    if (best === null || Math.abs(offset) < Math.abs(best.offset)) best = { index: i, offset };
  }
  return best;
}

/** offsets[i] = signed ms error for peak i, or null if missed. */
export function breathingScore(offsets: (number | null)[]): number {
  if (offsets.length === 0) return 0;
  const sum = offsets.reduce<number>((acc, o) => acc + (o === null ? 0 : tapOffsetScore(o)), 0);
  return clamp01(sum / offsets.length);
}

// ── Reaction under Noise ────────────────────────────────────
export const REACTION_TRIALS = 10;

/** <=250ms avg is perfect, >=700ms is zero. Missed trials and early taps reduce the score. */
export function reactionScore(reactionMs: number[], falseStarts: number, trials = REACTION_TRIALS): number {
  if (trials <= 0 || reactionMs.length === 0) return 0;
  const avg = reactionMs.reduce((a, b) => a + b, 0) / reactionMs.length;
  const speed = clamp01(1 - (avg - 250) / 450);
  const completion = Math.min(1, reactionMs.length / trials);
  return clamp01(speed * completion - 0.05 * falseStarts);
}
