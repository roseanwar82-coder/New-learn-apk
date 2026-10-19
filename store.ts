import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BlockMode, BlockedApp, toggleApp } from '../features/blocking/config';
import { GameId } from '../features/games/logic';
import { GameOutcome, Profile, applyGame, createProfile } from '../features/gamification/profile';
import { SyncedSession, syncFinishedSession } from '../features/overlay/syncFinishedSession';
import { HistoryEntry, pushHistory } from '../features/session/history';
import { FocusOverlay } from '../native/focusOverlay';

const tzOffset = () => -new Date().getTimezoneOffset();

export interface LastGame {
  id: GameId;
  score: number;
  xp: number;
  newBadges: string[];
}

interface AppState {
  onboarded: boolean;
  profile: Profile;
  history: HistoryEntry[];
  gameBest: Partial<Record<GameId, number>>;
  blockMode: BlockMode;
  blockedApps: BlockedApp[];
  solverDetail: 'steps' | 'short';

  /** Not persisted: shown on the completion screen. */
  lastOutcome: SyncedSession | null;

  completeOnboarding: (dailyGoalMin: number) => void;
  setDailyGoal: (min: number) => void;
  setStreakThreshold: (min: number) => void;
  setBlockMode: (mode: BlockMode) => void;
  toggleBlockedApp: (app: BlockedApp) => void;
  setSolverDetail: (d: 'steps' | 'short') => void;
  /** Pulls a finished native session (once) into the profile. Returns it, or null. */
  ingestFinished: () => SyncedSession | null;
  recordGame: (id: GameId, score01: number) => GameOutcome;
  resetAll: () => void;
}

const initial = () => ({
  onboarded: false,
  profile: createProfile(),
  history: [] as HistoryEntry[],
  gameBest: {} as Partial<Record<GameId, number>>,
  blockMode: 'soft' as BlockMode,
  blockedApps: [] as BlockedApp[],
  solverDetail: 'steps' as const,
  lastOutcome: null as SyncedSession | null,
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      completeOnboarding: (dailyGoalMin) =>
        set((s) => ({ onboarded: true, profile: { ...s.profile, dailyGoalMin } })),

      setDailyGoal: (min) => set((s) => ({ profile: { ...s.profile, dailyGoalMin: min } })),
      setStreakThreshold: (min) => set((s) => ({ profile: { ...s.profile, streakThresholdMin: min } })),
      setBlockMode: (blockMode) => set({ blockMode }),
      toggleBlockedApp: (app) => set((s) => ({ blockedApps: toggleApp(s.blockedApps, app) })),
      setSolverDetail: (solverDetail) => {
        set({ solverDetail });
        try {
          FocusOverlay.setSolverDetail(solverDetail);
        } catch {
          // native module unavailable (e.g. tests)
        }
      },

      ingestFinished: () => {
        const s = get();
        let r: SyncedSession | null = null;
        try {
          r = syncFinishedSession(FocusOverlay, s.profile, tzOffset());
        } catch {
          return null;
        }
        if (!r) return null;
        set({ profile: r.profile, history: pushHistory(s.history, r.entry), lastOutcome: r });
        return r;
      },

      recordGame: (id, score01) => {
        const s = get();
        const out = applyGame(s.profile, score01, Date.now(), tzOffset());
        const best = Math.max(s.gameBest[id] ?? 0, score01);
        set({ profile: out.profile, gameBest: { ...s.gameBest, [id]: best } });
        return out;
      },

      resetAll: () => set({ ...initial() }),
    }),
    {
      name: 'studystreak-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        profile: s.profile,
        history: s.history,
        gameBest: s.gameBest,
        blockMode: s.blockMode,
        blockedApps: s.blockedApps,
        solverDetail: s.solverDetail,
      }),
    },
  ),
);

/** True once persisted state has been loaded from disk. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
