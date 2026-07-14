# CLAUDE.md — PVLE Command Center

Project context for Claude Code. Read this first. Full detail in `docs/PVLE_Command_Center_Spec.md`; design reference in `reference/PVLE_Command_Center.jsx` and `reference/PVLE_CRM.jsx`.

## What we're building
An internal web app that runs the **Pura Vida Legacy Ecosystem (PVLE)**. Three jobs:
1. **Command Center** — a dark "mission control" dashboard (status, meters, this-week focus, ecosystem map).
2. **Operations modules** — Pipeline, Contacts, Programs, Tasks, Campaigns, Content Calendar.
3. **Present mode** — bright, per-brand pitch screens per program + the whole ecosystem.
Plus a **Files view** that browses the ecosystem's Google Drive folder from inside the app.

Primary user: Juleon (founder), desktop + phone. Admin: Waleed (Intelligent Paths).

## Stack
Next.js (App Router) + TypeScript + React · Tailwind CSS · next/font · lucide-react · Google Sheets API (data) · Google Drive API (Files view) · deployed on Vercel.

## Real project values (already set up)
- **Google Cloud project:** `pvle-command-center` (org: intelligentpaths.com)
- **Service account:** `crm-sheets@pvle-command-center.iam.gserviceaccount.com`
- **Sheet ID:** `1uUbvKfMlle_vjTrRUr4fnu29po378Udxw3qgUiVm6PM`
- **Drive root folder ID (wrapper "Pura Vida Legacy Ecosystem"):** `1FG4ffyT17H2BjyVGaASKNEl5wdzFEr-A`
- Sheet shared with the service account (Editor); Drive folder shared with it (Viewer). Folder lives in My Drive (not a Shared Drive — no special drive flags needed).

## Auth — KEYLESS (important: no service-account key file)
The org blocks downloadable service-account keys (`iam.disableServiceAccountKeyCreation`), and keyless is the more secure design anyway.

- **Local development:** Application Default Credentials (ADC) as the resource **owner** (`info@intelligentpaths.com`), who owns the Sheet + folder. Set up once with:
  ```
  gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive.readonly
  gcloud auth application-default set-quota-project pvle-command-center
  ```
  The Google libraries pick up ADC automatically. **No key file, ever.**
- **Production (Vercel):** Workload Identity Federation — Vercel issues a short-lived OIDC token, GCP trusts it and lets the workload **impersonate `crm-sheets`**. Configured at deploy time; not needed for local build.

Code must NOT expect a `GOOGLE_PRIVATE_KEY`. Use `GoogleAuth` with scopes and let it resolve ADC locally / federated creds in prod.

### `src/lib/google.ts`
Keyless. `GoogleAuth` resolves ADC locally / federated creds in prod. When
`GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` is set, the source creds mint a short-lived
token for that SA via `Impersonated`. Exported as **async factories** because
impersonation resolves the source client asynchronously (no eager `const sheets`).
```ts
import { google } from "googleapis";
// google-auth-library pinned to EXACT 10.5.0 to match googleapis-common
// (a floating version → two copies → TS type-brand errors passing auth to google.sheets)
import { GoogleAuth, Impersonated } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

async function resolveAuth() {
  const target = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT;
  if (!target) return new GoogleAuth({ scopes: SCOPES }); // ADC directly
  // Source creds (local ADC user / federated in prod) impersonate `target`.
  // Source needs cloud-platform scope; caller needs iam.serviceAccountTokenCreator on target.
  const source = await new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getClient();
  return new Impersonated({
    sourceClient: source, targetPrincipal: target, targetScopes: SCOPES, lifetime: 3600,
  });
}

// Resolve auth once; retry on the next request if it failed.
let authPromise: ReturnType<typeof resolveAuth> | null = null;
function getAuth() {
  if (!authPromise) authPromise = resolveAuth().catch((e) => { authPromise = null; throw e; });
  return authPromise;
}

export async function getSheets() { return google.sheets({ version: "v4", auth: await getAuth() }); }
export async function getDrive()  { return google.drive({ version: "v3", auth: await getAuth() }); }
```

