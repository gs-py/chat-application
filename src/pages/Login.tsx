import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { LoveQuotesPanel } from '@/components/auth/LoveQuotesPanel';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const [showSignUp, setShowSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-emerald-50/80 dark:bg-emerald-950/30">
      {/* Left: form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md">
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
      <div className="flex-1 md:flex-[1.2] flex items-center justify-center p-6 md:p-8 lg:p-10 min-h-[320px] md:min-h-0">
        <div className="w-full max-w-xl h-[280px] md:h-full md:min-h-[380px] md:max-h-[540px]">
          <LoveQuotesPanel />
        </div>
      </div>
    </div>
  );
}
