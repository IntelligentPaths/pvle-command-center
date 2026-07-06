# Login gate — setup note (Auth.js / NextAuth v5)

The Command Center is now gated: **only Google accounts on an email allowlist can reach any page or API route.** This is *user auth* and is completely separate from the service-account / Workload-Identity-Federation path in `src/lib/google.ts` that reads the Sheet & Drive (*data auth*). Two different Google concerns — don't mix the env vars.

Code map: `src/auth.ts` (config + allowlist gate) · `src/proxy.ts` (Next 16 middleware — protects every route) · `src/app/api/auth/[...nextauth]/route.ts` (OAuth endpoints) · `src/app/signin/page.tsx` (branded sign-in) · `src/components/UserMenu.tsx` (signed-in app-bar).

---

## 1. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and they already exist in local `.env.local` for dev). Apply to **Production** — and to **Preview** too if you want preview deployments gated.

| Variable | Purpose | Example / how to get it |
|---|---|---|
| `AUTH_SECRET` | Secret used to encrypt/sign the session JWT. **Required.** Must be stable in prod (rotating it logs everyone out). | Generate once: `npx auth secret` or `openssl rand -base64 32`. Use a **different** value than local dev. |
| `AUTH_GOOGLE_ID` | Google OAuth **client ID** for user sign-in. Auto-detected by NextAuth (the `AUTH_<PROVIDER>_ID` convention). | From the Google Cloud OAuth client (step 2), looks like `xxxx.apps.googleusercontent.com`. |
| `AUTH_GOOGLE_SECRET` | Google OAuth **client secret** for user sign-in. Auto-detected. | From the same OAuth client. |
| `ALLOWED_EMAILS` | Comma-separated allowlist of who may sign in. Anything not listed is denied. Empty/unset = **deny everyone** (fail-closed). Case-insensitive; whitespace around entries is ignored. | `you@example.com,teammate@example.com` (put the real team emails only in the env var, never in this doc) |
| `AUTH_URL` *(recommended)* | Pins the canonical origin so the OAuth callback URL is deterministic behind Vercel's aliases. | `https://pvle-command-center.vercel.app` |

Notes:
- **Do not** reuse the `GOOGLE_*` names (`GOOGLE_SHEET_ID`, `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT`, …). Those stay as-is for data auth. The sign-in credentials must be `AUTH_GOOGLE_*` so NextAuth's auto-inference finds them.
- `AUTH_TRUST_HOST` is **not** needed on Vercel (auto-trusted). Only set `AUTH_TRUST_HOST=true` if you self-host behind a proxy and host detection misbehaves.
- No secrets are committed — everything is read from env. `.env.local` is gitignored.

---

## 2. Google OAuth client — exact redirect URIs to register

In **Google Cloud Console → APIs & Services → Credentials**, create (or reuse) an **OAuth 2.0 Client ID** of type **Web application**, then register the URIs below **exactly** (NextAuth's callback path is always `/api/auth/callback/google`).

**Authorized redirect URIs** (add both):
```
https://pvle-command-center.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**Authorized JavaScript origins** (optional but tidy):
```
https://pvle-command-center.vercel.app
http://localhost:3000
```

If you sign in through any other Vercel alias directly (e.g. `…-git-main-….vercel.app`), add that alias's `/api/auth/callback/google` too — or just always use the canonical domain (which is why setting `AUTH_URL` above is recommended).

You may also need to configure the **OAuth consent screen** (External, add the test users / your team emails while it's in "Testing", or publish it). The account you sign in with must *also* be on `ALLOWED_EMAILS` — the consent screen controls *who Google will authenticate*; `ALLOWED_EMAILS` controls *who we let in*.

---

## 3. After setting the above
1. Save the env vars in Vercel → **redeploy** (env changes need a new deploy).
2. Visit the app → you should be redirected to `/signin` → "Sign in with Google" → pick an allowlisted account → land on the Command Center.
3. A non-allowlisted account is bounced back to `/signin` with an "account isn't on the approved list" message.
4. All `/api/*` routes return **401 JSON** when unauthenticated (they don't redirect — a fetch can't follow a redirect to HTML).

To add/remove users later, just edit `ALLOWED_EMAILS` in Vercel and redeploy — no code change. The allowlist is re-checked on **every request** (not only at sign-in), so a removed email loses access on their next request once the redeploy is live — no waiting for their session to expire. (For an instant, universal lockout you can also rotate `AUTH_SECRET`, which signs everyone out.)
