import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button, Muted } from '../../../ui/kit';
import { colors } from '../../../ui/theme';
import { REACTION_TRIALS, reactionScore } from '../logic';

const NOISE_COLORS = ['#FF6B6B', '#FFD166', '#4CC9F0', '#B388FF', '#FF9F1C'];
const DOTS = 14;
const ARENA_H = 380;
const TARGET = 80;

interface Dot {
  x: number;
  y: number;
  size: number;
  color: string;
}

function makeDots(w: number): Dot[] {
  return Array.from({ length: DOTS }, () => ({
    x: Math.random() * (w - 40),
    y: Math.random() * (ARENA_H - 40),
    size: 14 + Math.random() * 22,
    color: NOISE_COLORS[Math.floor(Math.random() * NOISE_COLORS.length)],
  }));
}

export function ReactionNoise({ onFinish }: { onFinish: (score01: number) => void }) {
  const { width } = useWindowDimensions();
  const arenaW = Math.min(width - 32, 340);

  const [started, setStarted] = useState(false);
  const [dots, setDots] = useState<Dot[]>(() => makeDots(arenaW));
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [trial, setTrial] = useState(0);

  const trialRef = useRef(0);
  const targetAt = useRef(0);
  const reactions = useRef<number[]>([]);
  const falseStarts = useRef(0);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dead = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const iv = setInterval(() => setDots(makeDots(arenaW)), 170);
    return () => clearInterval(iv);
  }, [arenaW]);

  useEffect(
    () => () => {
      dead.current = true;
      timers.current.forEach(clearTimeout);
      if (missTimer.current) clearTimeout(missTimer.current);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(
      setTimeout(() => {
        if (!dead.current) fn();
      }, ms),
    );
  };

  const nextTrial = () => {
    if (trialRef.current >= REACTION_TRIALS) {
      finishRef.current(reactionScore(reactions.current, falseStarts.current));
      return;
    }
    setTarget(null);
    targetAt.current = 0;
    later(() => {
      setTarget({
        x: 20 + Math.random() * (arenaW - TARGET - 40),
        y: 20 + Math.random() * (ARENA_H - TARGET - 40),
      });
      targetAt.current = Date.now();
      missTimer.current = setTimeout(() => {
        if (dead.current || !targetAt.current) return;
        targetAt.current = 0; // missed this trial
        setTarget(null);
        trialRef.current += 1;
        setTrial(trialRef.current);
        later(nextTrial, 500);
      }, 2000);
    }, 1500 + Math.random() * 2500);
  };

  const begin = () => {
    setStarted(true);
    nextTrial();
  };

  const onTapTarget = () => {
    if (!targetAt.current) return;
    reactions.current.push(Date.now() - targetAt.current);
    targetAt.current = 0;
    if (missTimer.current) clearTimeout(missTimer.current);
    setTarget(null);
    trialRef.current += 1;
    setTrial(trialRef.current);
    later(nextTrial, 600);
  };

  const onTapBackground = () => {
    if (started && !targetAt.current && trialRef.current < REACTION_TRIALS) falseStarts.current += 1;
  };

  return (
    <View style={styles.wrap}>
      <Muted>
        {started ? `Trial ${Math.min(trial + 1, REACTION_TRIALS)} of ${REACTION_TRIALS}` : 'Tap only the big green circle.'}
      </Muted>
      <Pressable onPress={onTapBackground} style={[styles.arena, { width: arenaW, height: ARENA_H }]}>
        {dots.map((d, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: d.x,
              top: d.y,
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              backgroundColor: d.color,
              opacity: 0.55,
            }}
          />
        ))}
        {target && (
          <Pressable
            onPress={onTapTarget}
            hitSlop={10}
            style={[styles.target, { left: target.x, top: target.y }]}
          />
        )}
        {!started && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Colored dots will flicker. Wait for the green one.</Text>
            <Button title="Start" onPress={begin} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 20, paddingVertical: 24 },
  arena: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  target: {
    position: 'absolute',
    width: TARGET,
    height: TARGET,
    borderRadius: TARGET / 2,
    backgroundColor: colors.good,
    borderWidth: 3,
    borderColor: '#B7F5CB',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  overlayText: { color: colors.text, fontSize: 16, textAlign: 'center' },
});
