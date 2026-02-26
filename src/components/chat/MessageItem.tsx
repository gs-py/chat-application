import { cn } from '@/lib/utils';
import type { Message } from '@/types/database';
import { Reply } from 'lucide-react';

export type MessageSenderProfile = {
  display_name: string | null;
  username: string;
  avatar_url?: string | null;
};

export type RepliedToMessage = {
  id: string;
  content: string;
  senderDisplayName: string;
};

type Props = {
  message: Message;
  profile: MessageSenderProfile | null;
  isOwn: boolean;
  repliedTo?: RepliedToMessage | null;
  showName?: boolean;
  animationDelay?: number;
  onReply?: (message: Message) => void;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const REPLY_SNIPPET_MAX = 80;

/** Matches http/https URLs; trailing punctuation is trimmed when linking */
const URL_REGEX = /https?:\/\/[^\s]+/g;

type TextPart = { type: 'text'; value: string };
type LinkPart = { type: 'link'; url: string };
type ContentPart = TextPart | LinkPart;

function linkify(text: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    const url = raw.replace(/[.,;:!?)]+$/, '');
    if (url.startsWith('http://') || url.startsWith('https://')) {
      parts.push({ type: 'link', url });
    } else {
      parts.push({ type: 'text', value: raw });
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: 'text', value: text }];
}

export function MessageItem({
  message,
  profile,
  isOwn,
  repliedTo,
  showName = true,
  animationDelay = 0,
  onReply,
}: Props) {
  const name = isOwn
    ? (profile?.display_name ?? profile?.username ?? 'You')
    : (profile?.display_name ?? profile?.username ?? 'Chat');

  const snippet =
    repliedTo?.content.length && repliedTo.content.length > REPLY_SNIPPET_MAX
      ? repliedTo.content.slice(0, REPLY_SNIPPET_MAX) + '…'
      : repliedTo?.content ?? '';

  return (
    <div
      className={cn(
        'flex px-4 sm:px-5',
        isOwn ? 'justify-end' : 'justify-start',
        showName ? 'pt-3' : 'pt-[2px]',
        'animate-msg-in',
        onReply && 'cursor-pointer group/msg'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onReply?.(message)}
      role={onReply ? 'button' : undefined}
      tabIndex={onReply ? 0 : undefined}
      onKeyDown={(e) => {
        if (onReply && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onReply(message);
        }
      }}
    >
      <div
        className={cn(
          'flex flex-col max-w-[80%] sm:max-w-[65%] min-w-0 relative',
          isOwn && 'items-end'
        )}
      >
        {/* Sender name */}
        {showName && !isOwn && (
          <span
            className="text-[12px] font-semibold mb-1 px-1"
            style={{ color: 'var(--chat-text-secondary)' }}
          >
            {name}
          </span>
        )}

        {/* Bubble */}
        <div
          className="rounded-[20px] px-[14px] py-[10px] text-[14.5px] leading-[1.4] relative"
          style={{
            backgroundColor: isOwn ? 'var(--chat-bubble-out)' : 'var(--chat-bubble-in)',
            color: isOwn ? 'var(--chat-bubble-out-text)' : 'var(--chat-bubble-in-text)',
            boxShadow: 'var(--chat-shadow-bubble)',
            borderBottomRightRadius: isOwn ? '6px' : undefined,
            borderBottomLeftRadius: !isOwn ? '6px' : undefined,
          }}
        >
          {/* Reply indicator */}
          {repliedTo && (
            <div
              className="flex gap-2 mb-2 pl-2.5 py-2 pr-3 rounded-xl border-l-[3px] -mx-1"
              style={{
                borderLeftColor: isOwn ? 'rgba(255,255,255,0.5)' : 'var(--chat-accent)',
                backgroundColor: isOwn ? 'rgba(255,255,255,0.12)' : 'var(--chat-accent-light)',
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-semibold truncate"
                  style={{ color: isOwn ? 'rgba(255,255,255,0.85)' : 'var(--chat-accent)' }}
                >
                  {repliedTo.senderDisplayName}
                </p>
                <p
                  className="text-[12px] line-clamp-2 break-words mt-0.5"
                  style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--chat-text-muted)' }}
                >
                  {snippet}
                </p>
              </div>
            </div>
          )}

          {/* Image attachment */}
          {message.image_url && (
            <a
              href={message.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden mb-2 max-w-[260px] sm:max-w-[280px] focus:outline-none focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={message.image_url}
                alt=""
                className="w-full h-auto max-h-64 object-cover"
              />
            </a>
          )}

          {/* Message text (links open in new tab) */}
          {message.content ? (
            <p className="whitespace-pre-wrap break-words">
              {linkify(message.content).map((part, i) =>
                part.type === 'link' ? (
                  <a
                    key={i}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium focus:outline-none focus:ring-2 rounded px-0.5"
                    style={{
                      color: isOwn ? 'rgba(255,255,255,0.95)' : 'var(--chat-accent)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part.url}
                  </a>
                ) : (
                  <span key={i}>{part.value}</span>
                )
              )}
            </p>
          ) : null}

          {/* Timestamp */}
          <div className="flex items-center justify-end mt-1 -mb-0.5">
            <span
              className="text-[11px] leading-none"
              style={{ color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--chat-text-muted)' }}
            >
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Reply hint on hover */}
        {onReply && (
          <div
            className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150"
            style={{
              [isOwn ? 'left' : 'right']: '-30px',
            }}
          >
            <div
              className="size-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--chat-surface)', boxShadow: 'var(--chat-shadow-md)' }}
            >
              <Reply className="size-3.5" style={{ color: 'var(--chat-text-muted)' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
