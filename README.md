# focus-overlay (Android native module)

Floating timer, app blocking, and "Circle to solve". **Status: written but never compiled or run on a device.** Expect a few compile errors on first build; paste them to Claude and they get fixed fast.

## What it does

1. `FocusOverlay.startSession(ms)` starts a foreground service. A draggable bubble shows the countdown; tap it for the panel: **Pause/Resume, +5 min, Stop, Circle to solve**.
2. The timer lives in the service (monotonic clock, persisted in SharedPreferences), so it keeps running if the app is killed. A finished session is handed to JS exactly once via `consumeFinishedSession()` (`src/features/overlay/syncFinishedSession.ts`).
3. **App blocking:** while a session is *running*, the service polls `UsageStatsManager` (~0.6s). If the foreground app is on your list, a full-screen "Stay focused" screen covers it.
   - **Soft:** "Continue anyway" unlocks after 10s and allows that app for 5 minutes.
   - **Hard:** the only way through is "Emergency exit" after 30s, which turns blocking off for the rest of that session.
   - Every blocked attempt is counted and saved with the session (affects the "No Distractions" badge).
   - Phone/dialer/Settings/SystemUI are never blocked, whatever the list says.
4. **Circle to solve:** panel hides, first use shows Android's screen-capture prompt, a dimmed frozen frame appears, you draw a loop, the crop streams to the AI, and an answer sheet slides up with follow-ups. One fixed prompt, no question-type detection and no mode picker.

## Verify first on a real phone

- Overlay permission flow, bubble drag, panel buttons.
- Timer survives: app swiped away, screen off 10+ min, overlay permission revoked mid-session.
- Usage access flow, then blocking: open a blocked app mid-session. Expect a brief flash of the app before the cover appears (polling delay), then the cover. Back button and "Back to studying" go home.
- Pausing from the bubble turns blocking off until you resume (a pause longer than 5 minutes ends the session).
- Android 14+ capture prompt: choose **Entire screen**. Apps that block screenshots (banking, DRM video) give a blank frame; the lasso warns "screen looks blank". There is no workaround, by design.
- Starting the capture prompt from the service. If your phone maker blocks it, you get a toast.

## Known limits

- Blocking is a commitment device, not security: the user can disable Usage access, force-stop the app, or uninstall it.
- Answer text is plain text (no math typesetting yet; the prompt asks for plain-text math).
- The API key is stored in app-private SharedPreferences. Fine for a personal APK; set a proxy URL before sharing the app with others.
- Detection is by polling, so very fast app switches can slip through for under a second.
- `build.gradle` uses the SDK 58 `expo-module-gradle-plugin`, and the Kotlin uses the classic `ModuleDefinition` API, both modeled on Expo's own SDK 58 modules. If an SDK upgrade breaks them, regenerate a throwaway local module with `npx create-expo-module@latest --local` and copy its `build.gradle` header.
- Not implemented: Accessibility-service strict blocking (faster but heavily restricted by Google Play policy). Not needed for a sideloaded APK; can be added later.
