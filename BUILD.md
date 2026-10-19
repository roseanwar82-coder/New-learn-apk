# Building the StudyStreak APK

This is a complete Expo SDK 58 project (`package.json`, `app.json`, `eas.json`, `src/`, `modules/`, `assets/`).
Nobody has built it yet, so the first build can fail. If it does, send the end of the build log to Claude.

## Option 1 (easiest): GitHub builds it, no Expo account

1. Create a new repository on github.com and upload **everything** from this folder
   (include the hidden `.github` folder; if it won't upload, see the note at the bottom).
2. Open the **Actions** tab, choose **"Build APK (GitHub only, no Expo account)"**, click **Run workflow**.
3. Wait about 20-30 minutes. When it's green, open the run and download **StudyStreak-apk** from Artifacts.
4. Unzip it, send `StudyStreak.apk` to your phone, install it (allow installs from that source).

The APK is signed with a debug key. That is fine for your own phone. It can't go on the Play Store.

## Option 2: EAS Build (Expo's cloud)

EAS must create your Android signing key interactively the first time, so you need a terminal once.
No computer? Open the repo in a free **GitHub Codespace** (green Code button -> Codespaces -> Create) and use its terminal.

```bash
npm install
npm install -g eas-cli
eas login                      # free account at expo.dev
eas init                       # links the project (adds a project ID to app.json; commit it)
eas build -p android --profile preview
```

Answer **Yes** when it offers to generate a keystore. When it finishes it prints a link to download the APK.

After that first build, you can use the **"EAS Build"** workflow in Actions: add a secret named `EXPO_TOKEN`
(expo.dev -> Account settings -> Access tokens) and run it.

## After installing

1. Finish onboarding and grant the permissions it asks for.
2. Settings -> paste your API key to enable Circle to solve.
3. Pick distracting apps (Settings -> Choose apps), then start a session.

## If the upload loses the `.github` folder

In the repo go to **Actions -> set up a workflow yourself**, name it `build-apk.yml`, and paste the contents of
`.github/workflows/build-apk.yml` from this project.

## Quick reference

| Thing | Value |
|---|---|
| Expo SDK | 58 (React Native 0.88, React 19.3) |
| Android package | `com.studystreak.app` |
| Min requirements for build | Node 22, JDK 17 (the workflows set these up) |
| Run logic tests | `npm test` |
