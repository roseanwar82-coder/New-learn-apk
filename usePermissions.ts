import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { FocusOverlay } from '../../native/focusOverlay';

export interface PermState {
  overlay: boolean;
  usage: boolean;
  notifications: boolean;
  battery: boolean;
}

const none: PermState = { overlay: false, usage: false, notifications: false, battery: false };

async function read(): Promise<PermState> {
  const safe = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };
  let notifications = false;
  try {
    notifications = (await Notifications.getPermissionsAsync()).granted;
  } catch {
    notifications = false;
  }
  return {
    overlay: safe(() => FocusOverlay.hasOverlayPermission(), false),
    usage: safe(() => FocusOverlay.hasUsageAccess(), false),
    battery: safe(() => FocusOverlay.isIgnoringBatteryOptimizations(), false),
    notifications,
  };
}

/** Permission status that re-checks whenever the app returns to the foreground. */
export function usePermissions(): [PermState, () => Promise<void>] {
  const [state, setState] = useState<PermState>(none);

  const refresh = useCallback(async () => {
    setState(await read());
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return [state, refresh];
}

export async function requestNotifications(): Promise<boolean> {
  try {
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
