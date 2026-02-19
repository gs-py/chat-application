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
      // 409 / 23505 = username already taken → try logging in instead
      if (error.code === '23505' || (error as { status?: number }).status === 409) {
        try {
          await signIn(username, password);
          return;
        } catch {
          throw new Error('Username already taken. Try logging in or choose a different username.');
        }
      }
      throw error;
    }
    if (!data) throw new Error('Sign up failed');
    await signIn(username, password);
  };

  const signIn = async (username: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('login', {
      body: { username: username.trim(), password },
    });
    if (error) throw new Error(error.message ?? 'Login failed');
    const body = data as { access_token?: string; refresh_token?: string; error?: string } | null;
    if (!body?.access_token) throw new Error(body?.error ?? 'Login failed');
    setStoredJwt(body.access_token);
    const u = userFromJwt(body.access_token);
    if (u) setUser(u);
  };

  const signOut = async () => {
    clearStoredJwt();
    setUser(null);
  };

  return { user, loading, signUp, signIn, signOut };
}
