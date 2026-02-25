// Sends FCM push when a new message is inserted. Invoked by Database Webhook.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as jose from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getAccessToken(sa: {
  client_email: string;
  private_key: string;
  project_id: string;
}): Promise<string> {
  const jwt = await new jose.SignJWT({})
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setSubject(sa.client_email)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(await jose.importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function sendFCM(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data ?? {},
          webpush: { fcm_options: { link: "/" } },
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FCM error: ${res.status} ${err}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as {
      type?: string;
      table?: string;
      record?: { conversation_id: string; sender_id: string; content: string };
    };
    if (payload.type !== "INSERT" || payload.table !== "messages" || !payload.record) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, sender_id, content } = payload.record;
    const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: members } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversation_id);
    const recipientId = members?.find((m) => m.user_id !== sender_id)?.user_id;
    if (!recipientId) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipient } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", recipientId)
      .single();
    const fcmToken = recipient?.fcm_token;
    if (!fcmToken) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sender } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", sender_id)
      .single();
    const senderName = sender?.display_name || sender?.username || "Someone";

    const sa = JSON.parse(saJson) as {
      client_email: string;
      private_key: string;
      project_id: string;
    };
    const accessToken = await getAccessToken(sa);
    await sendFCM(
      accessToken,
      sa.project_id,
      fcmToken,
      senderName,
      content?.slice(0, 100) || "New message",
      { conversation_id, sender_id }
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