### Env vars (`.env.local`; Vercel settings later)
```
GOOGLE_SHEET_ID=1uUbvKfMlle_vjTrRUr4fnu29po378Udxw3qgUiVm6PM
GOOGLE_DRIVE_FOLDER_ID=1FG4ffyT17H2BjyVGaASKNEl5wdzFEr-A
GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=crm-sheets@pvle-command-center.iam.gserviceaccount.com
# Production federation values added at deploy (Stage 8):
# GCP_PROJECT_NUMBER=... GCP_WORKLOAD_IDENTITY_PROVIDER=... GCP_SERVICE_ACCOUNT_EMAIL=crm-sheets@...
```

## Data layer — `src/lib/sheets.ts`
One tab = one table. Row 1 = headers. Map rows ↔ objects by header.
```ts
import { getSheets } from "./google";
const ID = process.env.GOOGLE_SHEET_ID!;
export async function readTab(tab: string) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: tab });
  const [head, ...rows] = res.data.values ?? [];
  return rows.map(r => Object.fromEntries((head as string[]).map((h, i) => [h, r[i] ?? ""])));
}
// writes: values.append (add) / values.update (edit by locating the id row)
```
Tabs (columns in spec §6): **Entities, Pipeline, Contacts, Programs, Tasks, Campaigns, Content, Events, Leads, Present_Points**.

## Drive browser — `src/lib/drive.ts`
```ts
import { getDrive } from "./google";
export async function listFolder(folderId: string) {
  const drive = await getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,webViewLink,iconLink,modifiedTime)",
    orderBy: "folder,name", pageSize: 200,
  });
  return res.data.files ?? []; // folders: mimeType application/vnd.google-apps.folder
}
```
Files view: list the root folder, folders navigable by id, open files via `webViewLink`.

## Design system (match `reference/PVLE_Command_Center.jsx`)
- **Tailwind v4** — CSS-first `@theme` tokens in `src/app/globals.css`; no `tailwind.config`. Colors → `bg-bg`/`text-gold`/…; fonts → `font-display`/`font-body`/`font-mono`.
- **Cockpit (dark):** bg `#16120C`, panels `#201A12`, edge `#3A2E1F`, gold `#F5B531`, cream `#F2E7CF`, muted `#B7A688`; warm radial glows.
- **Fonts:** Cormorant Garamond (display), Montserrat (body), IBM Plex Mono (data/labels).
- **Present mode (light, per-entity):** each entity its own palette — Sankofa `#E38C07`/`#B22714`, PVY `#F7A81B`/`#0C6F64` are real; UYN/Dance/Roots are placeholders. Pull palette + copy from `Entities` / `Present_Points` tabs.
- Subtle motion; respect `prefers-reduced-motion`; responsive to phone.

## Rules
- All Google calls **server-side** (route handlers / server components). Nothing secret in the client bundle.
- Reads via server components / `GET /api/...` with short revalidate (respect Sheets quota). Writes via `POST`/`PATCH`; last-write-wins.
- **NLT is internal only** — never render it in any list, map, or Present view. Enforced with `isNlt` (`src/lib/nlt.ts`): every module server-read filters its rows by entity, and `src/lib/dashboard.ts` filters Entities/Tasks/Content/Pipeline/Events at the source so all Command Center panels **and meters** (funding, focus, content) are NLT-free; `src/lib/drive.ts` filters NLT from every Drive listing and the Files view rejects a direct `?folder=<NLT id>`. Verified live (seed NLT rows → hidden on every surface → delete).
- Lead PII (parent contacts) not exposed publicly or logged client-side.

## Structure
```
src/
  app/
    page.tsx                    # Command Center
    pipeline|contacts|programs|tasks|campaigns|content|present|files/
    api/sheets/[tab]/route.ts   # GET list / POST add / PATCH update
    api/drive/route.ts          # GET list under a folder
    globals.css                 # Tailwind v4 @theme tokens (no tailwind.config)
  lib/    google.ts  sheets.ts  drive.ts   # import via @/lib/... (@/* -> src/*)
  components/
docs/  reference/                          # repo root, outside src/
```

