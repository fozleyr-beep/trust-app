# Sakinah Mobile

Expo React Native shell for Android first, iOS later. The app imports the
canonical four-agent registry from `../lib/agents/registry.ts` so web and mobile
do not drift on Hafiz, Watim, Adil, and Sabr.

## Run

```bash
cd mobile
npm install
npm run start
```

Before Android device QA, expose Clerk to Expo:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" npm run mobile:check
```

## Android build path

```bash
cd mobile
npx eas login
npx eas build:configure
npm run build:android
```

The `preview` profile creates an APK for internal testing. The `production`
profile creates an Android App Bundle for Play Console. EAS project id:
`96059a19-1de7-4d76-89f5-6dd27c616a75`.

Release readiness from repo root:

```bash
npm run android:release-check
```

## Launch gates

- Add final app icon, adaptive icon, splash, screenshots, and feature graphic.
- Move `extra.apiBaseUrl` to `https://sakinah.family` after the main app is
  attached to that Vercel project.
- Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for device builds. The root app is
  wrapped with `@clerk/expo` and `@clerk/expo/token-cache` for secure native
  session persistence, with native email/password sign-in and verified sign-up
  screens in the Account tab.
- Run `npm run mobile:check` before Android emulator/device QA. It should have
  zero failures; one warning means the Expo publishable key still needs to be
  exported for the mobile runtime.
- Port device-key generation and encrypted messaging storage to native secure
  storage before opening real rooms.
- Decide Android payments policy before exposing paid service unlocks in-app.
- Add an in-app account deletion entry point and public deletion URL for Play.
