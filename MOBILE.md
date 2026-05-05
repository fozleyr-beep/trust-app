# Mobile Strategy

## Pick

9/10 [PICK] - Expo React Native in `mobile/`.

Why: Sakinah is a mobile-first service, not only a mobile-readable website.
Expo keeps one TypeScript/React team surface, gives Android App Bundle output
for Play Console, and leaves iOS open when the Apple Developer account is ready.

## Alternatives

- 7/10 - Capacitor wrapper around the web app. Fastest, but risks feeling like a
  webview and delays native storage, push, and biometric trust work.
- 6/10 - PWA or Trusted Web Activity. Useful fallback, weak iOS path and not
  enough for the main service surface.
- 5/10 - Flutter rewrite. Good mobile UI potential, but it forks the stack and
  slows backend/product iteration.

## Play Store policy gates

- Account creation means account deletion must be available inside the app and
  from a public web URL. Current route: `/account/delete`.
- Play listing needs a public, non-PDF privacy policy URL that names the app and
  developer entity. Current route: `/privacy`.
- Data safety must match what the app actually collects and shares.
- Avoid sensitive permissions unless they are required for a user-visible
  feature.
- Android payments are a decision point. For in-app access to digital/service
  functionality, default to Google Play Billing unless a policy exception is
  clearly documented. Keep Stripe off the Android app until this is resolved.

## First implementation slice

- `mobile/App.tsx`: mobile-first shell for path, agents, and store-readiness.
- `mobile/app.json`: Android package `family.sakinah.app`, iOS bundle reserved.
- `mobile/eas.json`: internal APK and production AAB profiles.
- `mobile/metro.config.js`: allows the mobile app to import the shared agent
  registry from the repo root.

## Next slices

1. Mobile thread list/detail wiring on top of the native crypto helpers.
2. Android payment policy decision and implementation.
3. Play Store assets and internal testing release.
4. Move the API base URL to `https://sakinah.family` once the domain points at
   this app.
