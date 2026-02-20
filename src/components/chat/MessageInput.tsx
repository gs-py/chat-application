import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

type Props = {
  onSend: (content: string) => Promise<void>;
  disabled: boolean;
  placeholder?: string;
};

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Type a message…',
}: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setValue('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-3 sm:p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-200 bg-white shrink-0 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 rounded-xl border-zinc-200 bg-zinc-100 px-4 py-4 sm:py-5 text-base sm:text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-visible:ring-zinc-500 dark:focus-visible:border-zinc-500"
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim() || sending}
        className="shrink-0 size-11 min-w-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900 text-zinc-100 touch-manipulation transition-colors duration-200"
      >
        <Send className="size-5" strokeWidth={2} />
      </Button>
    </form>
  );
}
