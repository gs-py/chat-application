import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

type ConversationWithOther = {
  conversationId: string;
  otherProfile: Profile | null;
};

export function useConversation(
  userId: string | undefined,
  otherUserId: string | undefined
) {
  const [data, setData] = useState<ConversationWithOther | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!otherUserId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const { data: convId, error: rpcError } = await supabase.rpc(
        'get_or_create_1v1_conversation_with',
        { p_other_user_id: otherUserId }
      );

      if (rpcError) {
        if (!cancelled) setError(rpcError as Error);
        return;
      }

      const conversationId = convId as string | null;
      if (!conversationId) {
        if (!cancelled) setData({ conversationId: '', otherProfile: null });
        return;
      }

      const { data: otherMembers, error: otherError } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', userId);

      if (otherError || !otherMembers?.[0]) {
        if (!cancelled)
          setData({ conversationId, otherProfile: null });
        return;
      }

      const otherId = otherMembers[0].user_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', otherId)
        .single();

      if (!cancelled)
        setData({
          conversationId,
          otherProfile: profile as Profile | null,
        });
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, otherUserId]);

  return { ...data, loading, error };
}
