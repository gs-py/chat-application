import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_DAILY_LIMIT = 100;

export function useDailyLimit(userId: string | undefined) {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_DAILY_LIMIT);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!userId) return Promise.resolve();
    const today = new Date().toISOString().slice(0, 10);
    return Promise.all([
      supabase
        .from('daily_message_counts')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('daily_message_limit')
        .eq('id', userId)
        .maybeSingle(),
    ]).then(([countRes, profileRes]) => {
      setUsed((countRes.data as { count: number } | null)?.count ?? 0);
      setLimit(
        (profileRes.data as { daily_message_limit: number } | null)
          ?.daily_message_limit ?? DEFAULT_DAILY_LIMIT
      );
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    refetch().finally(() => setLoading(false));
  }, [userId, refetch]);

  const isAtLimit = used >= limit;

  return { used, limit, loading, isAtLimit, refetch };
}
