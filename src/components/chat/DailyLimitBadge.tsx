import { Badge } from '@/components/ui/badge';
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
      variant={isAtLimit ? 'destructive' : 'secondary'}
      className="shrink-0 gap-1 font-normal border-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
    >
      <MessageSquare className="size-3" />
      {used} / {limit}
    </Badge>
  );
}