## Build order (Phase 1)
1. Scaffold Next.js (TS + Tailwind + App Router); fonts via next/font; encode cockpit color tokens; make folders. **No Google calls yet.**
2. `lib/google.ts`, `lib/sheets.ts` written (auth resolves via ADC once local login is done).
3. Verify by reading the `Entities` tab (after local `gcloud` login).
4. **Command Center** live off the Sheet (ported from the prototype).
5. `lib/drive.ts` + **Files page** (browse the Drive folder).
6. **Pipeline module** end-to-end (read + write) as the pattern for other modules.
7. Deploy to Vercel + set up production federation.

## Status
Stages 1–3 done: workspace created, data Sheet live (10 tabs, seeded), Google Cloud + APIs + service account + sharing complete, keyless auth chosen. **Stage 4 (scaffold) complete** — Next.js 16 + TS + Tailwind v4 + App Router in `src/`, three fonts + cockpit tokens wired, route folders + `src/lib/` created, dev server boots clean. **Build-order steps 2–3 done** — keyless auth wired via impersonation (local ADC user → impersonate `crm-sheets` when `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` is set), `src/lib/google.ts` + `src/lib/sheets.ts` written, and a live `Entities` read verified through the temporary `GET /api/test` route (`google-auth-library` pinned to exact `10.5.0`). **Stage 5 (Command Center, live) complete** — `src/app/page.tsx` renders the dark cockpit dashboard read-only off the Sheet via `src/lib/dashboard.ts` (Entities/Tasks/Content/Pipeline/Events, `revalidate = 60`); cockpit CSS in `src/app/command-center.css`, `lucide-react` added, temporary `/api/test` deleted. **Stage 6 (Files view) complete** — `src/lib/drive.ts` (impersonated `getDrive()`, drive.readonly) + `src/app/files/page.tsx` browse the ecosystem Drive folder read-only (default root, `?folder=` drill-in, breadcrumb, folders-then-files, `webViewLink` opens in a new tab), cached with `unstable_cache` (60s); NLT filtered from listings and blocked on the direct folder param; nav links between Command Center ↔ Files. **Stage 7 (Pipeline module) complete** — first write path, now the template for every module. Write layer in `src/lib/sheets.ts` (`appendRow` / `updateRowById` / `deleteRowById` / `newId`, auto `id` + `updated_at`, `USER_ENTERED`, last-write-wins); `src/app/api/pipeline/route.ts` gives full CRUD (GET/POST/PATCH/DELETE) with input validation and `revalidatePath("/")` + `revalidatePath("/pipeline")` so the Command Center funding meter stays in sync; kanban UI (`src/app/pipeline/page.tsx` server read + `src/components/PipelineBoard.tsx` / `OpportunityModal.tsx`) with move/add/edit via optimistic updates → API → reconcile/rollback; `src/lib/pipeline.ts` holds the shared stages/types; Pipeline nav link added. **Contacts module complete** — `/api/contacts` (full CRUD + `revalidatePath("/contacts")`), server-read `src/app/contacts/page.tsx` (NLT-filtered) + `src/components/ContactsTable.tsx` (table, filter by type/entity, optimistic add/edit/delete) + `ContactModal`; shared modal/form/button/chip/toast primitives now live in `command-center.css`, shared NLT row filter in `src/lib/nlt.ts`; Contacts nav link added. **Programs module complete** — `/api/programs` (CRUD + `revalidatePath("/programs")`), server-read `src/app/programs/page.tsx` (NLT-filtered) + `src/components/ProgramsBoard.tsx` (cards grouped by entity, color-coded status chips) + `ProgramModal`; all 9 programs resolve to real entities (no Unassigned bucket). Programs tab has no `updated_at` column — the write layer skips it gracefully. **Tasks module complete** — added an `entity` column to the Tasks tab (one-off migration, backfilled 6 rows by task-text match). `/api/tasks` (CRUD + `revalidatePath("/tasks")` **and `revalidatePath("/")`** since focus drives the dashboard), server-read `src/app/tasks/page.tsx` (NLT-filtered) + `src/components/TasksList.tsx` (filter by owner/status/entity; star toggles `focus_week`, checkbox toggles `status==Done`) + `TaskModal`; `src/lib/tasks.ts` (`isFocus`/`isDone` match the dashboard's parsing). Verified both toggles sync to the Command Center's this-week focus (panel 3→4→3 tasks; done count 0/3→1/3). **Campaigns module complete** — `/api/campaigns` (CRUD + `revalidatePath("/campaigns")`), server-read `src/app/campaigns/page.tsx` (NLT-filtered) + `src/components/CampaignsList.tsx` (card list; filter by status/objective/entity; entity stripe/dot resolves for PVY/SNK) + `CampaignModal` (objective is a fixed dropdown — Awareness/Enrollment/Fundraising/Engagement); date ranges formatted. **Content module complete** — `/api/content` (CRUD + `revalidatePath("/content")` and `"/"`), server-read `src/app/content/page.tsx` (NLT-filtered) + `src/components/ContentCalendar.tsx` (grouped by date, channel badge, entity stripe, `campaign_id`→campaign name) + `ContentModal` (campaign/channel/status fixed dropdowns; campaign shows name/stores id, empty allowed). Shared `contentStatusStyle` in `src/lib/content.ts` is used by BOTH the Content view and the Command Center's "content this week" strip; the dashboard's "Full calendar →" links to `/content`.

**🏁 Milestone — all CRUD modules complete** (Pipeline + Contacts + Programs + Tasks + Campaigns + Content), each reading **and** writing the live Sheet through the shared write layer, in the dark cockpit style, NLT-filtered, with optimistic UI. Phase 1 is functionally built. Nav links to every module on the Command Center. **Cross-module review done** (6 dimensions × adversarial verify; 14 confirmed of 15). Fixed: NLT leaks (Pipeline page + every Command Center panel/meter now `isNlt`-filtered at the source — verified live), deduped `pipeline.css` down to the shared primitives (single source of truth in `command-center.css`), `updateRowById` now writes only the changed cells (no untouched-cell coercion; amounts stay numeric), and client optimistic state hardened (temp-id edit guard + targeted delete rollback across all modules). Deferred items logged below.

**Present mode complete** — `/present` (and an overlay launched from the dashboard "Present ecosystem" button + each ecosystem tile) renders full-screen bright per-entity pitch screens fed entirely by live Sheet data: per-entity fields ← `Entities`; "Why it matters" ← `Present_Points` (by `entity_id`, ordered); "What we offer" ← `Programs` (by entity); light palette derived from `color_primary`/`color_deep`; "Where it fits" hub-and-spoke from the entity list. Ecosystem "ALL" view uses a fallback constant (TODO below). Code: `src/lib/present.ts` + `src/components/present/*` (PresentProvider / PresentOverlay / EcosystemZones / PresentStandalone). The overlay is **portaled to `<body>`** (`position: fixed`, `z-index: 9999`, opaque bg, Esc + click-outside, scroll-lock) — fixes the prior behind-the-dashboard layering bug; **verified in a real browser (14/14 interaction checks): covers the viewport, dashboard not clickable behind, tabs/prev-next/Esc/tile-launch all work.** NLT is never presentable. **Next (last fork, needs Waleed): deploy to Vercel + production Workload Identity Federation.**

**Deployed to Vercel** — app is live at `https://pvle-command-center.vercel.app` (project `pvle-command-center`, scope `waleed-9941s-projects`). Production keyless data-auth path added in `src/lib/google.ts` (Vercel OIDC → Workload Identity Federation → impersonate `crm-sheets`; local dev unchanged). **Vercel deployment-protection topology:** the production alias is public; per-deployment hash URLs are SSO-gated (302) — test/pull logs via the alias (`vercel logs pvle-command-center.vercel.app --json`).

**Login gate complete (live in production)** — Google sign-in restricted to an **email allowlist** now gates **every page and API route**. Built with Auth.js / NextAuth **v5 (`next-auth@5.0.0-beta.31`)**, Google provider. This is *user auth* and is a **separate concern from `src/lib/google.ts`** (service-account / WIF *data auth*), which is left completely untouched.
- `src/auth.ts` — Google provider + `signIn` allowlist callback (case-insensitive, **fail-closed** when `ALLOWED_EMAILS` unset, Google-only, rejects `email_verified:false`); exports `isAllowedEmail`. JWT sessions, no DB adapter.
- `src/proxy.ts` — **Next 16's `proxy` middleware convention** (renamed from `middleware`, runs on Node runtime). Protects everything; unauthenticated pages → `307 /signin?callbackUrl`, `/api/*` → `401 JSON`. Public only: `/api/auth/*`, `/signin`, Next internals. **Re-checks the allowlist on every request** (not just at sign-in) so removing an email revokes on the next request; fail-safe if a session carries no email.
- `src/app/api/auth/[...nextauth]/route.ts`, branded dark-cockpit `src/app/signin/page.tsx` (+ access-denied / revoked states + open-redirect-guarded `callbackUrl`), global `src/components/UserMenu.tsx` app-bar (email + Sign out) wired into the root layout, styles in `src/app/auth.css` (also nudged `.cc { min-height }` so the app-bar coexists with the cockpit).
- **No hardcoded secrets** — env-only: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`, `ALLOWED_EMAILS`, all set in **Vercel Production** and verified; Google OAuth client + redirect URI (`…/api/auth/callback/google`) registered. Local dev config appended to `.env.local` (gitignored); setup note in `docs/AUTH_SETUP.md`.
- Reviewed via an adversarial multi-agent security pass (5 dimensions × verify): fixed the per-request revocation gap and a docs-PII nit before shipping.
- **Allowlist** is a small email allowlist kept **only** in the Vercel `ALLOWED_EMAILS` env var (Production) — not committed here, since this repo is public. View/change it via `vercel env` (or the Vercel dashboard) + redeploy.
- **Gotcha (Vercel CLI in agent/non-interactive mode):** `vercel env add` **ignores stdin** — you must pass `--value <V>` (add `--force` to overwrite, `--no-sensitive` if you want to read it back; production values default to *sensitive* = write-only, so `vercel env pull` shows them blank). Verify sensitive vars functionally (e.g. `/api/auth/csrf` returns a token only if `AUTH_SECRET` is set) rather than by pull.

**Client fixes + relational Programs/Enrollment layer** — *feature branch `feat/programs-enrollment-attachments`, in PREVIEW; NOT yet in production.* Built feature-by-feature (commit + `npm run build` each).
- **Ecosystem entity option** — `src/lib/entities.ts` `readEntityOptions()` is now the single source for every module's entity dropdown/filter/badge: reads `Entities`, **NLT-filters** (each page previously mapped entities without filtering → latent leak, now closed), and appends a synthetic **Ecosystem** option (id `ecosystem`, accent `#C9A227`). Not a row in the `Entities` tab (not pitchable). `ProgramsBoard` grouped view only renders non-empty groups.
- **Delete everywhere** — Pipeline gained delete (card action + edit-view button in `OpportunityModal`); all 6 CRUD modules share the confirm copy `Delete "X"? This can't be undone.` Shared `.btn-danger`.
- **Founding-cohort copy** neutralized (dashboard meters now show real enrollment/revenue). *Data note:* the Sankofa ecosystem-zone note is `Entities.tagline` — check/neutralize that Sheet row if it still carries launch copy.
- **Wix CSV import** — `src/lib/csv.ts` (dependency-free parser: BOM, CRLF, quoted commas, escaped quotes, empty-row drop + Wix header auto-map) + `ContactsImport` (upload → map → preview → dedupe by email → append) → `POST /api/contacts/import` (adds a `source` column via `ensureColumns`, batch `appendRows`; imports default entity **PVALD** + `source=wix-import`).
- **Relational layer** — `src/lib/schema.ts` `ensureRelationalSchema()` (via new `ensureTab`/`ensureColumns` in `sheets.ts`) creates/extends tabs on demand, non-destructively:
  - **Programs** tab gains `rate_amount | rate_period (one_time/monthly/session/annual) | capacity | created_at`. **The spec's `type` == the existing `category` column** (Product/Program/School) — not duplicated. New programs mint `prg_` ids.
  - **Enrollments** tab (new): `id | program_id | contact_id | status (active/pending/ended) | start_date | end_date | rate_override | notes | created_at`. `enr_` ids. `/api/enrollments` CRUD.
- **Referential integrity** — Enrollments store only ids; program/contact **names resolve at read time** (no denormalized copies) so renames propagate everywhere automatically. Revenue math in `src/lib/enrollments.ts`: `monthlyValue` (monthly=rate, annual=rate/12, one_time/session=0 → not recurring), `statsForProgram` → MRR + projected annual (MRR×12).
- **Programs detail** `/programs/[id]` + **Contact detail** `/contacts/[id]` (shared `src/app/detail.css`): roster/enrollments resolved by id + linked, enrolled count + capacity bar, live MRR/annual, enroll/unenroll via searchable picker (two doors, same Enrollments tab). Board/table names link to details.
- **Dashboard rollup** — live "Programs & revenue" section + Active-enrollments/MRR meters, NLT-free.
- **ID conventions:** `prg_` programs, `enr_` enrollments; existing Contacts/Pipeline/Tasks/etc. keep their original single-letter-prefixed ids (opaque; referenced as-is — a legacy string ref not migrated: none, all cross-refs are by id).

## Known TODOs
- **Entity progress bar** — the ecosystem zone cards omit the numeric progress bar; there's no progress/percent field in the `Entities` tab yet. Add the field, then render the bar.
- **Content stripe color** — cards color their top stripe by `Content.entity` → `Entities.color_primary`, falling back to muted `#8C7B5C` when a row's `entity` doesn't match an entity `id`. Verified resolving correctly for all seeded rows today; keep `Content.entity` values as valid entity ids (or add validation) so the stripe never silently defaults.
- **Ecosystem Present copy** — the "ALL" present view (tagline / what / who / signature / why-points) comes from a hardcoded `ECOSYSTEM_FALLBACK` in `src/lib/present.ts`. Move it to a dedicated `ECOSYSTEM` row in the `Entities` + `Present_Points` tabs; the code already prefers a real row (id matching `ecosystem`/`all`/`eco`) if one appears.

## Known limitations (deferred from the cross-module review — revisit at multi-user scale)
- **Concurrent writes are last-write-wins.** `updateRowById` finds the row by id but writes by A1 position from a possibly-stale read; a delete of an earlier row landing between another request's read and its write could clobber a bystander. Fine for a 1–2 person tool; add per-tab serialization / commit-time id re-check when several people edit at once.
- **Duplicate ids act on the first match.** `updateRowById` / `deleteRowById` use `findIndex`; if the Sheet ever holds two rows with the same id (manual paste, or a rare `newId` collision), only the first is touched and delete still reports success. Add a uniqueness/dedupe check if it comes up.
- **Text-cell coercion (RAW vs USER_ENTERED) — deferred.** Writes use `USER_ENTERED` (keeps amounts numeric), so a leading-zero phone `0612…` is stored as a number on append. `updateRowById` now writes only the changed cells, so unrelated cells are never re-coerced. Switch to `RAW` for text-heavy tabs if leading-zeros/formulas become real data.
- **Content → hidden campaign** shows the opaque `campaign_id` as `"<id> (unknown)"` when a visible post links to a campaign that's NLT-filtered/deleted. Edge case; suppress the chip for hidden campaigns if it ever surfaces.
