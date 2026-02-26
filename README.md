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

- **Online status:** run `supabase/add_last_seen.sql` to add `last_seen_at`, the `update_last_seen` RPC, and show online indicators in the sidebar and chat header.

- **Push notifications (optional):** run `supabase/add_fcm_push.sql` to add `fcm_token` to profiles. Then configure Firebase and the `send-push` Edge Function (see Push notifications below).

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

### Checking Supabase logs and issues

Use the **Supabase Dashboard** to inspect logs and debug issues (no MCP required):

1. **Log in:** [Supabase Dashboard](https://supabase.com/dashboard) → select your project.

2. **API / PostgREST logs** (401s, RPC failures, table access):
   - **Logs** (left sidebar) → **API**.
   - Filter by time range; look for failed requests (red / 4xx). Check **path** (e.g. `/rest/v1/...`, `/rpc/list_profiles`, `/rpc/login_verify`) and **status code** (401 = auth, 403 = RLS, 500 = server error).

3. **Edge Function logs** (login, send-push):
   - **Logs** → **Edge Functions**.
   - Select the function (e.g. `login`, `send-push`). Check **status** (success/fail), **duration**, and the **payload** / **logs** for errors (e.g. `JWT_SECRET` missing, FCM errors).

4. **Database / Postgres logs:**
   - **Logs** → **Postgres** (if available) for DB errors, slow queries, or trigger failures.

5. **Common issues from logs:**
   - **401 on `/rest/v1/*` or `/rpc/*` after login** → JWT secret mismatch (see “Troubleshooting: 401” above).
   - **Edge Function 500** → Check **Secrets** (e.g. `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`) and the function’s own log output.
   - **Timeout / “something went wrong”** → Often network (e.g. mobile data). Check browser console for `[Supabase] Request failed: timeout`; see “Works on WiFi but not on mobile data”.

### Works on WiFi but not on mobile data

If the app works on WiFi but Supabase requests fail on mobile (cellular) data, the **mobile carrier** may be blocking or throttling Supabase’s domain.

- **Check the error:** In the browser console you’ll see `[Supabase] Network request failed: …` with the error (e.g. `Failed to fetch`, timeout). That confirms the request never reaches Supabase.
- **Try a VPN** on the same device over mobile data; if it works, the carrier is likely blocking or restricting the connection.
- **Deploy the app over HTTPS** (e.g. Vercel, Netlify) and test on mobile data; some carriers treat HTTPS differently.
- There is nothing in the app code that behaves differently on WiFi vs mobile; the backend is the same. The issue is network/carrier between the device and Supabase.

## Push notifications (optional)

To receive push notifications and vibration/haptics when a new message arrives:

1. **Firebase project** – Create a project in [Firebase Console](https://console.firebase.google.com), enable Cloud Messaging, and add a Web app. Copy the config and VAPID key.

2. **Environment** – Add to `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_VAPID_KEY=...
   ```

3. **Database** – Run `supabase/add_fcm_push.sql` to add `fcm_token` to `profiles`.

4. **Service worker** – Run `npm run generate-firebase-sw` (or `npm run dev` / `npm run build` which run it automatically).

5. **Edge Functions** – Create a service account in Firebase, download the JSON, then:
   ```bash
   supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   supabase functions deploy send-push
   ```

6. **Database Webhook** – In Supabase Dashboard → Database → Webhooks, create a webhook: on `messages` INSERT, POST to the `send-push` Edge Function.

7. In the app, tap the bell icon to enable notifications. New messages trigger vibration (where supported) and push notifications when the app is in the background.

## Testing messages

To confirm messages are sent and received:

1. **Start the app:** `npm run dev` and open the URL (e.g. http://localhost:5173).

2. **Two users:** In a normal window, sign up or log in as **User A**. In an incognito/private window (or another browser), sign up or log in as **User B**.

3. **Open chat:** In both windows, select the other user from the conversation list so you’re in the same 1:1 chat.

4. **Send a message:** From User B’s window, type a message and send. It should appear in both windows (and in User A’s window without refresh, via Realtime or polling).

5. **Reply the other way:** Send a message from User A; it should show up for User B.

If messages don’t appear, check the browser console for errors and ensure Supabase env vars (`.env`) and the `messages` table/RLS are set up (see Setup above).

## Testing push notifications

To confirm the notification module works:

1. **Setup** – Complete the [Push notifications](#push-notifications-optional) steps (Firebase, `fcm_token`, `send-push` deployed, same secrets).

2. **Enable in app** – Log in, tap the **bell** in the header, and allow notifications when prompted.

3. **Test real message** – With two users, send a message from one; the other should get a push when the app is in the background (and vibration + toast when in the foreground).

**“Push service error” or “Registration failed”:** The app must run over **HTTPS** or **localhost**. Open it at `https://your-domain.com` or `http://localhost:5173` (not `http://192.168.x.x`). In [Firebase Console](https://console.firebase.google.com) → Project settings → Cloud Messaging → **Web Push certificates**, ensure the VAPID key pair matches the one in your app (or in `.env` as `VITE_FIREBASE_VAPID_KEY`). If you generated a new key in Firebase, copy it into the app and reload.

## Features

- **Username + password only:** Stored in the `profiles` table (password hashed with bcrypt in DB). No email, no Supabase Auth, no OAuth.
- **1:1 chat:** One conversation; the second user joins the first user’s conversation.
- **Daily message limit:** Enforced in the DB (default 100 per user). Shown in the header; send is disabled when at limit.
- **Realtime:** New messages appear without refresh.
- **Vibration and haptics:** Device vibrates when a new message arrives from another user (Android; limited on iOS).
- **Push notifications:** Firebase Cloud Messaging for alerts when the app is in the background (optional).
