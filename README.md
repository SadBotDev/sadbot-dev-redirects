# team.sadbot.dev

A Worker that serves the short links of `team.sadbot.dev`. Each link is a `302` redirect, and every
visit is recorded in the Analytics Engine dataset `sadbot_redirects`, so we know how many people
followed a link and where they came from.

| Link | Target | Set in |
|---|---|---|
| `/donate` | the donation page | `DONATE_TARGET` in `wrangler.toml` |

The source of a visit is the link's `utm_source` (`?utm_source=DickGrowerBot`). Nothing personal
is recorded: the path, the source and the visitor's country.

## Deploying

```bash
npm install
npx wrangler login     # once, opens the browser
npx wrangler deploy
```

`npx wrangler dev` runs it locally on `http://localhost:8787` (data points are discarded there),
and `npx wrangler tail` streams the live logs.

**A Cloudflare redirect rule for the same path wins over the Worker.** Redirect rules run first, so
while one exists for `team.sadbot.dev/donate` the Worker never sees a request. Moving a link here
means: copy the rule's destination into `wrangler.toml`, deploy, then delete the rule.

Check it with:

```bash
curl -I "https://team.sadbot.dev/donate?utm_source=test"   # 302, Location: the target
```

## Reading the numbers

The SQL API needs an API token with the *Account Analytics Read* permission.

```bash
curl "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  --header "Authorization: Bearer <API_TOKEN>" \
  --data "SELECT blob1 AS link, blob2 AS source, SUM(_sample_interval) AS visits
          FROM sadbot_redirects
          WHERE timestamp > NOW() - INTERVAL '30' DAY
          GROUP BY link, source
          ORDER BY visits DESC"
```

Count with `SUM(_sample_interval)`, never `count()`: Analytics Engine samples when traffic is
heavy, and the interval is how many visits a row stands for. At the volume of these links every
row is one visit, but the query stays right either way. Rows are kept for three months.
