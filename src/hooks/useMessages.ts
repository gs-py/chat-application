import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { vibrateNewMessage } from '@/lib/haptics';
import type { Message } from '@/types/database';

export function useMessages(conversationId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      knownIdsRef.current.clear();
      return;
    }

    knownIdsRef.current.clear();
    const fetch = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      const list = (error ? [] : (data as Message[])) ?? [];
      list.forEach((m) => knownIdsRef.current.add(m.id));
      setMessages(list);
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (userId && newMsg.sender_id !== userId) vibrateNewMessage();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (!data?.length) return;
          const fresh = data as Message[];
          setMessages((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            fresh.forEach((m) => {
              const isNew = !knownIdsRef.current.has(m.id);
              if (isNew && userId && m.sender_id !== userId) vibrateNewMessage();
              knownIdsRef.current.add(m.id);
              byId.set(m.id, m);
            });
            return [...byId.values()].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        });
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (
    content: string,
    replyToId?: string | null,
    imageUrl?: string | null
  ) => {
    if (!userId || !conversationId) return;
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content: trimmed,
      reply_to_id: replyToId ?? null,
      image_url: imageUrl ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: trimmed || '',
        reply_to_id: replyToId ?? null,
        image_url: imageUrl ?? null,
      })
      .select('*')
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw error;
    }
    if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data as Message) : m))
      );
    }
  };

  return { messages, loading, sendMessage };
}
