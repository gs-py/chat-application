// Login with username + password. Calls login_verify RPC, returns a JWT so the client can use setSession.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as jose from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Must match Project Settings → API → JWT Secret exactly, or PostgREST will return 401 on every request.
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is not set. Set it in Dashboard → Edge Functions → Secrets to the exact value from Project Settings → API → JWT Secret."
      );
      return new Response(
        JSON.stringify({
          error:
            "Server configuration error. Set Edge Function secret JWT_SECRET to Project Settings → API → JWT Secret.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profileId, error: rpcError } = await supabase.rpc(
      "login_verify",
      { p_username: username.trim(), p_password: password }
    );

    if (rpcError || !profileId) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
    const token = await new jose.SignJWT({ role: "authenticated" })
      .setSubject(profileId)
      .setIssuedAt()
      .setExpirationTime(exp)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .sign(secret);

    return new Response(
      JSON.stringify({ access_token: token, refresh_token: token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Login failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
