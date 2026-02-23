-- Image support for chat: message.image_url + storage bucket chat-images.
-- Run in Supabase SQL Editor or apply via MCP.

-- 1. Add image_url to messages
alter table public.messages add column if not exists image_url text;

-- 2. Create storage bucket (5MB limit, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  public = true;

-- 3. RLS: authenticated users can upload
create policy "chat_images_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'chat-images');

-- 4. RLS: authenticated users can read
create policy "chat_images_select"
on storage.objects for select to authenticated
using (bucket_id = 'chat-images');

-- 5. RLS: authenticated users can delete
create policy "chat_images_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'chat-images');
