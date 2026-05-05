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

## Android build path

```bash
cd mobile
npx eas login
npx eas build:configure
npm run build:android
```

The `preview` profile creates an APK for internal testing. The `production`
profile creates an Android App Bundle for Play Console.

## Launch gates

- Let `eas build:configure` add the Expo project id to `app.json`.
- Add final app icon, adaptive icon, splash, screenshots, and feature graphic.
- Move `extra.apiBaseUrl` to `https://sakinah.family` after the main app is
  attached to that Vercel project.
- Wire Clerk native auth with `@clerk/clerk-expo`.
- Port device-key generation and encrypted messaging storage to native secure
  storage before opening real rooms.
- Decide Android payments policy before exposing paid service unlocks in-app.
- Add an in-app account deletion entry point and public deletion URL for Play.
