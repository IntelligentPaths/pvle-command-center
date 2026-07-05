# Pura Vida Legacy Ecosystem — Command Center
### Technical Specification & Roadmap

**Version:** 0.1 (Draft) · **Date:** July 2, 2026
**Owner:** Intelligent Paths Solutions LLC (Waleed Amer) · **Client:** Juleon Lewis, Pura Vida Legacy Ecosystem
**Status:** Blueprint — reference guide for the build. Supersedes the earlier 4‑tab CRM data sheet.

---

## 1. Purpose & Vision

The Command Center is a single web application for running the entire Pura Vida Legacy Ecosystem (PVLE). It replaces scattered spreadsheets, docs, and mental notes with one operations hub.

It plays three roles at once:

1. **Cockpit** — an at‑a‑glance dashboard of the whole ecosystem: what's in play, what needs attention, what's moving.
2. **Operations hub** — the working modules for the day‑to‑day: funding pipeline, contacts, programs, tasks, marketing campaigns, and a content calendar.
3. **Pitch on demand** — an on‑brand "Present mode" that lets Juleon pull up a polished overview of any single program, or the whole ecosystem, at a moment's notice — so he is always prepared for a parent, funder, or partner.

**Design north star:** borrow the *legibility* of good game UI — you always know your status, your next move, and whether you're winning — executed with restraint and a premium, professional finish.

---

## 2. Users & Roles

| Role | Who | Access |
|---|---|---|
| **Owner / Operator** | Juleon Lewis | Full access — all modules, present mode, editing |
| **Marketing** | Bertha (PVY) *(to confirm)* | Campaigns + Content Calendar, read elsewhere |
| **Technical admin** | Waleed / Intelligent Paths | Full access + configuration |
| **Future** | Additional team members | Scoped by module as the team grows |

> **Open decision:** Is Bertha a daily user? If yes, the content calendar and permissions are designed for a small team from day one rather than a single operator. (See §14.)

---

## 3. Product Principles

- **One source of truth.** All data lives in one place (the Google Sheet, §6). Every view reads from it; nothing drifts.
- **The dashboard surfaces, the pages do the work.** The Command Center shows highlights (this‑week focus, top meters); the module pages hold the full detail.
- **Always presentable.** Any program can be shown to an outsider in one tap, in its own brand.
- **Game‑legible, professionally executed.** Progress meters, a focus list, momentum, an ecosystem map — never cartoonish.
- **NLT is internal only.** The NLT trust/IP entity never appears in any client‑facing view, entity list, map, or present mode. (Hard rule.)

---

## 4. Design System

Two coordinated modes:

- **Cockpit (dark).** Juleon's private operating view — warm espresso "mission control," gold accents, glowing meters. Used for the dashboard and all working modules.
- **Present (light, per‑brand).** Outward‑facing. Each entity flips to its own bright, branded palette for showing others.

### Typography
| Use | Typeface |
|---|---|
| Display / headings | Cormorant Garamond |
| Body / UI | Montserrat |
| Data readouts, labels, HUD | IBM Plex Mono |

