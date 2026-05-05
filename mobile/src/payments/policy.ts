export const androidPaymentPolicy = {
  decision: "google-play-billing",
  entitlementOnlyUntilBilling: true,
  externalCheckoutAllowedInAndroid: false,
  statusCopy:
    "Android shows service access, but paid in-app unlocks wait for Google Play Billing.",
} as const;
