# Domain Alignment

## Current Verified State

- `https://trust-app-three.vercel.app/api/health` returns `200`.
- `https://sakinah.family/` returns `200`.
- `https://sakinah.family/api/health` returns `404`, so the root domain is not
  serving this Next.js app yet.

## Pick

9/10 [PICK] - Keep mobile `extra.apiBaseUrl` on
`https://trust-app-three.vercel.app` until `sakinah.family/api/health` returns
`200`, then switch the app config and Play listing URLs together.

## Alternatives

- 7/10 - Add a temporary redirect/proxy layer. More moving parts before Play
  review.
- 6/10 - Switch mobile to `sakinah.family` now. Brand-correct but API-broken.
- 4/10 - Leave the Vercel preview URL forever. Works technically, weak brand
  trust.

## Switch Gate

Only change `mobile/app.json`, `mobile/store/play-listing.json`, and public
listing URLs to `https://sakinah.family` after:

```bash
curl -L -sS -o /dev/null -w '%{http_code}\n' https://sakinah.family/api/health
```

returns `200`.
