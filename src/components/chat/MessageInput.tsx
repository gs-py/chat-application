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
      className="flex gap-2 p-4 border-t border-zinc-200 bg-white shrink-0 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-full border-zinc-200 bg-zinc-50 px-4 py-5 text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim() || sending}
        className="shrink-0 size-11 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        <Send className="size-5" />
      </Button>
    </form>
  );
}
