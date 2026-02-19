import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
};

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Date.now() - t < ONLINE_THRESHOLD_MS;
}

export function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Never';
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < 60_000) return 'Just now';
  if (ms < ONLINE_THRESHOLD_MS) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  return `${Math.floor(ms / 86400_000)}d ago`;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('list_profiles');
    if (rpcError) {
      setError(rpcError as Error);
      return;
    }
    setProfiles((data as PublicProfile[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: rpcError } = await supabase.rpc('list_profiles');
      if (rpcError) {
        if (!cancelled) setError(rpcError as Error);
        return;
      }
      if (!cancelled) setProfiles((data as PublicProfile[]) ?? []);
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    const interval = setInterval(load, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { profiles, loading, error, refetch };
}
