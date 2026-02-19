-- Run this in Supabase SQL Editor if you get 404 on /rest/v1/rpc/sign_up
-- Requires: pgcrypto extension, and table public.profiles with columns (username, password_hash, display_name, ...)

create extension if not exists pgcrypto;

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
