import { useEffect, useRef } from 'react';
import { MessageItem, type MessageSenderProfile, type RepliedToMessage } from './MessageItem';
import type { Message } from '@/types/database';
import { MessageCircle } from 'lucide-react';

type Props = {
  messages: Message[];
  currentUserId: string;
  currentUserProfile: MessageSenderProfile | null;
  otherProfile: MessageSenderProfile | null;
  loading: boolean;
  onReply?: (message: Message) => void;
};

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

export function MessageList({
  messages,
  currentUserId,
  currentUserProfile,
  otherProfile,
  loading,
  onReply,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const messageById = useRef<Map<string, Message>>(new Map());
  messageById.current = new Map(messages.map((m) => [m.id, m]));

  const getRepliedTo = (msg: Message): RepliedToMessage | null => {
    if (!msg.reply_to_id) return null;
    const replied = messageById.current.get(msg.reply_to_id);
    if (!replied) return null;
    const isOwnReply = replied.sender_id === currentUserId;
    const senderName = isOwnReply
      ? (currentUserProfile?.display_name ?? currentUserProfile?.username ?? 'You')
      : (otherProfile?.display_name ?? otherProfile?.username ?? 'Chat');
    return {
      id: replied.id,
      content: replied.content,
      senderDisplayName: senderName,
    };
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNewMessage = messages.length > prevMessageCountRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 150;

    // Auto-scroll only if user is near bottom or a new message just arrived
    if (isNearBottom || isNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'auto' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-0 animate-in fade-in duration-300">
        <div
          className="animate-pulse rounded-full size-8"
          style={{ backgroundColor: 'var(--chat-accent)', opacity: 0.15 }}
        />
        <p className="text-[13px] font-medium" style={{ color: 'var(--chat-text-muted)' }}>Loading messages…</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center min-h-0 animate-in fade-in duration-300">
        <div
          className="rounded-3xl p-5"
          style={{ backgroundColor: 'var(--chat-accent-light)' }}
        >
          <MessageCircle className="size-10" style={{ color: 'var(--chat-accent)', opacity: 0.5 }} />
        </div>
        <p className="text-[14px]" style={{ color: 'var(--chat-text-muted)' }}>
          No messages yet — say hello!
        </p>
      </div>
    );
  }

  const showAvatarAndName = (idx: number): boolean => {
    if (idx === 0) return true;
    return messages[idx].sender_id !== messages[idx - 1].sender_id;
  };

  const needsDateSeparator = (idx: number): boolean => {
    if (idx === 0) return true;
    return !isSameDay(messages[idx].created_at, messages[idx - 1].created_at);
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch">
      <div className="flex flex-col py-4 pb-3">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            {/* Date separator */}
            {needsDateSeparator(idx) && (
              <div className="flex justify-center py-3">
                <span className="chat-date-pill">
                  {formatDateLabel(msg.created_at)}
                </span>
              </div>
            )}
            <MessageItem
              message={msg}
              profile={
                msg.sender_id === currentUserId
                  ? currentUserProfile
                  : otherProfile
              }
              isOwn={msg.sender_id === currentUserId}
              repliedTo={getRepliedTo(msg)}
              showName={showAvatarAndName(idx)}
              animationDelay={idx >= messages.length - 4 ? (messages.length - 1 - idx) * 40 : 0}
              onReply={onReply}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
