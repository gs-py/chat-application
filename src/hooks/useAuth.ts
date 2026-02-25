import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getStoredJwt,
  setStoredJwt,
  clearStoredJwt,
  decodeJwtPayload,
} from '@/lib/auth-storage';

/** Minimal user for our custom JWT (no Auth API). */
export type AppUser = { id: string };

function userFromJwt(token: string): AppUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;
  if (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000)) {
    clearStoredJwt();
    return null;
  }
  return { id: payload.sub };
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredJwt();
    if (token) {
      setUser(userFromJwt(token));
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signUp = async (username: string, password: string) => {
    const { data, error } = await supabase.rpc('sign_up', {
      p_username: username.trim(),
      p_password: password,
    });
    if (error) {
      // Username already taken
      if (error.code === '23505' || (error as { status?: number }).status === 409) {
        try {
          await signIn(username, password);
          return;
        } catch {
          throw new Error('This username is already taken. Try signing in, or choose a different username.');
        }
      }
      throw new Error('Something went wrong. Please try again in a moment.');
    }
    if (!data) throw new Error('Something went wrong. Please try again.');
    await signIn(username, password);
  };

  const signIn = async (username: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('login', {
      body: { username: username.trim(), password },
    });
    const body = data as { access_token?: string; refresh_token?: string; error?: string } | null;
    const serverMessage = body?.error;

    if (error) {
      // Prefer server message when present (e.g. 401/400 response body)
      throw new Error(serverMessage ?? 'Something went wrong. Please try again.');
    }
    if (!body?.access_token) {
      throw new Error(serverMessage ?? 'Something went wrong. Please try again.');
    }
    setStoredJwt(body.access_token);
    const u = userFromJwt(body.access_token);
    if (u) setUser(u);
  };

  const signOut = async () => {
    try {
      await supabase.rpc('clear_last_seen');
    } catch {
      // Ignore - JWT may already be invalid
    } finally {
      clearStoredJwt();
      setUser(null);
    }
  };

  return { user, loading, signUp, signIn, signOut };
}
