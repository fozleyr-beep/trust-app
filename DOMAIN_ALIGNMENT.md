# Domain Alignment

## Current Verified State

- `https://sakinah.family/` returns `200`.
- `https://sakinah.family/api/health` returns `200`.
- `https://www.sakinah.family/api/health` returns `200`.

## Pick

9/10 [PICK] - Use `https://sakinah.family` as the mobile API base and Play
listing URL now that the domain serves this app.

## Alternatives

- 7/10 - Add a temporary redirect/proxy layer. More moving parts before Play
  review.
- 6/10 - Switch mobile to `sakinah.family` now. Brand-correct but API-broken.
- 4/10 - Leave the Vercel preview URL forever. Works technically, weak brand
  trust.

## Switch Gate

Keep `mobile/app.json`, `mobile/store/play-listing.json`, and public listing
URLs on `https://sakinah.family` while:

```bash
curl -L -sS -o /dev/null -w '%{http_code}\n' https://sakinah.family/api/health
```

returns `200`.
