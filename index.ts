import { requireNativeModule } from 'expo';
import type { TimerState } from '../../src/features/session/timer';

export type OverlayAction =
  | 'started'
  | 'paused'
  | 'resumed'
  | 'extended'
  | 'completed'
  | 'aborted'
  | 'permissionLost'
  | 'solverError'
  | 'blocked'
  | 'emergencyExit';

export interface OverlayEvent {
  action: OverlayAction;
  focusedMs?: number;
  message?: string;
}

export interface SolverConfig {
  /** Leave empty when using a proxy via baseUrl. */
  apiKey: string;
  /** Defaults to claude-sonnet-5-5. */
  model?: string;
  /** Defaults to https://api.anthropic.com. Point at your own proxy to keep keys off devices. */
  baseUrl?: string;
  /** 'steps' (default) or 'short'. Set once; never asked per question. */
  detail?: 'steps' | 'short';
}

export interface InstalledApp {
  packageName: string;
  label: string;
}

interface NativeFocusOverlay {
  hasOverlayPermission(): boolean;
  requestOverlayPermission(): void;
  hasUsageAccess(): boolean;
  requestUsageAccess(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatterySettings(): void;
  elapsedRealtime(): number;
  startSession(plannedMs: number): void;
  endSession(): void;
  getTimerState(): string | null;
  consumeFinishedSession(): string | null;
  setBlockConfig(mode: string, packagesJson: string): void;
  getInstalledApps(): Promise<string>;
  setSolverConfig(apiKey: string, model?: string | null, baseUrl?: string | null, detail?: string | null): void;
  setSolverDetail(detail: string): void;
  hasSolverConfig(): boolean;
  addListener(event: 'onTimerAction', cb: (e: OverlayEvent) => void): { remove(): void };
}

const Native = requireNativeModule<NativeFocusOverlay>('FocusOverlay');

export const FocusOverlay = {
  hasOverlayPermission: () => Native.hasOverlayPermission(),
  requestOverlayPermission: () => Native.requestOverlayPermission(),
  hasUsageAccess: () => Native.hasUsageAccess(),
  requestUsageAccess: () => Native.requestUsageAccess(),
  isIgnoringBatteryOptimizations: () => Native.isIgnoringBatteryOptimizations(),
  openBatterySettings: () => Native.openBatterySettings(),

  /** Starts the floating timer + panel. Runs natively, so it survives the app being killed. */
  startSession: (plannedMs: number) => Native.startSession(plannedMs),
  endSession: () => Native.endSession(),

  /** Native monotonic clock; use it as `now` with the timer functions. */
  now: () => Native.elapsedRealtime(),

  /** Live timer state plus the matching native clock reading, or null if none is running. */
  readTimer(): { state: TimerState; now: number } | null {
    const raw = Native.getTimerState();
    if (!raw) return null;
    try {
      return { state: JSON.parse(raw) as TimerState, now: Native.elapsedRealtime() };
    } catch {
      return null;
    }
  },

  /** Hands back a finished session exactly once (JSON string), for syncFinishedSession. */
  consumeFinishedSession: () => Native.consumeFinishedSession(),

  /** Blocking only applies while a session is running. mode: off | soft | hard. */
  setBlockConfig: (mode: 'off' | 'soft' | 'hard', packages: string[]) =>
    Native.setBlockConfig(mode, JSON.stringify(packages)),

  async getInstalledApps(): Promise<InstalledApp[]> {
    try {
      return JSON.parse(await Native.getInstalledApps()) as InstalledApp[];
    } catch {
      return [];
    }
  },

  setSolverConfig(cfg: SolverConfig) {
    Native.setSolverConfig(cfg.apiKey, cfg.model ?? null, cfg.baseUrl ?? null, cfg.detail ?? null);
  },
  setSolverDetail: (detail: 'steps' | 'short') => Native.setSolverDetail(detail),
  hasSolverConfig: () => Native.hasSolverConfig(),

  /** The event is only a signal; read results via consumeFinishedSession(). */
  onEvent(cb: (e: OverlayEvent) => void) {
    return Native.addListener('onTimerAction', cb);
  },
};
