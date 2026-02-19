/**
 * Custom JWT storage so we never call Supabase Auth API (which returns 403 for our custom JWT).
 * Our login Edge Function returns a JWT signed with JWT_SECRET; we store it and send it with REST only.
 */

const STORAGE_KEY = 'chat_app_jwt';

export function getStoredJwt(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredJwt(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredJwt(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Decode JWT payload without verifying (we only need sub and exp on the client). */
export function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as { sub?: string; exp?: number };
  } catch {
    return null;
  }
}

export function getUserIdFromStoredJwt(): string | null {
  const token = getStoredJwt();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;
  if (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000)) {
    clearStoredJwt();
    return null;
  }
  return payload.sub;
}
