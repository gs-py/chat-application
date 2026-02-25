-- Add FCM token to profiles for push notifications.
-- Run in Supabase SQL Editor. Required for Firebase push.

alter table public.profiles
  add column if not exists fcm_token text;
