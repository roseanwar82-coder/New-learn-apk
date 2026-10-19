import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, AppState, Text } from 'react-native';

import { FocusOverlay } from '../../native/focusOverlay';
import { useStore } from '../../state/store';
import { colors } from '../../ui/theme';

const icon = (glyph: string) => () => <Text style={{ fontSize: 18 }}>{glyph}</Text>;

export default function TabsLayout() {
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);
  const ingestFinished = useStore((s) => s.ingestFinished);

  // This layout stays mounted under every other screen, so it is the one place that
  // pulls finished sessions in: on launch, on returning to the app, and when the
  // floating timer reports that a session ended.
  useEffect(() => {
    if (!onboarded) return;
    const check = () => {
      if (ingestFinished()) router.push('/complete');
    };
    check();

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    let eventSub: { remove(): void } | null = null;
    try {
      eventSub = FocusOverlay.onEvent((e) => {
        if (e.action === 'completed' || e.action === 'aborted') check();
        if (e.action === 'permissionLost') {
          Alert.alert('Overlay permission lost', 'Allow "Display over other apps" again to keep the floating timer.');
        }
      });
    } catch {
      // native module unavailable
    }

    return () => {
      appSub.remove();
      eventSub?.remove();
    };
  }, [onboarded]);

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('🎯') }} />
      <Tabs.Screen name="games" options={{ title: 'Train', tabBarIcon: icon('🧠') }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
