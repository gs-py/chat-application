import { createClient } from '@supabase/supabase-js';
import { getStoredJwt } from './auth-storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Custom fetch so REST requests use our JWT from localStorage (we never call Auth API).
 * Our login Edge Function returns a JWT; we store it and send it here so PostgREST auth.uid() works.
 * When the client passes a Request object, fetch() ignores init — so we must clone the Request with our header.
 */
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredJwt();
  if (token) {
    if (input instanceof Request) {
      const headers = new Headers(input.headers);
      headers.set('Authorization', `Bearer ${token}`);
      input = new Request(input, { headers });
    } else {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }
  }
  return fetch(input, init);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
});

export const functionsUrl = `${supabaseUrl}/functions/v1`;
