import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Button, Muted } from '../../../ui/kit';
import { colors } from '../../../ui/theme';
import {
  BREATH_CYCLES,
  BREATH_CYCLE_MS,
  BREATH_INHALE_MS,
  breathingScore,
  matchTapToPeak,
  peakTimes,
  tapOffsetScore,
} from '../logic';

export function BreathingTap({ onFinish }: { onFinish: (score01: number) => void }) {
  const [started, setStarted] = useState(false);
  const [label, setLabel] = useState('Breathe in');
  const [feedback, setFeedback] = useState('');
  const [taps, setTaps] = useState(0);

  const scale = useRef(new Animated.Value(0.5)).current;
  const startedAt = useRef(0);
  const peaks = useRef(peakTimes()).current;
  const offsets = useRef<(number | null)[]>(peaks.map(() => null));
  const used = useRef(new Set<number>());
  const dead = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const labelIv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      dead.current = true;
      timers.current.forEach(clearTimeout);
      if (labelIv.current) clearInterval(labelIv.current);
      scale.stopAnimation();
    },
    [scale],
  );

  const start = () => {
    setStarted(true);
    startedAt.current = Date.now();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: BREATH_INHALE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.5,
          duration: BREATH_CYCLE_MS - BREATH_INHALE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    labelIv.current = setInterval(() => {
      const t = (Date.now() - startedAt.current) % BREATH_CYCLE_MS;
      setLabel(t < BREATH_INHALE_MS ? 'Breathe in' : 'Breathe out');
    }, 200);
    timers.current.push(
      setTimeout(() => {
        if (dead.current) return;
        if (labelIv.current) clearInterval(labelIv.current);
        scale.stopAnimation();
        onFinish(breathingScore(offsets.current));
      }, BREATH_CYCLES * BREATH_CYCLE_MS),
    );
  };

  const onTap = () => {
    if (!started) return;
    const t = Date.now() - startedAt.current;
    const m = matchTapToPeak(t, peaks, used.current);
    if (!m) {
      setFeedback('Too early or late');
      return;
    }
    used.current.add(m.index);
    offsets.current[m.index] = m.offset;
    setTaps((n) => n + 1);
    const s = tapOffsetScore(m.offset);
    setFeedback(s >= 0.9 ? 'Perfect' : s >= 0.5 ? 'Good' : m.offset < 0 ? 'A bit early' : 'A bit late');
  };

  return (
    <View style={styles.wrap}>
      <Muted>
        {started ? `Peaks tapped: ${taps} / ${BREATH_CYCLES}` : 'About one minute. Breathe slowly.'}
      </Muted>
      <View style={styles.ringBox}>
        <Animated.View style={[styles.ring, { transform: [{ scale }] }]} />
        <Text style={styles.label}>{started ? label : 'Ready?'}</Text>
      </View>
      <Text style={styles.feedback}>{feedback}</Text>
      {started ? (
        <Button title="Tap at the top of the inhale" onPress={onTap} style={{ alignSelf: 'stretch' }} />
      ) : (
        <Button title="Start" onPress={start} style={{ alignSelf: 'stretch' }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 20, paddingVertical: 24 },
  ringBox: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  label: { color: colors.text, fontSize: 22, fontWeight: '700' },
  feedback: { color: colors.muted, fontSize: 15, height: 22 },
});
