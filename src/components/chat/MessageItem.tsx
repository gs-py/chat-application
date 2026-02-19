import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageItem({ message, profile, isOwn }: Props) {
  const name = profile?.display_name ?? profile?.username ?? 'Unknown';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2',
        isOwn && 'flex-row-reverse'
      )}
    >
      <Avatar className="size-9 shrink-0 ring-2 ring-zinc-100 dark:ring-zinc-800">
        {profile?.avatar_url && (
          <AvatarImage src={profile.avatar_url} alt="" />
        )}
        <AvatarFallback className="text-xs font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'flex flex-col max-w-[78%] min-w-0',
          isOwn && 'items-end'
        )}
      >
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5 px-0.5">
          {name}
        </span>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
            isOwn
              ? 'bg-emerald-600 text-white rounded-br-md dark:bg-emerald-500'
              : 'bg-white text-zinc-800 rounded-bl-md border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
          )}
        >
          <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
            {message.content}
          </p>
        </div>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-0.5">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
