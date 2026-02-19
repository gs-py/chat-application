import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function useProfiles() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

    return () => {
      cancelled = true;
    };
  }, []);

  return { profiles, loading, error };
}
