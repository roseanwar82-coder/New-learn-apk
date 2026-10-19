import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { FocusOverlay } from '../../native/focusOverlay';
import { useStore } from '../../state/store';
import { MAX_SESSION_MIN, MIN_SESSION_MIN, startFocusSession } from './startSession';

/** Returns a function that starts a session, routing to permissions when something is missing. */
export function useStartSession() {
  const router = useRouter();
  const blockMode = useStore((s) => s.blockMode);
  const blockedApps = useStore((s) => s.blockedApps);

  return useCallback(
    (minutes: number): boolean => {
      let result;
      try {
        result = startFocusSession(FocusOverlay, minutes, blockMode, blockedApps);
      } catch {
        Alert.alert('Could not start', 'The focus service is unavailable. Restart the app and try again.');
        return false;
      }
      if (result.ok) {
        router.replace('/session-active');
        return true;
      }
      if (result.reason === 'invalid_duration') {
        Alert.alert('Pick a length', `Sessions can be ${MIN_SESSION_MIN} to ${MAX_SESSION_MIN} minutes.`);
      } else if (result.reason === 'overlay_permission') {
        Alert.alert('One permission needed', 'Allow "Display over other apps" so the timer can float on top.', [
          { text: 'Set up', onPress: () => router.push('/permissions') },
        ]);
      } else {
        Alert.alert(
          'Usage access needed',
          'App blocking needs usage access to see which app is open. Allow it, or turn blocking off.',
          [{ text: 'Set up', onPress: () => router.push('/permissions') }, { text: 'Cancel', style: 'cancel' }],
        );
      }
      return false;
    },
    [router, blockMode, blockedApps],
  );
}
