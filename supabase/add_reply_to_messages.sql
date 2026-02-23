-- Add reply-to (quote) support: link a message to the one it replies to.
-- Applied via Supabase MCP or run in SQL Editor.

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
