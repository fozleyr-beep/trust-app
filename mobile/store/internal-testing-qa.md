# Android Internal Testing QA

## Auth

- Expo runtime has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Native sign-up creates account and accepts email verification code.
- Native sign-in restores session after app restart.
- Sign-out clears user-visible session.

## Service

- Start tab shows intake sequence, match readiness, and consent gates.
- Account tab shows onboarding and device-key registration after sign-in.
- Device key registers with `/api/device-keys`.
- Rooms tab loads `/api/me/threads` without exposing plaintext.
- Encrypted send writes fanout through `/api/threads/:id/messages`.

## Play Policy

- Privacy policy opens from Account.
- Account deletion page opens from Account.
- Android Store tab does not link to Stripe or external payment.
- App requests no sensitive permissions.

## Release

- `npm run mobile:check` has zero failures.
- Preview APK installs on Android.
- Production AAB builds with EAS.
- Play internal track receives the AAB.
