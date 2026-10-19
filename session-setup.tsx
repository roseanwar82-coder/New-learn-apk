import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { describeMode } from '../features/blocking/config';
import { GAMES } from '../features/games/logic';
import { MAX_SESSION_MIN, MIN_SESSION_MIN } from '../features/session/startSession';
import { useStartSession } from '../features/session/useStartSession';
import { useStore } from '../state/store';
import { Body, Button, Card, Chip, H1, H2, Muted, Row, Screen } from '../ui/kit';

const PRESETS = [15, 25, 45, 60, 90];

export default function SessionSetup() {
  const router = useRouter();
  const start = useStartSession();
  const blockMode = useStore((s) => s.blockMode);
  const blockedApps = useStore((s) => s.blockedApps);
  const setBlockMode = useStore((s) => s.setBlockMode);
  const [minutes, setMinutes] = useState(25);

  const step = (d: number) => setMinutes((m) => Math.min(MAX_SESSION_MIN, Math.max(MIN_SESSION_MIN, m + d)));

  return (
    <Screen>
      <H1>New session</H1>

      <Card>
        <H2>Length</H2>
        <Row>
          {PRESETS.map((m) => (
            <Chip key={m} label={`${m}`} selected={minutes === m} onPress={() => setMinutes(m)} />
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Button title="−5" variant="ghost" onPress={() => step(-5)} style={{ minWidth: 70 }} />
          <H1>{minutes} min</H1>
          <Button title="+5" variant="ghost" onPress={() => step(5)} style={{ minWidth: 70 }} />
        </Row>
      </Card>

      <Card>
        <H2>App blocking</H2>
        <Row>
          {(['off', 'soft', 'hard'] as const).map((m) => (
            <Chip key={m} label={m === 'off' ? 'Off' : m === 'soft' ? 'Soft' : 'Hard'} selected={blockMode === m} onPress={() => setBlockMode(m)} />
          ))}
        </Row>
        <Muted>{describeMode(blockMode)}</Muted>
        <Body>{blockedApps.length === 0 ? 'No apps chosen yet.' : `${blockedApps.length} apps will be blocked.`}</Body>
        <Button title="Choose apps" variant="ghost" onPress={() => router.push('/apps')} />
      </Card>

      <Card>
        <H2>Warm up first (optional)</H2>
        <Muted>A 1-2 minute game, then your session starts.</Muted>
        <Row>
          {GAMES.map((g) => (
            <Chip
              key={g.id}
              label={g.title}
              onPress={() => router.push({ pathname: '/game/[id]', params: { id: g.id, minutes: String(minutes) } })}
            />
          ))}
        </Row>
      </Card>

      <Button title={`Start ${minutes} min`} onPress={() => start(minutes)} />
      <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
