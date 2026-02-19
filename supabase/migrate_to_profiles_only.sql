-- Run this ONCE in Supabase SQL Editor if you already ran the old schema (auth.users-based).
-- This drops the old tables and trigger, then creates the new username+password-only profiles setup.
-- WARNING: This deletes all existing profiles, messages, and conversations.

-- Remove trigger and function that created profile from auth.users
drop trigger if exists on_auth_user_created on auth.users;  -- may fail if trigger name differs; ignore
drop function if exists public.handle_new_user();

-- Drop old tables (CASCADE removes RLS policies that depend on these tables)
drop table if exists public.daily_message_counts;
drop table if exists public.messages;
drop table if exists public.conversation_members cascade;
drop table if exists public.conversations cascade;
drop table if exists public.profiles cascade;

-- Drop the daily limit trigger function (it was on messages which we dropped)
drop function if exists public.check_daily_message_limit();

-- Now run the full new schema (copy-paste from schema.sql from "create extension" onward)
-- Or run schema.sql in a fresh project. Below is the full create part:

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text,
  avatar_url text,
  daily_message_limit integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.daily_message_counts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  count integer not null default 0,
  primary key (user_id, date)
);

create or replace function public.check_daily_message_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_limit integer;
  current_count integer;
begin
  select coalesce(p.daily_message_limit, 100) into user_limit
  from public.profiles p where p.id = new.sender_id;

  select coalesce(d.count, 0) into current_count
  from public.daily_message_counts d
  where d.user_id = new.sender_id and d.date = current_date;

  if current_count >= user_limit then
    raise exception 'Daily message limit reached (%)', user_limit;
  end if;

  insert into public.daily_message_counts (user_id, date, count)
  values (new.sender_id, current_date, 1)
  on conflict (user_id, date) do update set count = daily_message_counts.count + 1;

  return new;
end;
$$;

create trigger messages_check_daily_limit
  before insert on public.messages
  for each row execute function public.check_daily_message_limit();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.daily_message_counts enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_select_conversation_member" on public.profiles for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.user_id = profiles.id
      and exists (
        select 1 from public.conversation_members cm2
        where cm2.conversation_id = cm.conversation_id and cm2.user_id = auth.uid()
      )
    )
  );

create policy "conversations_select_member" on public.conversations for select
  using (exists (select 1 from public.conversation_members where conversation_id = id and user_id = auth.uid()));
create policy "conversations_insert" on public.conversations for insert with check (true);

create policy "conversation_members_select" on public.conversation_members for select
  using (exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_members.conversation_id and cm.user_id = auth.uid()));
create policy "conversation_members_insert" on public.conversation_members for insert with check (user_id = auth.uid());

create policy "messages_select_member" on public.messages for select
  using (exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()));
create policy "messages_insert_sender" on public.messages for insert with check (sender_id = auth.uid());

create policy "daily_message_counts_select_own" on public.daily_message_counts for select using (user_id = auth.uid());

alter publication supabase_realtime add table public.messages;

create or replace function public.sign_up(p_username text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
  uname text := lower(trim(p_username));
begin
  if length(uname) < 1 or length(p_password) < 1 then
    raise exception 'Username and password required';
  end if;
  insert into public.profiles (username, password_hash, display_name)
  values (uname, extensions.crypt(p_password, extensions.gen_salt('bf')), trim(p_username))
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.login_verify(p_username text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  profile_id uuid;
begin
  select id into profile_id
  from public.profiles
  where username = lower(trim(p_username))
    and password_hash = extensions.crypt(p_password, password_hash);
  return profile_id;
end;
$$;

create or replace function public.get_or_create_1v1_conversation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  conv_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select conversation_id into conv_id
  from public.conversation_members
  where user_id = uid
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  select cm.conversation_id into conv_id
  from public.conversation_members cm
  group by cm.conversation_id
  having count(*) = 1
  limit 1;

  if conv_id is not null then
    insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, uid);
    return conv_id;
  end if;

  insert into public.conversations default values returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, uid);
  return conv_id;
end;
$$;
