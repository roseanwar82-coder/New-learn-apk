import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { describeMode } from '../../features/blocking/config';
import { FocusOverlay } from '../../native/focusOverlay';
import { useStore } from '../../state/store';
import { Body, Button, Card, Chip, H1, H2, Muted, Row, Screen } from '../../ui/kit';
import { colors } from '../../ui/theme';

const GOALS = [30, 60, 90, 120, 180];
const THRESHOLDS = [10, 15, 25, 30];

export default function Settings() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const blockMode = useStore((s) => s.blockMode);
  const blockedApps = useStore((s) => s.blockedApps);
  const solverDetail = useStore((s) => s.solverDetail);
  const { setDailyGoal, setStreakThreshold, setBlockMode, setSolverDetail, resetAll } = useStore.getState();

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saved, setSaved] = useState(() => {
    try {
      return FocusOverlay.hasSolverConfig();
    } catch {
      return false;
    }
  });

  const saveSolver = () => {
    if (!apiKey.trim() && !baseUrl.trim()) {
      Alert.alert('Nothing to save', 'Enter an API key, or a proxy URL.');
      return;
    }
    try {
      FocusOverlay.setSolverConfig({
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || undefined,
        detail: solverDetail,
      });
      setSaved(true);
      setApiKey('');
      Alert.alert('Saved', 'Circle to solve is ready. Start a session and open the floating timer.');
    } catch {
      Alert.alert('Could not save', 'The native module is unavailable.');
    }
  };

  const confirmReset = () =>
    Alert.alert('Reset everything?', 'This deletes your XP, streaks, badges and history on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
    ]);

  return (
    <Screen>
      <H1>Settings</H1>

      <Card>
        <H2>Daily goal</H2>
        <Row>
          {GOALS.map((m) => (
            <Chip key={m} label={`${m} min`} selected={profile.dailyGoalMin === m} onPress={() => setDailyGoal(m)} />
          ))}
        </Row>
        <H2>Minutes to keep your streak</H2>
        <Row>
          {THRESHOLDS.map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              selected={profile.streakThresholdMin === m}
              onPress={() => setStreakThreshold(m)}
            />
          ))}
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
        <Button title={`Choose apps (${blockedApps.length})`} variant="ghost" onPress={() => router.push('/apps')} />
      </Card>

      <Card>
        <H2>Circle to solve (AI)</H2>
        <Muted>
          {saved ? 'A key or proxy is saved on this phone.' : 'Add your API key to enable it.'} The key is stored only in
          this app's private storage.
        </Muted>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={saved ? 'Enter a new API key to replace it' : 'API key'}
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TextInput
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="Proxy URL (optional)"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Row>
          <Chip label="Step by step" selected={solverDetail === 'steps'} onPress={() => setSolverDetail('steps')} />
          <Chip label="Short answers" selected={solverDetail === 'short'} onPress={() => setSolverDetail('short')} />
        </Row>
        <Button title="Save" onPress={saveSolver} />
      </Card>

      <Card>
        <H2>Permissions</H2>
        <Body>Overlay, usage access, notifications and battery settings.</Body>
        <Button title="Review permissions" variant="ghost" onPress={() => router.push('/permissions')} />
      </Card>

      <Button title="Reset all data" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
