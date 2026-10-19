import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';

import { BreathingTap } from '../../features/games/ui/BreathingTap';
import { DistractionFilter } from '../../features/games/ui/DistractionFilter';
import { FocusHold } from '../../features/games/ui/FocusHold';
import { PatternMemory } from '../../features/games/ui/PatternMemory';
import { ReactionNoise } from '../../features/games/ui/ReactionNoise';
import { GameId, getGame, scoreLabel } from '../../features/games/logic';
import { BADGES } from '../../features/gamification/badges';
import { useStartSession } from '../../features/session/useStartSession';
import { useStore } from '../../state/store';
import { Body, Button, Card, H1, H2, Muted, Row, Screen } from '../../ui/kit';
import { colors } from '../../ui/theme';

type Phase = 'intro' | 'play' | 'result';

const COMPONENTS: Record<GameId, React.ComponentType<{ onFinish: (score01: number) => void }>> = {
  'focus-hold': FocusHold,
  'pattern-memory': PatternMemory,
  'distraction-filter': DistractionFilter,
  'breathing-tap': BreathingTap,
  'reaction-noise': ReactionNoise,
};

export default function GameScreen() {
  const { id, minutes } = useLocalSearchParams<{ id: string; minutes?: string }>();
  const router = useRouter();
  const start = useStartSession();
  const recordGame = useStore((s) => s.recordGame);

  const game = getGame(String(id));
  const [phase, setPhase] = useState<Phase>('intro');
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<{ score: number; xp: number; badges: string[] } | null>(null);

  if (!game) {
    return (
      <Screen>
        <H1>Game not found</H1>
        <Button title="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const Game = COMPONENTS[game.id];
  const sessionMinutes = minutes ? Number(minutes) : 0;

  const onFinish = (score: number) => {
    const out = recordGame(game.id, score);
    setResult({ score, xp: out.xpEarned, badges: out.newBadges });
    setPhase('result');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  if (phase === 'intro') {
    return (
      <Screen>
        <H1>{game.title}</H1>
        <Card>
          <Body>{game.instructions}</Body>
          <Muted>{game.duration}</Muted>
        </Card>
        <Button
          title="Start"
          onPress={() => {
            setRun((n) => n + 1);
            setPhase('play');
          }}
        />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (phase === 'play') {
    return (
      <Screen>
        <H2>{game.title}</H2>
        <Game key={run} onFinish={onFinish} />
      </Screen>
    );
  }

  const newBadges = (result?.badges ?? []).map((b) => BADGES.find((x) => x.id === b)).filter(Boolean);
  return (
    <Screen>
      <Muted>{game.title}</Muted>
      <H1>{result ? scoreLabel(result.score) : ''}</H1>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Score</Body>
          <H2>{result ? Math.round(result.score * 100) : 0}%</H2>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>XP</Body>
          <H2 style={{ color: colors.accent }}>
            {result && result.xp > 0 ? `+${result.xp}` : '0 (daily game XP cap reached)'}
          </H2>
        </Row>
        {newBadges.map((b) => (
          <Body key={b!.id}>
            🏅 {b!.title}
          </Body>
        ))}
      </Card>
      {sessionMinutes > 0 && (
        <Button title={`Start ${sessionMinutes} min session`} onPress={() => start(sessionMinutes)} />
      )}
      <Button
        title="Play again"
        variant={sessionMinutes > 0 ? 'ghost' : 'primary'}
        onPress={() => {
          setResult(null);
          setRun((n) => n + 1);
          setPhase('play');
        }}
      />
      <Button title="Done" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
