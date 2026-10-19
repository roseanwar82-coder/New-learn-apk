import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Muted } from '../../../ui/kit';
import { colors } from '../../../ui/theme';
import { Stimulus, filterScore, makeStimuli } from '../logic';

const TOTAL = 60;
const PERIOD_MS = 1000;
const SHOW_MS = 800;
const SHAPE = 64;
const ARENA_H = 360;

interface Current {
  i: number;
  kind: Stimulus;
  x: number;
  y: number;
}

export function DistractionFilter({ onFinish }: { onFinish: (score01: number) => void }) {
  const { width } = useWindowDimensions();
  const arenaW = Math.min(width - 32, 340);

  const [cur, setCur] = useState<Current | null>(null);
  const [shown, setShown] = useState(0);

  const stimuli = useRef(makeStimuli(TOTAL)).current;
  const counts = useRef({ targets: 0, decoys: 0, hits: 0, falseTaps: 0 });
  const tappedIndex = useRef(-1);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const finished = useRef(false);

  useEffect(() => {
    let i = 0;
    const hideTimers: ReturnType<typeof setTimeout>[] = [];
    const iv = setInterval(() => {
      if (i >= TOTAL) {
        clearInterval(iv);
        if (!finished.current) {
          finished.current = true;
          const c = counts.current;
          finishRef.current(filterScore(c.targets, c.hits, c.decoys, c.falseTaps));
        }
        return;
      }
      const kind = stimuli[i];
      if (kind === 'target') counts.current.targets += 1;
      else counts.current.decoys += 1;
      const idx = i;
      setCur({
        i: idx,
        kind,
        x: Math.random() * (arenaW - SHAPE),
        y: Math.random() * (ARENA_H - SHAPE),
      });
      setShown(idx + 1);
      hideTimers.push(setTimeout(() => setCur((c) => (c && c.i === idx ? null : c)), SHOW_MS));
      i += 1;
    }, PERIOD_MS);
    return () => {
      finished.current = true;
      clearInterval(iv);
      hideTimers.forEach(clearTimeout);
    };
  }, []);

  const onTapShape = () => {
    if (!cur || tappedIndex.current === cur.i) return;
    tappedIndex.current = cur.i;
    if (cur.kind === 'target') counts.current.hits += 1;
    else counts.current.falseTaps += 1;
    setCur(null);
  };

  return (
    <View style={styles.wrap}>
      <Muted>
        Tap circles only · {Math.max(0, TOTAL - shown)}s left
      </Muted>
      <View style={[styles.arena, { width: arenaW, height: ARENA_H }]}>
        {cur && (
          <Pressable
            onPress={onTapShape}
            hitSlop={12}
            style={[
              styles.shape,
              { left: cur.x, top: cur.y },
              cur.kind === 'target'
                ? { borderRadius: SHAPE / 2, backgroundColor: colors.good }
                : { borderRadius: 8, backgroundColor: colors.bad },
            ]}
          />
        )}
      </View>
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
  shape: { position: 'absolute', width: SHAPE, height: SHAPE },
});
