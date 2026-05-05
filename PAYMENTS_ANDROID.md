# Android Payments Decision

## Pick

9/10 [PICK] - Use Google Play Billing for any paid Android in-app unlock.

Reason: Google Play policy says Play-distributed apps requiring or accepting
payment for access to in-app features, services, functionality, or subscription
content generally must use Google Play's billing system unless a named policy
exception or enrolled alternative-billing program applies.

## Alternatives

- 7/10 - Keep Android as entitlement-consumption only. Users who already paid
  elsewhere can access their entitlement, but the app must not lead them to
  external payment.
- 5/10 - Use Stripe through an external web link. Too much rejection risk unless
  a specific policy exception/program is confirmed for the target country.
- 3/10 - Hide Stripe behind copy or indirect links. Rejection risk and bad trust
  posture.

## Product rule

The Android app may show whether service access is locked or active. Until Play
Billing is implemented, it must not expose an in-app Stripe checkout, external
payment link, or payment-direction copy.

Web can keep Stripe for browser checkout. Android implementation must later map
Google Play purchase tokens to `service_entitlements` server-side.
