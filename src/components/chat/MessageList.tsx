import { useEffect, useRef } from 'react';
import { MessageItem, type MessageSenderProfile } from './MessageItem';
import type { Message } from '@/types/database';
import { MessageCircle } from 'lucide-react';

type Props = {
  messages: Message[];
  currentUserId: string;
  currentUserProfile: MessageSenderProfile | null;
  otherProfile: MessageSenderProfile | null;
  loading: boolean;
};

export function MessageList({
  messages,
  currentUserId,
  currentUserProfile,
  otherProfile,
  loading,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 min-h-0 animate-in fade-in duration-300">
        <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 size-8" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center min-h-0 animate-in fade-in duration-300">
        <div className="rounded-2xl bg-zinc-100/80 p-6 dark:bg-zinc-800/50">
          <MessageCircle className="size-10 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No messages yet — say hello to start
        </p>
      </div>
    );
  }

  const showAvatarAndName = (idx: number): boolean => {
    if (idx === 0) return true;
    return messages[idx].sender_id !== messages[idx - 1].sender_id;
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch">
      <div className="flex flex-col py-4">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            profile={
              msg.sender_id === currentUserId
                ? currentUserProfile
                : otherProfile
            }
            isOwn={msg.sender_id === currentUserId}
            showName={showAvatarAndName(idx)}
            animationDelay={idx >= messages.length - 4 ? (messages.length - 1 - idx) * 40 : 0}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
