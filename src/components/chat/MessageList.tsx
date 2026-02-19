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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 min-h-0">
        <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 size-10" />
        <p className="text-sm font-medium">Loading messages…</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center min-h-0">
        <div className="rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
          <MessageCircle className="size-12 text-zinc-400 dark:text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No messages yet
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Say hello to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="flex flex-col py-4">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            profile={
              msg.sender_id === currentUserId
                ? currentUserProfile
                : otherProfile
            }
            isOwn={msg.sender_id === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
