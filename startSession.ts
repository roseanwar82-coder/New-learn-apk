import { BlockMode, BlockedApp, blockedPackages } from '../blocking/config';

/** The slice of the native module the start flow needs (injectable for tests). */
export interface StartDeps {
  hasOverlayPermission(): boolean;
  hasUsageAccess(): boolean;
  setBlockConfig(mode: BlockMode, packages: string[]): void;
  startSession(plannedMs: number): void;
}

export type StartResult =
  | { ok: true }
  | { ok: false; reason: 'overlay_permission' | 'usage_access' | 'invalid_duration' };

export const MIN_SESSION_MIN = 5;
export const MAX_SESSION_MIN = 240;

export function startFocusSession(
  deps: StartDeps,
  minutes: number,
  blockMode: BlockMode,
  blockedApps: readonly BlockedApp[],
): StartResult {
  if (!Number.isFinite(minutes) || minutes < MIN_SESSION_MIN || minutes > MAX_SESSION_MIN) {
    return { ok: false, reason: 'invalid_duration' };
  }
  if (!deps.hasOverlayPermission()) return { ok: false, reason: 'overlay_permission' };

  const packages = blockedPackages(blockedApps);
  const enforcing = blockMode !== 'off' && packages.length > 0;
  if (enforcing && !deps.hasUsageAccess()) return { ok: false, reason: 'usage_access' };

  deps.setBlockConfig(enforcing ? blockMode : 'off', enforcing ? packages : []);
  deps.startSession(Math.round(minutes) * 60_000);
  return { ok: true };
}
