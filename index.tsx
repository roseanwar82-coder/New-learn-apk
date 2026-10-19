import { useRouter } from 'expo-router';
import React from 'react';

import { deviceDayKey } from '../../core/dayKey';
import { levelProgress } from '../../features/gamification/xp';
import { liveStreak } from '../../features/gamification/streak';
import { usePermissions } from '../../features/permissions/usePermissions';
import { formatHours } from '../../features/stats/weekly';
import { useStore } from '../../state/store';
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Row, Screen } from '../../ui/kit';
import { colors } from '../../ui/theme';

export default function Today() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const [perms] = usePermissions();

  const today = deviceDayKey();
  const lvl = levelProgress(profile.xpTotal);
  const live = liveStreak(profile.streak, today);
  const dayMs = profile.dailyFocusMs[today] ?? 0;
  const goalMs = profile.dailyGoalMin * 60_000;
  const threshold = profile.streakThresholdMin;

  let streakNote: string;
  if (live.qualifiedToday) streakNote = "Today's streak is secured.";
  else if (live.recoverable) streakNote = `Study ${threshold * 2} min today to save your streak.`;
  else if (live.atRisk) streakNote = `Study ${threshold} min today to keep it going.`;
  else streakNote = `Study ${threshold} min today to start a streak.`;

  return (
    <Screen>
      <Muted>Level {lvl.level}</Muted>
      <H1>Ready to focus?</H1>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Level {lvl.level}</H2>
          <Muted>
            {lvl.intoLevel} / {lvl.needed} XP
          </Muted>
        </Row>
        <ProgressBar value={lvl.fraction} />
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>🔥 {live.value}-day streak</H2>
          <Muted>❄ {profile.streak.freezeTokens} freeze</Muted>
        </Row>
        <Muted>{streakNote}</Muted>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Daily goal</H2>
          <Muted>
            {formatHours(dayMs)} / {formatHours(goalMs)}
          </Muted>
        </Row>
        <ProgressBar value={goalMs > 0 ? dayMs / goalMs : 0} color={dayMs >= goalMs ? colors.good : colors.accent} />
      </Card>

      {!perms.overlay && (
        <Card style={{ borderColor: colors.warn }}>
          <H2>Finish setup</H2>
          <Body>Allow the floating timer to appear over other apps.</Body>
          <Button title="Set up permissions" variant="ghost" onPress={() => router.push('/permissions')} />
        </Card>
      )}

      <Button title="Start focus session" onPress={() => router.push('/session-setup')} />
    </Screen>
  );
}
