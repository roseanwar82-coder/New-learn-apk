import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../ui/theme';
import { Muted, ProgressBar } from '../../../ui/kit';
import { FOCUS_HOLD_TARGETS, focusHoldScore } from '../logic';

export function FocusHold({ onFinish }: { onFinish: (score01: number) => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'holding' | 'between'>('ready');
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');

  const roundRef = useRef(0);
  const held = useRef<number[]>([]);
  const startedAt = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dead = useRef(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      dead.current = true;
      if (interval.current) clearInterval(interval.current);
      timeouts.current.forEach(clearTimeout);
    };
  }, [pulse]);

  const later = (fn: () => void, ms: number) => {
    timeouts.current.push(
      setTimeout(() => {
        if (!dead.current) fn();
      }, ms),
    );
  };

  const endRound = (heldMs: number, success: boolean) => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    const r = roundRef.current;
    held.current[r] = Math.min(heldMs, FOCUS_HOLD_TARGETS[r]);
    setPhase('between');
    setNote(success ? 'Nice. Round complete.' : 'Released early.');
    if (r >= FOCUS_HOLD_TARGETS.length - 1) {
      later(() => onFinish(focusHoldScore(held.current)), 900);
      return;
    }
    later(() => {
      roundRef.current = r + 1;
      setRound(r + 1);
      setProgress(0);
      setNote('');
      setPhase('ready');
    }, 1100);
  };

  const onPressIn = () => {
    if (phase !== 'ready') return;
    setPhase('holding');
    startedAt.current = Date.now();
    const target = FOCUS_HOLD_TARGETS[roundRef.current];
    interval.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setProgress(Math.min(1, elapsed / target));
      if (elapsed >= target) endRound(target, true);
    }, 100);
  };

  const onPressOut = () => {
    if (phase !== 'holding') return;
    endRound(Date.now() - startedAt.current, false);
  };

  const target = FOCUS_HOLD_TARGETS[round];
  const label =
    phase === 'ready'
      ? 'Press and hold'
      : phase === 'holding'
        ? `${Math.max(0, Math.ceil((target * (1 - progress)) / 1000))}s`
        : note;

  return (
    <View style={styles.wrap}>
      <Muted>
        Round {round + 1} of {FOCUS_HOLD_TARGETS.length} · hold for {target / 1000}s
      </Muted>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={styles.hit}>
        <Animated.View
          style={[
            styles.orb,
            { transform: [{ scale: pulse }] },
            phase === 'holding' && { backgroundColor: colors.accent },
          ]}
        >
          <Text style={styles.orbText}>{label}</Text>
        </Animated.View>
      </Pressable>
      <View style={{ width: '80%' }}>
        <ProgressBar value={progress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 32, paddingVertical: 24 },
  hit: { padding: 24 },
  orb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbText: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', paddingHorizontal: 12 },
});
