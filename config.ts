export type BlockMode = 'off' | 'soft' | 'hard';

export interface BlockedApp {
  packageName: string;
  label: string;
}

/** Never offered for blocking or sent to the native blocker. */
export const NEVER_BLOCK: readonly string[] = [
  'com.android.settings',
  'com.android.systemui',
  'com.android.phone',
  'com.android.dialer',
  'com.google.android.dialer',
  'com.samsung.android.dialer',
  'com.android.emergency',
  'com.google.android.apps.safetyhub',
];

export function isBlockable(packageName: string, ownPackage?: string): boolean {
  if (!packageName) return false;
  if (ownPackage && packageName === ownPackage) return false;
  return !NEVER_BLOCK.includes(packageName);
}

export function isBlocked(list: readonly BlockedApp[], packageName: string): boolean {
  return list.some((a) => a.packageName === packageName);
}

/** Adds the app if absent, removes it if present. Returns a new list. */
export function toggleApp(list: readonly BlockedApp[], app: BlockedApp): BlockedApp[] {
  if (!isBlockable(app.packageName)) return [...list];
  return isBlocked(list, app.packageName)
    ? list.filter((a) => a.packageName !== app.packageName)
    : [...list, app];
}

export function blockedPackages(list: readonly BlockedApp[]): string[] {
  return list.filter((a) => isBlockable(a.packageName)).map((a) => a.packageName);
}

export function describeMode(mode: BlockMode): string {
  switch (mode) {
    case 'off':
      return 'No blocking';
    case 'soft':
      return 'Warning screen. You can continue after a short wait.';
    case 'hard':
      return 'Blocked for the whole session. Emergency exit after 30 seconds.';
  }
}
