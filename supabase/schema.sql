-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  tagline text,
  image_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  charity_id uuid references public.charities (id),
  charity_percent integer not null default 10 check (charity_percent >= 10 and charity_percent <= 100),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'inactive',
  subscription_plan text,
  subscription_renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null check (score between 1 and 45),
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  numbers integer[] not null,
  published boolean not null default false,
  mode text default 'random',
  created_at timestamptz not null default now()
);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_count integer not null,
  prize numeric not null,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "scores_all_own" on public.scores;
drop policy if exists "charities_read_all" on public.charities;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "scores_all_own" on public.scores
  for all using (auth.uid() = user_id);

create policy "charities_read_all" on public.charities
  for select using (true);
