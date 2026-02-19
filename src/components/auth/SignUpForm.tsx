import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  onSuccess: () => void;
  onLoginClick: () => void;
  signUp: (username: string, password: string) => Promise<unknown>;
};

export function SignUpForm({ onSuccess, onLoginClick, signUp }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60',
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20',
        'animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both'
      )}
    >
      <div className="px-8 pt-10 pb-8 md:px-12 md:pt-12 md:pb-10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-2xl">
          Create account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Choose a username and password
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div
              role="alert"
              className={cn(
                'rounded-lg border border-red-200/80 dark:border-red-900/50',
                'bg-red-50/80 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300',
                'animate-in fade-in slide-in-from-top-1 duration-300'
              )}
            >
              {error}
            </div>
          )}

          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:50ms]">
            <label
              htmlFor="signup-username"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Username
            </label>
            <Input
              id="signup-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className={cn(
                'h-12 md:h-11 rounded-xl border-slate-200 dark:border-slate-600',
                'bg-slate-50/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100',
                'transition-all duration-200 placeholder:text-slate-400',
                'focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 dark:focus:ring-slate-700/50'
              )}
            />
          </div>

          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:100ms]">
            <label
              htmlFor="signup-password"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className={cn(
                'h-12 md:h-11 rounded-xl border-slate-200 dark:border-slate-600',
                'bg-slate-50/80 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100',
                'transition-all duration-200 placeholder:text-slate-400',
                'focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 dark:focus:ring-slate-700/50'
              )}
            />
          </div>

          <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:150ms]">
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'h-12 md:h-11 w-full rounded-xl font-medium',
                'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
                'hover:bg-slate-800 dark:hover:bg-slate-200',
                'transition-all duration-200 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="font-medium text-slate-700 dark:text-slate-300 underline-offset-4 hover:underline transition-colors"
              >
                Log in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
