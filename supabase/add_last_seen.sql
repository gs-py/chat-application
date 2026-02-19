-- Add last_seen_at for online status. Users update via RPC; list_profiles returns it.
-- Run this in Supabase SQL Editor. Requires: profiles table, auth.uid() from JWT.

-- 1. Add column
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- 2. RPC: update current user's last_seen_at (uses auth.uid() from JWT)
create or replace function public.update_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

-- Ensure RPC is callable by authenticated clients
grant execute on function public.update_last_seen() to authenticated;
grant execute on function public.update_last_seen() to anon;

-- RPC: clear last_seen_at on logout (call before clearing JWT)
create or replace function public.clear_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set last_seen_at = null where id = auth.uid();
end;
$$;

grant execute on function public.clear_last_seen() to authenticated;
grant execute on function public.clear_last_seen() to anon;

-- 3. Update list_profiles to include last_seen_at (drop first - return type changes)
drop function if exists public.list_profiles();
create or replace function public.list_profiles()
returns table (id uuid, username text, display_name text, avatar_url text, last_seen_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.last_seen_at
  from public.profiles p
  where p.id != auth.uid()
  order by p.username;
$$;
