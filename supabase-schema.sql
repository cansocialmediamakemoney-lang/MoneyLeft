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
