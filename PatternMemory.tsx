import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Muted } from '../../../ui/kit';
import { colors } from '../../../ui/theme';
import {
  PATTERN_MAX_ROUNDS,
  PATTERN_START_LENGTH,
  checkTap,
  makeSequence,
  patternScore,
} from '../logic';

export function PatternMemory({ onFinish }: { onFinish: (score01: number) => void }) {
  const { width } = useWindowDimensions();
  const tile = Math.min(width - 48, 330) / 3 - 8;

  const [rounds, setRounds] = useState(0);
  const [lives, setLives] = useState(3);
  const [seq, setSeq] = useState<number[]>(() => makeSequence(PATTERN_START_LENGTH));
  const [replay, setReplay] = useState(0);
  const [phase, setPhase] = useState<'show' | 'input' | 'wait'>('show');
  const [lit, setLit] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);

  const idx = useRef(0);
  const dead = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(
      setTimeout(() => {
        if (!dead.current) fn();
      }, ms),
    );
  };

  useEffect(
    () => () => {
      dead.current = true;
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  // Play the sequence whenever it changes or a replay is requested.
  useEffect(() => {
    setPhase('show');
    idx.current = 0;
    let t = 600;
    seq.forEach((cell) => {
      later(() => setLit(cell), t);
      later(() => setLit(null), t + 550);
      t += 800;
    });
    later(() => setPhase('input'), t);
  }, [seq, replay]);

  const onTap = (cell: number) => {
    if (phase !== 'input') return;
    const result = checkTap(seq, idx.current, cell);
    setLit(cell);
    later(() => setLit(null), 160);

    if (result === 'correct') {
      idx.current += 1;
      return;
    }
    if (result === 'complete') {
      const done = rounds + 1;
      setRounds(done);
      setPhase('wait');
      if (done >= PATTERN_MAX_ROUNDS) {
        later(() => onFinish(patternScore(done)), 500);
      } else {
        later(() => setSeq(makeSequence(PATTERN_START_LENGTH + done)), 700);
      }
      return;
    }
    // wrong
    const left = lives - 1;
    setLives(left);
    setWrong(cell);
    setPhase('wait');
    if (left <= 0) {
      later(() => onFinish(patternScore(rounds)), 800);
    } else {
      later(() => {
        setWrong(null);
        setReplay((n) => n + 1);
      }, 900);
    }
  };

  return (
    <View style={styles.wrap}>
      <Muted>
        Round {rounds + 1} · {'♥'.repeat(Math.max(0, lives))} ·{' '}
        {phase === 'show' ? 'Watch…' : phase === 'input' ? 'Your turn' : ' '}
      </Muted>
      <View style={[styles.grid, { width: (tile + 8) * 3 }]}>
        {Array.from({ length: 9 }, (_, cell) => (
          <Pressable
            key={cell}
            onPress={() => onTap(cell)}
            style={[
              styles.tile,
              { width: tile, height: tile },
              lit === cell && { backgroundColor: colors.accent },
              wrong === cell && { backgroundColor: colors.bad },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 24, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    margin: 4,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
