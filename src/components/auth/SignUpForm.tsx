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
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(
        msg.includes('already taken')
          ? msg
          : msg.includes('Something went wrong')
            ? msg
            : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'relative z-10 w-full overflow-hidden rounded-2xl',
        'backdrop-blur-xl shadow-2xl',
        'animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both'
      )}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(139, 92, 246, 0.05)',
      }}
    >
      <div className="px-8 pt-10 pb-8 md:px-12 md:pt-12 md:pb-10">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl" style={{ color: '#e2e8f0' }}>
          Create account
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: '#475569' }}>
          Choose a username and password
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div
              role="alert"
              className={cn(
                'rounded-lg px-4 py-3 text-sm',
                'animate-in fade-in slide-in-from-top-1 duration-300'
              )}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:50ms]">
            <label
              htmlFor="signup-username"
              className="text-sm font-medium"
              style={{ color: '#94a3b8' }}
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
                'h-12 md:h-11 rounded-xl',
                'transition-all duration-200'
              )}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
              }}
            />
          </div>

          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:100ms]">
            <label
              htmlFor="signup-password"
              className="text-sm font-medium"
              style={{ color: '#94a3b8' }}
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
                'h-12 md:h-11 rounded-xl',
                'transition-all duration-200'
              )}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
              }}
            />
          </div>

          <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both [animation-delay:150ms]">
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'h-12 md:h-11 w-full rounded-xl font-medium text-white',
                'transition-all duration-200 active:scale-[0.98] send-btn-gradient'
              )}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: '#475569' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="font-medium underline-offset-4 hover:underline transition-colors"
                style={{ color: '#60a5fa' }}
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
