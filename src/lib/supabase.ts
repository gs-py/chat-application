import { createClient } from '@supabase/supabase-js';
import { getStoredJwt } from './auth-storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const supabaseUrlForLog = import.meta.env.VITE_SUPABASE_URL ?? '';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

/**
 * Custom fetch: JWT in header, timeout, one retry on failure, and dev logging.
 * Helps on slow or flaky networks (e.g. mobile data).
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
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  function doFetch(): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const req =
      input instanceof Request
        ? new Request(input, { signal: controller.signal })
        : input;
    const opts =
      input instanceof Request
        ? undefined
        : { ...init, signal: controller.signal };
    return fetch(req, opts).finally(() => clearTimeout(timeoutId));
  }

  return doFetch().catch((err) => {
    const isTimeout = err?.name === 'AbortError';
    const isNetwork =
      err?.message === 'Failed to fetch' ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('Load failed');
    if (import.meta.env.DEV && supabaseUrlForLog && url.includes(supabaseUrlForLog)) {
      console.warn('[Supabase] Request failed:', isTimeout ? 'timeout' : err?.message ?? err, '| URL:', url);
    }
    if (MAX_RETRIES > 0 && (isTimeout || isNetwork)) {
      return doFetch();
    }
    throw err;
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: customFetch },
});

export const functionsUrl = `${supabaseUrl}/functions/v1`;
