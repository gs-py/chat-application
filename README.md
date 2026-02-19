# Chat Application

1:1 chat app with username + password stored only in the `profiles` table. No email, no Supabase Auth, no OAuth. Built with React, Vite, Tailwind, shadcn/ui, and Supabase.

## Setup

### 1. Environment

Copy `.env.example` to `.env` and set your Supabase project URL and anon key:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase database

In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor:

- **New project:** run the full contents of `supabase/schema.sql`.
- **Existing project (already ran the old auth-based schema):** run the full contents of `supabase/migrate_to_profiles_only.sql` instead.

This gives you: `profiles` (username + password_hash), `conversations`, `conversation_members`, `messages`, `daily_message_counts`, RLS, daily-limit trigger, and RPCs `sign_up`, `login_verify`, `get_or_create_1v1_conversation`.

### 3. Login Edge Function and secret

Login uses a Supabase Edge Function that checks username/password and returns a JWT.

1. **Set the JWT secret (required for API access)**  
   The login function signs JWTs with `JWT_SECRET`. PostgREST verifies requests using your project’s **JWT Secret**. They must be the same or every REST request will return **401 Unauthorized**.
   - In Supabase Dashboard go to **Project Settings → API** and copy the **JWT Secret**.
   - Go to **Edge Functions → Secrets** and add a secret named **`JWT_SECRET`** with that exact value (no extra spaces).

2. **Deploy the login function**  
   From the project root (with [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in):

   ```bash
   supabase functions deploy login
   ```

   If the function must be callable with only the anon key (no user JWT), deploy with:

   ```bash
   supabase functions deploy login --no-verify-jwt
   ```

   (Or use `supabase/config.toml` with `[functions.login] verify_jwt = false` and deploy normally.)

### 4. Run the app

```bash
npm install
npm run dev
```

Sign up with a username and password, then in another browser (or incognito) sign up with a second user. Both share the same 1:1 conversation.

### Troubleshooting: 401 on every route after login

If Supabase API logs show **401** for `/rest/v1/profiles`, `/rest/v1/rpc/list_profiles`, etc. after you log in, the token is being rejected because the login function is signing JWTs with a different secret than your project uses.

**Option A – You can copy the project JWT secret**

1. In Supabase Dashboard open **Project Settings → API** and copy the **JWT Secret**.
2. Open **Edge Functions → Secrets** and set **`JWT_SECRET`** to that exact value (create it if it doesn’t exist).
3. Redeploy the login function: `supabase functions deploy login --no-verify-jwt`.
4. Log out in the app, then log in again so a new token is issued.

**Option B – You can’t copy the project JWT secret (use your own)**

1. Generate a secret: `node scripts/generate-jwt-secret.mjs`
2. Copy the printed value and use it in **both** places:
   - **Project Settings → API** → **Change Legacy Secret** → **Create my own secret** → paste the value and confirm.
   - **Edge Functions → Secrets** → add or edit **`JWT_SECRET`** with the same value.
3. Redeploy: `supabase functions deploy login --no-verify-jwt`
4. Log out and log in again in the app.

Note: After changing the legacy secret, Supabase may show new anon/service_role keys. If the app stops working, copy the new **anon (public)** key from Project Settings → API into your `.env` as `VITE_SUPABASE_ANON_KEY`.

## Features

- **Username + password only:** Stored in the `profiles` table (password hashed with bcrypt in DB). No email, no Supabase Auth, no OAuth.
- **1:1 chat:** One conversation; the second user joins the first user’s conversation.
- **Daily message limit:** Enforced in the DB (default 100 per user). Shown in the header; send is disabled when at limit.
- **Realtime:** New messages appear without refresh.
