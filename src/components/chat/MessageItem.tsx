import type { ReactNode } from 'react';
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
  onScrollToMessage?: (messageId: string) => void;
  highlighted?: boolean;
  searchQuery?: string;
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

function highlightText(text: string, query: string | undefined): ReactNode {
  if (!query?.trim()) return text;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {highlightText(text.slice(idx + q.length), query)}
    </>
  );
}

export function MessageItem({
  message,
  profile,
  isOwn,
  repliedTo,
  showName = true,
  animationDelay = 0,
  onReply,
  onScrollToMessage,
  highlighted,
  searchQuery,
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
      id={`msg-${message.id}`}
      className={cn(
        'flex px-4 sm:px-5 transition-colors duration-300',
        isOwn ? 'justify-end' : 'justify-start',
        showName ? 'pt-3' : 'pt-[2px]',
        'animate-msg-in',
        onReply && 'cursor-pointer group/msg',
        highlighted && 'bg-blue-500/10'
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
          className={cn(
            'px-[14px] py-[10px] text-[14.5px] leading-[1.4] relative transition-shadow duration-200',
            isOwn ? 'bubble-glass-out' : 'bubble-glass-in'
          )}
          style={{
            borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          }}
        >
          {/* Reply indicator */}
          {repliedTo && (
            <div
              className="flex gap-2 mb-2 pl-2.5 py-2 pr-3 rounded-xl border-l-[3px] -mx-1 cursor-pointer hover:brightness-125 transition-all duration-150"
              style={{
                borderLeftColor: isOwn ? 'rgba(96,165,250,0.6)' : 'var(--chat-accent)',
                backgroundColor: isOwn ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onScrollToMessage?.(repliedTo.id);
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-semibold truncate"
                  style={{ color: isOwn ? 'rgba(96,165,250,0.9)' : 'var(--chat-accent)' }}
                >
                  {repliedTo.senderDisplayName}
                </p>
                <p
                  className="text-[12px] line-clamp-2 break-words mt-0.5"
                  style={{ color: 'var(--chat-text-muted)' }}
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
                      color: isOwn ? '#93c5fd' : '#60a5fa',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {searchQuery ? highlightText(part.url, searchQuery) : part.url}
                  </a>
                ) : (
                  <span key={i}>{searchQuery ? highlightText(part.value, searchQuery) : part.value}</span>
                )
              )}
            </p>
          ) : null}

          {/* Timestamp */}
          <div className="flex items-center justify-end mt-1 -mb-0.5">
            <span
              className="text-[11px] leading-none"
              style={{ color: isOwn ? 'rgba(148,163,184,0.6)' : 'var(--chat-text-muted)' }}
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
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', boxShadow: '0 0 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Reply className="size-3.5" style={{ color: 'var(--chat-text-secondary)' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
