# Lightweight GitHub viewer observations

A tiny Cloudflare Worker + existing D1 database collects **best-effort observations** of public GitHub usernames reported by giscus on the PStar80 portfolio. It does **not** run OAuth, verify a new login, create user accounts, or store visitor IP addresses, passwords, emails, access tokens or device identifiers.

**This is an informational log, not an authentication audit.** Browser-originated metadata can be spoofed; a timestamp means the Worker received an observation, not necessarily that GitHub just authenticated that person. Giscus metadata is emitted when its discussion iframe loads (the portfolio initializes it early for an existing giscus session). No data is recorded for anonymous visitors. No new GitHub authorization or visitor opt-in screen is involved.

## Components

- **Existing website login:** direct giscus OAuth, unchanged.
- **Giscus metadata:** viewer login and public GitHub profile URL, validated in the portfolio browser against the giscus iframe and local giscus session presence. Only the username is submitted to the Worker.
- **Worker:** accepts small JSON posts on `POST /observe` from the portfolio origin, timestamps them on the server, and ignores duplicate usernames within 15 minutes. The HTTP Origin check limits normal browser requests; it **does not authenticate** the caller or make these audit-grade records.
- **D1:** private `giscus_observations` table with `github_login` and `observed_at_ms`. Cleanup deletes records after 30 days using the existing daily cron.
- **Owner access:** review the D1 database in **your Cloudflare dashboard**. There is no public history endpoint or custom admin login.

This avoids a separate GitHub OAuth application, client secret, owner account ID and admin cookie secret.

## Setup with Local Sky

1. Keep the existing Cloudflare D1 database **`pstar80-visitor-checkins`** and deployed Worker **`pstar80-visitor-checkins`**. Preserve the real D1 binding from Local Sky's GitHub PR #27; do not re-create infrastructure or roll back the database UUID.
2. From `visitor-history/`, run `node --check src/index.js` and `node --test test/checkins.test.mjs`. The GitHub Actions verification workflow also runs both commands.
3. Apply the new migration: `npx wrangler d1 migrations apply pstar80-visitor-checkins --remote`. This adds `giscus_observations`. Historical migration `0001_checkins.sql` stays for D1 migration continuity; its old `visitor_checkins` table is **not used** by this design.
4. Deploy the revised Worker with `npx wrangler deploy`. Check `https://<actual-worker-host>/health` responds `ok`. The old `/admin`, `/check-in`, and GitHub OAuth routes should no longer be present.
5. Set GitHub Actions variable `VISITOR_HISTORY_WORKER_URL` to the **HTTPS Worker origin only**, without a path, and redeploy GitHub Pages. Without this variable the portfolio still works normally but no observations are submitted.
6. Sign in to the portfolio using the existing **Sign in with GitHub** button, then visit or reload the page. The giscus iframe will report the signed-in viewer. Verify that D1 has **one** corresponding username/time row after the event is received. You can also test while viewing Discussion.
7. Check sign-out, anonymous browsing, country map, discussions/comments, and the blue theme. Ensure normal sign-in remains direct through giscus and no extra OAuth authorization appears.

## View the log privately

In Cloudflare, open **Storage & databases → D1 → pstar80-visitor-checkins → Console** and run:

```sql
SELECT github_login,
       datetime(observed_at_ms / 1000, 'unixepoch') AS observed_utc
FROM giscus_observations
ORDER BY observed_at_ms DESC
LIMIT 100;
```

The console is protected by your Cloudflare account login. Do **not** expose these records through a public Pages endpoint.

## What to remove

- Stop the old GitHub OAuth App registration. If an OAuth App was created for visitor check-ins, it is no longer required; delete it only after confirming no other app uses it.
- Retire the four former Worker secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OWNER_GITHUB_ID`, `ADMIN_COOKIE_SECRET`) **if they were configured**, after replacing the old deployed Worker and verifying the new one.
- The previous optional consent page, custom owner dashboard and diagnostic panel are removed by this change. No custom account authorization is needed because history is read through the Cloudflare dashboard.
- Do not delete the current D1 database, existing Worker, or other SkyCommand/portfolio resources.

## Privacy and limits

The Discussion section informs visitors that their public GitHub username and observed sign-in activity may be recorded for site operations and retained up to 30 days. This is not an opt-in checkpoint, but visitors remain free to browse anonymously. Review your notice and applicable privacy obligations before enabling collection.

No credentials are necessary in GitHub Pages or the public repository. The Worker origin is public configuration, **not** a secret. The old table can be removed separately only after confirming it is empty and no other process references it.

**Rollback:** Remove the GitHub Actions variable `VISITOR_HISTORY_WORKER_URL` and redeploy Pages; this disables sending new observations without affecting giscus comments. Disable or delete the Worker independently if no longer wanted.
