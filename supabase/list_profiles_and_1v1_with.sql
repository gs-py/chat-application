-- List other profiles (id, username, display_name, avatar_url) for authenticated user.
-- Excludes current user. Used for "select user to chat" list.
create or replace function public.list_profiles()
returns table (id uuid, username text, display_name text, avatar_url text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where p.id != auth.uid()
  order by p.username;
$$;

-- Get or create 1:1 conversation between current user and given user id.
create or replace function public.get_or_create_1v1_conversation_with(p_other_user_id uuid)
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
  if p_other_user_id is null or p_other_user_id = uid then
    raise exception 'Invalid other user';
  end if;

  -- existing conversation with exactly these two members
  select c.id into conv_id
  from public.conversations c
  where exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = c.id and cm.user_id = uid
  )
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = c.id and cm.user_id = p_other_user_id
  )
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations default values returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, uid), (conv_id, p_other_user_id);
  return conv_id;
end;
$$;
