-- ═══════════════════════════════════════════════════════════════════════════
-- MoneyLeft database schema
-- Run this entire file in your Supabase SQL editor.
-- (Supabase dashboard → SQL Editor → New query → paste this → Run)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per user. Stores income, savings goal, pay date, and currency.
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  income          numeric     default 0,
  savings_goal    numeric     default 0,
  pay_date        integer     default 1,
  currency        text        default 'USD',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── BILLS ───────────────────────────────────────────────────────────────────
-- Multiple bills per user.
create table public.bills (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  name            text        not null,
  amount          numeric     not null default 0,
  due_day         integer     not null default 1,
  category        text        default 'Other Bill',
  created_at      timestamptz default now()
);
create index bills_user_id_idx on public.bills (user_id);

-- ─── SPENDING ENTRIES ────────────────────────────────────────────────────────
-- Each individual purchase a user logs.
create table public.spending_entries (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  spent_on        date        not null default current_date,
  category        text        not null,
  amount          numeric     not null,
  note            text,
  created_at      timestamptz default now()
);
create index spending_user_date_idx on public.spending_entries (user_id, spent_on desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- This is what makes users only see their OWN data.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles         enable row level security;
alter table public.bills            enable row level security;
alter table public.spending_entries enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users see own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users delete own profile" on public.profiles for delete using (auth.uid() = id);

-- Bills: users can only see/edit their own bills
create policy "Users see own bills"   on public.bills for select using (auth.uid() = user_id);
create policy "Users insert own bills" on public.bills for insert with check (auth.uid() = user_id);
create policy "Users update own bills" on public.bills for update using (auth.uid() = user_id);
create policy "Users delete own bills" on public.bills for delete using (auth.uid() = user_id);

-- Spending: users can only see/edit their own entries
create policy "Users see own spending"   on public.spending_entries for select using (auth.uid() = user_id);
create policy "Users insert own spending" on public.spending_entries for insert with check (auth.uid() = user_id);
create policy "Users update own spending" on public.spending_entries for update using (auth.uid() = user_id);
create policy "Users delete own spending" on public.spending_entries for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE WHEN USER SIGNS UP
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATIONS — run these if you already have the base schema deployed
-- ═══════════════════════════════════════════════════════════════════════════

-- Savings tracking (added for onboarding + Savings tab)
-- ⚠️  Run these in your Supabase SQL Editor before deploying the Savings features.
alter table public.profiles add column if not exists current_savings numeric default 0;
alter table public.profiles add column if not exists ml_savings       numeric default 0;

-- Onboarding completion flag (added to prevent false onboarding redirects)
-- ⚠️  Run in Supabase SQL Editor.
alter table public.profiles add column if not exists setup_complete boolean default false;

-- ─── PLANS ───────────────────────────────────────────────────────────────────
-- Spend plans (plan_type: trip/weekend/custom) and Savings Goals (plan_type: saving).
-- This table was created directly in Supabase before the schema file was written.
-- CREATE TABLE IF NOT EXISTS makes this file safe to re-run on existing instances.
-- NOTE: This block must appear before goal_contributions — the FK goal_id references plans(id).
create table if not exists public.plans (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  name            text        not null,
  plan_type       text        not null default 'custom',  -- 'trip'|'weekend'|'custom'|'saving'
  amount          numeric     not null default 0,          -- total budget or savings target
  start_date      date,                                    -- spend plans; savings goals use today
  end_date        date,                                    -- deadline for both types
  current_saved   numeric     default 0,                  -- savings goals: amount saved so far
  reserve_amount  numeric,                                 -- spend plans: amount set aside
  reserve_label   text,                                    -- spend plans: label for the reserve
  created_at      timestamptz default now()
);
create index if not exists plans_user_id_idx on public.plans (user_id);

alter table public.plans enable row level security;

-- Policies use DO blocks so re-running this file on an existing DB does not fail.
do $$ begin
  create policy "Users see own plans"    on public.plans for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own plans" on public.plans for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own plans" on public.plans for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users delete own plans" on public.plans for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── GOAL CONTRIBUTIONS ──────────────────────────────────────────────────────
-- Tracks which monthly savings contributions have been applied to each savings
-- goal. The unique(user_id, goal_id, contribution_month) constraint makes the
-- month-end logic idempotent: even if the user opens the app multiple times in
-- the same month, each goal only ever receives one contribution per month.
-- ⚠️  Run in Supabase SQL Editor before deploying the month-end goal logic.
create table if not exists public.goal_contributions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  goal_id             uuid        not null references public.plans(id) on delete cascade,
  contribution_month  text        not null,  -- "YYYY-MM"
  amount              numeric     not null default 0,
  created_at          timestamptz default now(),
  unique(user_id, goal_id, contribution_month)
);
create index if not exists goal_contributions_user_idx on public.goal_contributions (user_id);

-- Stores the expected plans.current_saved value after the contribution is applied.
-- Used to detect stale rows: if a row exists but plans.current_saved < planned_current_saved,
-- the plans UPDATE never completed and the row should be deleted so it can be retried.
-- ⚠️  Run in Supabase SQL Editor:
alter table public.goal_contributions add column if not exists planned_current_saved numeric;

alter table public.goal_contributions enable row level security;
create policy "Users see own goal contributions"    on public.goal_contributions for select using (auth.uid() = user_id);
create policy "Users insert own goal contributions" on public.goal_contributions for insert with check (auth.uid() = user_id);
create policy "Users update own goal contributions" on public.goal_contributions for update using (auth.uid() = user_id);
create policy "Users delete own goal contributions" on public.goal_contributions for delete using (auth.uid() = user_id);

-- ─── BASE SAVINGS CONTRIBUTIONS ─────────────────────────────────────────────
-- Tracks that the base monthly savings goal (profile.savings_goal) has been
-- credited to profile.ml_savings for a given month. One row per user per month.
-- The unique(user_id, contribution_month) constraint makes the month-end logic
-- idempotent — two devices racing will both try to INSERT; one gets 23505 and skips.
-- ⚠️  Run in Supabase SQL Editor before deploying this feature.
create table if not exists public.base_savings_contributions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  contribution_month  text        not null,  -- "YYYY-MM"
  amount              numeric     not null default 0,
  created_at          timestamptz default now(),
  unique(user_id, contribution_month)
);
create index if not exists base_savings_contributions_user_idx on public.base_savings_contributions (user_id);

alter table public.base_savings_contributions enable row level security;

do $$ begin
  create policy "Users see own base savings contributions"
    on public.base_savings_contributions for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own base savings contributions"
    on public.base_savings_contributions for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own base savings contributions"
    on public.base_savings_contributions for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users delete own base savings contributions"
    on public.base_savings_contributions for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── INCOME ENTRIES ──────────────────────────────────────────────────────────
-- One-time or irregular income a user logs during the month.
create table public.income_entries (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  received_on     date        not null default current_date,
  amount          numeric     not null,
  source          text,
  created_at      timestamptz default now()
);
create index income_user_date_idx on public.income_entries (user_id, received_on desc);

alter table public.income_entries enable row level security;
create policy "Users see own income"    on public.income_entries for select using (auth.uid() = user_id);
create policy "Users insert own income" on public.income_entries for insert with check (auth.uid() = user_id);
create policy "Users update own income" on public.income_entries for update using (auth.uid() = user_id);
create policy "Users delete own income" on public.income_entries for delete using (auth.uid() = user_id);
