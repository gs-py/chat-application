import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

type Props = {
  used: number;
  limit: number;
  loading?: boolean;
};

export function DailyLimitBadge({ used, limit, loading }: Props) {
  if (loading) return null;

  const isAtLimit = used >= limit;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 gap-1.5 font-medium border-0 text-[11px] px-2.5 py-1 rounded-full"
      )}
      style={{
        backgroundColor: isAtLimit ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.06)',
        color: isAtLimit ? 'var(--chat-accent)' : 'var(--chat-text-secondary)',
      }}
    >
      <MessageSquare className="size-3" />
      {used}/{limit}
    </Badge>
  );
}