(All three are the ecosystem's established fonts plus a mono face for the "instrument panel" feel.)

### Color — cockpit
Deep espresso background (`#16120C`), warm panels (`#201A12`), gold accent (`#F5B531`), cream text (`#F2E7CF`), muted tan (`#B7A688`).

### Color — per‑entity (Present mode)
Each entity carries its own identity. **Sankofa and PVY use their real brand palettes; UYN, Dance, and Roots are placeholders to be replaced with real brand assets.**

| Entity | Primary | Deep / Accent | Source |
|---|---|---|---|
| Sankofa Legacy School | `#E38C07` gold | `#B22714` rust | Real brand kit |
| Pura Vida Youth | `#F7A81B` sun‑gold | `#0C6F64` teal | Established (flyer) |
| Ubuntu y Nosotros (UYN) | `#E0821C` amber | `#5B3A8A` violet | **Placeholder** |
| Afro‑Latin Dance | `#E7663A` coral | `#B12A5B` magenta | **Placeholder** |
| Roots Rediscovered | `#7E8C3E` green | `#4A5A22` deep green | **Placeholder** |
| Ecosystem (general) | `#E3A81C` gold | `#8A3A12` deep amber | Ecosystem |

### Motion & quality floor
Subtle only — hover lift on cards, meter fills, view transitions. Respect `prefers-reduced-motion`. Keyboard‑accessible controls, visible focus states, responsive from phone to desktop (Juleon works from his phone).

---

## 5. Modules (Information Architecture)

Persistent left nav. Command Center is the landing view; each module is a full page in the cockpit design language.

| # | Module | Purpose | Phase |
|---|---|---|---|
| 1 | **Command Center** | Dashboard: status, meters, this‑week focus, needs‑attention, content‑this‑week, ecosystem map | 1 |
| 2 | **Pipeline** | Funding kanban — grants, contracts, opportunities by stage | 2 |
| 3 | **Contacts** | People directory — internal, vendors, partners, prospects | 2 |
| 4 | **Programs & Products** | The six UYN products, PVY programs, Sankofa, Dance | 2 |
| 5 | **Tasks** | Full task/quest list (dashboard shows only "this week's focus") | 2 |
| 6 | **Campaigns** | Marketing agenda — the pushes (enrollment, launches) and their goals | 3 |
| 7 | **Content Calendar** | Individual posts by date/channel, linked to campaigns | 3 |
| 8 | **Present Mode** | On‑brand pitch views per entity + a general ecosystem view; launchable from anywhere | 4 |
| 9 | **Events** | Info sessions, STEAM Saturdays, deadlines | 5 |
| 10 | **Leads** | Enrollment/interest leads (e.g., FWSA flyer forms) flowing in | 5 |

### Page detail (summary)
- **Command Center** — greeting + ecosystem status line; momentum (content streak); 4 meters (founding cohort, after‑school, funding in play, content ready); ecosystem map of entity "zones" (each tappable → Present); this‑week focus (interactive quests + progress); needs‑attention (deadlines/decisions); content‑this‑week strip.
- **Pipeline** — kanban columns (Researching → Drafting → Submitted → Decision → Awarded/Declined); cards color‑striped by entity; drag/advance stage; add/edit; per‑stage totals; filter by entity.
- **Contacts** — searchable/filterable table; add/edit; type + entity tags; detail drawer.
- **Programs & Products** — cards grouped by entity; status (Priority/Active/In Development/Planned/Dormant); one‑liner + notes.
- **Tasks** — full list, filter by owner/entity/status; mark "focus this week" to surface on the dashboard.
- **Campaigns** — list of campaigns with goal, objective, timeframe, owner, linked content count.
- **Content Calendar** — week/month calendar; posts by channel + entity color; status pipeline (Idea → Drafting → Scheduled → Posted); linked to a campaign. **Planning only — not an auto‑publisher** (see §11).
- **Present Mode** — full‑screen, per‑entity branded; tabs: Overview (tagline, signature line, what, who, facts), What we offer, Why it matters, Where it fits (live ecosystem map). Prev/next between entities; "Present ecosystem" for the whole.

---

## 6. Data Model (Google Sheet = system of record)

One Google Sheet, one tab per "table." A thin data‑access layer maps rows ↔ typed objects by header name. `id` is the stable key on every row.

**Entities** *(reference; NLT excluded)*
| Column | Notes |
|---|---|
| id | e.g. `UYN`, `PVY`, `SNK`, `DANCE`, `ROOTS` |
| name / short_name | Display names |
| type | Platform / Program / School / Community / Heritage |
| status | Active / Building / Launching / Dormant |
| color_primary / color_deep | Brand hex |
| tagline / signature / what / who | Present‑mode copy |
| order | Sort order |

**Pipeline**
`id, name, funder, entity, type (Grant/Contract/Voucher/Donation/Other), amount, stage (Researching/Drafting/Submitted/Decision/Awarded/Declined), owner, decision_date, notes, updated_at`

**Contacts**
`id, name, role, org, type (Internal/Vendor/Partner/Prospect), email, phone, entity, notes, updated_at`

**Programs**
`id, name, entity, category (Product/Program/School/Community), status (Priority/Active/In Development/Planned/Dormant), one_liner, description, notes`

**Tasks**
`id, task, related, owner, status (To Do/In Progress/Blocked/Done), due, focus_week (TRUE/FALSE), notes`

**Campaigns**
`id, name, entity, goal, objective (Awareness/Enrollment/Fundraising/Engagement), start_date, end_date, owner, status (Planned/Active/Complete), notes`

**Content**
`id, title, date, channel (Instagram/Facebook/TikTok/Email/Other), entity, campaign_id, copy, asset_link, status (Idea/Drafting/Scheduled/Posted), owner`

**Events** *(Phase 5)*
`id, title, date, time, entity, type (Info session/STEAM Saturday/Deadline/Meeting), location, status, notes`

**Leads** *(Phase 5)*
`id, created_at, source, entity, student_name, grade, parent_name, email, phone, interest_level (Yes/Possibly/No), status (New/Contacted/Enrolled/Closed), notes`

**Present_Points** *(supports "Why it matters")*
`entity_id, title, blurb, order`

> **Present‑mode sourcing:** overview copy comes from **Entities**; "What we offer" is drawn from **Programs** filtered by entity; "Why it matters" from **Present_Points**; "Where it fits" is generated from the entity list. No duplicate content to maintain.

---

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Your stack; server components for secure Sheet reads, route handlers for writes |
| Hosting | **Vercel** | Your stack; zero‑config Next.js deploys, free tier fits |
| Data store | **Google Sheets (Sheets API v4)** | System of record Juleon can also see/edit; transparent; no DB to run |
| Data access | **Google service account** via `googleapis` | App has its own identity; Sheet shared with it; keys server‑side only |
| Styling | **Tailwind CSS** + design tokens | Fast, consistent; tokens encode the palette/type from §4 |
| Fonts | **next/font** (Cormorant Garamond, Montserrat, IBM Plex Mono) | Self‑hosted, no layout shift |
| Icons | **lucide-react** | Clean, consistent |
| Charts/meters | Custom SVG rings + light lib if needed | Crisp, low‑weight |
| Auth *(Phase 6)* | **Auth.js (NextAuth)** — Google + email allowlist | Simple, secure gate for a small team |
| Repo | **GitHub** (`IntelligentPaths/pvle-command-center`) | Your org; Vercel deploys from it |

---

## 8. Architecture

```
Browser (Next.js client)
      │  fetch / mutations
      ▼
Next.js Route Handlers  ── googleapis (service account) ──►  Google Sheet
   (server-side only)                                         (one tab per table)
      ▲
      │  reads (React Server Components where possible)
Vercel (hosting + env vars)
```

- **Reads:** prefer React Server Components / server route handlers; cache with short revalidation to respect Sheets API quotas.
- **Writes:** POST/PATCH route handlers append/update rows by `id`; last‑write‑wins.
- **Data layer:** a small typed module (`lib/sheets.ts`) reads a tab into objects and writes objects back — one place that knows the schema.
- **Secrets:** service account credentials live only in Vercel env vars, never in the client bundle or the repo.
- **Scale note:** Sheets comfortably handles this scale (hundreds–low thousands of rows). If any table outgrows it, that single table migrates to Postgres/Supabase behind the same data layer without touching the UI.

**Environment variables**
`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` — and later `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`.

---

## 9. Security & Access

- **Service account** holds the only write credential; Sheet is shared with it as Editor.
- **App gate (Phase 6):** Auth.js Google sign‑in restricted to an email allowlist (Juleon, Bertha, Waleed).
- **NLT rule:** the NLT entity is never rendered in any list, map, or present view. Enforced at the data layer.
- **Lead PII:** parent names, emails, and phone numbers (Leads tab) are handled with care — access limited, not exposed publicly, not in client‑side logs.

---

## 10. Integrations

| System | Role | Status |
|---|---|---|
| Google Sheets | System of record (all data) | Core |
| Google Drive | Asset storage (logos, photos, present media) | Existing folder tree |
| Website lead capture | Flyer/site interest forms → Leads tab | Phase 5 |
| Email (SendGrid) | Notifications / lead follow‑up | Later, optional |
| Social scheduling (Buffer/Later) | Actual auto‑publishing of posts | **External — not built in.** The hub *plans*; a dedicated tool *publishes* |

---

## 11. Roadmap

| Phase | Ships | Notes |
|---|---|---|
| **0 — Foundations** | Google Sheet (full model) + service account + repo | Sheet supersedes the 4‑tab draft |
| **1 — Shell + Cockpit** | Left‑nav app shell, Command Center wired to the Sheet | The landing experience, live |
| **2 — Core modules** | Pipeline, Contacts, Programs, Tasks | The original CRM, now real pages |
| **3 — Marketing** | Campaigns + Content Calendar | Where Juleon/Bertha feel daily value |
| **4 — Present mode** | Per‑entity + ecosystem pitch views | Always‑prepared |
| **5 — Reach** | Events, Leads, website → Leads capture | Closes the loop from marketing to enrollment |
| **6 — Team & polish** | Auth + allowlist, multi‑user, refinements | Opens it to Bertha and beyond |

Guiding rule: **wire the shell + Command Center + one real module first**, prove the Sheet‑backed pattern end to end, then add rooms one at a time.

---

## 12. What Exists Today

- **Command Center prototype** (React artifact) — cockpit + Present mode with all five entities, live map, interactive focus quests. Design + vision locked; seeded data; a few figures illustrative.
- **CRM prototype** (React artifact) — Pipeline (kanban), Contacts, Programs, Tasks; persistent; real PVLE data. Becomes the Phase‑2 modules.
- **Data sheet (draft)** — 4 tabs (Pipeline, Contacts, Programs, Tasks) with seed data. **To be replaced** by the full model in §6.
- **Google Drive structure** — ~70‑folder ecosystem tree, live.
- **Brand inputs** — Sankofa brand kit (real), PVY palette (established).

---

## 13. Open Decisions

1. **Bertha as user?** Drives multi‑user/permissions timing.
2. **Real brand assets** for UYN, Dance, Roots (logos + hex) to replace placeholders.
3. **Real numbers** for cockpit meters (enrollment counts, spots) — currently illustrative.
4. **Griot / Forge / Insight** one‑liners (Juleon) — currently intentionally vague.
5. **Content publishing** — confirm planning‑only (recommended) vs. any auto‑publish ambition.
6. **Domain / URL** for the app; and Leads source (which forms feed it first).
7. **Auth timing** — gate from launch, or add in Phase 6.

---

## 14. Appendix

**Suggested repo structure**
```
pvle-command-center/
├─ app/
│  ├─ (dashboard)/page.tsx        # Command Center
│  ├─ pipeline/ contacts/ programs/ tasks/
│  ├─ campaigns/ content/ present/
│  └─ api/                        # route handlers (read/write Sheet)
├─ lib/sheets.ts                  # typed data-access layer
├─ components/                    # UI (cockpit + present)
├─ styles/tokens                  # palette + type tokens
└─ .env.local                     # never committed
```

**Conventions**
- IDs: short, stable, per‑table (`p1`, `c1`, `prog1`, `t1`, `camp1`, `post1`).
- Entity refs use the entity `id` (`SNK`, `PVY`, …), resolved to color/name at render.
- Dates ISO `YYYY-MM-DD`.
- One tab = one table = one typed model; add fields freely, don't rename headers casually (the data layer maps by header).

---

*This is a living document. As decisions in §13 resolve and phases ship, update the version and date at the top.*
