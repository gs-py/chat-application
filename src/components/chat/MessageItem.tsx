import { cn } from '@/lib/utils';
import type { Message } from '@/types/database';

export type MessageSenderProfile = {
  display_name: string | null;
  username: string;
  avatar_url?: string | null;
};

type Props = {
  message: Message;
  profile: MessageSenderProfile | null;
  isOwn: boolean;
  /** Show name for first message in consecutive group */
  showName?: boolean;
  /** Animation delay in ms */
  animationDelay?: number;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageItem({ message, profile, isOwn, showName = true, animationDelay = 0 }: Props) {
  const name = isOwn
    ? (profile?.display_name ?? profile?.username ?? 'You')
    : (profile?.display_name ?? profile?.username ?? 'Chat');

  return (
    <div
      className={cn(
        'flex px-3 sm:px-4 py-1.5 sm:py-2',
        isOwn && 'justify-end',
        'animate-in fade-in duration-200 fill-mode-both'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className={cn(
          'flex flex-col max-w-[85%] sm:max-w-[75%] min-w-0',
          isOwn && 'items-end'
        )}
      >
        {showName && !isOwn && (
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 mb-1 px-1">
            {name}
          </span>
        )}
        <div
          className={cn(
            'group rounded-2xl px-3.5 py-2.5 text-sm',
            'transition-all duration-200',
            isOwn
              ? 'bg-zinc-800 text-zinc-100 rounded-br-md dark:bg-zinc-200 dark:text-zinc-900'
              : 'bg-zinc-100 text-zinc-900 rounded-bl-md dark:bg-zinc-800/80 dark:text-zinc-100 dark:border dark:border-zinc-700/50'
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          <div className="flex justify-end mt-1">
            <span
              className={cn(
                'text-[10px] opacity-60',
                isOwn ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
