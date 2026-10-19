import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { GAMES, scoreLabel } from '../../features/games/logic';
import { useStore } from '../../state/store';
import { Body, Card, H1, H2, Muted, Row, Screen } from '../../ui/kit';

export default function Train() {
  const router = useRouter();
  const best = useStore((s) => s.gameBest);

  return (
    <Screen>
      <H1>Focus training</H1>
      <Muted>Short games that build concentration. Play one as a warm-up before studying. Game XP is capped each day.</Muted>
      {GAMES.map((g) => {
        const b = best[g.id];
        return (
          <Pressable key={g.id} onPress={() => router.push({ pathname: '/game/[id]', params: { id: g.id } })}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <H2>{g.title}</H2>
                <Muted>{g.duration}</Muted>
              </Row>
              <Body>{g.blurb}</Body>
              <Muted>{b === undefined ? 'Not played yet' : `Best: ${Math.round(b * 100)}% · ${scoreLabel(b)}`}</Muted>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
