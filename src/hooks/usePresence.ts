import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const HEARTBEAT_INTERVAL_MS = 15_000; // 15 seconds

/**
 * Updates the current user's last_seen_at in profiles every 15s while mounted.
 * Uses update_last_seen RPC. Run supabase/add_last_seen.sql first.
 */
export function usePresence(
  userId: string | undefined,
  onAfterUpdate?: () => void
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const tick = () => {
      supabase.rpc('update_last_seen').then(({ error }) => {
        if (error) {
          console.warn('Presence update failed:', error.message);
          return;
        }
        onAfterUpdate?.();
      });
    };

    tick();
    intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, onAfterUpdate]);
}
