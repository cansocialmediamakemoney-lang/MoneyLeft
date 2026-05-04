# MoneyLeft — Claude Handoff Document
*Last updated: May 2026 session*

---

## What this app is

MoneyLeft is a budgeting PWA for older adults (parents, retirees). The core product is one big number: **"How much can I safely spend today?"**

**Production URL:** https://moneyleft.app
**Stack:** Next.js 14.2.35 (App Router), Supabase (Auth + Postgres + RLS), Vercel (hosting), Capacitor (iOS wrapper), Tailwind CSS + CSS variables, pure JavaScript (no TypeScript)

---

## Database schema

All tables use Row Level Security (RLS) — users only see their own rows.

| Table | Key columns | Notes |
|-------|-------------|-------|
| `profiles` | `id, income, savings_goal, pay_date, currency, current_savings, ml_savings, setup_complete` | 1 row per user, auto-created on signup trigger |
| `bills` | `id, user_id, name, amount, due_day, category` | Individual bills (rent, phone, etc.) |
| `spending_entries` | `id, user_id, spent_on, category, amount, note` | One row per purchase |
| `plans` | `id, user_id, name, amount, plan_type, start_date, end_date, current_saved, reserve_amount, reserve_label` | `plan_type`: `"trip"`, `"weekend"`, `"custom"`, `"saving"` |
| `goal_contributions` | `id, user_id, goal_id, contribution_month (YYYY-MM), amount, planned_current_saved` | Month-end savings contributions; UNIQUE(user_id, goal_id, contribution_month) |
| `income_entries` | `id, user_id, received_on, amount, source` | One-off income entries |

**Schema migrations that must be run in Supabase SQL Editor if not already done:**
```sql
alter table public.profiles add column if not exists current_savings numeric default 0;
alter table public.profiles add column if not exists ml_savings numeric default 0;
alter table public.profiles add column if not exists setup_complete boolean default false;

alter table public.goal_contributions add column if not exists planned_current_saved numeric;
```

The `goal_contributions` table may need to be created fresh on some instances — the full CREATE TABLE is in `supabase-schema.sql`.

**Do not apply migrations in code.** Write the SQL and tell the user to run it in Supabase SQL Editor.

---

## Design system

All theme colors are CSS variables in `app/globals.css`. Use them inline: `style={{ color: "var(--accent-text)" }}`.

| Variable | Value | Use |
|----------|-------|-----|
| `--bg-base` | #0a0e0c | Page background |
| `--bg-elevated` | #141a17 | Card background |
| `--bg-elevated-2` | #1c2420 | Nested / hover state |
| `--accent` | #1f6f4a | Forest green primary |
| `--accent-text` | #4ea87e | Readable green text on dark bg |
| `--text-primary/secondary/tertiary` | — | Content hierarchy |
| `--danger, --warn` | — | Semantic states (each has `-bg` variant) |

**Typography:** Georgia/serif, 17–18px base. Large because target audience is older adults.

**Do NOT** extend Tailwind theme config. Use Tailwind only for layout/spacing/responsive. Colors always via CSS variables.

---

## Key components

- `<Hero>` — the big number card with label, hero slot, support text, footer stats. Used on every main tab.
- `<MoneyDisplay>` — dollar amounts in hero positions (handles formatting + responsive sizing).
- `<ConfirmSheet>` — bottom-sheet confirmation for destructive actions (delete, etc.).
- `<AppShell>` — wraps all authenticated pages. Bottom nav is always visible except during onboarding.
- `<Onboarding>` — shown to new users instead of dashboard. 4 steps: Intro → Income/Savings → Bills (individual) → Result.
- `<MonthEndReview>` — modal that fires when a new month starts with leftover money.

---

## Auth and session

### Middleware (`middleware.js`)
Protects routes server-side. On every request it calls `supabase.auth.getUser()` (a live network call to the Supabase auth API). 

**Critical fix in this session:** If `getUser()` returns an `authError` (transient network failure, Capacitor app resuming from background, token refresh race), the middleware now returns the response unchanged instead of redirecting to login. This prevents false logouts. Unauthenticated users are still blocked.

### Client-side auth
- `useBudgetData` and `usePlans` both call `supabase.auth.getUser()` internally. If this fails, they set an `error` state — they do NOT redirect to login.
- The dashboard's onboarding gate is: `income > 0 || bills.length > 0`. Existing users are never trapped.
- **No client page does `router.push("/login")`** — only `AppShell.signOut()` does (intentional).

### Email auth redirects
- Signup uses `${window.location.origin}/dashboard` (dynamic, works on any domain)
- Password reset uses `${window.location.origin}/reset-password` (dynamic)
- No hardcoded URLs in auth flows.

---

## Savings goal contribution system

### How it works
- Budget tab's `planSavingsMonthly` deducts the required monthly savings for each active `plan_type === "saving"` goal from Money Left **all month long**.
- Goal progress (`current_saved`) does **not** increase during the current month.
- On the first dashboard load after a month ends, `useGoalContributions` runs once and applies the previous month's contribution to `current_saved`.

