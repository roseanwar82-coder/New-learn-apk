import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { deviceDayKey } from '../../core/dayKey';
import { BADGES } from '../../features/gamification/badges';
import { levelFromXp } from '../../features/gamification/xp';
import { formatHours, lastNDays } from '../../features/stats/weekly';
import { useStore } from '../../state/store';
import { Body, Card, H1, H2, Muted, Row, Screen } from '../../ui/kit';
import { colors } from '../../ui/theme';

export default function Stats() {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);

  const week = lastNDays(profile.dailyFocusMs, deviceDayKey(), 7);
  const maxMin = Math.max(30, ...week.map((d) => d.minutes));
  const unlocked = new Set(profile.unlockedBadges);

  return (
    <Screen>
      <H1>Stats</H1>

      <Card>
        <H2>Last 7 days</H2>
        <View style={styles.chart}>
          {week.map((d) => (
            <View key={d.day} style={styles.col}>
              <Text style={styles.val}>{d.minutes > 0 ? d.minutes : ''}</Text>
              <View style={[styles.bar, { height: Math.max(3, (d.minutes / maxMin) * 110) }]} />
              <Text style={styles.lbl}>{d.label}</Text>
            </View>
          ))}
        </View>
        <Muted>Minutes of focus per day</Muted>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Total focus</Body>
          <H2>{formatHours(profile.stats.totalFocusMs)}</H2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Sessions completed</Body>
          <H2>{profile.stats.sessionsCompleted}</H2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Longest streak</Body>
          <H2>{profile.streak.longest} days</H2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Level</Body>
          <H2>{levelFromXp(profile.xpTotal)}</H2>
        </Row>
      </Card>

      <H2>Badges</H2>
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const got = unlocked.has(b.id);
          return (
            <View key={b.id} style={[styles.badge, !got && { opacity: 0.4 }]}>
              <Text style={styles.badgeIcon}>{got ? '🏅' : '🔒'}</Text>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
            </View>
          );
        })}
      </View>

      <H2>Recent sessions</H2>
      {history.length === 0 && <Muted>No sessions yet. Your first one will show up here.</Muted>}
      {history.slice(0, 8).map((h) => (
        <Card key={h.endedAt}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>{new Date(h.endedAt).toLocaleString()}</Body>
            <Body>+{h.xp} XP</Body>
          </Row>
          <Muted>
            {formatHours(h.focusedMs)} · {h.completed ? 'completed' : 'stopped early'}
            {h.blockAttempts > 0 ? ` · ${h.blockAttempts} blocked-app attempt${h.blockAttempts === 1 ? '' : 's'}` : ''}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, paddingTop: 8 },
  col: { alignItems: 'center', flex: 1, gap: 4 },
  bar: { width: 18, borderRadius: 6, backgroundColor: colors.accent },
  val: { color: colors.muted, fontSize: 11, height: 14 },
  lbl: { color: colors.muted, fontSize: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 2,
  },
  badgeIcon: { fontSize: 22 },
  badgeTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  badgeDesc: { color: colors.muted, fontSize: 12 },
});
