import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { LoveQuotesPanel } from '@/components/auth/LoveQuotesPanel';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Login() {
  const [showSignUp, setShowSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Left: form - optimized for iPad (768–1024px) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 min-h-[50vh] md:min-h-0">
        <div className="w-full max-w-[420px] md:max-w-[380px] lg:max-w-[420px]">
          {showSignUp ? (
            <SignUpForm
              onSuccess={() => navigate('/chat', { replace: true })}
              onLoginClick={() => setShowSignUp(false)}
              signUp={signUp}
            />
          ) : (
            <LoginForm
              onSuccess={() => navigate('/chat', { replace: true })}
              onSignUpClick={() => setShowSignUp(true)}
              signIn={signIn}
            />
          )}
        </div>
      </div>

      {/* Right: quotes panel */}
      <div className="flex-1 md:flex-[1.15] flex items-center justify-center p-6 md:p-10 lg:p-12 min-h-[300px] md:min-h-0">
        <div
          className={cn(
            'w-full h-[260px] md:h-full',
            'md:min-h-[420px] md:max-h-[600px]',
            'animate-in fade-in duration-700 slide-in-from-right-4 fill-mode-both delay-150'
          )}
        >
          <LoveQuotesPanel />
        </div>
      </div>
    </div>
  );
}