### Idempotency (cross-device safe)
1. DB SELECT: check if a `goal_contributions` row exists for `(user_id, goal_id, prev_month)`.
2. If found → skip.
3. If not found → INSERT first (the UNIQUE constraint is the atomic lock; 23505 = another device beat us, skip).
4. If INSERT succeeds → call `updatePlan` to increment `current_saved`.
5. If `updatePlan` fails → roll back the INSERT so the next session can retry.
6. The `planned_current_saved` column stores the expected value after update — used to detect stale rows (INSERT succeeded but update failed).

### What the budget formula uses
```js
// planSavingsMonthly in app/dashboard/page.js:
plans.reduce((sum, p) => {
  if (p.plan_type !== "saving") return sum;
  if (p.end_date <= todayStr) return sum;
  const remaining = Math.max(0, p.amount - p.current_saved);
  const months = msLeft / 86400000 / 30.4375;
  return sum + (months > 0 ? remaining / months : 0);
}, 0);
```

### Goals created this month
`start_date >= currentMonthFirstDay()` → skip. No previous-month contribution for a brand-new goal.

---

## Onboarding

4-step flow shown to new users (no income and no bills yet):
1. **Intro** — "Know what you can spend"
2. **Setup** — Monthly income, savings goal, current savings
3. **Bills** — Add bills individually (name + amount + due date). "Skip for now" allowed.
4. **Result** — Shows safe-to-spend/day based on what was entered

Each bill entered in step 3 is saved as an individual row in the `bills` table (not a lump sum). This prevents double-counting when users later add more bills via My Bills.

---

## Total Savings formula (Savings tab)

```
Total Savings = profile.current_savings
              + profile.ml_savings          (leftover money applied at month-end)
              + Σ min(plan.current_saved, plan.amount)  for each plan_type==="saving"
```

`min(current_saved, amount)` caps at the goal target so an overfunded goal doesn't inflate the total.

---

## Files with auth/route logic to know

| File | What it does |
|------|-------------|
| `middleware.js` | Server-side route protection; redirects unauthenticated users to /login |
| `lib/supabase-browser.js` | `createBrowserClient` from `@supabase/ssr` — used in all client components |
| `lib/supabase-server.js` | `createServerClient` with cookie handling — used in API routes |
| `lib/useBudgetData.js` | Loads profile, bills, spending entries; exposes mutations |
| `lib/usePlans.js` | Loads plans; `updatePlan` uses `.select().single()` to detect 0-row silent failures |
| `lib/useGoalContributions.js` | Month-end contribution hook; DB-first, no localStorage gating |
| `components/AppShell.js` | Bottom nav + signOut |

---

## Routing conventions

- New authenticated routes **must** be added to `PROTECTED_ROUTES` in `middleware.js`.
- Pages using `useSearchParams()` **must** wrap content in `<Suspense>` (Next.js 14 requirement).
- Secondary views (Plan create/detail) use **query params** `?view=create`, `?id=...` — not nested routes.

---

## Capacitor iOS

- Config file: `capacitor.config.json` (root) — `server.url = "https://moneyleft.app"`
- The copy at `ios/App/App/capacitor.config.json` is git-ignored (generated). Run `npx cap sync ios` to regenerate it before an Xcode build.
- The iOS WebView loads the live production site. No local bundle.

---

## Common pitfalls

- **`useSearchParams` without Suspense** → build fails with "should be wrapped" error. Pattern: default export is a Suspense wrapper, real component is a named function below.
- **`.single()` vs `.maybeSingle()`** — `.single()` throws when 0 rows returned. Use `.maybeSingle()` when the row might not exist. Use `.select().single()` on mutations (INSERT/UPDATE) when you want to verify the row was actually written.
- **Service worker cache** — bump `CACHE_VERSION` in `public/sw.js` when PWA assets change so installed users get updates.
- **No TypeScript** — keep it JS. The user has explicitly not opted into TS.
- **CSS variable names** — referenced inline across 20+ files. Don't rename them in `globals.css`.

---

## Current state: working features

- Auth (login, signup, email confirm, password reset)
- Budget dashboard: Money Left hero, safe/day, pace insight, bill warnings, calculation breakdown, Quick Check
- Bills: add / edit / delete individual bills with due-date warnings
- Spending entry + history with month picker
- Savings tab: Total Savings hero, 12-month projection, what-if slider, goal progress cards
- Plan tab: Spend Plans + Savings Goals (CRUD), budget comparison widget
- Month-end review: leftover → savings / rollover / fresh start
- Add Income: one-off income entries
- Scam Checker (rules mode default; AI mode behind env flag)
- Settings: account, preferences, privacy, support
- PWA installable on iOS/Android
- Capacitor iOS native wrapper

## Current state: known limitations

- Account deletion deletes user data but not the `auth.users` row (needs service role key + server-side delete)
- App version in Settings is hardcoded "1.0"
- No edit UI for Plans (view + delete only)
- Support email in Settings is placeholder
- Bills / Spending / Budget-Edit pages don't have standalone page titles (accessed via dashboard buttons)
- `goal_contributions` table must be created manually in Supabase SQL Editor if not present
