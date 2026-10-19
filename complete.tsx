import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { BADGES } from '../features/gamification/badges';
import { StreakOutcome } from '../features/gamification/streak';
import { formatHours } from '../features/stats/weekly';
import { useStore } from '../state/store';
import { Body, Button, Card, H1, H2, Muted, Row, Screen } from '../ui/kit';
import { colors } from '../ui/theme';

const STREAK_TEXT: Record<StreakOutcome, string> = {
  started: 'Streak started. Come back tomorrow to keep it alive.',
  continued: 'Streak extended.',
  frozen: 'A streak freeze covered your missed day. Streak extended.',
  recovered: 'Streak recovered with your double-goal day.',
  reset: 'Your old streak ended. A new one starts today.',
  unchanged: 'Study a little more today to count it toward your streak.',
};

export default function Complete() {
  const router = useRouter();
  const outcome = useStore((s) => s.lastOutcome);
  const streak = useStore((s) => s.profile.streak.current);

  useEffect(() => {
    if (!outcome) router.replace('/(tabs)');
  }, [outcome]);

  if (!outcome) return null;
  const done = outcome.entry.completed;
  const newBadges = outcome.newBadges.map((id) => BADGES.find((b) => b.id === id)).filter(Boolean);

  return (
    <Screen>
      <Muted>{done ? 'Session complete' : 'Session ended'}</Muted>
      <H1>{done ? 'Nice work.' : 'Good effort.'}</H1>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Focus time</Body>
          <H2>{formatHours(outcome.entry.focusedMs)}</H2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>XP earned</Body>
          <H2 style={{ color: colors.accent }}>+{outcome.xpEarned}</H2>
        </Row>
        {outcome.leveledUp && <H2 style={{ color: colors.good }}>Level up! You're now level {outcome.levelAfter}.</H2>}
        {outcome.entry.blockAttempts > 0 && (
          <Muted>
            You tried to open a blocked app {outcome.entry.blockAttempts} time{outcome.entry.blockAttempts === 1 ? '' : 's'}.
          </Muted>
        )}
      </Card>

      <Card>
        <H2>🔥 {streak}-day streak</H2>
        <Muted>{STREAK_TEXT[outcome.streakOutcome]}</Muted>
      </Card>

      {newBadges.length > 0 && (
        <Card>
          <H2>New badges</H2>
          {newBadges.map((b) => (
            <Body key={b!.id}>
              🏅 {b!.title}: {b!.description}
            </Body>
          ))}
        </Card>
      )}

      <Button title="Done" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
