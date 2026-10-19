import {
  FOCUS_HOLD_TARGETS,
  GAMES,
  breathingScore,
  checkTap,
  filterScore,
  focusHoldScore,
  getGame,
  makeSequence,
  makeStimuli,
  matchTapToPeak,
  patternScore,
  peakTimes,
  reactionScore,
  scoreLabel,
  tapOffsetScore,
} from '../logic';

// deterministic rng cycling through a list
function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('game registry', () => {
  it('has five games with unique ids', () => {
    expect(GAMES).toHaveLength(5);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(5);
    expect(getGame('focus-hold')?.title).toBe('Focus Hold');
    expect(getGame('nope')).toBeUndefined();
  });

  it('labels scores', () => {
    expect(scoreLabel(0.9)).toBe('Excellent');
    expect(scoreLabel(0.7)).toBe('Great');
    expect(scoreLabel(0.5)).toBe('Good');
    expect(scoreLabel(0.1)).toBe('Keep practicing');
  });
});

describe('focus hold', () => {
  it('is 1 when every round is fully held and 0 when nothing is held', () => {
    expect(focusHoldScore(FOCUS_HOLD_TARGETS)).toBe(1);
    expect(focusHoldScore([])).toBe(0);
  });
  it('is partial and caps over-holding', () => {
    expect(focusHoldScore([10_000, 5_000, 0])).toBeCloseTo(15_000 / 60_000, 5);
    expect(focusHoldScore([99_999, 99_999, 99_999])).toBe(1);
    expect(focusHoldScore([-5, 0, 0])).toBe(0);
  });
});

describe('pattern memory', () => {
  it('makes sequences of the right length within the grid', () => {
    const s = makeSequence(6, 9);
    expect(s).toHaveLength(6);
    expect(s.every((c) => c >= 0 && c < 9)).toBe(true);
  });
  it('never repeats a cell back to back', () => {
    const s = makeSequence(5, 9, seq([0.5, 0.5, 0.5, 0.5, 0.5])); // would be all 4s
    for (let i = 1; i < s.length; i++) expect(s[i]).not.toBe(s[i - 1]);
  });
  it('checks taps in order', () => {
    const s = [2, 7, 4];
    expect(checkTap(s, 0, 2)).toBe('correct');
    expect(checkTap(s, 1, 7)).toBe('correct');
    expect(checkTap(s, 2, 4)).toBe('complete');
    expect(checkTap(s, 1, 3)).toBe('wrong');
  });
  it('scores by rounds completed', () => {
    expect(patternScore(0)).toBe(0);
    expect(patternScore(4)).toBe(0.5);
    expect(patternScore(20)).toBe(1);
  });
});

describe('distraction filter', () => {
  it('generates the requested number of stimuli by ratio', () => {
    const s = makeStimuli(4, 0.5, seq([0.1, 0.9, 0.2, 0.8]));
    expect(s).toEqual(['target', 'decoy', 'target', 'decoy']);
  });
  it('rewards hits and penalizes false taps', () => {
    expect(filterScore(20, 20, 30, 0)).toBe(1);
    expect(filterScore(20, 10, 30, 0)).toBe(0.5);
    expect(filterScore(20, 20, 30, 30)).toBe(0.5);
    expect(filterScore(0, 0, 10, 0)).toBe(0);
    expect(filterScore(10, 0, 10, 10)).toBe(0);
  });
});

describe('breathing + tap', () => {
  it('computes peak times every 8s starting at 4s', () => {
    expect(peakTimes(3)).toEqual([4000, 12000, 20000]);
  });
  it('scores tap accuracy', () => {
    expect(tapOffsetScore(0)).toBe(1);
    expect(tapOffsetScore(-150)).toBe(1);
    expect(tapOffsetScore(1000)).toBe(0);
    expect(tapOffsetScore(575)).toBeCloseTo(0.5, 5);
  });
  it('matches taps to the nearest unused peak within 2s', () => {
    const peaks = peakTimes(3);
    expect(matchTapToPeak(4100, peaks, new Set())).toEqual({ index: 0, offset: 100 });
    expect(matchTapToPeak(4100, peaks, new Set([0]))).toBeNull();
    expect(matchTapToPeak(8000, peaks, new Set())).toBeNull(); // 4s from any peak
    expect(matchTapToPeak(11000, peaks, new Set())).toEqual({ index: 1, offset: -1000 });
  });
  it('averages offsets, counting misses as zero', () => {
    expect(breathingScore([0, 0, 0, 0])).toBe(1);
    expect(breathingScore([0, null])).toBe(0.5);
    expect(breathingScore([])).toBe(0);
  });
});

describe('reaction under noise', () => {
  it('is near-perfect for fast, complete, clean runs', () => {
    expect(reactionScore(Array(10).fill(250), 0)).toBe(1);
  });
  it('drops with slow reactions, missed trials and false starts', () => {
    expect(reactionScore(Array(10).fill(700), 0)).toBe(0);
    expect(reactionScore(Array(5).fill(250), 0)).toBe(0.5);
    expect(reactionScore(Array(10).fill(250), 2)).toBeCloseTo(0.9, 5);
    expect(reactionScore([], 0)).toBe(0);
  });
});
