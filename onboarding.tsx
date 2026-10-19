import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { useStore } from '../state/store';
import { Body, Button, Card, Chip, H1, H2, Muted, Row, Screen } from '../ui/kit';

const GOALS = [30, 60, 90, 120, 180];

const SLIDES = [
  {
    title: 'Study deeper.',
    body: 'Earn XP for every focused minute, build streaks, level up and unlock badges. Short focus games warm your brain up first.',
  },
  {
    title: 'A timer that follows you.',
    body: 'A floating timer stays on top of your study apps. Pause, extend or stop it right from the bubble, even if StudyStreak is closed.',
  },
  {
    title: 'Block distractions. Circle to solve.',
    body: 'Pick the apps that pull you away and they get blocked during sessions. Stuck on a question? Circle it on screen and get a worked answer.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(60);

  const last = step === SLIDES.length;

  return (
    <Screen>
      <Muted>StudyStreak</Muted>
      {!last ? (
        <>
          <H1>{SLIDES[step].title}</H1>
          <Card>
            <Body>{SLIDES[step].body}</Body>
          </Card>
          <Button title="Next" onPress={() => setStep(step + 1)} />
        </>
      ) : (
        <>
          <H1>Set your daily goal</H1>
          <Card>
            <H2>How long do you want to study each day?</H2>
            <Row>
              {GOALS.map((m) => (
                <Chip key={m} label={`${m} min`} selected={goal === m} onPress={() => setGoal(m)} />
              ))}
            </Row>
            <Muted>You can change this any time in Settings.</Muted>
          </Card>
          <Button
            title="Set up permissions"
            onPress={() => {
              complete(goal);
              router.replace('/permissions');
            }}
          />
        </>
      )}
    </Screen>
  );
}
