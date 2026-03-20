-- Run this in your Supabase SQL Editor

-- =====================
-- PROFILES TABLE
-- =====================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  is_admin boolean default false,
  approved boolean default false,
  invite_code_used boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- =====================
-- ITEMS TABLE
-- =====================
create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  brand text,
  category text,
  price numeric(10,2),
  image_url text,
  product_url text,
  status text default 'wishlist' check (status in ('wishlist', 'bought', 'archived')),
  custom_status text,
  tags text[] default '{}',
  is_private boolean default false,
  created_at timestamptz default now()
);

alter table items enable row level security;

-- Public items visible to everyone
create policy "Public items are viewable by everyone"
  on items for select using (is_private = false);

-- Users can see their own private items
create policy "Users can view own items"
  on items for select using (auth.uid() = user_id);

-- Authenticated users can insert their own items
create policy "Users can insert own items"
  on items for insert with check (auth.uid() = user_id);

-- Users can update their own items
create policy "Users can update own items"
  on items for update using (auth.uid() = user_id);

-- Users can delete their own items
create policy "Users can delete own items"
  on items for delete using (auth.uid() = user_id);

-- Admins can select all items
create policy "Admins can view all items"
  on items for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Admins can update any item
create policy "Admins can update any item"
  on items for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Admins can delete any item
create policy "Admins can delete any item"
  on items for delete
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- =====================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================
create or replace function handle_new_user()
returns trigger as $$
declare
  v_is_first boolean;
begin
  select not exists(select 1 from public.profiles) into v_is_first;

  insert into public.profiles (id, username, avatar_url, is_admin, approved, invite_code_used)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    v_is_first,
    v_is_first,
    v_is_first
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =====================
-- INVITATION SYSTEM
-- Run this block if you already have the tables above set up.
-- =====================

-- Add approval + invite tracking to profiles
alter table profiles add column if not exists approved boolean default false;
alter table profiles add column if not exists invite_code_used boolean default false;

-- Add currency preference (EUR default)
alter table profiles add column if not exists currency_preference text default 'EUR' check (currency_preference in ('EUR', 'USD'));

-- Admins can approve/reject any profile
create policy "Admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- =====================
-- INVITE CODES TABLE
-- =====================
create table if not exists invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  used boolean default false,
  used_by uuid references auth.users,
  created_at timestamptz default now()
);

alter table invite_codes enable row level security;

create policy "Admins can manage invite codes"
  on invite_codes for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- =====================
-- INVITE CODE FUNCTIONS
-- =====================

-- Check if a code is valid (unused)
create or replace function validate_invite_code(p_code text)
returns boolean
language sql security definer
as $$
  select exists(select 1 from invite_codes where code = p_code and used = false);
$$;

-- Consume a code and mark the profile as having used one
-- Security note: security definer bypasses RLS so this works even before email confirmation
create or replace function consume_invite_code(p_code text, p_user_id uuid)
returns boolean
language plpgsql security definer
as $$
declare
  v_count int;
begin
  update invite_codes
  set used = true, used_by = p_user_id
  where code = p_code and used = false;

  get diagnostics v_count = row_count;

  if v_count > 0 then
    update profiles set invite_code_used = true where id = p_user_id;
    return true;
  end if;

  return false;
end;
$$;
