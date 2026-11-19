# Optional GitHub visitor check-ins

This is a **separate Cloudflare Worker + D1 database**, not part of the GitHub Pages static site. Nothing is recorded unless you explicitly deploy and enable it. The website's existing giscus-based commenting continues to work without it.

## What this records

A visitor deliberately chooses **Continue & record check-in** on the Worker consent page. The Worker uses GitHub's server-side OAuth authorization-code + PKCE flow to verify the public GitHub account, then writes exactly three fields:

| Field | Example | Purpose |
|---|---|---|
| GitHub numeric user ID | integer | Durable identity across username changes |
| Public GitHub login | username | Human-readable history |
| UTC verification time | Unix milliseconds | Time the Worker successfully verified the GitHub identity |

No email, IP address, browser identifier, password or OAuth token is stored **in D1**. The OAuth token is used only in memory to call GitHub `GET /user` and discarded. Cloudflare and GitHub may still process request data operationally according to their policies.

**Event semantics:** This is a verified **portfolio check-in**, not evidence that the visitor completed the separate giscus OAuth flow, posted a comment, or visited again later. Visitors who choose to proceed directly to giscus aren't included. Existing giscus sessions don't retroactively generate events.

The D1 table is purged after **30 days** by a daily Worker cron and on new check-ins or owner reads. A server-only dashboard shows the 100 most recent check-ins within that window. There is **no browser-supplied event-writing endpoint**.

## Security and privacy

- The GitHub authorization callback verifies an unpredictable CSRF state bound to a short-lived, secure, HttpOnly, same-site cookie and exchanges the authorization code with a PKCE verifier.
- The Worker requests **no additional OAuth scopes**, and uses only the public GitHub ID/login values returned by the authenticated `/user` endpoint.
- The history page is protected by a **second** GitHub login that checks the **numeric owner account ID on the server**, then issues a signed, secure, HttpOnly cookie valid for 20 minutes.
- The owner cookie cannot be forged by changing a username or by editing React state. No data endpoint reveals records publicly.
- No third-party analytics or JavaScript is used on the Worker pages. There is no CORS-enabled visitor logging API.
- The consent page explains the check-in, retention and data use before a visitor proceeds. It also offers **Continue without check-in** to the existing giscus OAuth.
- Review your privacy notice and Cloudflare/GitHub account configuration for applicable law before enabling collection publicly.

## Setup — complete these steps before activation

1. In Cloudflare, create a D1 database named **`pstar80-visitor-checkins`**, and copy its actual database UUID into `visitor-history/wrangler.toml` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`. Do **not** invent this value or check a private API credential into Git.
2. Register **one GitHub OAuth App** under your GitHub account: name e.g. `PStar80 Portfolio Check-ins`, homepage `https://pstar80.github.io/`, callback URL `https://<YOUR-WORKER-HOST>/oauth/callback`. The callback must exactly match your deployed Worker hostname; disable callback wildcard matching. Its Client ID and Client Secret must **not** go in this repository.
3. Determine your permanent numeric GitHub account ID (the `id` field from `https://api.github.com/users/PStar80`). Use this—not `PStar80` as a text comparison—to authorize the private dashboard.
4. In the `visitor-history/` directory, install Wrangler with `npm install` (not `npm ci` until a lockfile is committed) and log in to Cloudflare using `npx wrangler login`. Apply the schema: `npx wrangler d1 migrations apply pstar80-visitor-checkins --remote`.
5. Add the following **Worker secrets** using `npx wrangler secret put NAME` or Cloudflare's Secrets UI (never paste values into ChatGPT or a PR):
   - `GITHUB_CLIENT_ID` — new GitHub OAuth App Client ID.
   - `GITHUB_CLIENT_SECRET` — the app's confidential Client Secret.
   - `OWNER_GITHUB_ID` — your GitHub numeric user ID.
   - `ADMIN_COOKIE_SECRET` — a securely generated, random 32+ byte secret, preferably a long hexadecimal/base64url string.
6. Deploy the Worker with `npx wrangler deploy`. Check the actual `https://<YOUR-WORKER-HOST>/check-in` consent page and `/admin` owner sign-in. Confirm the OAuth App's registered callback matches that host exactly.
7. **Only after** the above works, set the GitHub repository **Actions variable** `VISITOR_HISTORY_WORKER_URL` to the Worker origin, e.g. `https://<YOUR-WORKER-HOST>`. The GitHub Pages build can expose this public origin as `VITE_VISITOR_HISTORY_WORKER_URL`. It is **not** a secret. Without this variable, the navbar retains the original direct giscus flow.

Note: Cloudflare secret updates may publish a new Worker version. Keep the Worker and its secrets private until you have completed the setup and verified the consent page.

### Expected visitor flow after activation

`Portfolio Sign in with GitHub → Worker consent page → GitHub OAuth check-in → D1 check-in recorded → giscus GitHub OAuth → Portfolio discussion`.

Someone may decline the optional check-in yet still authorize giscus and comment. On the first visit, GitHub may show **two distinct authorization prompts** (one for the optional read-only check-in and one for giscus commenting). This is deliberate so no giscus token is shared with the portfolio Worker.

### Private owner history

Navigate directly to `https://<YOUR-WORKER-HOST>/admin`. The Worker redirects to a server-verified GitHub owner login if needed; it checks the numeric GitHub ID and then shows public login names and UTC verification times. No admin link is advertised in the regular portfolio navigation, and records never enter the static GitHub Pages bundle.

### Testing and rollback

Before setting the website Actions variable, test:
- Your own optional check-in: appears once on the dashboard, UTC time is correct.
- `Continue without check-in`: no entry, giscus still works.
- Anonymous access to `/admin`: no history returned.
- A different GitHub account attempting owner login: receives HTTP 403.
- Signed out / expired session, unexpected OAuth state, denied authorization, and D1 unavailability: no exposure of records.
- After the configured retention window, records disappear automatically.

To roll back immediately, unset the GitHub Actions variable and rebuild/deploy GitHub Pages. Its login button goes straight to giscus again. The Worker and D1 records are independent and can be disabled or deleted separately. The optional in-browser `?authDiagnostics=1` developer panel remains **diagnostic only**, not a source for these verified records.

### References

- [GitHub OAuth web application flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub authenticated user endpoint](https://docs.github.com/en/rest/users/users#get-the-authenticated-user)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
