import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { remainingMs } from '../features/session/timer';
import { FocusOverlay } from '../native/focusOverlay';
import { useStore } from '../state/store';
import { Body, Button, Muted } from '../ui/kit';
import { colors } from '../ui/theme';

function fmt(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function SessionActive() {
  const router = useRouter();
  const blockMode = useStore((s) => s.blockMode);
  const blockedCount = useStore((s) => s.blockedApps.length);
  const ingestFinished = useStore((s) => s.ingestFinished);
  const [, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  let snapshot: ReturnType<typeof FocusOverlay.readTimer> = null;
  try {
    snapshot = FocusOverlay.readTimer();
  } catch {
    snapshot = null;
  }

  // No live timer: either it just finished (pull it in) or nothing is running.
  const hasTimer = !!snapshot;
  useEffect(() => {
    if (hasTimer) return;
    const t = setTimeout(() => {
      if (ingestFinished()) router.replace('/complete');
      else router.replace('/(tabs)');
    }, 600);
    return () => clearTimeout(t);
  }, [hasTimer]);

  const stop = () =>
    Alert.alert('Stop this session?', 'You keep the XP for the focus time so far.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => FocusOverlay.endSession() },
    ]);

  const paused = snapshot?.state.status === 'paused';
  const remaining = snapshot ? remainingMs(snapshot.state, snapshot.now) : 0;

  return (
    <View style={styles.wrap}>
      <Muted>{paused ? 'Paused' : 'Focusing'}</Muted>
      <Text style={styles.time}>{fmt(remaining)}</Text>
      <Body style={{ textAlign: 'center' }}>
        The timer is floating over your other apps. Switch to what you're studying. Tap the bubble for pause, +5 min, stop
        and Circle to solve.
      </Body>
      <Muted style={{ textAlign: 'center' }}>
        {blockMode === 'off' || blockedCount === 0
          ? 'App blocking is off for this session.'
          : `Blocking ${blockedCount} apps (${blockMode} mode).`}
      </Muted>
      <Button title="Stop session" variant="danger" onPress={stop} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  time: { color: colors.text, fontSize: 72, fontWeight: '800', letterSpacing: -2 },
});
